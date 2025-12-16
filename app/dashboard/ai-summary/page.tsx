'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'

interface Match {
  match_id: number
  player_slot: number
  radiant_win: boolean
  kills: number
  deaths: number
  assists: number
  gold_per_min?: number
  xp_per_min?: number
  start_time: number
  duration: number
  hero_id?: number
}

export default function AISummaryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [activeTab, setActiveTab] = useState<'match' | 'profile'>('profile')
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Fetch heroes list
    fetch('/api/opendota/heroes')
      .then((res) => res.json())
      .then((data) => {
        const heroesMap: Record<number, { name: string; localized_name: string }> = {}
        data.forEach((hero: { id: number; name: string; localized_name: string }) => {
          heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
        })
        setHeroes(heroesMap)
      })
      .catch(console.error)
  }, [])

  const fetchMatches = useCallback(async () => {
    if (!playerId) return

    try {
      setLoadingMatches(true)
      setError(null)

      const response = await fetch(`https://api.opendota.com/api/players/${playerId}/matches?limit=20`)
      if (!response.ok) throw new Error('Failed to fetch matches')

      const data = await response.json()
      setMatches(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoadingMatches(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId && activeTab === 'match') {
      fetchMatches()
    }
  }, [playerId, activeTab, fetchMatches])

  const generateMatchSummary = useCallback(async () => {
    if (!selectedMatchId) {
      setError('Seleziona una partita')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSummary('')

      const response = await fetch(`/api/ai-summary/match/${selectedMatchId}?playerId=${playerId}`)
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
  }, [selectedMatchId])

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
          {!playerId ? (
            <PlayerIdInput
              pageTitle="Riassunto Partita IA"
              title="Inserisci Player ID"
              description="Inserisci il tuo Dota 2 Account ID per selezionare una partita e generare un riassunto. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
            />
          ) : (
            <>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">🎮 Riassunto Partita</h2>
                <p className="text-gray-400 mb-4 text-sm">
                  Seleziona una partita dalle tue ultime 20 partite per generare un riassunto intelligente con analisi dettagliata.
                </p>
                {selectedMatchId && (
                  <button
                    onClick={generateMatchSummary}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-4"
                  >
                    {loading ? 'Generazione in corso...' : '🚀 Genera Riassunto Partita Selezionata'}
                  </button>
                )}
              </div>

              {loadingMatches && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                  <p className="mt-4 text-gray-400">Caricamento partite...</p>
                </div>
              )}

              {matches.length > 0 && !loadingMatches && (
                <div className="space-y-4">
                  {matches.map((match) => {
                    const isWin = (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win)
                    const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2)
                    const heroName = match.hero_id ? (heroes[match.hero_id]?.localized_name || `Hero ${match.hero_id}`) : 'Sconosciuto'
                    const formatDuration = (seconds: number) => {
                      const mins = Math.floor(seconds / 60)
                      const secs = seconds % 60
                      return `${mins}:${secs.toString().padStart(2, '0')}`
                    }
                    const formatDate = (timestamp: number) => {
                      return new Date(timestamp * 1000).toLocaleDateString('it-IT', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }
                    const isSelected = selectedMatchId === match.match_id

                    return (
                      <div
                        key={match.match_id}
                        onClick={() => setSelectedMatchId(match.match_id)}
                        className={`bg-gray-800 border rounded-lg p-6 hover:bg-gray-750 transition cursor-pointer ${
                          isSelected ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-xl font-semibold text-white">
                                {heroName}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isWin ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                              }`}>
                                {isWin ? 'Vittoria' : 'Sconfitta'}
                              </span>
                              {isSelected && (
                                <span className="text-red-400 font-semibold">✓ Selezionata</span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                              <div>
                                <span className="text-gray-400">K/D/A</span>
                                <p className="text-white font-semibold">
                                  {match.kills}/{match.deaths}/{match.assists}
                                </p>
                                <p className="text-gray-500 text-xs">KDA: {kda}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">GPM/XPM</span>
                                <p className="text-white font-semibold">
                                  {match.gold_per_min || 0} / {match.xp_per_min || 0}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">Durata</span>
                                <p className="text-white font-semibold">{formatDuration(match.duration)}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Data</span>
                                <p className="text-white font-semibold">{formatDate(match.start_time)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {matches.length === 0 && !loadingMatches && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
                  <p className="text-gray-400">Nessuna partita trovata</p>
                </div>
              )}

              {summary && (
                <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-300">📝 Riassunto Partita</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{summary}</p>
                  </div>
                </div>
              )}
            </>
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

