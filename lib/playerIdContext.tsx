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
}

const PlayerIdContext = createContext<PlayerIdContextType>({
  playerId: null,
  setPlayerId: () => {},
  isVerified: false,
  verifiedAt: null,
  verificationMethod: null,
  setVerified: () => {},
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

      // Load Player ID from database when user is authenticated AND session is loaded
      useEffect(() => {
        if (!isMounted) return

        const loadPlayerIdFromDatabase = async () => {
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

ilo          // Verifica che la sessione abbia un access_token valido
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
            // Ora auth.uid() funzionerà correttamente perché la sessione è caricata e valida
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
                  userId: user.id
                })
              } else {
                console.error('[PlayerIdContext] Error fetching player ID from DB:', fetchError)
              }
              // In caso di errore, mostra campo vuoto (non fallback localStorage)
              setPlayerIdState(null)
              setIsVerifiedState(false)
              setVerifiedAtState(null)
              setVerificationMethodState(null)
            } else if (userData?.dota_account_id) {
              // Found in database - use it
              const dbPlayerId = String(userData.dota_account_id)
              setPlayerIdState(dbPlayerId)
              
              // Carica anche dati verifica se presenti
              setIsVerifiedState(!!userData.dota_account_verified_at)
              setVerifiedAtState(userData.dota_account_verified_at || null)
              setVerificationMethodState(userData.dota_verification_method || null)
            } else {
              // No ID in DB
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
        }

        // Aggiungi un piccolo delay per assicurarsi che la sessione sia completamente inizializzata
        const timeoutId = setTimeout(() => {
          loadPlayerIdFromDatabase()
        }, 100)

        return () => clearTimeout(timeoutId)
      }, [isMounted, user, session])

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
    }),
    [playerId, setPlayerId, isVerified, verifiedAt, verificationMethod, setVerified]
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
