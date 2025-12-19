'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import HelpButton from '@/components/HelpButton'
import { Info } from 'lucide-react'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId, setPlayerId } = usePlayerIdContext()
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

  // Load from PlayerIdContext (which reads from localStorage)
  const loadUserSettings = () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load from PlayerIdContext (which uses localStorage)
      if (playerId) {
        setDotaAccountId(playerId)
      } else {
        // Also try direct localStorage read as fallback
        try {
          const saved = localStorage.getItem('fzth_player_id')
          if (saved) {
            setDotaAccountId(saved)
            // Sync with context
            setPlayerId(saved)
          }
        } catch (err) {
          console.error('Failed to read localStorage:', err)
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update local state when playerId changes
  useEffect(() => {
    if (playerId) {
      setDotaAccountId(playerId)
    } else {
      setDotaAccountId('')
    }
  }, [playerId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      setMessage(null)

      // Validate that it's a valid number if provided
      if (dotaAccountId.trim() && isNaN(parseInt(dotaAccountId.trim()))) {
        setMessage({
          type: 'error',
          text: 'L\'ID Dota deve essere un numero valido',
        })
        setSaving(false)
        return
      }

      // Salva SOLO in localStorage (via PlayerIdContext)
      // Non usiamo più Supabase per evitare errori RLS
      const playerIdString = dotaAccountId.trim() || null
      
      // Force update: salva in localStorage direttamente E tramite context
      // Questo assicura che tutte le pagine vedano il cambio immediatamente
      if (playerIdString) {
        try {
          localStorage.setItem('fzth_player_id', playerIdString)
        } catch (err) {
          console.error('Failed to save to localStorage:', err)
        }
      } else {
        try {
          localStorage.removeItem('fzth_player_id')
        } catch (err) {
          console.error('Failed to remove from localStorage:', err)
        }
      }
      
      // Update context (this will trigger re-renders in all consuming components)
      setPlayerId(playerIdString)

      setMessage({ 
        type: 'success', 
        text: 'Player ID salvato con successo! Naviga tra le sezioni per vedere i dati aggiornati.' 
      })
    } catch (err) {
      console.error('Failed to save settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore nel salvataggio delle impostazioni'
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
                <span>Il Player ID viene salvato nel tuo browser (localStorage) e sarà disponibile su tutte le pagine del dashboard.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-semibold transition"
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
