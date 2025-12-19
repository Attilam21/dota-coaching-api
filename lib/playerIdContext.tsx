'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

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
  // Initialize playerId from localStorage synchronously (if on client) as fallback
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
  const [loadedFromSupabase, setLoadedFromSupabase] = useState(false)

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load from Supabase when user is available
  useEffect(() => {
    if (!isMounted || !user || loadedFromSupabase) return

    const loadFromSupabase = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('dota_account_id')
          .eq('id', user.id)
          .single()

        const profile = data as { dota_account_id: number | null } | null
        if (profile?.dota_account_id) {
          const idString = String(profile.dota_account_id)
          setPlayerIdState(idString)
          // Sync with localStorage for backward compatibility
          try {
            localStorage.setItem(PLAYER_ID_KEY, idString)
          } catch (err) {
            console.error('[PlayerIdContext] Failed to sync to localStorage:', err)
          }
        }
        setLoadedFromSupabase(true)
      } catch (err) {
        console.error('[PlayerIdContext] Failed to load from Supabase:', err)
        setLoadedFromSupabase(true) // Mark as loaded even on error to avoid retries
      }
    }

    loadFromSupabase()
  }, [isMounted, user, loadedFromSupabase])

  // Sync with localStorage on mount (in case it changed externally) - only if not loaded from Supabase
  useEffect(() => {
    if (!isMounted || loadedFromSupabase) return

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
  }, [isMounted, loadedFromSupabase]) // Only run on mount, not when playerId changes

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

  // Save to Supabase and localStorage whenever playerId changes
  const setPlayerId = useCallback(async (id: string | null) => {
    try {
      if (id) {
        const trimmedId = id.trim()
        setPlayerIdState(trimmedId)
        // Save to localStorage for immediate access
        try {
          localStorage.setItem(PLAYER_ID_KEY, trimmedId)
        } catch (err) {
          console.error('[PlayerIdContext] Failed to save to localStorage:', err)
        }
        // Save to Supabase if user is logged in
        if (user) {
          try {
            const parsedId = parseInt(trimmedId)
            if (!isNaN(parsedId)) {
              await (supabase
                .from('users') as any)
                .update({ dota_account_id: parsedId })
                .eq('id', user.id)
            }
          } catch (err) {
            console.error('[PlayerIdContext] Failed to save to Supabase:', err)
          }
        }
      } else {
        setPlayerIdState(null)
        try {
          localStorage.removeItem(PLAYER_ID_KEY)
        } catch (err) {
          console.error('[PlayerIdContext] Failed to remove from localStorage:', err)
        }
        // Remove from Supabase if user is logged in
        if (user) {
          try {
            await (supabase
              .from('users') as any)
              .update({ dota_account_id: null })
              .eq('id', user.id)
          } catch (err) {
            console.error('[PlayerIdContext] Failed to remove from Supabase:', err)
          }
        }
      }
    } catch (err) {
      console.error('[PlayerIdContext] Failed to save player ID:', err)
    }
  }, [user])

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
