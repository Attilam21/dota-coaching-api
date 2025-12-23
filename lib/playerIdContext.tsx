'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Funzione per caricare Player ID dal database (riutilizzabile)
  const loadPlayerIdFromDatabase = useCallback(async () => {
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

          try {
            setIsLoading(true)
            
            // Verifica che l'ID utente nella sessione corrisponda
            if (session.user.id !== user.id) {
              console.error('[PlayerIdContext] ID utente mismatch:', {
                sessionUserId: session.user.id,
                authUserId: user.id
              })
              setIsLoading(false)
              return
            }

            // Verifica che la sessione sia ancora valida prima di fare la query
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError || !currentSession || !currentSession.access_token) {
              console.error('[PlayerIdContext] Session invalid or expired:', sessionError)
              setPlayerIdState(null)
              setIsVerifiedState(false)
              setVerifiedAtState(null)
              setVerificationMethodState(null)
              setIsLoading(false)
              return
            }
        
            // Carica da database (SOLA FONTE DI VERITÀ)
            // CRITICO: Assicurarsi che la sessione sia impostata nel client prima della query
            // Supabase client deve avere la sessione attiva per auth.uid() funzionare nelle RLS policies
            console.log('[PlayerIdContext] Caricamento Player ID dal database per user:', user.id)
            
            // Verifica che la sessione sia attiva nel client Supabase
            // Questo è necessario perché Supabase usa la sessione per auth.uid() nelle RLS policies
            // NOTA: Supabase client dovrebbe già avere la sessione da localStorage,
            // ma assicuriamoci che sia sincronizzata
            if (currentSession?.access_token) {
              // Imposta esplicitamente la sessione nel client per garantire che auth.uid() funzioni
              // Usa solo access_token e refresh_token come richiesto dal tipo
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token || '',
              })
              
              if (setSessionError) {
                console.warn('[PlayerIdContext] setSession error (continuing anyway):', setSessionError.message)
              } else {
                console.log('[PlayerIdContext] Session set successfully in client')
              }
            }
            
            const { data: userData, error: fetchError } = await supabase
              .from('users')
              .select('dota_account_id, dota_account_verified_at, dota_verification_method')
              .eq('id', user.id)
              .single()

            if (fetchError) {
              // Se è un errore 403, potrebbe essere un problema di timing - logga ma non bloccare
              if (fetchError.code === 'PGRST301' || fetchError.message?.includes('403') || fetchError.message?.includes('Forbidden')) {
                console.warn('[PlayerIdContext] 403 Forbidden - RLS policy might be blocking. Session:', {
                  hasSession: !!currentSession,
                  hasAccessToken: !!currentSession?.access_token,
                  userId: user?.id,
                  errorCode: fetchError.code,
                  errorMessage: fetchError.message
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
            } else if (userData?.dota_account_id) {
              // Found in database - use it
              const dbPlayerId = String(userData.dota_account_id)
              console.log('[PlayerIdContext] Player ID trovato nel database:', dbPlayerId)
              setPlayerIdState(dbPlayerId)
              
              // Carica anche dati verifica se presenti
              setIsVerifiedState(!!userData.dota_account_verified_at)
              setVerifiedAtState(userData.dota_account_verified_at || null)
              setVerificationMethodState(userData.dota_verification_method || null)
            } else {
              // No ID in DB
              console.log('[PlayerIdContext] Nessun Player ID trovato nel database per questo utente')
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
          }
  }, [user, session])

  // Load Player ID from database when user is authenticated AND session is loaded
  useEffect(() => {
    if (!isMounted) return

    // Aggiungi un piccolo delay per assicurarsi che la sessione sia completamente inizializzata
    const timeoutId = setTimeout(() => {
      loadPlayerIdFromDatabase()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [isMounted, user, session, loadPlayerIdFromDatabase])

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
