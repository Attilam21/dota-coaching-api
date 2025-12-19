'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import HelpButton from '@/components/HelpButton'
import { Info } from 'lucide-react'
import AnimatedCard from '@/components/AnimatedCard'
import AnimatedPage from '@/components/AnimatedPage'
import AnimatedButton from '@/components/AnimatedButton'

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
    <AnimatedPage>
      <div className="p-4 md:p-6">
        <HelpButton />
        <h1 className="text-3xl font-bold mb-4">Impostazioni Account</h1>
        <p className="text-gray-400 mb-8">Gestisci le tue impostazioni personali</p>

        {message && (
          <AnimatedCard delay={0.1} className={`mb-6 border rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-900/50 border-green-700 text-green-200'
              : 'bg-red-900/50 border-red-700 text-red-200'
          }`}>
            {message.text}
          </AnimatedCard>
        )}

        {/* Guida per nuovo utente - solo se non ha ancora un Player ID */}
        {!playerId && !dotaAccountId && (
          <AnimatedCard delay={0.15} className="bg-green-900/30 border border-green-700 rounded-lg p-6 max-w-2xl mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-green-200 mb-2">Come far funzionare la Dashboard</h3>
                <p className="text-gray-300 mb-3">
                  Per iniziare ad usare tutte le funzionalità della dashboard, inserisci il tuo Dota 2 Account ID:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm mb-4 ml-2">
                  <li>
                    Vai su{' '}
                    <a
                      href="https://www.opendota.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 underline"
                    >
                      OpenDota.com
                    </a>{' '}
                    e cerca il tuo nome utente Steam o nickname
                  </li>
                  <li>Nella pagina del tuo profilo, copia il numero dell'<strong>Account ID</strong> (è un numero lungo, es: 123456789)</li>
                  <li>Incolla l'ID nel campo qui sotto e clicca "Salva Impostazioni"</li>
                  <li>Torna alla dashboard principale e vedrai popolarsi automaticamente tutte le statistiche del tuo profilo!</li>
                </ol>
                <p className="text-sm text-green-200 font-medium">
                  💡 Suggerimento: Una volta salvato, l'ID rimarrà memorizzato e la dashboard si aggiornerà automaticamente ogni volta che accedi.
                </p>
              </div>
            </div>
          </AnimatedCard>
        )}

        <AnimatedCard delay={0.2} className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
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
                Dota 2 Account ID <span className="text-red-400">*</span>
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
                Il tuo Steam Account ID per Dota 2. Cercalo su{' '}
                <a
                  href="https://www.opendota.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 underline"
                >
                  OpenDota.com
                </a>
                {' '}inserendo il tuo nome utente Steam.
              </p>
            </div>

            <div className="flex gap-3">
              <AnimatedButton
                type="submit"
                disabled={saving}
                variant="primary"
              >
                {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
              </AnimatedButton>
              {playerId && (
                <AnimatedButton
                  type="button"
                  onClick={() => {
                    if (confirm('Sei sicuro di voler rimuovere il Player ID? Dovrai reinserirlo per vedere le statistiche.')) {
                      setPlayerId(null)
                      setDotaAccountId('')
                      setMessage({
                        type: 'success',
                        text: 'Player ID rimosso con successo.'
                      })
                    }
                  }}
                  variant="secondary"
                >
                  Rimuovi Player ID
                </AnimatedButton>
              )}
            </div>
          </form>
        </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Sicurezza</h2>
          <p className="text-gray-400 text-sm mb-4">
            Per modificare la password, utilizza la funzione di reset password dalla pagina di login.
          </p>
          <AnimatedButton
            variant="secondary"
            onClick={() => window.location.href = '/auth/login'}
          >
            Vai al Login
          </AnimatedButton>
        </AnimatedCard>
      </div>
    </AnimatedPage>
  )
}
