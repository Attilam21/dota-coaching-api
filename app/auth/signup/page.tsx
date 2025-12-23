'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { updatePlayerId } from '@/app/actions/update-player-id'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dotaAccountId, setDotaAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Le password non corrispondono')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri')
      setLoading(false)
      return
    }

    try {
      // Valida Dota Account ID se fornito
      let dotaAccountIdNum: number | null = null
      if (dotaAccountId.trim()) {
        dotaAccountIdNum = parseInt(dotaAccountId.trim(), 10)
        if (isNaN(dotaAccountIdNum)) {
          setError('L\'ID Dota deve essere un numero valido')
          setLoading(false)
          return
        }
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Se la sessione è disponibile (email confirmation non richiesta), salva ID e vai al dashboard
      // Altrimenti mostra solo messaggio di verifica email
      if (signUpData.session?.access_token) {
        // Utente autenticato immediatamente - salva ID se fornito
        // NOTA: Il trigger handle_new_user() crea già il record in public.users
        if (dotaAccountIdNum) {
          try {
            // Usa Server Action per salvare l'ID (gestisce correttamente RLS)
            const result = await updatePlayerId(dotaAccountId.toString(), signUpData.session.access_token)
            if (result.success) {
              console.log('[Signup] Dota Account ID salvato con successo:', dotaAccountIdNum)
            } else {
              console.warn('[Signup] Errore salvataggio Dota Account ID:', result.error)
              // Non bloccare il signup se il salvataggio dell'ID fallisce
              // L'utente può salvarlo successivamente nelle settings
            }
          } catch (err) {
            console.warn('[Signup] Exception durante salvataggio Dota Account ID:', err)
            // Non bloccare il signup
          }
        }
        
        setSuccess(true)
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      } else {
        // Email confirmation richiesta - mostra solo messaggio, non fare redirect
        // L'ID verrà salvato quando l'utente verifica l'email e fa login
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
            <p className="font-semibold">Account creato con successo!</p>
            <p className="text-sm mt-1">Controlla la tua email per verificare l'account.</p>
            <p className="text-sm mt-2">Reindirizzamento al dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Crea il tuo account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Hai già un account?{' '}
            <Link href="/auth/login" className="font-medium text-red-400 hover:text-red-300">
              Accedi qui
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Indirizzo Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="esempio@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Minimo 6 caratteri"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Conferma Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Ripeti la password"
              />
            </div>
            <div>
              <label htmlFor="dotaAccountId" className="block text-sm font-medium text-gray-300 mb-2">
                Dota 2 Account ID <span className="text-gray-500 text-xs">(opzionale)</span>
              </label>
              <input
                id="dotaAccountId"
                name="dotaAccountId"
                type="text"
                value={dotaAccountId}
                onChange={(e) => setDotaAccountId(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="es. 1903287666 (puoi aggiungerlo anche dopo)"
              />
              <p className="mt-1 text-xs text-gray-400">
                Puoi trovarlo su{' '}
                <a
                  href="https://www.opendota.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 underline"
                >
                  OpenDota
                </a>
                . Puoi anche aggiungerlo successivamente nelle impostazioni.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creazione account...
                </span>
              ) : (
                'Crea Account'
              )}
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-red-400 transition-colors">
            Hai già un account? Accedi qui
          </Link>
        </div>
      </div>
    </div>
  )
}

