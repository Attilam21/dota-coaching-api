'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from './auth-context'
import { supabase } from './supabase'

// NOTA: localStorage per Player ID rimosso - usiamo solo database
// localStorage rimane SOLO per dati partita (last_match_id_*, player_data_* per cache match)

interface PlayerIdContextType {
  playerId: string | null
  setPlayerId: (id: string | null) => void
  isVerified: boolean
  verifiedAt: string | null
  verificationMethod: string | null
  setVerified: (verified: boolean, method?: string) => void
  reload: () => Promise<void> // Funzione per forzare ricaricamento da database
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

export function PlayerIdProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const [playerId, setPlayerIdState] = useState<string | null>(null)
  const [isVerified, setIsVerifiedState] = useState<boolean>(false)
  const [verifiedAt, setVerifiedAtState] = useState<string | null>(null)
  const [verificationMethod, setVerificationMethodState] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const loadingRef = useRef(false) // Prevenire chiamate multiple simultanee
  const lastErrorRef = useRef<{ timestamp: number; count: number } | null>(null) // Traccia errori per prevenire loop

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Funzione per caricare Player ID dal database (riutilizzabile)
  const loadPlayerIdFromDatabase = useCallback(async () => {
    // Prevenire chiamate multiple simultanee
    if (loadingRef.current) {
      console.log('[PlayerIdContext] Load già in corso, skip...')
      return
    }

    // CRITICO: Attendere che sia user che session siano disponibili
    // Se la sessione non è disponibile, auth.uid() non funziona e RLS rifiuta (403)
    if (!user || !session) {
      // User o sessione non ancora disponibili - attendere
      setPlayerIdState(null)
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
      setIsLoading(false)
      return
    }
    
    // Verifica che la sessione abbia un access_token valido
    if (!session.access_token) {
      console.warn('[PlayerIdContext] Session without access_token, waiting...')
      setPlayerIdState(null)
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
      setIsLoading(false)
      return
    }

    // Gestione errori ripetuti - se abbiamo avuto troppi errori 403 di recente, non riprovare
    const now = Date.now()
    if (lastErrorRef.current) {
      const timeSinceLastError = now - lastErrorRef.current.timestamp
      // Se abbiamo avuto 3+ errori negli ultimi 10 secondi, non riprovare (previene loop)
      if (lastErrorRef.current.count >= 3 && timeSinceLastError < 10000) {
        console.warn('[PlayerIdContext] Troppi errori recenti, skip per prevenire loop. Riprova tra qualche secondo.')
        setIsLoading(false)
        return
      }
      // Reset counter se è passato abbastanza tempo
      if (timeSinceLastError > 30000) {
        lastErrorRef.current = null
      }
    }

    try {
      loadingRef.current = true
      setIsLoading(true)
            
            // Verifica che l'ID utente nella sessione corrisponda
            if (session.user.id !== user.id) {
              console.error('[PlayerIdContext] ID utente mismatch:', {
                sessionUserId: session.user.id,
                authUserId: user.id
              })
              setIsLoading(false)
              loadingRef.current = false // ✅ CRITICO: Reset loadingRef prima di return
              return
            }

            // Verifica che la sessione sia ancora valida prima di fare la query
            // NOTA: Supabase client con persistSession: true dovrebbe già avere la sessione da localStorage
            // Non serve chiamare setSession() se la sessione è già presente nel client
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError || !currentSession || !currentSession.access_token) {
              console.error('[PlayerIdContext] Session invalid or expired:', sessionError)
              setPlayerIdState(null)
              setIsVerifiedState(false)
              setVerifiedAtState(null)
              setVerificationMethodState(null)
              setIsLoading(false)
              loadingRef.current = false
              return
            }

            // Verifica che la sessione nel client corrisponda a quella che abbiamo
            if (currentSession.access_token !== session.access_token) {
              console.warn('[PlayerIdContext] Session token mismatch, sincronizzando...')
              // Sincronizza la sessione se diversa
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token || '',
              })
              
              if (setSessionError) {
                console.warn('[PlayerIdContext] setSession error:', setSessionError.message)
              }
            }
        
            // Carica da database (SOLA FONTE DI VERITÀ)
            // Supabase client con persistSession: true dovrebbe automaticamente usare la sessione
            // da localStorage per auth.uid() nelle RLS policies
            console.log('[PlayerIdContext] Caricamento Player ID dal database per user:', user.id)
            
            const { data: userData, error: fetchError } = await supabase
              .from('users')
              .select('dota_account_id, dota_account_verified_at, dota_verification_method')
              .eq('id', user.id)
              .single()

