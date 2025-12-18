'use client'

import { useEffect, useState } from 'react'
import PlayerAvatar from './PlayerAvatar'
import { Trophy, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface OptimalTeam {
  players: Array<{
    account_id: number
    name: string
    games: number
    winrate: number
    role?: string
  }>
  predictedWinrate: number
  teamScore: number
  strengths: string[]
  weaknesses: string[]
  recommendedHeroes?: string[]
}

interface OptimalTeamsProps {
  playerId: string
}

export default function OptimalTeams({ playerId }: OptimalTeamsProps) {
  const [data, setData] = useState<{ optimalTeams: OptimalTeam[]; insights: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/player/${playerId}/team/optimal-builder`)
        if (!response.ok) throw new Error('Failed to fetch optimal teams')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load optimal teams')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [playerId])

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-400 text-sm">Calcolo Team Ottimali...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          <p className="font-semibold">Errore</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.optimalTeams.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-gray-400">
            {data?.insights?.[0] || 'Nessun team ottimale disponibile'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.optimalTeams.map((team, idx) => (
          <div
            key={idx}
            className={`bg-gray-800 border rounded-lg p-6 ${
              idx === 0 ? 'border-green-500 border-2' : 'border-gray-700'
            }`}
          >
            {idx === 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Team Migliore</span>
              </div>
            )}
            
            {/* Team Score */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Winrate Predetto</p>
                <p className={`text-3xl font-bold ${
                  team.predictedWinrate >= 60 ? 'text-green-400' :
                  team.predictedWinrate >= 50 ? 'text-blue-400' :
                  team.predictedWinrate >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {team.predictedWinrate.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Team Score</p>
                <p className="text-2xl font-bold text-white">{team.teamScore.toFixed(1)}</p>
              </div>
            </div>

            {/* Players */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-semibold text-gray-300 mb-2">Composizione Team:</p>
              {team.players.map((player) => (
                <div key={player.account_id} className="flex items-center gap-2 bg-gray-700/50 rounded p-2">
                  <PlayerAvatar
                    accountId={player.account_id}
                    playerName={player.name}
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white">{player.name}</p>
                    {player.games > 0 && (
                      <p className="text-xs text-gray-400">
                        {player.winrate.toFixed(1)}% winrate ({player.games} partite)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths */}
            {team.strengths.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-semibold text-green-400">Punti di Forza</p>
                </div>
                <ul className="space-y-1">
                  {team.strengths.map((strength, sIdx) => (
                    <li key={sIdx} className="text-xs text-green-300 ml-6">• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {team.weaknesses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Punti di Debolezza</p>
                </div>
                <ul className="space-y-1">
                  {team.weaknesses.map((weakness, wIdx) => (
                    <li key={wIdx} className="text-xs text-red-300 ml-6">• {weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Insights</h3>
          <ul className="space-y-1">
            {data.insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-blue-200">• {insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

