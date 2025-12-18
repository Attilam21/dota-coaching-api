import { useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { supabase } from './supabase'

export function usePlayerId() {
  const { user } = useAuth()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setPlayerId(null)
      setLoading(false)
      return
    }

    const fetchPlayerId = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('dota_account_id')
          .eq('id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        const userData = data as any
        if (userData?.dota_account_id) {
          setPlayerId(userData.dota_account_id.toString())
        } else {
          setPlayerId(null)
        }
      } catch (err) {
        console.error('Failed to fetch player ID:', err)
        const errorObj = err as { message?: string; code?: string }
        const errorMessage = errorObj?.message || 'Failed to load player ID'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerId()

    // Note: Real-time subscription requires enabling replication for users table in Supabase
    // For now, components will refetch when they remount or when explicitly refreshed
    // To enable real-time updates, go to Supabase Dashboard > Database > Replication
    // and enable replication for the users table
    
    // No cleanup needed for now since we're not using subscriptions
    // return () => { supabase.removeChannel(channel) }
  }, [user])

  return { playerId, loading, error }
}

