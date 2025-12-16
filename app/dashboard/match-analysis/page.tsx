'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'

export default function MatchAnalysisPage() {
  const [matchId, setMatchId] = useState('')
  const router = useRouter()
  const { playerId } = usePlayerIdContext()

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    if (matchId.trim()) {
      router.push(`/analysis/match/${matchId.trim()}`)
    }
  }

  // Show Player ID input if not available (optional, for consistency)
  // But this page doesn't strictly need it since it uses Match ID, not Player ID
  // So we'll keep it simple and just show the form

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Analisi Partita</h1>
      <p className="text-gray-400 mb-8">
        Inserisci un Match ID per analizzare una singola partita in dettaglio
      </p>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md">
        <form onSubmit={handleAnalyze} className="space-y-4">
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
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Analizza Partita
          </button>
        </form>
      </div>

      <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-lg p-4 max-w-2xl">
        <h3 className="text-lg font-semibold mb-2 text-blue-200">Informazioni</h3>
        <p className="text-blue-300 text-sm">
          L'analisi della partita ti mostrerà statistiche dettagliate, performance dei giocatori, grafici e insights personalizzati.
        </p>
      </div>
    </div>
  )
}

