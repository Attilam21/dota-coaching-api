'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    // Get initial session with error handling
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }: { data: { session: Session | null }; error: Error | null }) => {
        if (error) {
          console.error('Error getting session:', error)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to get session:', error)
        setSession(null)
        setUser(null)
      })
      .finally(() => {
        // Always set loading to false, even on error
        setLoading(false)
      })

    // Listen for auth changes with error handling
    try {
      const authStateChangeResult = supabase.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: Session | null) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      // Safe access to subscription property
      if (authStateChangeResult?.data?.subscription) {
        subscription = authStateChangeResult.data.subscription
      }
    } catch (error) {
      console.error('Failed to set up auth state listener:', error)
      setLoading(false)
    }

    // Safe cleanup function
    return () => {
      if (subscription?.unsubscribe) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from auth state:', error)
        }
      }
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}