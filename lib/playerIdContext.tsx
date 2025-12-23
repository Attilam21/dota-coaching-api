'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

/**
 * PlayerIdContext - Gestione Player ID Dota 2
 * 
 * Questo context gestisce il Dota 2 Account ID dell'utente utilizzando localStorage come unica fonte di verità.
 * 
 * ARCHITETTURA:
 * - Player ID salvato SOLO in localStorage (chiave: 'fzth_player_id')
 * - Nessun salvataggio nel database Supabase
 * - localStorage è la fonte primaria e unica per il Player ID
 * - Altri dati in localStorage: cache match (last_match_id_*, player_data_*)
 * 
 * FLUSSO:
 * 1. Al mount del componente, carica Player ID da localStorage
 * 2. setPlayerId() aggiorna sia lo state React che localStorage
 * 3. Tutti i componenti che usano usePlayerIdContext() ricevono il Player ID aggiornato
 * 4. Le dashboard pages usano questo Player ID per fetchare dati da OpenDota API
 * 
 * UTILIZZO:
 * ```tsx
 * const { playerId, setPlayerId, isLoading } = usePlayerIdContext()
 * ```
 */
const PLAYER_ID_KEY = 'fzth_player_id'

/**
 * Interfaccia del Context per Player ID
 */
interface PlayerIdContextType {
  /** Player ID Dota 2 corrente (null se non impostato) */
  playerId: string | null
  /** Funzione per impostare/aggiornare il Player ID (salva anche in localStorage) */
  setPlayerId: (id: string | null) => void
  /** Stato di verifica del Player ID (non persistito, solo in-memory) */
  isVerified: boolean
  /** Timestamp di verifica (non persistito, solo in-memory) */
  verifiedAt: string | null
  /** Metodo di verifica utilizzato (non persistito, solo in-memory) */
  verificationMethod: string | null
  /** Funzione per impostare lo stato di verifica (solo in-memory, non persistito) */
  setVerified: (verified: boolean, method?: string) => void
  /** Funzione per forzare il ricaricamento da localStorage */
  reload: () => Promise<void>
  /** Stato di caricamento iniziale */
  isLoading: boolean
}

const PlayerIdContext = createContext<PlayerIdContextType>({
  playerId: null,
  setPlayerId: () => {},
  isVerified: false,
  verifiedAt: null,
  verificationMethod: null,
  setVerified: () => {},
  reload: async () => {},
  isLoading: false,
})

/**
 * Provider per PlayerIdContext
 * 
 * Gestisce lo state del Player ID e la sincronizzazione con localStorage.
 * Non richiede autenticazione Supabase - è puro client-side.
 */
