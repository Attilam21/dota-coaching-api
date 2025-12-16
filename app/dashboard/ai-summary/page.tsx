'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'

export default function AISummaryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [activeTab, setActiveTab] = useState<'match' | 'profile'>('profile')
  const [matchId, setMatchId] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const generateMatchSummary = useCallback(async () => {
    if (!matchId.trim()) {
      setError('Inserisci un Match ID valido')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSummary('')

      const response = await fetch(`/api/ai-summary/match/${matchId.trim()}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  const generateProfileSummary = useCallback(async () => {
    if (!playerId) {
      setError('Player ID non configurato')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSummary('')

      const response = await fetch(`/api/ai-summary/profile/${playerId}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  if (authLoading) {
    return (
      <div className="p-8">
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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">🤖 Riassunto IA</h1>
      <p className="text-gray-400 mb-6">
        Genera riassunti intelligenti delle tue partite o del tuo profilo completo utilizzando l'intelligenza artificiale.
      </p>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('profile')
              setSummary('')
              setError(null)
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-red-400 border-b-2 border-red-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📊 Riassunto Profilo
          </button>
          <button
            onClick={() => {
              setActiveTab('match')
              setSummary('')
              setError(null)
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'match'
                ? 'text-red-400 border-b-2 border-red-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🎮 Riassunto Partita
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Summary Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {!playerId ? (
            <PlayerIdInput
              pageTitle="Riassunto Profilo IA"
              title="Inserisci Player ID"
              description="Inserisci il tuo Dota 2 Account ID per generare un riassunto completo del tuo profilo. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
            />
          ) : (
            <>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📊 Riassunto Profilo Completo</h2>
                <p className="text-gray-400 mb-4 text-sm">
                  Genera un riassunto intelligente del tuo profilo di gioco basato su tutte le tue performance recenti, 
                  punti di forza, debolezze, trend e raccomandazioni.
                </p>
                <button
                  onClick={generateProfileSummary}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Generazione in corso...' : '🚀 Genera Riassunto Profilo'}
                </button>
              </div>

              {summary && (
                <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-300">📝 Riassunto Generato</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{summary}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Match Summary Tab */}
      {activeTab === 'match' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎮 Riassunto Partita</h2>
            <p className="text-gray-400 mb-4 text-sm">
              Inserisci il Match ID di una partita per generare un riassunto intelligente con analisi dettagliata.
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="Inserisci Match ID (es. 1234567890)"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    generateMatchSummary()
                  }
                }}
              />
              <button
                onClick={generateMatchSummary}
                disabled={loading || !matchId.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Generazione...' : '🚀 Genera'}
              </button>
            </div>
          </div>

          {summary && (
            <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-300">📝 Riassunto Partita</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{summary}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && !summary && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Generazione riassunto in corso...</p>
        </div>
      )}
    </div>
  )
}

