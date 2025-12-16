'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

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
  const [playerId, setPlayerIdState] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load from localStorage on mount (only on client)
  useEffect(() => {
    if (!isMounted) return

    try {
      const saved = localStorage.getItem(PLAYER_ID_KEY)
      if (saved) {
        setPlayerIdState(saved)
      }
    } catch (err) {
      console.error('Failed to load player ID from localStorage:', err)
    }
  }, [isMounted])

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
      console.error('Failed to save player ID to localStorage:', err)
    }
  }, [])

  return (
    <PlayerIdContext.Provider value={{ playerId, setPlayerId }}>
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

