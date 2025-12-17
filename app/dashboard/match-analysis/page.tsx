'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'

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

export default function MatchAnalysisSelectPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [matches, setMatches] = useState<Match[]>([])
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchMatchId, setSearchMatchId] = useState('')

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
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch matches')

      const data = await response.json()
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchMatches()
    }
  }, [playerId, fetchMatches])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchMatchId.trim()) {
      router.push(`/dashboard/match-analysis/${searchMatchId.trim()}`)
    }
  }

  const getHeroName = (heroId?: number) => {
    if (!heroId) return 'Sconosciuto'
    return heroes[heroId]?.localized_name || `Hero ${heroId}`
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isWin = (match: Match) => {
    return (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win)
  }

  const getKDA = (match: Match) => {
    return ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2)
  }

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

  if (!playerId) {
    return (
      <PlayerIdInput
        pageTitle="Seleziona Partita"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le tue partite. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  return (
    <div className="p-8">
      <HelpButton />
      <div className="mb-6">
        <Link href="/dashboard/matches" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
          ← Torna a Partite
        </Link>
        <h1 className="text-3xl font-bold mb-2">Seleziona Partita</h1>
        <p className="text-gray-400">Scegli una partita per visualizzare l'analisi dettagliata</p>
      </div>

      {/* Search by Match ID */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Cerca per Match ID</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchMatchId}
            onChange={(e) => setSearchMatchId(e.target.value)}
            placeholder="Inserisci Match ID (es. 8608973113)"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Analizza
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento partite...</p>
        </div>
      )}

      {matches.length > 0 && !loading && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-white">Le tue ultime 20 partite</h2>
          <div className="space-y-4">
            {matches.map((match) => {
              const win = isWin(match)
              const kda = getKDA(match)
              
              return (
                <Link
                  key={match.match_id}
                  href={`/dashboard/match-analysis/${match.match_id}`}
                  className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-2xl font-semibold text-white">
                          {getHeroName(match.hero_id)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          win ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                        }`}>
                          {win ? 'Vittoria' : 'Sconfitta'}
                        </span>
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
                    
                    <div className="ml-4">
                      <span className="text-red-400 hover:text-red-300 text-sm font-semibold">
                        Analizza Partita →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {matches.length === 0 && !loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400">Nessuna partita trovata</p>
        </div>
      )}
    </div>
  )
}
