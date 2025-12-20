'use client'

import { useEffect, useState } from 'react'
import PlayerAvatar from './PlayerAvatar'

interface SynergyPair {
  player1_id: number
  player1_name: string
  player1_avatar?: string
  player2_id: number
  player2_name: string
  player2_avatar?: string
  games: number
  wins: number
  winrate: number
  synergy: 'excellent' | 'good' | 'average' | 'poor'
}

interface SynergyMatrixProps {
  playerId: string
}

export default function SynergyMatrix({ playerId }: SynergyMatrixProps) {
  const [data, setData] = useState<{ matrix: SynergyPair[]; topSynergies: SynergyPair[]; insights: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/player/${playerId}/team/synergy-matrix`)
        if (!response.ok) throw new Error('Failed to fetch synergy matrix')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load synergy matrix')
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
          <p className="mt-2 text-gray-400 text-sm">Calcolo Synergy Matrix...</p>
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

  if (!data || data.matrix.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-gray-400">
            {data?.insights?.[0] || 'Nessun dato disponibile per la Synergy Matrix'}
          </p>
        </div>
      </div>
    )
  }

  const getSynergyColor = (synergy: string) => {
    switch (synergy) {
      case 'excellent': return 'bg-green-600'
      case 'good': return 'bg-blue-600'
      case 'average': return 'bg-yellow-600'
      case 'poor': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getSynergyTextColor = (synergy: string) => {
    switch (synergy) {
      case 'excellent': return 'text-green-300'
      case 'good': return 'text-blue-300'
      case 'average': return 'text-yellow-300'
      case 'poor': return 'text-red-300'
      default: return 'text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Synergies */}
      {data.topSynergies && data.topSynergies.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Top Sinergie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topSynergies.map((pair, idx) => (
              <div
                key={`${pair.player1_id}-${pair.player2_id}`}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <PlayerAvatar
                    accountId={pair.player1_id}
                    avatarUrl={pair.player1_avatar}
                    playerName={pair.player1_name}
                    size="sm"
                    tooltipText={`${pair.player1_name} - ID: ${pair.player1_id}`}
                  />
                  <span className="text-gray-400">+</span>
                  <PlayerAvatar
                    accountId={pair.player2_id}
                    avatarUrl={pair.player2_avatar}
                    playerName={pair.player2_name}
                    size="sm"
                    tooltipText={`${pair.player2_name} - ID: ${pair.player2_id}`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getSynergyTextColor(pair.synergy)}`}>
                    {pair.winrate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">{pair.games} partite</span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${getSynergyColor(pair.synergy)} text-white`}>
                    {pair.synergy === 'excellent' ? 'Eccellente' :
                     pair.synergy === 'good' ? 'Buona' :
                     pair.synergy === 'average' ? 'Media' : 'Povera'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Matrix Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Matrice Completa Sinergie</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Giocatore 1</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Giocatore 2</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Partite</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Winrate</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Sinergia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.matrix.map((pair) => (
                <tr key={`${pair.player1_id}-${pair.player2_id}`} className="hover:bg-gray-700/50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar
                        accountId={pair.player1_id}
                        avatarUrl={pair.player1_avatar}
                        playerName={pair.player1_name}
                        size="sm"
                        tooltipText={`${pair.player1_name} - ID: ${pair.player1_id}`}
                      />
                      <span className="text-sm text-white">{pair.player1_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar
                        accountId={pair.player2_id}
                        avatarUrl={pair.player2_avatar}
                        playerName={pair.player2_name}
                        size="sm"
                        tooltipText={`${pair.player2_name} - ID: ${pair.player2_id}`}
                      />
                      <span className="text-sm text-white">{pair.player2_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-300 text-sm">{pair.games}</td>
                  <td className="px-4 py-2">
                    <span className={`font-semibold ${
                      pair.winrate >= 60 ? 'text-green-400' :
                      pair.winrate >= 50 ? 'text-blue-400' :
                      pair.winrate >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {pair.winrate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-1 rounded ${getSynergyColor(pair.synergy)} text-white`}>
                      {pair.synergy === 'excellent' ? 'Eccellente' :
                       pair.synergy === 'good' ? 'Buona' :
                       pair.synergy === 'average' ? 'Media' : 'Povera'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

