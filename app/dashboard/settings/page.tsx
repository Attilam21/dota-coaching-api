'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import HelpButton from '@/components/HelpButton'
import { Info, Image as ImageIcon } from 'lucide-react'
import AnimatedCard from '@/components/AnimatedCard'
import AnimatedPage from '@/components/AnimatedPage'
import AnimatedButton from '@/components/AnimatedButton'
import { useBackgroundPreference, BackgroundType } from '@/lib/hooks/useBackgroundPreference'
import { supabase } from '@/lib/supabase'
import { updatePlayerId } from '@/app/actions/update-player-id'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId, setPlayerId, reload } = usePlayerIdContext()
  const { background, updateBackground } = useBackgroundPreference()
  const [dotaAccountId, setDotaAccountId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundType[]>([])

  // Verifica quali file di sfondo sono disponibili
  useEffect(() => {
    const checkAvailableBackgrounds = async () => {
      const backgrounds: BackgroundType[] = ['none']
      
      const possibleFiles: BackgroundType[] = [
        'dashboard-bg.jpg',
        'dashboard-bg.png',
        'profile-bg.jpg',
        'profile-bg.png'
      ]

      for (const file of possibleFiles) {
        try {
          const response = await fetch(`/${file}`, { method: 'HEAD' })
          if (response.ok) {
            backgrounds.push(file)
          }
        } catch (err) {
          // File non esiste, continua
        }
      }

      setAvailableBackgrounds(backgrounds)
    }

    if (user) {
      checkAvailableBackgrounds()
    }
  }, [user])

  // Redirect se non autenticato
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Sincronizza input con playerId dal context (caricato da PlayerIdContext)
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

      const playerIdString = dotaAccountId.trim() || null
      const dotaAccountIdNum = playerIdString 
        ? parseInt(playerIdString, 10) 
        : null

      if (playerIdString && isNaN(dotaAccountIdNum!)) {
        setMessage({
          type: 'error',
          text: 'L\'ID Dota deve essere un numero valido',
        })
        setSaving(false)
        return
      }

      // Verifica sessione prima di salvare
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !currentSession) {
        setMessage({
          type: 'error',
          text: 'Sessione non valida. Fai logout e login di nuovo.',
        })
        setSaving(false)
        return
      }

      // Usa Server Action invece di client diretto
      // Passa l'access_token dalla sessione corrente
      // Vantaggi:
      // - ✅ JWT passato esplicitamente dal client
      // - ✅ RLS policies funzionano correttamente perché auth.uid() è disponibile
      const result = await updatePlayerId(playerIdString, currentSession.access_token)

      if (!result.success) {
        setMessage({
          type: 'error',
          text: result.error || 'Errore nel salvataggio del Player ID.',
        })
        setSaving(false)
        return
      }

      // Success - ricarica dal database per sincronizzazione completa
      console.log('[Settings] Salvataggio riuscito, ricarico Player ID dal database...')
      await reload()
      
      // Aggiorna anche state locale per immediate feedback
      setPlayerId(playerIdString)

      setMessage({ 
        type: 'success', 
        text: result.message || 'Player ID salvato con successo! La dashboard si aggiornerà automaticamente.'
      })
      
      // Notifica che la dashboard si aggiornerà automaticamente
      // Il redirect è opzionale - l'utente può rimanere qui o andare alla dashboard
      console.log('[Settings] Player ID salvato e ricaricato. Dashboard si aggiornerà automaticamente.')
    } catch (err) {
      console.error('Failed to save settings:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Errore nel salvataggio delle impostazioni',
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
                    onClick={async () => {
                      if (confirm('Sei sicuro di voler rimuovere il Player ID? Dovrai reinserirlo per vedere le statistiche.')) {
                        try {
                          if (!user) return
                          const { error } = await supabase
                            .from('users')
                            .update({ dota_account_id: null, updated_at: new Date().toISOString() })
                            .eq('id', user.id)
                          
                          if (error) {
                            setMessage({ type: 'error', text: 'Errore nella rimozione del Player ID.' })
                          } else {
                            setPlayerId(null)
                            setDotaAccountId('')
                            setMessage({ type: 'success', text: 'Player ID rimosso con successo.' })
                          }
                        } catch (err) {
                          setMessage({ type: 'error', text: 'Errore nella rimozione del Player ID.' })
                        }
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

        <AnimatedCard delay={0.25} className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Sfondo Dashboard</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Scegli lo sfondo che preferisci per il dashboard. La modifica sarà applicata immediatamente.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {([
              { value: 'dashboard-bg.jpg' as BackgroundType, label: 'Dashboard JPG', file: 'dashboard-bg.jpg' },
              { value: 'dashboard-bg.png' as BackgroundType, label: 'Dashboard PNG', file: 'dashboard-bg.png' },
              { value: 'profile-bg.jpg' as BackgroundType, label: 'Profile JPG', file: 'profile-bg.jpg' },
              { value: 'profile-bg.png' as BackgroundType, label: 'Profile PNG', file: 'profile-bg.png' },
              { value: 'none' as BackgroundType, label: 'Nessuno', file: null },
            ])
            .filter((option) => option.file === null || availableBackgrounds.includes(option.value))
            .map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  updateBackground(option.value)
                  setMessage({
                    type: 'success',
                    text: `Sfondo cambiato in: ${option.label}`
                  })
                }}
                className={`p-4 rounded-lg border-2 transition-all relative ${
                  background === option.value
                    ? 'border-red-500 bg-red-900/20 text-white'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                }`}
              >
                {option.file && (
                  <div className="w-full h-20 mb-2 rounded overflow-hidden bg-gray-800">
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url('/${option.file}')` }}
                    />
                  </div>
                )}
                <div className="text-sm font-medium">{option.label}</div>
                {background === option.value && (
                  <div className="text-xs text-red-400 mt-1 font-bold">✓ ATTIVO</div>
                )}
              </button>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 mt-4 space-y-2">
            <p>
              💡 Per aggiungere nuove immagini, salva i file nella cartella <code className="bg-gray-900 px-1 rounded">public/</code>
            </p>
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
              <p className="font-semibold text-gray-400 mb-2">📂 Percorso esatto:</p>
              <code className="text-xs text-gray-300 break-all">
                C:\Users\attil\Desktop\dota-2-giusto\dota-coaching-api\dota-coaching-api\public\
              </code>
              <p className="mt-2 text-gray-400">File supportati:</p>
              <ul className="list-disc list-inside ml-2 space-y-1 text-gray-400">
                <li><code className="bg-gray-800 px-1 rounded">dashboard-bg.jpg</code> ✅ presente</li>
                <li><code className="bg-gray-800 px-1 rounded">profile-bg.jpg</code> ❌ mancante</li>
                <li><code className="bg-gray-800 px-1 rounded">dashboard-bg.png</code> ❌ opzionale</li>
                <li><code className="bg-gray-800 px-1 rounded">profile-bg.png</code> ❌ opzionale</li>
              </ul>
            </div>
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
