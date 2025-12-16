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

        if (data?.dota_account_id) {
          setPlayerId(data.dota_account_id.toString())
        } else {
          setPlayerId(null)
        }
      } catch (err) {
        console.error('Failed to fetch player ID:', err)
        setError(err instanceof Error ? err.message : 'Failed to load player ID')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerId()

    // Subscribe to changes in user profile
    const channel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newAccountId = payload.new.dota_account_id
          setPlayerId(newAccountId ? newAccountId.toString() : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return { playerId, loading, error }
}