            if (fetchError) {
              // Gestione errori 403/42501 (permission denied)
              const isPermissionError = fetchError.code === 'PGRST301' || 
                                       fetchError.code === '42501' ||
                                       fetchError.message?.includes('403') || 
                                       fetchError.message?.includes('Forbidden') ||
                                       fetchError.message?.includes('permission denied')
              
              if (isPermissionError) {
                // Traccia errori per prevenire loop
                if (!lastErrorRef.current) {
                  lastErrorRef.current = { timestamp: Date.now(), count: 1 }
                } else {
                  lastErrorRef.current.count += 1
                  lastErrorRef.current.timestamp = Date.now()
                }
                
                console.error('[PlayerIdContext] 403/42501 Permission Denied - RLS policy blocking:', {
                  hasSession: !!currentSession,
                  hasAccessToken: !!currentSession?.access_token,
                  userId: user?.id,
                  errorCode: fetchError.code,
                  errorMessage: fetchError.message,
                  errorCount: lastErrorRef.current.count,
                  hint: 'Verifica che RLS policies siano configurate correttamente e che auth.uid() funzioni'
                })
              } else {
                console.error('[PlayerIdContext] Error fetching player ID from DB:', {
                  error: fetchError,
                  code: fetchError.code,
                  message: fetchError.message,
                  details: fetchError.details
                })
              }
              // In caso di errore, mostra campo vuoto (non fallback localStorage)
              setPlayerIdState(null)
              setIsVerifiedState(false)
              setVerifiedAtState(null)
              setVerificationMethodState(null)
              
              // Reset error counter se non è un errore di permesso
              if (!isPermissionError) {
                lastErrorRef.current = null
              }
            } else if (userData?.dota_account_id) {
              // Found in database - use it
              const dbPlayerId = String(userData.dota_account_id)
              console.log('[PlayerIdContext] ✅ Player ID trovato nel database:', dbPlayerId, 'per user:', user.id)
              setPlayerIdState(dbPlayerId)
              
              // Carica anche dati verifica se presenti
              setIsVerifiedState(!!userData.dota_account_verified_at)
              setVerifiedAtState(userData.dota_account_verified_at || null)
              setVerificationMethodState(userData.dota_verification_method || null)
            } else {
              // No ID in DB
              console.warn('[PlayerIdContext] ⚠️ Nessun Player ID trovato nel database per questo utente:', user.id)
              console.warn('[PlayerIdContext] UserData ricevuto:', userData)
              setPlayerIdState(null)
              setIsVerifiedState(false)
              setVerifiedAtState(null)
              setVerificationMethodState(null)
            }
          } catch (err) {
            console.error('[PlayerIdContext] Failed to load player ID:', err)
            setPlayerIdState(null)
            setIsVerifiedState(false)
            setVerifiedAtState(null)
            setVerificationMethodState(null)
          } finally {
            setIsLoading(false)
            loadingRef.current = false
          }
  }, [user, session])

  // Load Player ID from database when user is authenticated AND session is loaded
  // NOTA: NON includere loadPlayerIdFromDatabase nelle dipendenze per prevenire loop
  // La funzione è già memoizzata con useCallback e dipende solo da user/session
  useEffect(() => {
    console.log('[PlayerIdContext] 🔄 useEffect triggerato:', {
      isMounted,
      hasUser: !!user,
      userId: user?.id,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token
    })
    
    if (!isMounted) {
      console.log('[PlayerIdContext] ⏸️ Componente non ancora montato, skip')
      return
    }
    
    if (!user || !session) {
      console.warn('[PlayerIdContext] ⚠️ User o session non disponibili, skip:', {
        hasUser: !!user,
        hasSession: !!session
      })
      return // Non provare se user/session non sono disponibili
    }

    // Aggiungi un piccolo delay per assicurarsi che la sessione sia completamente inizializzata
    console.log('[PlayerIdContext] ⏳ Delay 200ms prima di caricare Player ID...')
    const timeoutId = setTimeout(() => {
      console.log('[PlayerIdContext] 🚀 Chiamata loadPlayerIdFromDatabase()')
      loadPlayerIdFromDatabase()
    }, 200) // Aumentato a 200ms per dare più tempo alla sessione

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, user?.id, session?.access_token]) // Usa solo ID e token come dipendenze, non l'intero oggetto

  // Update player ID state (database è la fonte di verità, questo aggiorna solo lo state)
  const setPlayerId = useCallback((id: string | null) => {
    // Aggiorna solo lo state locale - il database viene aggiornato da SettingsPage
    // Questo permette sincronizzazione immediata tra componenti
    setPlayerIdState(id ? id.trim() : null)
    
    // Se ID viene rimosso, rimuovi anche dati verifica
    if (!id) {
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
    }
    
    // NOTA: NON salvare in localStorage - database è l'unica fonte
    // localStorage rimane SOLO per dati partita (last_match_id_*, player_data_*)
  }, [])

  // Set verification status (aggiorna solo state locale - database viene aggiornato da SettingsPage se necessario)
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
    
    // NOTA: NON salvare in localStorage - database è l'unica fonte
  }, [playerId])

  // Funzione reload esposta per forzare ricaricamento da database
  const reload = useCallback(async () => {
    console.log('[PlayerIdContext] Reload forzato richiesto')
    await loadPlayerIdFromDatabase()
  }, [loadPlayerIdFromDatabase])

  // Memoize context value to prevent unnecessary re-renders
  // This ensures components only re-render when values actually change
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

export const usePlayerIdContext = () => {
  const context = useContext(PlayerIdContext)
  if (context === undefined) {
    throw new Error('usePlayerIdContext must be used within a PlayerIdProvider')
  }
  return context
}