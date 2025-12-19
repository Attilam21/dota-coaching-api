'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import HelpButton from '@/components/HelpButton'
import { Info, User, Image as ImageIcon } from 'lucide-react'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [dotaAccountId, setDotaAccountId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    // Chiama loadUserSettings solo una volta quando user è disponibile
    // Usa user?.id invece di user per evitare re-render quando cambia l'oggetto
    if (user && !isLoadingSettings && !loading) {
      loadUserSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]) // Usa user?.id per evitare loop infiniti

  const loadUserSettings = async () => {
    if (!user || isLoadingSettings) return

    try {
      setIsLoadingSettings(true)
      setLoading(true)
      
      // Verifica sessione usando getUser() per ottenere l'utente dal server (più affidabile)
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      if (userError || !authUser) {
        console.error('[Settings] No valid user found:', userError)
        setMessage({
          type: 'error',
          text: 'Utente non autenticato. Per favore, effettua il login di nuovo.',
        })
        return
      }

      // Verifica anche la sessione per ottenere l'access_token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('[Settings] No valid session found:', sessionError)
        setMessage({
          type: 'error',
          text: 'Sessione non valida. Per favore, effettua il login di nuovo.',
        })
        return
      }

      // Verifica che user.id corrisponda a authUser.id
      if (authUser.id !== user.id) {
        console.error('[Settings] User ID mismatch! Context user:', user.id, 'Auth user:', authUser.id)
        setMessage({
          type: 'error',
          text: 'Errore di autenticazione: ID utente non corrisponde. Per favore, effettua il logout e login di nuovo.',
        })
        return
      }

      console.log('[Settings] Loading profile for user:', user.id)
      console.log('[Settings] Auth user valid:', !!authUser)
      console.log('[Settings] Session valid:', !!session)
      console.log('[Settings] Session access_token present:', !!session.access_token)
      console.log('[Settings] Session access_token length:', session.access_token?.length || 0)
      console.log('[Settings] Session expires at:', session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A')
      
      // Verifica se il token è scaduto
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.warn('[Settings] Session token expired!')
        setMessage({
          type: 'error',
          text: 'Sessione scaduta. Per favore, effettua il login di nuovo.',
        })
        return
      }

      console.log('[Settings] Making query with session token...')
      console.log('[Settings] Token preview:', session.access_token ? `${session.access_token.substring(0, 20)}...` : 'MISSING')
      
      // Carica profilo da Supabase (usa id che è foreign key a auth.users.id)
      // IMPORTANTE: NON chiamare setSession() qui - causa loop infinito!
      // Supabase JS gestisce automaticamente il JWT quando c'è una sessione valida
      const { data, error } = await supabase
        .from('users')
        .select('display_name, avatar_url, dota_account_id')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('[Settings] Error loading user profile:', error)
        console.error('[Settings] Error code:', error.code)
        console.error('[Settings] Error message:', error.message)
        
        // Se non esiste, crea profilo base
        if (error.code === 'PGRST116') {
          // No rows returned - crea profilo
          console.log('[Settings] Profile not found, creating...')
          await createUserProfile()
          return
        } else {
          // Altri errori (403, etc.)
          setMessage({
            type: 'error',
            text: `Errore nel caricamento: ${error.message || 'Errore sconosciuto'}`,
          })
        }
      } else if (data) {
        console.log('[Settings] Profile loaded successfully:', data)
        const profile = data as { display_name: string | null; avatar_url: string | null; dota_account_id: number | null }
        setUserProfile(profile)
        setDisplayName(profile.display_name || '')
        setAvatarUrl(profile.avatar_url || '')
        setDotaAccountId(profile.dota_account_id ? String(profile.dota_account_id) : '')
      }
    } catch (err) {
      console.error('[Settings] Failed to load settings:', err)
      setMessage({
        type: 'error',
        text: 'Errore nel caricamento delle impostazioni',
      })
    } finally {
      setLoading(false)
      setIsLoadingSettings(false)
    }
  }

  const createUserProfile = async () => {
    if (!user) return

    try {
      // Verifica sessione (autoRefreshToken gestisce il refresh automaticamente)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('[Settings] No valid session for profile creation:', sessionError)
        setMessage({
          type: 'error',
          text: 'Sessione non valida. Per favore, effettua il login di nuovo.',
        })
        return
      }

      console.log('[Settings] Creating profile for user:', user.id)
      const { error } = await (supabase
        .from('users') as any)
        .upsert({
          id: user.id,
          email: user.email || '',
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('[Settings] Error creating profile:', error)
        console.error('[Settings] Error code:', error.code)
        console.error('[Settings] Error message:', error.message)
        setMessage({
          type: 'error',
          text: `Errore nella creazione del profilo: ${error.message || 'Errore sconosciuto'}`,
        })
      } else {
        console.log('[Settings] Profile created successfully')
        // Ricarica dopo creazione
        await loadUserSettings()
      }
    } catch (err) {
      console.error('[Settings] Failed to create profile:', err)
      setMessage({
        type: 'error',
        text: 'Errore nella creazione del profilo',
      })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      setMessage(null)

      // Verifica sessione (autoRefreshToken gestisce il refresh automaticamente)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('[Settings] No valid session for save:', sessionError)
        setMessage({
          type: 'error',
          text: 'Sessione non valida. Per favore, effettua il login di nuovo.',
        })
        setSaving(false)
        return
      }

      console.log('[Settings] Saving profile for user:', user.id)
      console.log('[Settings] Session valid:', !!session)

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

      // Validate avatar URL (basic check)
      if (avatarUrl.trim() && !isValidUrl(avatarUrl.trim())) {
        setMessage({
          type: 'error',
          text: 'L\'URL dell\'avatar non è valido',
        })
        setSaving(false)
        return
      }

      // SOLUZIONE: Separare INSERT e UPDATE invece di UPSERT
      // UPSERT può avere problemi con RLS quando fa sia INSERT che UPDATE
      // Prima verifica se il record esiste, poi fa UPDATE o INSERT
      
      // Step 1: Verifica se il profilo esiste
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        // Errore diverso da "not found"
        console.error('[Settings] Error checking existing profile:', checkError)
        setMessage({
          type: 'error',
          text: `Errore nel controllo del profilo: ${checkError.message || 'Errore sconosciuto'}`,
        })
        setSaving(false)
        return
      }

      const profileData: {
        id: string
        email: string
        display_name: string | null
        avatar_url: string | null
        dota_account_id: number | null
        updated_at: string
      } = {
        id: user.id,
        email: user.email || '',
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        dota_account_id: dotaAccountIdNum,
        updated_at: new Date().toISOString(),
      }

      let data, error

      if (existingProfile) {
        // Step 2a: UPDATE se esiste
        console.log('[Settings] Profile exists, updating...')
        const result = await (supabase
          .from('users') as any)
          .update(profileData)
          .eq('id', user.id)
          .select()
        data = result.data
        error = result.error
      } else {
        // Step 2b: INSERT se non esiste
        console.log('[Settings] Profile does not exist, creating...')
        const result = await (supabase
          .from('users') as any)
          .insert(profileData)
          .select()
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('[Settings] Save error details:', error)
        console.error('[Settings] Error code:', error.code)
        console.error('[Settings] Error message:', error.message)
        console.error('[Settings] Error details:', JSON.stringify(error, null, 2))
        
        // Messaggio errore più dettagliato
        if (error.code === '42501' || error.message?.includes('permission denied') || error.code === 'PGRST301') {
          setMessage({
            type: 'error',
            text: 'Permessi insufficienti. La sessione potrebbe essere scaduta. Per favore, effettua il logout e login di nuovo.',
          })
        } else {
          setMessage({
            type: 'error',
            text: `Errore nel salvataggio: ${error.message || 'Errore sconosciuto'}`,
          })
        }
        setSaving(false)
        return
      }

      setMessage({ 
        type: 'success', 
        text: 'Impostazioni salvate con successo!' 
      })

      // Ricarica profilo
      await loadUserSettings()
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

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleUseSteamAvatar = async () => {
    if (!dotaAccountId.trim()) {
      setMessage({
        type: 'error',
        text: 'Inserisci prima il Dota Account ID',
      })
      return
    }

    try {
      // Prova a fetchare profilo da OpenDota
      const response = await fetch(`https://api.opendota.com/api/players/${dotaAccountId.trim()}`)
      if (!response.ok) {
        setMessage({
          type: 'error',
          text: 'Impossibile recuperare l\'avatar Steam. Verifica che l\'ID sia corretto.',
        })
        return
      }

      const data = await response.json()
      // OpenDota non ha direttamente avatar, ma possiamo costruire URL Steam
      // Per ora, mostra messaggio che l'utente deve inserire manualmente
      setMessage({
        type: 'error',
        text: 'L\'avatar Steam deve essere inserito manualmente. Cerca il tuo profilo Steam e copia l\'URL dell\'avatar.',
      })
    } catch (err) {
      console.error('Failed to fetch Steam avatar:', err)
      setMessage({
        type: 'error',
        text: 'Errore nel recupero dell\'avatar Steam',
      })
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

      <form onSubmit={handleSave}>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl mb-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profilo Personale
          </h2>

          <div className="space-y-4">
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

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Nome Visualizzato
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Il tuo nome nel dashboard"
                maxLength={50}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Questo nome verrà mostrato nel dashboard invece dell'email
              </p>
            </div>

            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Inserisci l'URL dell'immagine del tuo avatar (Steam, Imgur, Gravatar, etc.)
              </p>
              
              {/* Preview Avatar */}
              {avatarUrl && isValidUrl(avatarUrl) && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full border-2 border-gray-600 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span className="text-xs text-green-400">Preview avatar</span>
                </div>
              )}
            </div>
          </div>
        </div>

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
                <span>Il Player ID viene salvato in Supabase e sarà disponibile su tutte le pagine del dashboard.</span>
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
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </button>
        </div>
      </form>

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
