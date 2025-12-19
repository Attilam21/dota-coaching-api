'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HelpButton from '@/components/HelpButton'
import { Info } from 'lucide-react'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dotaAccountId, setDotaAccountId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && !loading) {
      loadUserSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  const loadUserSettings = async () => {
    if (!user || loading) return

    try {
      setLoading(true)
      
      // Carica solo dota_account_id da Supabase
      const { data, error } = await supabase
        .from('users')
        .select('dota_account_id')
        .eq('id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        // Errore diverso da "not found"
        console.error('[Settings] Error loading:', error)
        setMessage({
          type: 'error',
          text: `Errore nel caricamento: ${error.message || 'Errore sconosciuto'}`,
        })
        return
      }

      const profile = data as { dota_account_id: number | null } | null
      if (profile?.dota_account_id) {
        setDotaAccountId(String(profile.dota_account_id))
      }
    } catch (err) {
      console.error('[Settings] Failed to load:', err)
      setMessage({
        type: 'error',
        text: 'Errore nel caricamento delle impostazioni',
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

      // Validate Dota Account ID
      let dotaAccountIdNum: number | null = null
      if (dotaAccountId.trim()) {
        const parsed = parseInt(dotaAccountId.trim())
        if (isNaN(parsed)) {
          setMessage({
            type: 'error',
            text: 'L\'ID Dota deve essere un numero valido',
          })
          setSaving(false)
          return
        }
        dotaAccountIdNum = parsed
      }

      // Verifica se il profilo esiste
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[Settings] Error checking profile:', checkError)
        setMessage({
          type: 'error',
          text: `Errore: ${checkError.message || 'Errore sconosciuto'}`,
        })
        setSaving(false)
        return
      }

      // Salva solo dota_account_id
      let error
      if (existingProfile) {
        // UPDATE se esiste
        const result = await (supabase
          .from('users') as any)
          .update({
            dota_account_id: dotaAccountIdNum,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
        error = result.error
      } else {
        // INSERT se non esiste
        const result = await (supabase
          .from('users') as any)
          .insert({
            id: user.id,
            email: user.email || '',
            dota_account_id: dotaAccountIdNum,
          })
        error = result.error
      }

      if (error) {
        console.error('[Settings] Save error:', error)
        setMessage({
          type: 'error',
          text: `Errore nel salvataggio: ${error.message || 'Errore sconosciuto'}`,
        })
        setSaving(false)
        return
      }

      setMessage({ 
        type: 'success', 
        text: 'Dota Account ID salvato con successo!' 
      })

      // Ricarica
      await loadUserSettings()
    } catch (err) {
      console.error('Failed to save:', err)
      setMessage({
        type: 'error',
        text: 'Errore nel salvataggio',
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-4 md:p-6">
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
    <div className="p-4 md:p-6">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-4">Impostazioni Account</h1>
      <p className="text-gray-400 mb-8">Gestisci il tuo Dota 2 Account ID</p>

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

      <form onSubmit={handleSave}>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl mb-6">
          <h2 className="text-xl font-semibold mb-6">Dota 2 Account</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="dotaAccountId" className="block text-sm font-medium text-gray-300 mb-2">
                Dota 2 Account ID
              </label>
              <input
                id="dotaAccountId"
                type="text"
                value={dotaAccountId}
                onChange={(e) => setDotaAccountId(e.target.value)}
                placeholder="es. 8607682237"
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
              <div className="text-xs text-blue-400 mt-2 flex items-center gap-2">
                <Info className="w-3 h-3" />
                <span>Il Player ID viene salvato e sarà disponibile su tutte le pagine del dashboard.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-semibold transition"
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
