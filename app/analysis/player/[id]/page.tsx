'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import DashboardLayout from '@/components/DashboardLayout'
import HelpButton from '@/components/HelpButton'
import HeroIcon from '@/components/HeroIcon'
import Link from 'next/link'

interface PlayerData {
  profile: {
    account_id: number
    personaname: string
    avatarfull: string
    plus: boolean
  }
  rank_tier: number | null
  leaderboard_rank: number | null
  competitive_rank: number | null
  solo_competitive_rank: number | null
  mmr_estimate: {
    estimate: number
  }
  tracked_until: string
}

interface PlayerWinLoss {
  win: number
  lose: number
}

interface PlayerMatch {
  match_id: number
  player_slot: number
  radiant_win: boolean
  duration: number
  game_mode: number
  lobby_type: number
  hero_id: number
  start_time: number
  version: number
  kills: number
  deaths: number
  assists: number
  skill: number | null
  leaver_status: number
  party_size: number
}

export default function PlayerAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const accountId = params.id as string
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [winLoss, setWinLoss] = useState<PlayerWinLoss | null>(null)
  const [recentMatches, setRecentMatches] = useState<PlayerMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await fetch('/api/opendota/heroes')
        if (response.ok) {
          const heroesData = await response.json()
          const heroesMap: Record<number, { name: string; localized_name: string }> = {}
          heroesData.forEach((hero: { id: number; name: string; localized_name: string }) => {
            heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
          })
          setHeroes(heroesMap)
        }
      } catch (err) {
        console.error('Failed to fetch heroes:', err)
      }
    }
    fetchHeroes()
  }, [])

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true)

        // Fetch player profile
        const profileResponse = await fetch(`/api/opendota/player/${accountId}`)
        if (!profileResponse.ok) throw new Error('Failed to fetch player data')
        const profileData = await profileResponse.json()
        setPlayerData(profileData)

        // Fetch win/loss
        const wlResponse = await fetch(`/api/player/${accountId}/wl`)
        if (wlResponse.ok) {
          const wlData = await wlResponse.json()
          setWinLoss(wlData)
        }

        // Fetch recent matches (last 20)
        const matchesResponse = await fetch(`/api/player/${accountId}/stats`)
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json()
          setRecentMatches(matchesData.stats?.matches || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerData()
  }, [accountId])

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-400">Caricamento dati giocatore...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !playerData) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-200 mb-2">Errore nel caricamento del giocatore</h2>
            <p className="text-red-300">{error || 'Giocatore non trovato'}</p>
            <Link href="/dashboard/teammates" className="inline-block mt-4 text-red-400 hover:text-red-300">
              ← Torna a Team & Compagni
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const getHeroName = (heroId: number) => {
    return heroes[heroId]?.localized_name || `Hero ${heroId}`
  }

  const winRate = winLoss ? (winLoss.win / (winLoss.win + winLoss.lose) * 100).toFixed(1) : null

  // Prepare chart data for recent matches
  const matchesChartData = recentMatches.slice(0, 10).map((match) => ({
    match: `Match ${match.match_id.toString().slice(-4)}`,
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    result: (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win) ? 1 : 0,
  }))

  const kdaStats = recentMatches.reduce(
    (acc, match) => ({
      kills: acc.kills + match.kills,
      deaths: acc.deaths + match.deaths,
      assists: acc.assists + match.assists,
    }),
    { kills: 0, deaths: 0, assists: 0 }
  )
  const avgKDA =
    recentMatches.length > 0
      ? ((kdaStats.kills + kdaStats.assists) / Math.max(kdaStats.deaths, 1)).toFixed(2)
      : '0.00'

  return (
    <DashboardLayout>
      <div className="p-8">
        <HelpButton />
        
        {/* Back Link */}
        <Link 
          href="/dashboard/teammates" 
          className="text-gray-400 hover:text-white text-sm mb-4 inline-block"
        >
          ← Torna a Team & Compagni
        </Link>

        {/* Player Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-6">
            {playerData.profile.avatarfull && (
              <img
                src={playerData.profile.avatarfull}
                alt={playerData.profile.personaname}
                className="w-24 h-24 rounded-full border-2 border-gray-700"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">{playerData.profile.personaname || `Player ${accountId}`}</h1>
              <p className="text-gray-400">Account ID: {accountId}</p>
              {playerData.mmr_estimate?.estimate && (
                <p className="text-lg font-semibold text-red-400 mt-2">
                  MMR Estimate: {playerData.mmr_estimate.estimate}
                </p>
              )}
              {playerData.rank_tier && (
                <p className="text-gray-400">Rank: {playerData.rank_tier}</p>
              )}
            </div>
          </div>
        </div>

        {/* Win/Loss Stats */}
        {winLoss && (
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Win Rate</h3>
              <p className={`text-3xl font-bold ${parseFloat(winRate || '0') >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {winRate}%
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {winLoss.win} vittorie / {winLoss.lose} sconfitte
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Partite Totali</h3>
              <p className="text-3xl font-bold text-white">{winLoss.win + winLoss.lose}</p>
              <p className="text-sm text-gray-400 mt-1">Partite recenti</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">KDA Medio</h3>
              <p className="text-3xl font-bold text-white">{avgKDA}</p>
              <p className="text-sm text-gray-400 mt-1">Ultime {recentMatches.length} partite</p>
            </div>
          </div>
        )}

        {/* Recent Matches Performance Chart */}
        {matchesChartData.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">Performance Ultime Partite</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={matchesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="match" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
                <Bar dataKey="kills" fill="#10b981" name="Kills" />
                <Bar dataKey="deaths" fill="#ef4444" name="Deaths" />
                <Bar dataKey="assists" fill="#3b82f6" name="Assists" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Matches Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Partite Recenti</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Match ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Hero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    K/D/A
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Durata
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Risultato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentMatches.map((match) => {
                  const won = (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win)
                  return (
                    <tr key={match.match_id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/analysis/match/${match.match_id}`}
                          className="text-red-400 hover:text-red-300 font-medium"
                        >
                          {match.match_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {heroes[match.hero_id] && (
                            <HeroIcon
                              heroId={match.hero_id}
                              heroName={heroes[match.hero_id].name}
                              size={32}
                              className="rounded"
                            />
                          )}
                          <span className="text-sm text-gray-300">{getHeroName(match.hero_id)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        {match.kills}/{match.deaths}/{match.assists}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            won ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'
                          }`}
                        >
                          {won ? 'Vittoria' : 'Sconfitta'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(match.start_time * 1000).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

