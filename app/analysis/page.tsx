'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AnalysisPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Analisi</h1>
          <p className="text-gray-400">Scegli il tipo di analisi che vuoi visualizzare</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/matches"
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🎮</div>
              <h2 className="text-2xl font-semibold text-white">Analisi Partita</h2>
            </div>
            <p className="text-gray-400">
              Analizza una partita specifica visualizzando statistiche dettagliate, timeline degli eventi e performance dei giocatori.
            </p>
            <div className="mt-4 text-red-400 hover:text-red-300 text-sm font-semibold">
              Vai alle Partite →
            </div>
          </Link>
          
          <Link
            href="/dashboard"
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">👤</div>
              <h2 className="text-2xl font-semibold text-white">Analisi Giocatore</h2>
            </div>
            <p className="text-gray-400">
              Visualizza statistiche complete del giocatore, performance, trend e analisi approfondite del profilo.
            </p>
            <div className="mt-4 text-red-400 hover:text-red-300 text-sm font-semibold">
              Vai al Dashboard →
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Analisi Disponibili</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/performance"
              className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <h4 className="font-semibold text-white mb-2">Performance & Stile</h4>
              <p className="text-sm text-gray-400">Analisi delle performance e stile di gioco</p>
            </Link>
            <Link
              href="/dashboard/profiling"
              className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <h4 className="font-semibold text-white mb-2">Profilazione FZTH</h4>
              <p className="text-sm text-gray-400">Profilo completo con IA</p>
            </Link>
            <Link
              href="/dashboard/advanced"
              className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <h4 className="font-semibold text-white mb-2">Analisi Avanzate</h4>
              <p className="text-sm text-gray-400">Lane, Farm, Fight, Vision</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

