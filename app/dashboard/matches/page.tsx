'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import HeroCard from '@/components/HeroCard'
import { List, BarChart as BarChartIcon } from 'lucide-react'

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

type TabType = 'list' | 'stats'

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [matches, setMatches] = useState<Match[]>([])
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('list')

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
      // Extract matches from response (matches are at root level, not in stats)
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

  if (!playerId) {
    return (
      <PlayerIdInput
        pageTitle="Partite"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le tue ultime partite. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
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

  // Calculate aggregate statistics
  const aggregateStats = matches.length > 0 ? {
    total: matches.length,
    wins: matches.filter(m => isWin(m)).length,
    losses: matches.filter(m => !isWin(m)).length,
    winrate: (matches.filter(m => isWin(m)).length / matches.length) * 100,
    avgKDA: matches.reduce((sum, m) => sum + parseFloat(getKDA(m)), 0) / matches.length,
    avgGPM: matches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / matches.length,
    avgXPM: matches.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / matches.length,
    avgDuration: matches.reduce((sum, m) => sum + m.duration, 0) / matches.length,
  } : null

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-4">Partite</h1>
      <p className="text-gray-400 mb-6">Le tue ultime partite</p>

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
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'list' as TabType, name: 'Lista', icon: List },
                { id: 'stats' as TabType, name: 'Statistiche', icon: BarChartIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* List Tab */}
              {activeTab === 'list' && (
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
                      {match.hero_id && heroes[match.hero_id] && (
                        <HeroCard
                          heroId={match.hero_id}
                          heroName={heroes[match.hero_id].name}
                          size="md"
                        />
                      )}
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
                      Vedi Analisi →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && aggregateStats && (
                <div className="space-y-6">
                  {/* Aggregate Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Partite Totali</div>
                      <div className="text-3xl font-bold text-white">{aggregateStats.total}</div>
                    </div>
                    <div className="bg-gray-800 border border-green-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Vittorie</div>
                      <div className="text-3xl font-bold text-green-400">{aggregateStats.wins}</div>
                      <div className="text-xs text-gray-500 mt-1">Winrate: {aggregateStats.winrate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-800 border border-red-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Sconfitte</div>
                      <div className="text-3xl font-bold text-red-400">{aggregateStats.losses}</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">KDA Medio</div>
                      <div className="text-3xl font-bold text-yellow-400">{aggregateStats.avgKDA.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">GPM Medio</div>
                      <div className="text-2xl font-bold text-white">{aggregateStats.avgGPM.toFixed(0)}</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">XPM Medio</div>
                      <div className="text-2xl font-bold text-blue-400">{aggregateStats.avgXPM.toFixed(0)}</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Durata Media</div>
                      <div className="text-2xl font-bold text-white">{formatDuration(Math.round(aggregateStats.avgDuration))}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
