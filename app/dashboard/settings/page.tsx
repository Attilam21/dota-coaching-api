'use client'

import React, { useEffect, useState, Suspense, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import HelpButton from '@/components/HelpButton'
import { Info, Image as ImageIcon } from 'lucide-react'
import AnimatedCard from '@/components/AnimatedCard'
import AnimatedPage from '@/components/AnimatedPage'
import AnimatedButton from '@/components/AnimatedButton'
import { useBackgroundPreference, BackgroundType } from '@/lib/hooks/useBackgroundPreference'
import { updatePlayerId } from '@/app/actions/update-player-id'
import { getPlayerId } from '@/app/actions/get-player-id'
import { supabase } from '@/lib/supabase'

/**
 * SettingsPageContent - Pagina Impostazioni Account
 * 
 * Permette all'utente di:
 * 1. Impostare/modificare il Dota 2 Account ID (salvato in localStorage)
 * 2. Scegliere lo sfondo della dashboard
 * 
 * ARCHITETTURA:
 * - Player ID salvato SOLO in localStorage (chiave: 'fzth_player_id')
 * - Nessun salvataggio nel database Supabase
 * - Quando l'utente salva, viene chiamato setPlayerId() che aggiorna localStorage e Context
 * - La dashboard si aggiorna automaticamente quando il Player ID cambia
 * 
 * FLUSSO:
 * 1. Utente può arrivare qui da PlayerIdInput con query param ?playerId=123
 * 2. Il form viene pre-compilato con il Player ID dal query param o dal Context
 * 3. Utente modifica e salva → salva in localStorage → aggiorna Context → dashboard si aggiorna
 * 
 * NOTA: useSearchParams richiede Suspense boundary (Next.js 14 requirement)
 */
function SettingsPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { playerId, setPlayerId } = usePlayerIdContext()
  const { background, updateBackground } = useBackgroundPreference()
  
  // State del form localStorage
  const [dotaAccountId, setDotaAccountId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundType[]>([])
  
  // State per sezione Supabase (opzionale)
  const [supabasePlayerId, setSupabasePlayerId] = useState<string>('')
  const [savingToSupabase, setSavingToSupabase] = useState(false)
  const [loadingFromSupabase, setLoadingFromSupabase] = useState(false)
  const [supabaseMessage, setSupabaseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [supabaseSavedId, setSupabaseSavedId] = useState<number | null>(null)
  
  // Ref per tracciare se abbiamo già processato il query param ?playerId=xxx
  // Previene che il valore dal Context sovrascriva il valore inserito dall'utente
  const hasProcessedQueryParam = useRef(false)

  /**
   * Verifica quali file di sfondo sono disponibili nella cartella public/
   * 
   * NOTA: Le richieste HEAD per file non esistenti generano errori 404 nella console.
   * Questo è normale per file opzionali. Il codice gestisce correttamente questi casi
   * ma il browser logga comunque gli errori 404.
   * 
   * Soluzione: Verifichiamo solo i file che potrebbero esistere e gestiamo
   * silenziosamente i 404 senza loggarli.
   */
  useEffect(() => {
    const checkAvailableBackgrounds = async () => {
      const backgrounds: BackgroundType[] = ['none']
      
      // Lista file da verificare
      // NOTA: Rimuovi i file .png dalla lista se non esistono per evitare errori 404
      // Aggiungili quando li carichi nella cartella public/
      const possibleFiles: BackgroundType[] = [
        'dashboard-bg.jpg',
        'profile-bg.jpg',
        // File opzionali - decommenta quando li aggiungi:
        // 'dashboard-bg.png',
        // 'profile-bg.png'
      ]

      // Verifica ogni file in parallelo per performance
      const checks = possibleFiles.map(async (file) => {
        const controller = new AbortController()
        let timeoutId: NodeJS.Timeout | null = null
        
        try {
          // Usa AbortController per timeout e gestione errori migliore
          timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout
          
          const response = await fetch(`/${file}`, { 
            method: 'HEAD',
            signal: controller.signal,
            // Non loggare errori 404 nella console del browser
            cache: 'no-cache'
          })
          
          // Solo aggiungi se la risposta è OK (200)
          if (response.ok && response.status === 200) {
            return file
          }
          
          // 404 è normale per file opzionali, non loggare
          return null
        } catch (err) {
          // Ignora errori (file non esiste, timeout, network error, ecc.)
          // Non loggare perché sono file opzionali
          return null
        } finally {
          // CRITICO: Sempre cancella il timeout per evitare memory leak
          // Questo viene eseguito sia in caso di successo che di errore
          if (timeoutId !== null) {
            clearTimeout(timeoutId)
          }
        }
      })

      // Attendi tutti i check in parallelo
      const results = await Promise.all(checks)
      
      // Aggiungi solo i file trovati
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

  // Redirect a login se utente non autenticato
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  /**
   * Gestisce il query param ?playerId=xxx quando l'utente arriva da PlayerIdInput
   * 
   * Quando l'utente inserisce un Player ID in PlayerIdInput, viene reindirizzato qui
   * con ?playerId=123. Questo effect legge il valore e pre-compila il form.
   */
  useEffect(() => {
    const playerIdFromQuery = searchParams.get('playerId')
    if (playerIdFromQuery && !hasProcessedQueryParam.current) {
      setDotaAccountId(playerIdFromQuery)
      hasProcessedQueryParam.current = true
      // Rimuovi query param dall'URL per pulizia
      router.replace('/dashboard/settings', { scroll: false })
    }
  }, [searchParams, router])

  /**
   * Sincronizza il form con il Player ID dal Context
   * 
   * IMPORTANTE: Non sovrascrive se abbiamo già processato un query param.
   * Questo previene che il valore inserito dall'utente venga sovrascritto
   * dal valore salvato nel Context.
   */
  useEffect(() => {
    if (hasProcessedQueryParam.current) return
    
    // Sincronizza con il valore dal Context (caricato da localStorage)
    if (playerId) {
      setDotaAccountId(playerId)
    } else {
      setDotaAccountId('')
    }
  }, [playerId])

  /**
   * Carica Player ID da Supabase (se salvato)
   * Funzione opzionale per sincronizzare con il database
   * 
   * Usa Server Action getPlayerId per garantire:
   * - apikey passato correttamente
   * - RLS policies funzionanti (session gestita correttamente)
   * - Coerenza con updatePlayerId
   */
  const loadPlayerIdFromSupabase = async () => {
    if (!user) return
    
    try {
      setLoadingFromSupabase(true)
      setSupabaseMessage(null)
      
      // Usa Server Action che legge automaticamente la sessione dai cookie
      // Non serve più passare accessToken - Supabase legge dai cookie HTTP
      const result = await getPlayerId()

      if (!result.success) {
        // Se l'utente non esiste ancora nella tabella (PGRST116), non è un errore
        if (result.code === 'PGRST116') {
          setSupabaseSavedId(null)
          setSupabasePlayerId('')
          setSupabaseMessage({
            type: 'success',
            text: 'Nessun Player ID salvato in database. Puoi salvarlo qui sotto.'
          })
          return
        }
        
        // Altri errori
        setSupabaseMessage({
          type: 'error',
          text: result.error || 'Errore nel caricamento da database'
        })
        return
      }

      // Success - gestisci il risultato
      if (result.playerId) {
        const playerIdNum = parseInt(result.playerId, 10)
        setSupabaseSavedId(playerIdNum)
        setSupabasePlayerId(result.playerId)
        setSupabaseMessage({
          type: 'success',
          text: `Player ID caricato da database: ${result.playerId}`
        })
      } else {
        setSupabaseSavedId(null)
        setSupabasePlayerId('')
        setSupabaseMessage({
          type: 'success',
          text: 'Nessun Player ID salvato in database.'
        })
      }
    } catch (err) {
      console.error('Errore nel caricamento da Supabase:', err)
      setSupabaseMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Errore nel caricamento da database'
      })
    } finally {
      setLoadingFromSupabase(false)
    }
  }

  /**
   * Salva Player ID in Supabase (opzionale)
   * Questa è una funzionalità aggiuntiva - localStorage rimane la fonte primaria
   */
  const handleSaveToSupabase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSavingToSupabase(true)
      setSupabaseMessage(null)

      const playerIdString = supabasePlayerId.trim() || null
      const dotaAccountIdNum = playerIdString 
        ? parseInt(playerIdString, 10) 
        : null

      // Validazione
      if (playerIdString && isNaN(dotaAccountIdNum!)) {
        setSupabaseMessage({
          type: 'error',
          text: 'L\'ID Dota deve essere un numero valido',
        })
        setSavingToSupabase(false)
        return
      }

      // Recupera sessione dal client Supabase (localStorage)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        setSupabaseMessage({
          type: 'error',
          text: 'Non autenticato. Effettua il login per salvare il Player ID.',
        })
        setSavingToSupabase(false)
        return
      }

      // Passa access_token esplicitamente alla Server Action
      const result = await updatePlayerId(playerIdString, session.access_token)

      if (!result.success) {
        setSupabaseMessage({
          type: 'error',
          text: result.error || 'Errore nel salvataggio nel database.',
        })
        setSavingToSupabase(false)
        return
      }

      // Aggiorna state locale
      setSupabaseSavedId(dotaAccountIdNum)
      
      setSupabaseMessage({ 
        type: 'success', 
        text: result.message || 'Player ID salvato in database con successo!'
      })
    } catch (err) {
      console.error('Errore nel salvataggio in Supabase:', err)
      setSupabaseMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Errore nel salvataggio nel database',
      })
    } finally {
      setSavingToSupabase(false)
    }
  }

  // Carica Player ID da Supabase al mount (solo se utente autenticato)
  useEffect(() => {
    if (user) {
      loadPlayerIdFromSupabase()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  /**
   * Gestisce il salvataggio del Player ID
   * 
   * FLUSSO:
   * 1. Valida che l'ID sia un numero valido
   * 2. Salva in localStorage (chiave: 'fzth_player_id')
   * 3. Aggiorna il Context chiamando setPlayerId()
   * 4. Il Context notifica tutti i componenti sottoscritti
   * 5. La dashboard si aggiorna automaticamente
   * 
   * NOTA: Nessun salvataggio nel database - localStorage è l'unica fonte.
   */
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

      // Validazione: Player ID deve essere un numero valido
      if (playerIdString && isNaN(dotaAccountIdNum!)) {
        setMessage({
          type: 'error',
          text: 'L\'ID Dota deve essere un numero valido',
        })
        setSaving(false)
        return
      }

      // Salva in localStorage (fonte primaria)
      if (typeof window !== 'undefined') {
        if (playerIdString) {
          localStorage.setItem('fzth_player_id', playerIdString)
        } else {
          localStorage.removeItem('fzth_player_id')
        }
      }

      // Aggiorna Context (notifica tutti i componenti sottoscritti)
      setPlayerId(playerIdString)
      
      // Reset ref per permettere sincronizzazione futura
      hasProcessedQueryParam.current = false

      setMessage({ 
        type: 'success', 
        text: 'Player ID salvato con successo! La dashboard si aggiornerà automaticamente.'
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
                    onClick={() => {
                      if (confirm('Sei sicuro di voler rimuovere il Player ID? Dovrai reinserirlo per vedere le statistiche.')) {
                        // Rimuovi da localStorage (fonte primaria)
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('fzth_player_id')
                        }
                        // Aggiorna Context e form
                        setPlayerId(null)
                        setDotaAccountId('')
                        hasProcessedQueryParam.current = false
                        setMessage({ type: 'success', text: 'Player ID rimosso con successo.' })
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

        {/* Sezione Salvataggio in Supabase (Opzionale) */}
        <AnimatedCard delay={0.22} className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-6 max-w-2xl">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Salvataggio in Database (Opzionale)</h2>
              <p className="text-gray-300 text-sm mb-4">
                Puoi salvare il tuo Player ID anche nel database Supabase per sincronizzarlo tra dispositivi.
                Questa è un'opzione aggiuntiva - il salvataggio in localStorage rimane la fonte primaria.
              </p>
            </div>
          </div>

          {supabaseMessage && (
            <div className={`mb-4 border rounded-lg p-3 ${
              supabaseMessage.type === 'success'
                ? 'bg-green-900/50 border-green-700 text-green-200'
                : 'bg-red-900/50 border-red-700 text-red-200'
            }`}>
              {supabaseMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="supabasePlayerId" className="block text-sm font-medium text-gray-300 mb-2">
                Dota 2 Account ID (per Database)
              </label>
              <div className="flex gap-2">
                <input
                  id="supabasePlayerId"
                  type="text"
                  value={supabasePlayerId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupabasePlayerId(e.target.value)}
                  placeholder={supabaseSavedId ? supabaseSavedId.toString() : "es. 8607682237"}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <AnimatedButton
                  type="button"
                  onClick={loadPlayerIdFromSupabase}
                  disabled={loadingFromSupabase}
                  variant="secondary"
                >
                  {loadingFromSupabase ? 'Caricamento...' : 'Carica da DB'}
                </AnimatedButton>
              </div>
              {supabaseSavedId && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Salvato in database: {supabaseSavedId}
                </p>
              )}
            </div>

            <form onSubmit={handleSaveToSupabase}>
              <div className="flex gap-3">
                <AnimatedButton
                  type="submit"
                  disabled={savingToSupabase}
                  variant="primary"
                >
                  {savingToSupabase ? 'Salvataggio...' : 'Salva in Database'}
                </AnimatedButton>
                {supabaseSavedId && (
                  <AnimatedButton
                    type="button"
                    onClick={async () => {
                      if (confirm('Sei sicuro di voler rimuovere il Player ID dal database?')) {
                        // Recupera sessione dal client Supabase (localStorage)
                        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                        
                        if (sessionError || !session?.access_token) {
                          setSupabaseMessage({
                            type: 'error',
                            text: 'Non autenticato. Effettua il login per rimuovere il Player ID.',
                          })
                          return
                        }

                        // Passa access_token esplicitamente alla Server Action
                        const result = await updatePlayerId(null, session.access_token)
                        if (result.success) {
                          setSupabaseSavedId(null)
                          setSupabasePlayerId('')
                          setSupabaseMessage({ type: 'success', text: 'Player ID rimosso dal database.' })
                        } else {
                          setSupabaseMessage({
                            type: 'error',
                            text: result.error || 'Errore nella rimozione del Player ID.',
                          })
                        }
                      }
                    }}
                    variant="secondary"
                  >
                    Rimuovi da DB
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
                <li><code className="bg-gray-800 px-1 rounded">profile-bg.jpg</code> ✅ presente</li>
                {/* File opzionali - decommenta quando li aggiungi: */}
                {/* <li><code className="bg-gray-800 px-1 rounded">dashboard-bg.png</code> ❌ opzionale</li> */}
                {/* <li><code className="bg-gray-800 px-1 rounded">profile-bg.png</code> ❌ opzionale</li> */}
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

// Export principale con Suspense boundary per useSearchParams
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