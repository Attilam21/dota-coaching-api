'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { supabase } from './supabase'

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
  const { user } = useAuth()
  const [playerId, setPlayerIdState] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load from localStorage first, then Supabase as fallback (only on client)
  useEffect(() => {
    if (!isMounted || !user) return

    const loadPlayerId = async () => {
      try {
        // Step 1: Try localStorage first (fastest)
        const saved = localStorage.getItem(PLAYER_ID_KEY)
        if (saved) {
          setPlayerIdState(saved)
          return
        }

        // Step 2: If localStorage empty, query Supabase as fallback
        const { data, error } = await supabase
          .from('users')
          .select('dota_account_id')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('[PlayerIdContext] Failed to load from Supabase:', error)
          return
        }

        if (data?.dota_account_id) {
          const dbPlayerId = data.dota_account_id.toString()
          setPlayerIdState(dbPlayerId)
          // Also save to localStorage for next time (performance)
          try {
            localStorage.setItem(PLAYER_ID_KEY, dbPlayerId)
          } catch (err) {
            console.error('[PlayerIdContext] Failed to save to localStorage:', err)
          }
        }
      } catch (err) {
        console.error('[PlayerIdContext] Error loading player ID:', err)
      }
    }

    loadPlayerId()
  }, [isMounted, user])

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
