'use client'

import React, { useEffect, useState, Suspense, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import HelpButton from '@/components/HelpButton'
import { Info, Image as ImageIcon, Lock, AlertTriangle, CheckCircle2, User, Gamepad2, Palette, Shield, Mail, Calendar, TrendingUp } from 'lucide-react'
import AnimatedCard from '@/components/AnimatedCard'
import AnimatedPage from '@/components/AnimatedPage'
import AnimatedButton from '@/components/AnimatedButton'
import { useBackgroundPreference, BackgroundType } from '@/lib/hooks/useBackgroundPreference'
import { useDashboardStyles } from '@/lib/hooks/useDashboardStyles'
import { updatePlayerId } from '@/app/actions/update-player-id'
import { getPlayerId } from '@/app/actions/get-player-id'
import { supabase } from '@/lib/supabase'

function SettingsPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { playerId, setPlayerId, isLocked, changesRemaining, changeCount, reload } = usePlayerIdContext()
  const { background, updateBackground, backgroundUrl } = useBackgroundPreference()
  const styles = useDashboardStyles()
  
  const [dotaAccountId, setDotaAccountId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundType[]>([])
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null)
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  
  const hasProcessedQueryParam = useRef(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: userData, error } = await (supabase as any)
            .from('users')
            .select('created_at')
            .eq('id', user.id)
            .single()
          if (!error && userData?.created_at) {
            setUserCreatedAt(userData.created_at)
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err)
      }
    }
    loadUserData()
  }, [user])

  useEffect(() => {
    const checkAvailableBackgrounds = async () => {
      const backgrounds: BackgroundType[] = ['none']
      
      const possibleFiles: BackgroundType[] = [
        'dashboard-bg.jpg',
        'profile-bg.jpg',
        'landa desolata.jpeg',
        'sfondo pop.jpeg',
      ]

      const checks = possibleFiles.map(async (file) => {
        const controller = new AbortController()
        let timeoutId: NodeJS.Timeout | null = null
        
        try {
          timeoutId = setTimeout(() => controller.abort(), 3000)
          
          const response = await fetch(`/${file}`, { 
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache'
          })
          
          if (response.ok && response.status === 200) {
            return file
          }
          
          return null
        } catch (err) {
          return null
        } finally {
          if (timeoutId !== null) {
            clearTimeout(timeoutId)
          }
        }
      })

      const results = await Promise.all(checks)
      
      results.forEach((file) => {
        if (file) {
          backgrounds.push(file)
        }
      })

      setAvailableBackgrounds(backgrounds)
    }

    if (user) {
      checkAvailableBackgrounds()
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const playerIdFromQuery = searchParams.get('playerId')
    if (playerIdFromQuery && !hasProcessedQueryParam.current) {
      setDotaAccountId(playerIdFromQuery)
      hasProcessedQueryParam.current = true
      router.replace('/dashboard/settings', { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    if (hasProcessedQueryParam.current) return
    
    if (playerId) {
      setDotaAccountId(playerId)
    } else {
      setDotaAccountId('')
    }
  }, [playerId])



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (isLocked) {
      setMessage({
        type: 'error',
        text: 'Player ID bloccato. Hai già cambiato 3 volte. Contatta il supporto per sbloccare.',
      })
      return
    }

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

      const isChanging = playerId && playerIdString && playerIdString !== playerId
      if (isChanging && changeCount >= 3) {
        setMessage({
          type: 'error',
          text: 'Hai raggiunto il limite di 3 cambi Player ID. Contatta il supporto.',
        })
        setSaving(false)
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setMessage({
          type: 'error',
          text: 'Devi fare login.',
        })
        setSaving(false)
        return
      }

      if (!session.access_token || !session.refresh_token) {
        setMessage({
          type: 'error',
          text: 'Sessione non valida. Rifai login.',
        })
        setSaving(false)
        return
      }

      const result = await updatePlayerId(
        playerIdString, 
        session.access_token,
        session.refresh_token
      )

      if (!result.success) {
        setMessage({
          type: 'error',
          text: result.error || 'Errore nel salvataggio nel database.',
        })
        setSaving(false)
        return
      }

      if (playerIdString) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('fzth_player_id', playerIdString)
        }
        setPlayerId(playerIdString)
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fzth_player_id')
        }
        setPlayerId(null)
      }
      
      await reload()
      hasProcessedQueryParam.current = false

      setMessage({ 
        type: 'success', 
        text: result.message || 'Player ID salvato con successo! La dashboard si aggiornerà automaticamente.'
      })
    } catch (err) {
      console.error('Errore nel salvataggio impostazioni:', err)
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
        <p className={`${styles.textSecondary} mb-8`}>Gestisci le tue impostazioni personali</p>

        {message && (
          <AnimatedCard delay={0.1} className={`mb-6 border rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-900/60 backdrop-blur-sm border-green-700 text-green-200'
              : 'bg-red-900/60 backdrop-blur-sm border-red-700 text-red-200'
          }`}>
            <div className={`flex items-center gap-2 ${styles.hasBackground ? 'drop-shadow-sm' : ''}`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </AnimatedCard>
        )}

        {!playerId && !dotaAccountId && (
          <AnimatedCard delay={0.15} className="bg-green-900/40 backdrop-blur-sm border border-green-700 rounded-lg p-6 max-w-2xl mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-green-200 mb-2">Come far funzionare la Dashboard</h3>
                <p className={`${styles.textSecondary} mb-3`}>
                  Per iniziare ad usare tutte le funzionalità della dashboard, inserisci il tuo Dota 2 Account ID:
                </p>
                <ol className={`list-decimal list-inside space-y-2 ${styles.textSecondary} text-sm mb-4 ml-2`}>
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

        {/* Sezione Profilo Utente */}
        <AnimatedCard delay={0.2} className={`${styles.card} p-6 max-w-2xl mb-6`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-900/40 backdrop-blur-sm">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className={`text-xl font-semibold ${styles.textPrimary}`}>Profilo Utente</h2>
          </div>

          <div className="space-y-4 mb-6">
            {/* Info Account */}
            <div className={`${styles.cardSubtle} p-4 border border-gray-600`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium ${styles.textSecondary} mb-1 uppercase tracking-wider`}>
                    <Mail className="w-3 h-3 inline mr-1" />
                    Email
                  </label>
                  <p className={`text-sm ${styles.textPrimary} font-medium`}>{user.email || 'N/A'}</p>
                </div>
                {userCreatedAt && (
                  <div>
                    <label className={`block text-xs font-medium ${styles.textSecondary} mb-1 uppercase tracking-wider`}>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Membro da
                    </label>
                    <p className={`text-sm ${styles.textPrimary} font-medium`}>
                      {new Date(userCreatedAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar Cambi Player ID */}
            {playerId && changesRemaining !== null && (
              <div className={`${styles.cardSubtle} p-4 border border-gray-600`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${styles.textSecondary}`}>
                    Cambi Player ID Rimanenti
                  </span>
                  <span className={`text-sm font-bold ${
                    changesRemaining === 0 ? 'text-red-400' :
                    changesRemaining === 1 ? 'text-yellow-400' :
                    'text-green-400'
                  } ${styles.hasBackground ? 'drop-shadow-sm' : ''}`}>
                    {changesRemaining} / 3
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      changesRemaining === 0 ? 'bg-red-600' :
                      changesRemaining === 1 ? 'bg-yellow-600' :
                      changesRemaining === 2 ? 'bg-blue-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${(changesRemaining / 3) * 100}%` }}
                  />
                </div>
                <p className={`text-xs mt-2 ${
                  changesRemaining === 0 ? 'text-red-300' :
                  changesRemaining === 1 ? 'text-yellow-300' :
                  styles.textSecondary
                } ${styles.hasBackground ? 'drop-shadow-sm' : ''}`}>
                  {changesRemaining === 0 && '⚠️ Dopo il prossimo cambio, il Player ID verrà bloccato.'}
                  {changesRemaining === 1 && '⚠️ Ti rimane solo 1 cambio disponibile.'}
                  {changesRemaining > 1 && `Puoi cambiare il Player ID ancora ${changesRemaining} volte.`}
                </p>
              </div>
            )}

            {/* Info su lock e cambi rimanenti */}
            {playerId && (
              <div className={`p-4 rounded-lg border ${
                isLocked 
                  ? 'bg-red-900/40 backdrop-blur-sm border-red-700' 
                  : changesRemaining !== null && changesRemaining < 3
                    ? 'bg-yellow-900/40 backdrop-blur-sm border-yellow-700'
                    : 'bg-blue-900/40 backdrop-blur-sm border-blue-700'
              }`}>
                <div className="flex items-start gap-3">
                  {isLocked ? (
                    <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {isLocked ? (
                      <>
                        <h3 className="font-semibold text-red-200 mb-1">Player ID Bloccato</h3>
                        <p className="text-sm text-red-300">
                          Hai raggiunto il limite di 3 cambi Player ID. Per sbloccare, contatta il supporto.
                        </p>
                      </>
                    ) : changesRemaining !== null ? (
                      <>
                        <h3 className="font-semibold text-blue-200 mb-1">Cambi Rimanenti</h3>
                        <p className="text-sm text-blue-300">
                          Puoi cambiare il Player ID ancora <strong>{changesRemaining}</strong> {changesRemaining === 1 ? 'volta' : 'volte'}.
                          {changesRemaining === 0 && ' Dopo il prossimo cambio, il Player ID verrà bloccato.'}
                        </p>
                        {changeCount > 0 && (
                          <p className="text-xs text-blue-400 mt-1">
                            Cambi effettuati: {changeCount} / 3
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-blue-200 mb-1">Player ID Attivo</h3>
                        <p className="text-sm text-blue-300">
                          Il tuo Player ID è salvato e sincronizzato. Puoi cambiarlo fino a 3 volte.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sezione Dota 2 Account */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-900/40 backdrop-blur-sm">
                  <Gamepad2 className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className={`text-lg font-semibold ${styles.textPrimary}`}>Dota 2 Account ID</h3>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label htmlFor="dotaAccountId" className={`block text-sm font-medium ${styles.textSecondary} mb-2`}>
                  Account ID <span className="text-red-400">*</span>
                </label>
                <input
                  id="dotaAccountId"
                  type="text"
                  value={dotaAccountId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDotaAccountId(e.target.value)}
                  placeholder="es. 8607682237"
                  disabled={isLocked}
                  className={`w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                {isLocked && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Input disabilitato: Player ID bloccato
                  </p>
                )}
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
                  disabled={saving || isLocked}
                  variant="primary"
                >
                  {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
                </AnimatedButton>
                {playerId && !isLocked && (
                  <AnimatedButton
                    type="button"
                    onClick={async () => {
                      if (confirm('Sei sicuro di voler rimuovere il Player ID? Dovrai reinserirlo per vedere le statistiche.')) {
                        try {
                          const { data: { session } } = await supabase.auth.getSession()
                          if (session?.access_token && session?.refresh_token) {
                            const result = await updatePlayerId(null, session.access_token, session.refresh_token)
                            if (result.success) {
                              if (typeof window !== 'undefined') {
                                localStorage.removeItem('fzth_player_id')
                              }
                              setPlayerId(null)
                              setDotaAccountId('')
                              hasProcessedQueryParam.current = false
                              await reload()
                              setMessage({ type: 'success', text: 'Player ID rimosso con successo.' })
                            } else {
                              setMessage({ type: 'error', text: result.error || 'Errore nella rimozione.' })
                            }
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

        {/* Info sistema Player ID */}
        <AnimatedCard delay={0.22} className="mt-6 bg-blue-900/30 backdrop-blur-sm border border-blue-700 rounded-lg p-6 max-w-2xl mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Sistema Player ID</h2>
              <p className="text-gray-300 text-sm mb-3">
                Il tuo Player ID è salvato nel database e sincronizzato automaticamente tra dispositivi.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm ml-2">
                <li>Puoi cambiare il Player ID fino a <strong>3 volte</strong></li>
                <li>Dopo 3 cambi, il Player ID verrà <strong>bloccato</strong> per prevenire abusi</li>
                <li>La profilazione viene <strong>cachata</strong> per 7 giorni per migliorare le performance</li>
                <li>Il Player ID viene sincronizzato automaticamente con localStorage per compatibilità</li>
              </ul>
              {isLocked && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <strong>Player ID bloccato:</strong> Contatta il supporto per sbloccare.
                  </p>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Sezione Personalizzazione */}
        <AnimatedCard delay={0.25} className={`mt-6 ${styles.card} p-6 max-w-2xl mb-6`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-pink-900/40 backdrop-blur-sm">
              <Palette className="w-5 h-5 text-pink-400" />
            </div>
            <h2 className={`text-xl font-semibold ${styles.textPrimary}`}>Personalizzazione Dashboard</h2>
          </div>
          <p className={`text-sm mb-6 ${styles.textSecondary}`}>
            Scegli lo sfondo che preferisci per il dashboard. La modifica sarà applicata immediatamente.
          </p>
          
          {background !== 'none' && (
            <div className={`mb-6 ${styles.cardSubtle} p-4 border border-gray-600`}>
              <p className={`text-sm font-medium mb-3 ${styles.textSecondary}`}>
                Anteprima Sfondo Attuale
              </p>
              <div className="w-full h-40 rounded-lg overflow-hidden border-2 border-gray-600 relative shadow-lg">
                <div 
                  className="w-full h-full bg-cover bg-center transition-transform duration-300 hover:scale-105"
                  style={{ backgroundImage: `url('/${background}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className={`text-sm font-semibold ${styles.textPrimary}`}>
                    {background === 'dashboard-bg.jpg' ? 'Dashboard' :
                     background === 'profile-bg.jpg' ? 'Profile' :
                     background === 'landa desolata.jpeg' ? 'Landa Desolata' :
                     background === 'sfondo pop.jpeg' ? 'Sfondo Pop' :
                     background}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {([
              { value: 'dashboard-bg.jpg' as BackgroundType, label: 'Dashboard', file: 'dashboard-bg.jpg' },
              { value: 'profile-bg.jpg' as BackgroundType, label: 'Profile', file: 'profile-bg.jpg' },
              { value: 'landa desolata.jpeg' as BackgroundType, label: 'Landa Desolata', file: 'landa desolata.jpeg' },
              { value: 'sfondo pop.jpeg' as BackgroundType, label: 'Sfondo Pop', file: 'sfondo pop.jpeg' },
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
                className={`group p-3 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${
                  background === option.value
                    ? 'border-red-500 bg-red-900/30 text-white shadow-lg shadow-red-500/20 scale-105'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-400 hover:bg-gray-700 hover:scale-[1.02]'
                }`}
              >
                {option.file && (
                  <div className="w-full h-28 mb-3 rounded-lg overflow-hidden bg-gray-800 shadow-md group-hover:shadow-lg transition-shadow">
                    <div 
                      className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundImage: `url('/${option.file}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {!option.file && (
                  <div className="w-full h-28 mb-3 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <span className="text-4xl">🚫</span>
                  </div>
                )}
                <div className={`text-sm font-medium text-center ${background === option.value ? 'text-red-200' : ''}`}>
                  {option.label}
                </div>
                {background === option.value && (
                  <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </AnimatedCard>

        {/* Sezione Sicurezza */}
        <AnimatedCard delay={0.3} className={`mt-6 ${styles.card} p-6 max-w-2xl`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-900/40 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h2 className={`text-xl font-semibold ${styles.textPrimary}`}>Sicurezza Account</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className={`text-sm font-medium mb-3 ${styles.textSecondary}`}>
                Cambio Password
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (passwordData.new !== passwordData.confirm) {
                  setMessage({ type: 'error', text: 'Le password non corrispondono' })
                  return
                }
                if (passwordData.new.length < 6) {
                  setMessage({ type: 'error', text: 'La password deve essere di almeno 6 caratteri' })
                  return
                }
                try {
                  setChangingPassword(true)
                  const { error } = await supabase.auth.updateUser({
                    password: passwordData.new
                  })
                  if (error) {
                    setMessage({ type: 'error', text: error.message || 'Errore nel cambio password' })
                  } else {
                    setMessage({ type: 'success', text: 'Password cambiata con successo!' })
                    setPasswordData({ current: '', new: '', confirm: '' })
                  }
                } catch (err) {
                  setMessage({ type: 'error', text: 'Errore nel cambio password' })
                } finally {
                  setChangingPassword(false)
                }
              }}>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-medium ${styles.textSecondary} mb-1`}>
                      Nuova Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      placeholder="Minimo 6 caratteri"
                      autoComplete="new-password"
                      className={`w-full px-4 py-2 bg-gray-700/70 backdrop-blur-sm border border-gray-600 rounded-lg text-white ${styles.hasBackground ? 'drop-shadow-sm' : ''} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${styles.textSecondary} mb-1`}>
                      Conferma Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      placeholder="Ripeti la nuova password"
                      autoComplete="new-password"
                      className={`w-full px-4 py-2 bg-gray-700/70 backdrop-blur-sm border border-gray-600 rounded-lg text-white ${styles.hasBackground ? 'drop-shadow-sm' : ''} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                  <AnimatedButton
                    type="submit"
                    disabled={changingPassword || !passwordData.new || !passwordData.confirm}
                    variant="primary"
                  >
                    {changingPassword ? 'Aggiornamento...' : 'Cambia Password'}
                  </AnimatedButton>
                </div>
              </form>
            </div>
            
            <div className="pt-4 border-t border-gray-700 bg-gray-700/30 backdrop-blur-sm rounded-lg p-4">
              <p className={`text-xs ${styles.textSecondary} mb-2`}>
                💡 <strong>Nota:</strong> Per reimpostare la password se l'hai dimenticata, utilizza la funzione di reset password dalla pagina di login.
              </p>
              <AnimatedButton
                variant="secondary"
                onClick={() => window.location.href = '/auth/login'}
                className="mt-2"
              >
                Vai al Login
              </AnimatedButton>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </AnimatedPage>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  )
}