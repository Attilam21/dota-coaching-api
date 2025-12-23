'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

// Player ID gestito SOLO in localStorage (come da ARCHITECTURE.md originale)
// localStorage rimane anche per dati partita (last_match_id_*, player_data_* per cache match)
// NESSUN salvataggio nel database - localStorage è l'unica fonte
const PLAYER_ID_KEY = 'fzth_player_id'

interface PlayerIdContextType {
  playerId: string | null
  setPlayerId: (id: string | null) => void
  isVerified: boolean
  verifiedAt: string | null
  verificationMethod: string | null
  setVerified: (verified: boolean, method?: string) => void
  reload: () => Promise<void> // Funzione per forzare ricaricamento da localStorage
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
  // NOTA: localStorage non richiede autenticazione - è puro client-side
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

  // Funzione per caricare Player ID da localStorage (fonte primaria)
  const loadPlayerIdFromLocalStorage = useCallback(() => {
    // Prevenire chiamate multiple simultanee
    if (loadingRef.current) {
      console.log('[PlayerIdContext] Load già in corso, skip...')
      return
    }

    try {
      loadingRef.current = true
      setIsLoading(true)
      
      // Carica da localStorage (fonte primaria come da ARCHITECTURE.md)
      if (typeof window !== 'undefined') {
        const savedPlayerId = localStorage.getItem(PLAYER_ID_KEY)
        
        if (savedPlayerId && savedPlayerId.trim()) {
          console.log('[PlayerIdContext] ✅ Player ID trovato in localStorage:', savedPlayerId)
          setPlayerIdState(savedPlayerId.trim())
          // localStorage non contiene dati verifica, quindi reset
          setIsVerifiedState(false)
          setVerifiedAtState(null)
          setVerificationMethodState(null)
        } else {
          console.log('[PlayerIdContext] Nessun Player ID trovato in localStorage')
          setPlayerIdState(null)
          setIsVerifiedState(false)
          setVerifiedAtState(null)
          setVerificationMethodState(null)
        }
      } else {
        // SSR - non c'è localStorage
        setPlayerIdState(null)
        setIsVerifiedState(false)
        setVerifiedAtState(null)
        setVerificationMethodState(null)
      }
    } catch (err) {
      console.error('[PlayerIdContext] Failed to load player ID from localStorage:', err)
      setPlayerIdState(null)
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [])

  // Load Player ID from localStorage quando il componente è montato
  // localStorage è la fonte primaria (come da ARCHITECTURE.md)
  useEffect(() => {
    if (!isMounted) {
      return
    }

    // Carica immediatamente da localStorage
    loadPlayerIdFromLocalStorage()
  }, [isMounted, loadPlayerIdFromLocalStorage])
  
  // NOTA: storage event funziona solo tra tab diverse, non nella stessa tab
  // Non serve listener - setPlayerId() aggiorna già tutto direttamente

  // Update player ID state e localStorage (localStorage è la fonte primaria)
  const setPlayerId = useCallback((id: string | null) => {
    const trimmedId = id ? id.trim() : null
    
    // Aggiorna state
    setPlayerIdState(trimmedId)
    
    // Salva in localStorage (fonte primaria)
    if (typeof window !== 'undefined') {
      if (trimmedId) {
        localStorage.setItem(PLAYER_ID_KEY, trimmedId)
        console.log('[PlayerIdContext] Player ID salvato in localStorage:', trimmedId)
      } else {
        localStorage.removeItem(PLAYER_ID_KEY)
        console.log('[PlayerIdContext] Player ID rimosso da localStorage')
      }
    }
    
    // Se ID viene rimosso, rimuovi anche dati verifica
    if (!id) {
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
    }
  }, [])

  // Set verification status (aggiorna solo state locale)
  // NOTA: localStorage non contiene dati verifica, solo Player ID
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

  // Funzione reload esposta per forzare ricaricamento da localStorage
  // NOTA: Non serve async, ma manteniamo la signature per compatibilità
  const reload = useCallback(async () => {
    console.log('[PlayerIdContext] Reload forzato richiesto')
    loadPlayerIdFromLocalStorage()
  }, [loadPlayerIdFromLocalStorage])

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