'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function HomeContent() {
  const [matchId, setMatchId] = useState('')
  const [accountId, setAccountId] = useState('')
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleMatchAnalysis = (e: React.FormEvent) => {
    e.preventDefault()
    if (matchId) {
      router.push(`/analysis/match/${matchId}`)
    }
  }

  const handlePlayerAnalysis = (e: React.FormEvent) => {
    e.preventDefault()
    if (accountId && accountId.trim()) {
      router.push(`/analysis/player/${accountId.trim()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Migliora le Tue Skills in Dota 2
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Analisi partite con IA, percorsi di apprendimento personalizzati e tracking delle performance
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => router.push('/auth/signup')}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Inizia Gratis
            </button>
            <button 
              onClick={() => router.push('/auth/login')}
              className="bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold border border-gray-700 hover:bg-gray-700 transition"
            >
              Accedi
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Analisi Partite</h3>
            <p className="text-gray-400">
              Analisi approfondita delle tue partite con insights basati su IA su efficienza farm, posizionamento e decision-making.
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Percorsi di Apprendimento</h3>
            <p className="text-gray-400">
              Moduli di training personalizzati adattati al tuo livello di skill e preferenze di ruolo.
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Tracking Performance</h3>
            <p className="text-gray-400">
              Traccia il tuo progresso con statistiche dettagliate, analisi avanzate e suggerimenti personalizzati.
            </p>
          </div>
        </div>

        {/* Quick Analysis Forms */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Match Analysis Form */}
          <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">Analizza Partita</h2>
            <form onSubmit={handleMatchAnalysis} className="space-y-4">
              <div>
                <label htmlFor="matchId" className="block text-sm font-medium text-gray-300 mb-2">
                  Match ID
                </label>
                <input
                  id="matchId"
                  type="text"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  placeholder="es. 8576841486"
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-900 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Analizza Partita
              </button>
            </form>
          </div>

          {/* Player Analysis Form */}
          <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">Statistiche Giocatore</h2>
            <form onSubmit={handlePlayerAnalysis} className="space-y-4">
              <div>
                <label htmlFor="accountId" className="block text-sm font-medium text-gray-300 mb-2">
                  Account ID
                </label>
                <input
                  id="accountId"
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="es. 123456789"
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-900 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Visualizza Statistiche
              </button>
            </form>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="mt-16 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto a Migliorare il Tuo Gioco?</h2>
          <p className="text-xl text-red-100 mb-6">
            Inizia ad analizzare le tue partite e tracciare le tue performance oggi stesso
          </p>
          <button 
            onClick={() => router.push('/auth/signup')}
            className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Crea Account Gratuito
          </button>
        </div>
      </div>
    </div>
  )
}
