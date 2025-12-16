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

export default function TeammatesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [teammates, setTeammates] = useState<Teammate[]>([])
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

      {teammates.length > 0 && !loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Top Compagni</h2>
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
                {teammates.map((teammate) => (
                  <tr key={teammate.account_id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                      {teammate.name}
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
                ))}
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
