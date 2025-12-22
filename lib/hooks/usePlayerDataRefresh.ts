'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const POLLING_INTERVAL = 20 * 60 * 1000 // 20 minuti (durata media partita)
const CACHE_DURATION = 20 * 60 * 1000 // 20 minuti

interface CacheEntry<T> {
  data: T
  timestamp: number
  matchId?: number
}

interface UsePlayerDataRefreshOptions {
  enabled?: boolean
  onNewMatch?: () => void
}

/**
 * Hook per gestire refresh automatico dati player con cache, polling e background sync
 * 
 * Funzionalità:
 * - Cache lato client (20 minuti)
 * - Polling ogni 20 minuti (solo quando pagina visibile)
 * - Background sync quando utente torna sulla pagina
 * - Rilevamento nuove partite (confronta match_id più recente)
 * - Refresh manuale disponibile
 * 
 * @param playerId - Player ID per cui gestire il refresh
 * @param fetchFunction - Funzione fetch da wrappare (deve essere useCallback)
 * @param options - Opzioni aggiuntive
 */
export function usePlayerDataRefresh<T = any>(
  playerId: string | null,
  fetchFunction: (() => Promise<void>) | null,
  options: UsePlayerDataRefreshOptions = {}
) {
  const { enabled = true, onNewMatch } = options
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [hasNewMatches, setHasNewMatches] = useState(false)
  
  const fetchFunctionRef = useRef(fetchFunction)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCheckingRef = useRef(false)
  const lastMatchIdRef = useRef<string | null>(null)
  
  // Aggiorna ref quando fetchFunction cambia
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction
  }, [fetchFunction])
  
  // Cache key per questo player
  const getCacheKey = useCallback((endpoint: string) => {
    return `player_data_${playerId}_${endpoint}`
  }, [playerId])
  
  // Salva last_match_id
  const saveLastMatchId = useCallback((matchId: number | null) => {
    if (!playerId) return
    try {
      if (matchId) {
        localStorage.setItem(`last_match_id_${playerId}`, matchId.toString())
        lastMatchIdRef.current = matchId.toString()
      } else {
        localStorage.removeItem(`last_match_id_${playerId}`)
        lastMatchIdRef.current = null
      }
    } catch (err) {
      console.error('[usePlayerDataRefresh] Failed to save last_match_id:', err)
    }
  }, [playerId])
  
  // Carica last_match_id salvato
  const loadLastMatchId = useCallback((): string | null => {
    if (!playerId) return null
    try {
      const saved = localStorage.getItem(`last_match_id_${playerId}`)
      if (saved) {
        lastMatchIdRef.current = saved
        return saved
      }
    } catch (err) {
      console.error('[usePlayerDataRefresh] Failed to load last_match_id:', err)
    }
    return null
  }, [playerId])
  
  // Check per nuove partite (fetch leggero)
  const checkForNewMatches = useCallback(async (): Promise<boolean> => {
    if (!playerId || !enabled || isCheckingRef.current) return false
    
    try {
      isCheckingRef.current = true
      
      // Fetch leggero solo per match_id più recente
      const response = await fetch(`/api/player/${playerId}/stats`, {
        // Cache control per client-side fetch
        cache: 'no-store' // Forza fetch sempre per rilevare nuove partite
      })
      
      if (!response.ok) return false
      
      const data = await response.json()
      const matches = data?.stats?.matches || []
      
      if (matches.length === 0) return false
      
      // Prendi match_id più recente (primo nella lista)
      const latestMatchId = matches[0]?.match_id
      if (!latestMatchId) return false
      
      const latestMatchIdStr = latestMatchId.toString()
      const savedMatchId = loadLastMatchId()
      
      // Se è la prima volta, salva e non considerare come "nuova"
      if (!savedMatchId) {
        saveLastMatchId(latestMatchId)
        return false
      }
      
      // Se match_id diverso → nuova partita!
      if (latestMatchIdStr !== savedMatchId) {
        saveLastMatchId(latestMatchId)
        setHasNewMatches(true)
        
        // Callback opzionale
        if (onNewMatch) {
          onNewMatch()
        }
        
        return true
      }
      
      return false
    } catch (err) {
      console.error('[usePlayerDataRefresh] Failed to check for new matches:', err)
      return false
    } finally {
      isCheckingRef.current = false
    }
  }, [playerId, enabled, loadLastMatchId, saveLastMatchId, onNewMatch])
  
  // Refresh completo (chiama fetchFunction)
  const refresh = useCallback(async (force = false) => {
    if (!playerId || !fetchFunctionRef.current || isRefreshing) return
    
    try {
      setIsRefreshing(true)
      setHasNewMatches(false) // Reset flag dopo refresh
      
      // Chiama fetch function esistente
      await fetchFunctionRef.current()
      
      // Aggiorna timestamp
      setLastUpdate(new Date())
      
      // Aggiorna last_match_id dopo refresh
      // (fetchFunction dovrebbe aver aggiornato i dati)
      await checkForNewMatches()
    } catch (err) {
      console.error('[usePlayerDataRefresh] Refresh failed:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [playerId, isRefreshing, checkForNewMatches])
  
  // Polling periodico (solo quando pagina visibile)
  useEffect(() => {
    if (!playerId || !enabled || !fetchFunctionRef.current) return
    
    // Funzione polling
    const doPolling = async () => {
      // Solo se pagina visibile
      if (document.visibilityState !== 'visible') return
      
      // Check nuove partite prima
      const hasNew = await checkForNewMatches()
      
      // Se nuova partita → refresh completo
      if (hasNew) {
        await refresh()
      }
    }
    
    // Polling ogni 20 minuti
    pollingIntervalRef.current = setInterval(doPolling, POLLING_INTERVAL)
    
    // Esegui subito al mount (dopo un breve delay per non interferire con fetch iniziale)
    const initialDelay = setTimeout(() => {
      doPolling()
    }, 5000) // 5 secondi dopo mount
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      clearTimeout(initialDelay)
    }
  }, [playerId, enabled, checkForNewMatches, refresh])
  
  // Background sync (quando utente torna sulla pagina)
  useEffect(() => {
    if (!playerId || !enabled) return
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Utente torna sulla pagina → check rapido
        const hasNew = await checkForNewMatches()
        
        // Se nuova partita → refresh silenzioso (non mostra loading)
        if (hasNew && fetchFunctionRef.current) {
          try {
            await fetchFunctionRef.current()
            setLastUpdate(new Date())
          } catch (err) {
            console.error('[usePlayerDataRefresh] Background sync failed:', err)
          }
        }
      }
    }
    
    const handleFocus = async () => {
      // Stesso comportamento di visibility change
      await handleVisibilityChange()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [playerId, enabled, checkForNewMatches])
  
  // Inizializza last_match_id al mount
  useEffect(() => {
    if (playerId) {
      loadLastMatchId()
    }
  }, [playerId, loadLastMatchId])
  
  return {
    refresh,
    isRefreshing,
    lastUpdate,
    hasNewMatches,
    clearNewMatchesFlag: () => setHasNewMatches(false)
  }
}