export function PlayerIdProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [playerId, setPlayerIdState] = useState<string | null>(null)
  const [isVerified, setIsVerifiedState] = useState<boolean>(false)
  const [verifiedAt, setVerifiedAtState] = useState<string | null>(null)
  const [verificationMethod, setVerificationMethodState] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Refs per prevenire race conditions
  const loadingRef = useRef(false)
  const lastErrorRef = useRef<{ timestamp: number; count: number } | null>(null)

  // SSR Safety: marca il componente come montato solo lato client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  /**
   * Carica il Player ID da localStorage
   * 
   * Questa è l'unica fonte di verità per il Player ID.
   * Viene chiamata al mount del componente e quando necessario.
   */
  const loadPlayerIdFromLocalStorage = useCallback(() => {
    // Prevenire chiamate multiple simultanee (race condition protection)
    if (loadingRef.current) {
      return
    }

    try {
      loadingRef.current = true
      setIsLoading(true)
      
      // Verifica che siamo lato client (localStorage disponibile solo nel browser)
      if (typeof window !== 'undefined') {
        const savedPlayerId = localStorage.getItem(PLAYER_ID_KEY)
        
        if (savedPlayerId && savedPlayerId.trim()) {
          setPlayerIdState(savedPlayerId.trim())
          // Reset dati verifica (non persistiti in localStorage)
          setIsVerifiedState(false)
          setVerifiedAtState(null)
          setVerificationMethodState(null)
        } else {
          // Nessun Player ID salvato
          setPlayerIdState(null)
          setIsVerifiedState(false)
          setVerifiedAtState(null)
          setVerificationMethodState(null)
        }
      } else {
        // SSR: non c'è localStorage, imposta valori di default
        setPlayerIdState(null)
        setIsVerifiedState(false)
        setVerifiedAtState(null)
        setVerificationMethodState(null)
      }
    } catch (err) {
      console.error('[PlayerIdContext] Errore nel caricamento Player ID:', err)
      setPlayerIdState(null)
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [])

  // Carica Player ID da localStorage al mount del componente (solo lato client)
  useEffect(() => {
    if (!isMounted) return
    loadPlayerIdFromLocalStorage()
  }, [isMounted, loadPlayerIdFromLocalStorage])

  /**
   * Imposta/aggiorna il Player ID
   * 
   * Questa funzione:
   * 1. Aggiorna lo state React
   * 2. Salva in localStorage (fonte primaria)
   * 3. Se id è null, rimuove anche i dati di verifica
   * 
   * @param id - Player ID Dota 2 (string) o null per rimuoverlo
   */
  const setPlayerId = useCallback((id: string | null) => {
    const trimmedId = id ? id.trim() : null
    
    // Aggiorna state React
    setPlayerIdState(trimmedId)
    
    // Salva in localStorage (fonte primaria)
    if (typeof window !== 'undefined') {
      if (trimmedId) {
        localStorage.setItem(PLAYER_ID_KEY, trimmedId)
      } else {
        localStorage.removeItem(PLAYER_ID_KEY)
      }
    }
    
    // Se ID viene rimosso, reset anche dati verifica
    if (!id) {
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
    }
  }, [])

  /**
   * Imposta lo stato di verifica del Player ID
   * 
   * NOTA: I dati di verifica sono solo in-memory (non persistiti in localStorage).
   * Solo il Player ID viene salvato in localStorage.
   * 
   * @param verified - true se il Player ID è stato verificato
   * @param method - Metodo di verifica utilizzato (default: 'questions')
   */
  const setVerified = useCallback((verified: boolean, method: string = 'questions') => {
    if (!playerId) return
    
    setIsVerifiedState(verified)
    if (verified) {
      setVerifiedAtState(new Date().toISOString())
      setVerificationMethodState(method)
    } else {
      setVerifiedAtState(null)
      setVerificationMethodState(null)
    }
  }, [playerId])

  /**
   * Forza il ricaricamento del Player ID da localStorage
   * 
   * Utile quando si vuole sincronizzare manualmente dopo modifiche esterne.
   */
  const reload = useCallback(async () => {
    loadPlayerIdFromLocalStorage()
  }, [loadPlayerIdFromLocalStorage])

  // Memoizza il valore del context per evitare re-render inutili
  // I componenti si ri-renderizzano solo quando i valori cambiano effettivamente
  const value = useMemo(
    () => ({
      playerId,
      setPlayerId,
      isVerified,
      verifiedAt,
      verificationMethod,
      setVerified,
      reload,
      isLoading,
    }),
    [playerId, setPlayerId, isVerified, verifiedAt, verificationMethod, setVerified, reload, isLoading]
  )

  return (
    <PlayerIdContext.Provider value={value}>
      {children}
    </PlayerIdContext.Provider>
  )
}

/**
 * Hook per accedere al PlayerIdContext
 * 
 * @throws Error se usato fuori da PlayerIdProvider
 * @returns PlayerIdContextType con playerId, setPlayerId, isLoading, ecc.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { playerId, setPlayerId, isLoading } = usePlayerIdContext()
 *   
 *   if (isLoading) return <div>Caricamento...</div>
 *   if (!playerId) return <div>Nessun Player ID impostato</div>
 *   
 *   return <div>Player ID: {playerId}</div>
 * }
 * ```
 */
export const usePlayerIdContext = () => {
  const context = useContext(PlayerIdContext)
  if (context === undefined) {
    throw new Error('usePlayerIdContext must be used within a PlayerIdProvider')
  }
  return context
}