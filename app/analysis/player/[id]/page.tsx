'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

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
  const accountId = params.id as string
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [winLoss, setWinLoss] = useState<PlayerWinLoss | null>(null)
  const [recentMatches, setRecentMatches] = useState<PlayerMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await fetch('/api/opendota/heroes')
        if (response.ok) {
          const heroesData = await response.json()
          const heroesMap: Record<number, { name: string; localized_name: string }> = {}
          heroesData.forEach((hero: any) => {
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
        const wlResponse = await fetch(`https://api.opendota.com/api/players/${accountId}/wl`)
        if (wlResponse.ok) {
          const wlData = await wlResponse.json()
          setWinLoss(wlData)
        }

        // Fetch recent matches (last 20)
        const matchesResponse = await fetch(`https://api.opendota.com/api/players/${accountId}/matches?limit=20`)
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json()
          setRecentMatches(matchesData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerData()
  }, [accountId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading player data...</p>
        </div>
      </div>
    )
  }

  if (error || !playerData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Player</h2>
          <p className="text-red-600">{error || 'Player not found'}</p>
          <a href="/" className="inline-block mt-4 text-red-600 hover:text-red-800">
            ← Back to Home
          </a>
        </div>
      </div>
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
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Player Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-6">
          {playerData.profile.avatarfull && (
            <img
              src={playerData.profile.avatarfull}
              alt={playerData.profile.personaname}
              className="w-24 h-24 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{playerData.profile.personaname || `Player ${accountId}`}</h1>
            <p className="text-gray-600">Account ID: {accountId}</p>
            {playerData.mmr_estimate?.estimate && (
              <p className="text-lg font-semibold text-red-600 mt-2">
                MMR Estimate: {playerData.mmr_estimate.estimate}
              </p>
            )}
            {playerData.rank_tier && (
              <p className="text-gray-600">Rank: {playerData.rank_tier}</p>
            )}
          </div>
        </div>
      </div>

      {/* Win/Loss Stats */}
      {winLoss && (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
            <p className="text-3xl font-bold text-green-600">{winRate}%</p>
            <p className="text-sm text-gray-600 mt-1">
              {winLoss.win} wins / {winLoss.lose} losses
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Total Matches</h3>
            <p className="text-3xl font-bold">{winLoss.win + winLoss.lose}</p>
            <p className="text-sm text-gray-600 mt-1">Recent matches</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Average KDA</h3>
            <p className="text-3xl font-bold">{avgKDA}</p>
            <p className="text-sm text-gray-600 mt-1">Last {recentMatches.length} matches</p>
          </div>
        </div>
      )}

      {/* Recent Matches Performance Chart */}
      {matchesChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Matches Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matchesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="kills" fill="#10b981" name="Kills" />
              <Bar dataKey="deaths" fill="#ef4444" name="Deaths" />
              <Bar dataKey="assists" fill="#3b82f6" name="Assists" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Matches Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Recent Matches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hero
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  K/D/A
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMatches.map((match) => {
                const won = (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win)
                return (
                  <tr key={match.match_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`/analysis/match/${match.match_id}`}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        {match.match_id}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getHeroName(match.hero_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {match.kills}/{match.deaths}/{match.assists}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {won ? 'Win' : 'Loss'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(match.start_time * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

