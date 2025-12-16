import { useState, useEffect } from 'react'
import { usePlayerId } from './usePlayerId'

const MANUAL_PLAYER_ID_KEY = 'manual_player_id'

export function usePlayerIdWithManual() {
  const { playerId: profilePlayerId, loading, error } = usePlayerId()
  const [manualPlayerId, setManualPlayerId] = useState<string>('')
  const [usingManualId, setUsingManualId] = useState(false)

  // Load manual ID from localStorage on mount
  useEffect(() => {
    const savedManualId = localStorage.getItem(MANUAL_PLAYER_ID_KEY)
    if (savedManualId && !profilePlayerId) {
      setManualPlayerId(savedManualId)
      setUsingManualId(true)
    }
  }, [profilePlayerId])

  // Use profile ID if available, otherwise use manual input
  const playerId = profilePlayerId || (usingManualId ? manualPlayerId : null)

  const setManualId = (id: string) => {
    setManualPlayerId(id)
    if (id) {
      localStorage.setItem(MANUAL_PLAYER_ID_KEY, id)
      setUsingManualId(true)
    } else {
      localStorage.removeItem(MANUAL_PLAYER_ID_KEY)
      setUsingManualId(false)
    }
  }

  return {
    playerId,
    manualPlayerId,
    setManualPlayerId: setManualId,
    usingManualId,
    setUsingManualId,
    loading,
    error,
    hasPlayerId: !!playerId,
  }
}

