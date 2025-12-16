import { useState, useEffect, useCallback } from 'react'
import { usePlayerId } from './usePlayerId'

const MANUAL_PLAYER_ID_KEY = 'manual_player_id'

export function usePlayerIdWithManual() {
  const { playerId: profilePlayerId, loading, error } = usePlayerId()
  const [manualPlayerId, setManualPlayerIdState] = useState<string>('')
  const [usingManualId, setUsingManualId] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load manual ID from localStorage on mount (only on client)
  useEffect(() => {
    if (!isMounted) return

    try {
      const savedManualId = localStorage.getItem(MANUAL_PLAYER_ID_KEY)
      if (savedManualId && !profilePlayerId) {
        setManualPlayerIdState(savedManualId)
        setUsingManualId(true)
      } else if (profilePlayerId) {
        // Clear manual ID if profile ID is available
        localStorage.removeItem(MANUAL_PLAYER_ID_KEY)
        setUsingManualId(false)
      }
    } catch (err) {
      console.error('Failed to access localStorage:', err)
    }
  }, [isMounted, profilePlayerId])

  // Update state when profile ID becomes available (should clear manual ID)
  useEffect(() => {
    if (profilePlayerId && usingManualId) {
      setUsingManualId(false)
      setManualPlayerIdState('')
      try {
        localStorage.removeItem(MANUAL_PLAYER_ID_KEY)
      } catch (err) {
        console.error('Failed to remove from localStorage:', err)
      }
    }
  }, [profilePlayerId, usingManualId])

  // Use profile ID if available, otherwise use manual input
  const playerId = profilePlayerId || (usingManualId && manualPlayerId ? manualPlayerId : null)

  // Set manual ID (for input onChange)
  const setManualPlayerId = useCallback((id: string) => {
    setManualPlayerIdState(id)
  }, [])

  // Activate manual ID (for form submit) - accepts optional ID to avoid stale closures
  const activateManualId = useCallback((id?: string) => {
    const idToUse = id?.trim() || manualPlayerId.trim()
    if (idToUse && !profilePlayerId) {
      try {
        const trimmedId = idToUse.trim()
        localStorage.setItem(MANUAL_PLAYER_ID_KEY, trimmedId)
        setManualPlayerIdState(trimmedId)
        setUsingManualId(true)
      } catch (err) {
        console.error('Failed to save to localStorage:', err)
      }
    }
  }, [manualPlayerId, profilePlayerId])

  return {
    playerId,
    manualPlayerId,
    setManualPlayerId,
    activateManualId,
    usingManualId,
    setUsingManualId,
    loading,
    error,
    hasPlayerId: !!playerId,
  }
}

