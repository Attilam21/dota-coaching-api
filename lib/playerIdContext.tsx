'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const PLAYER_ID_KEY = 'fzth_player_id'
const PLAYER_DATA_KEY = 'fzth_player_data'

interface PlayerData {
  playerId: string
  verified: boolean
  verifiedAt: string | null
  verificationMethod: string | null
}

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
  // Load player data from localStorage
  const loadPlayerData = (): { playerId: string | null; verified: boolean; verifiedAt: string | null; verificationMethod: string | null } => {
    if (typeof window === 'undefined') {
      return { playerId: null, verified: false, verifiedAt: null, verificationMethod: null }
    }
    
    try {
      // Try new format first (JSON object)
      const dataStr = localStorage.getItem(PLAYER_DATA_KEY)
      if (dataStr) {
        const data: PlayerData = JSON.parse(dataStr)
        return {
          playerId: data.playerId ? data.playerId.trim() : null,
          verified: data.verified || false,
          verifiedAt: data.verifiedAt || null,
          verificationMethod: data.verificationMethod || null
        }
      }
      
      // Fallback to old format (just player ID)
      const oldPlayerId = localStorage.getItem(PLAYER_ID_KEY)
      if (oldPlayerId) {
        return {
          playerId: oldPlayerId.trim(),
          verified: false,
          verifiedAt: null,
          verificationMethod: null
        }
      }
    } catch (err) {
      console.error('[PlayerIdContext] Failed to load player data:', err)
    }
    
    return { playerId: null, verified: false, verifiedAt: null, verificationMethod: null }
  }

  const initialData = loadPlayerData()
  
  const [playerId, setPlayerIdState] = useState<string | null>(initialData.playerId)
  const [isVerified, setIsVerifiedState] = useState<boolean>(initialData.verified)
  const [verifiedAt, setVerifiedAtState] = useState<string | null>(initialData.verifiedAt)
  const [verificationMethod, setVerificationMethodState] = useState<string | null>(initialData.verificationMethod)
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted on client side (SSR safety)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync with localStorage on mount (in case it changed externally)
  useEffect(() => {
    if (!isMounted) return

    try {
      const data = loadPlayerData()
      if (data.playerId !== playerId) {
        setPlayerIdState(data.playerId)
      }
      if (data.verified !== isVerified) {
        setIsVerifiedState(data.verified)
      }
      if (data.verifiedAt !== verifiedAt) {
        setVerifiedAtState(data.verifiedAt)
      }
      if (data.verificationMethod !== verificationMethod) {
        setVerificationMethodState(data.verificationMethod)
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
      if (e.key === PLAYER_ID_KEY || e.key === PLAYER_DATA_KEY) {
        const data = loadPlayerData()
        if (data.playerId !== playerId) {
          setPlayerIdState(data.playerId)
        }
        if (data.verified !== isVerified) {
          setIsVerifiedState(data.verified)
        }
        if (data.verifiedAt !== verifiedAt) {
          setVerifiedAtState(data.verifiedAt)
        }
        if (data.verificationMethod !== verificationMethod) {
          setVerificationMethodState(data.verificationMethod)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isMounted, playerId, isVerified, verifiedAt, verificationMethod])

  // Save to localStorage whenever playerId changes
  const setPlayerId = useCallback((id: string | null) => {
    try {
      if (id) {
        const trimmedId = id.trim()
        setPlayerIdState(trimmedId)
        
        // Save in new format (JSON object)
        const playerData: PlayerData = {
          playerId: trimmedId,
          verified: isVerified,
          verifiedAt: verifiedAt,
          verificationMethod: verificationMethod
        }
        localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData))
        
        // Also save in old format for compatibility
        localStorage.setItem(PLAYER_ID_KEY, trimmedId)
      } else {
        setPlayerIdState(null)
        setIsVerifiedState(false)
        setVerifiedAtState(null)
        setVerificationMethodState(null)
        localStorage.removeItem(PLAYER_DATA_KEY)
        localStorage.removeItem(PLAYER_ID_KEY)
      }
    } catch (err) {
      console.error('[PlayerIdContext] Failed to save player ID to localStorage:', err)
    }
  }, [isVerified, verifiedAt, verificationMethod])

  // Set verification status
  const setVerified = useCallback((verified: boolean, method: string = 'questions') => {
    try {
      if (!playerId) return
      
      setIsVerifiedState(verified)
      if (verified) {
        setVerifiedAtState(new Date().toISOString())
        setVerificationMethodState(method)
      } else {
        setVerifiedAtState(null)
        setVerificationMethodState(null)
      }
      
      // Save in new format (JSON object)
      const playerData: PlayerData = {
        playerId: playerId,
        verified: verified,
        verifiedAt: verified ? new Date().toISOString() : null,
        verificationMethod: verified ? method : null
      }
      localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData))
    } catch (err) {
      console.error('[PlayerIdContext] Failed to save verification status:', err)
    }
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
