'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'

interface Teammate {
  account_id: number
  name: string
  games: number
  wins: number
  winrate: number
}

interface TeammateInsights {
  bestTeammate: Teammate | null
  worstTeammate: Teammate | null
  highWinrateTeammates: Teammate[]
  insights: string[]
}

export default function TeammatesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [teammates, setTeammates] = useState<Teammate[]>([])
  const [insights, setInsights] = useState<TeammateInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (playerId) {
      fetchTeammates()
    }
  }, [playerId])

  const fetchTeammates = async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`https://api.opendota.com/api/players/${playerId}/peers`)
      if (!response.ok) throw new Error('Failed to fetch teammates')

      const data = await response.json()
      const teammatesData: Teammate[] = data
        .filter((t: { games?: number }) => t.games && t.games > 0)
        .map((t: { account_id: number; games: number; win: number; personaname?: string }) => ({
          account_id: t.account_id,
          name: t.personaname || `Player ${t.account_id}`,
          games: t.games,
          wins: t.win,
          winrate: (t.win / t.games) * 100,
        }))
        .sort((a: Teammate, b: Teammate) => b.games - a.games)
        .slice(0, 20)

      setTeammates(teammatesData)

      // Calculate insights
      if (teammatesData.length > 0) {
        const minGames = 5 // Minimum games for meaningful insights
        const validTeammates = teammatesData.filter(t => t.games >= minGames)
        
        if (validTeammates.length > 0) {
          const bestTeammate = validTeammates.reduce((best, current) => 
            current.winrate > best.winrate ? current : best
          )
          
          const worstTeammate = validTeammates.reduce((worst, current) => 
            current.winrate < worst.winrate ? current : worst
          )
          
          const highWinrateTeammates = validTeammates
            .filter(t => t.winrate >= 60 && t.games >= 10)
            .sort((a, b) => b.winrate - a.winrate)
            .slice(0, 3)
          
          const insightsList: string[] = []
          
          if (bestTeammate && bestTeammate.winrate >= 60) {
            insightsList.push(`🏆 Winrate migliore con ${bestTeammate.name}: ${bestTeammate.winrate.toFixed(1)}% (${bestTeammate.games} partite)`)
          }
          
          if (highWinrateTeammates.length > 0) {
            const names = highWinrateTeammates.map(t => t.name).join(', ')
            insightsList.push(`✨ Sinergie migliori: ${names}`)
          }
          
          if (worstTeammate && worstTeammate.winrate < 40 && worstTeammate.games >= 10) {
            insightsList.push(`⚠️ Winrate bassa con ${worstTeammate.name}: ${worstTeammate.winrate.toFixed(1)}% (${worstTeammate.games} partite)`)
          }
          
          const avgWinrate = validTeammates.reduce((sum, t) => sum + t.winrate, 0) / validTeammates.length
          if (avgWinrate > 55) {
            insightsList.push(`📈 Winrate medio con i tuoi compagni: ${avgWinrate.toFixed(1)}% - Ottima sinergia di squadra!`)
          } else if (avgWinrate < 45) {
            insightsList.push(`📉 Winrate medio con i tuoi compagni: ${avgWinrate.toFixed(1)}% - Potresti beneficiare di un cambio di compagni`)
          }
          
          setInsights({
            bestTeammate: bestTeammate.winrate >= 50 ? bestTeammate : null,
            worstTeammate: worstTeammate.winrate < 50 ? worstTeammate : null,
            highWinrateTeammates,
            insights: insightsList,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teammates')
    } finally {
      setLoading(false)
    }
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
        pageTitle="Team & Compagni"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare i tuoi compagni di squadra. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Team & Compagni</h1>
      <p className="text-gray-400 mb-6">Statistiche dei giocatori con cui hai giocato più spesso</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento compagni...</p>
        </div>
      )}

      {insights && insights.insights.length > 0 && !loading && (
        <div className="mb-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">💡 Insights & Sinergie</h2>
          <div className="space-y-2">
            {insights.insights.map((insight, idx) => (
              <p key={idx} className="text-sm text-blue-200">{insight}</p>
            ))}
          </div>
        </div>
      )}

      {teammates.length > 0 && !loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Top Compagni</h2>
            <p className="text-sm text-gray-400 mt-1">Giocatori con cui hai giocato più spesso</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Giocatore</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Partite</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Vittorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Winrate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {teammates.map((teammate) => {
                  const isBest = insights?.bestTeammate?.account_id === teammate.account_id
                  const isHighWinrate = insights?.highWinrateTeammates.some(t => t.account_id === teammate.account_id)
                  
                  return (
                    <tr key={teammate.account_id} className={`hover:bg-gray-750 ${isBest ? 'bg-green-900/20' : isHighWinrate ? 'bg-blue-900/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        <div className="flex items-center gap-2">
                          {isBest && <span className="text-yellow-400" title="Miglior winrate">🏆</span>}
                          {isHighWinrate && !isBest && <span className="text-blue-400" title="Alta sinergia">✨</span>}
                          {teammate.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{teammate.games}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{teammate.wins}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-semibold ${teammate.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {teammate.winrate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/analysis/player/${teammate.account_id}`}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Vedi Profilo
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {teammates.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun compagno trovato</p>
        </div>
      )}
    </div>
  )
}
