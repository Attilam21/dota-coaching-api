'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const PLAYER_ID_KEY = 'fzth_player_id'

interface PlayerIdContextType {
  playerId: string | null
  setPlayerId: (id: string | null) => void
}

const PlayerIdContext = createContext<PlayerIdContextType>({
  playerId: null,
  setPlayerId: () => {},
})

export function PlayerIdProvider({ children }: { children: React.ReactNode }) {
  // Initialize playerId from localStorage synchronously (if on client)
  // This prevents the initial null state and eliminates timing issues
  const [playerId, setPlayerIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(PLAYER_ID_KEY)
      } catch {
        return null
      }
    }
    return null
  })
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync with localStorage on mount (in case it changed externally)
  useEffect(() => {
    if (!isMounted) return

    try {
      const saved = localStorage.getItem(PLAYER_ID_KEY)
      // Only update if different from current state (avoid unnecessary re-renders)
      if (saved !== playerId) {
        setPlayerIdState(saved)
      }
    } catch (err) {
      console.error('[PlayerIdContext] Failed to load from localStorage:', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]) // Only run on mount, not when playerId changes

  // Listen for storage events (synchronize between tabs/windows)
  useEffect(() => {
    if (!isMounted) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PLAYER_ID_KEY) {
        const newValue = e.newValue
        if (newValue !== playerId) {
          setPlayerIdState(newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isMounted, playerId])

  // Save to localStorage whenever playerId changes
  const setPlayerId = useCallback((id: string | null) => {
    try {
      if (id) {
        const trimmedId = id.trim()
        setPlayerIdState(trimmedId)
        localStorage.setItem(PLAYER_ID_KEY, trimmedId)
      } else {
        setPlayerIdState(null)
        localStorage.removeItem(PLAYER_ID_KEY)
      }
    } catch (err) {
      console.error('[PlayerIdContext] Failed to save player ID to localStorage:', err)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  // This ensures components only re-render when playerId or setPlayerId actually changes
  const value = useMemo(
    () => ({
      playerId,
      setPlayerId,
    }),
    [playerId, setPlayerId]
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
