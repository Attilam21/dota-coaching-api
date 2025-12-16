'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { usePlayerIdContext } from '@/lib/playerIdContext'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { setPlayerId } = usePlayerIdContext()
  const [dotaAccountId, setDotaAccountId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadUserSettings()
    }
  }, [user, authLoading, router])

  const loadUserSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('dota_account_id')
        .eq('id', user.id)
        .single()

      // PGRST116 = no rows returned, which is OK (user might not have a profile yet)
      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load settings:', error)
        setMessage({
          type: 'error',
          text: `Errore nel caricamento: ${error.message || 'Errore sconosciuto'}`,
        })
        return
      }

      if (data?.dota_account_id) {
        setDotaAccountId(data.dota_account_id.toString())
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto nel caricamento'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      setMessage(null)

      // Validate that it's a valid number if provided
      const accountIdValue = dotaAccountId.trim() ? parseInt(dotaAccountId.trim()) : null
      
      if (dotaAccountId.trim() && isNaN(accountIdValue as number)) {
        setMessage({
          type: 'error',
          text: 'L\'ID Dota deve essere un numero valido',
        })
        return
      }

      // Use UPDATE as before - the record should exist from the signup trigger
      const { error } = await supabase
        .from('users')
        .update({ dota_account_id: accountIdValue })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving settings:', error)
        throw error
      }

      // Sincronizza PlayerIdContext e localStorage dopo save in Supabase
      // Questo assicura che Dashboard e altre pagine vedano immediatamente il valore
      const playerIdString = accountIdValue ? accountIdValue.toString() : null
      setPlayerId(playerIdString)

      setMessage({ 
        type: 'success', 
        text: 'Impostazioni salvate con successo! Il Player ID è ora disponibile in tutte le sezioni.' 
      })
    } catch (err) {
      console.error('Failed to save settings:', err)
      const errorObj = err as { message?: string; code?: string; details?: string }
      const errorMessage = errorObj?.message || 'Errore nel salvataggio delle impostazioni'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Impostazioni Account</h1>
      <p className="text-gray-400 mb-8">Gestisci le tue impostazioni personali</p>

      {message && (
        <div
          className={`mb-6 border rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-900/50 border-green-700 text-green-200'
              : 'bg-red-900/50 border-red-700 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-6">Profilo Utente</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
          </div>

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label htmlFor="dotaAccountId" className="block text-sm font-medium text-gray-300 mb-2">
                Dota 2 Account ID
              </label>
              <input
                id="dotaAccountId"
                type="text"
                value={dotaAccountId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDotaAccountId(e.target.value)}
                placeholder="es. 86745912"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Il tuo Steam Account ID per Dota 2. Puoi trovarlo su{' '}
                <a
                  href="https://www.opendota.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300"
                >
                  OpenDota
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Sicurezza</h2>
        <p className="text-gray-400 text-sm mb-4">
          Per modificare la password, utilizza la funzione di reset password dalla pagina di login.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
        >
          Vai al Login
        </Link>
      </div>
    </div>
  )
}
