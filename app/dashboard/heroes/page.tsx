'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'

interface HeroStats {
  hero_id: number
  hero_name: string
  games: number
  wins: number
  winrate: number
}

export default function HeroesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [heroStats, setHeroStats] = useState<HeroStats[]>([])
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
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

  const fetchHeroStats = useCallback(async () => {
    if (!playerId || Object.keys(heroes).length === 0) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`https://api.opendota.com/api/players/${playerId}/heroes`)
      if (!response.ok) throw new Error('Failed to fetch hero stats')

      const data = await response.json()
      const stats: HeroStats[] = data
        .filter((h: { games?: number }) => h.games && h.games > 0)
        .map((h: { hero_id: number; games: number; win: number }) => ({
          hero_id: h.hero_id,
          hero_name: heroes[h.hero_id]?.localized_name || `Hero ${h.hero_id}`,
          games: h.games,
          wins: h.win,
          winrate: (h.win / h.games) * 100,
        }))
        .sort((a: HeroStats, b: HeroStats) => b.games - a.games)
        .slice(0, 10)

      setHeroStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hero stats')
    } finally {
      setLoading(false)
    }
  }, [playerId, heroes])

  useEffect(() => {
    if (playerId && Object.keys(heroes).length > 0) {
      fetchHeroStats()
    }
  }, [playerId, heroes, fetchHeroStats])

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
        pageTitle="Hero Pool"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le statistiche degli heroes. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const chartData = heroStats.map((hero) => ({
    name: hero.hero_name,
    winrate: hero.winrate,
    games: hero.games,
  }))

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Hero Pool</h1>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento statistiche heroes...</p>
        </div>
      )}

      {heroStats.length > 0 && !loading && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Top 10 Heroes per Partite</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={120} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="winrate" fill="#EF4444" name="Winrate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heroes Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Statistiche Heroes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Hero</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Partite</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Vittorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Winrate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {heroStats.map((hero) => (
                    <tr key={hero.hero_id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        {hero.hero_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.games}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.wins}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-semibold ${hero.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {hero.winrate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {heroStats.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessuna statistica heroes disponibile</p>
        </div>
      )}
    </div>
  )
}
