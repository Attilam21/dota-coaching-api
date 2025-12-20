import { useState, useEffect, useCallback } from 'react'

interface RefreshLimiterState {
  remainingRefreshes: number
  timeUntilNextRefresh: number | null
  canRefresh: boolean
}

const MAX_REFRESHES_PER_HOUR = 4
const HOUR_IN_MS = 60 * 60 * 1000
const STORAGE_KEY = 'refresh_limiter'

interface RefreshRecord {
  timestamps: number[]
}

export function useRefreshLimiter(playerId?: string | null) {
  const [state, setState] = useState<RefreshLimiterState>({
    remainingRefreshes: MAX_REFRESHES_PER_HOUR,
    timeUntilNextRefresh: null,
    canRefresh: true,
  })

  const storageKey = playerId ? `${STORAGE_KEY}_${playerId}` : STORAGE_KEY

  useEffect(() => {
    const updateState = () => {
      try {
        const stored = localStorage.getItem(storageKey)
        if (!stored) {
          setState({
            remainingRefreshes: MAX_REFRESHES_PER_HOUR,
            timeUntilNextRefresh: null,
            canRefresh: true,
          })
          return
        }

        const record: RefreshRecord = JSON.parse(stored)
        const now = Date.now()

        // Remove timestamps older than 1 hour
        const recentTimestamps = record.timestamps.filter(
          (ts) => now - ts < HOUR_IN_MS
        )

        // Save cleaned up record
        if (recentTimestamps.length !== record.timestamps.length) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ timestamps: recentTimestamps })
          )
        }

        const remaining = MAX_REFRESHES_PER_HOUR - recentTimestamps.length
        const canRefresh = remaining > 0

        // Calculate time until next refresh is available
        let timeUntilNext: number | null = null
        if (!canRefresh && recentTimestamps.length > 0) {
          const oldestTimestamp = Math.min(...recentTimestamps)
          const timeUntilOldestExpires = oldestTimestamp + HOUR_IN_MS - now
          timeUntilNext = Math.max(0, timeUntilOldestExpires)
        }

        setState({
          remainingRefreshes: Math.max(0, remaining),
          timeUntilNextRefresh: timeUntilNext,
          canRefresh,
        })
      } catch (error) {
        console.error('Error reading refresh limiter:', error)
        setState({
          remainingRefreshes: MAX_REFRESHES_PER_HOUR,
          timeUntilNextRefresh: null,
          canRefresh: true,
        })
      }
    }

    // Initial state update
    updateState()

    // Update every second to refresh countdown
    const interval = setInterval(updateState, 1000)

    return () => clearInterval(interval)
  }, [storageKey])

  const consumeRefresh = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      const record: RefreshRecord = stored
        ? JSON.parse(stored)
        : { timestamps: [] }

      const now = Date.now()
      record.timestamps.push(now)

      // Keep only last MAX_REFRESHES_PER_HOUR timestamps (cleanup will handle the rest)
      if (record.timestamps.length > MAX_REFRESHES_PER_HOUR * 2) {
        record.timestamps = record.timestamps
          .filter((ts) => now - ts < HOUR_IN_MS)
          .slice(-MAX_REFRESHES_PER_HOUR)
      }

      localStorage.setItem(storageKey, JSON.stringify(record))

      // Update state immediately
      const remaining = MAX_REFRESHES_PER_HOUR - record.timestamps.length
      setState({
        remainingRefreshes: Math.max(0, remaining),
        timeUntilNextRefresh: null,
        canRefresh: remaining > 0,
      })
    } catch (error) {
      console.error('Error consuming refresh:', error)
    }
  }, [storageKey])

  const formatTimeUntilNext = useCallback((ms: number | null): string => {
    if (ms === null) return ''
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  return {
    ...state,
    consumeRefresh,
    formatTimeUntilNext,
  }
}

