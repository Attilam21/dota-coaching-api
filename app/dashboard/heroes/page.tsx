'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import HeroCard from '@/components/HeroCard'
import { BarChart as BarChartIcon, Table } from 'lucide-react'

interface HeroStats {
  hero_id: number
  hero_name: string
  games: number
  wins: number
  winrate: number
  avg_gpm?: string
  avg_xpm?: string
  kda?: string
}

type TabType = 'chart' | 'stats'

export default function HeroesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [heroStats, setHeroStats] = useState<HeroStats[]>([])
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('chart')

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

      const response = await fetch(`/api/player/${playerId}/hero-analysis`)
      if (!response.ok) throw new Error('Failed to fetch hero stats')

      const data = await response.json()
      const stats: HeroStats[] = (data.heroStats || [])
        .map((h: { hero_id: number; games: number; wins: number; winrate: number; hero_name: string; avg_gpm?: string; avg_xpm?: string; kda?: string }) => ({
          hero_id: h.hero_id,
          hero_name: h.hero_name,
          games: h.games,
          wins: h.wins,
          winrate: h.winrate,
          avg_gpm: h.avg_gpm,
          avg_xpm: h.avg_xpm,
          kda: h.kda,
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
        pageTitle="Hero Pool"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le statistiche degli heroes. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const chartData = heroStats.map((hero) => ({
    name: hero.hero_name.length > 10 ? hero.hero_name.substring(0, 10) + '...' : hero.hero_name,
    winrate: hero.winrate,
    games: hero.games,
    kda: hero.kda && hero.kda !== 'N/A' ? parseFloat(hero.kda) : 0,
    gpm: hero.avg_gpm && hero.avg_gpm !== 'N/A' ? parseFloat(hero.avg_gpm) : 0,
    xpm: hero.avg_xpm && hero.avg_xpm !== 'N/A' ? parseFloat(hero.avg_xpm) : 0,
  }))

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
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
          {/* Hero Pool Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Heroes Totali</h3>
              <p className="text-2xl font-bold text-white">{heroStats.length}</p>
              <p className="text-xs text-gray-500 mt-1">Heroes giocati</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">KDA Medio</h3>
              <p className="text-2xl font-bold text-red-400">
                {(() => {
                  const validKDA = heroStats.filter(h => h.kda && h.kda !== '0' && h.kda !== 'N/A' && !isNaN(parseFloat(h.kda)))
                  if (validKDA.length === 0) return '0.00'
                  const avg = validKDA.reduce((acc, h) => acc + parseFloat(h.kda || '0'), 0) / validKDA.length
                  return isNaN(avg) ? '0.00' : avg.toFixed(2)
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">GPM Medio</h3>
              <p className="text-2xl font-bold text-yellow-400">
                {(() => {
                  const validGPM = heroStats.filter(h => h.avg_gpm && h.avg_gpm !== '0' && h.avg_gpm !== 'N/A' && !isNaN(parseFloat(h.avg_gpm)))
                  if (validGPM.length === 0) return '0'
                  const avg = validGPM.reduce((acc, h) => acc + parseFloat(h.avg_gpm || '0'), 0) / validGPM.length
                  return isNaN(avg) ? '0' : Math.round(avg).toString()
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">XPM Medio</h3>
              <p className="text-2xl font-bold text-blue-400">
                {(() => {
                  const validXPM = heroStats.filter(h => h.avg_xpm && h.avg_xpm !== '0' && h.avg_xpm !== 'N/A' && !isNaN(parseFloat(h.avg_xpm)))
                  if (validXPM.length === 0) return '0'
                  const avg = validXPM.reduce((acc, h) => acc + parseFloat(h.avg_xpm || '0'), 0) / validXPM.length
                  return isNaN(avg) ? '0' : Math.round(avg).toString()
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'chart' as TabType, name: 'Grafico', icon: BarChartIcon },
                { id: 'stats' as TabType, name: 'Statistiche', icon: Table },
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
              {/* Chart Tab */}
              {activeTab === 'chart' && (
                <div className="space-y-6">
                  {/* Winrate Chart */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 relative">
                    {playerId && (
                      <InsightBadge
                        elementType="trend-chart"
                        elementId="heroes-chart"
                        contextData={{ heroes: heroStats.slice(0, 10), totalHeroes: heroStats.length }}
                        playerId={playerId}
                        position="top-right"
                      />
                    )}
                    <h2 className="text-2xl font-semibold mb-4">Winrate per Hero</h2>
                    <ResponsiveContainer width="100%" height={300}>
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

                  {/* GPM/XPM Chart */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">GPM e XPM per Hero</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={120} />
                        <YAxis yAxisId="left" stroke="#9CA3AF" />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="gpm" fill="#F59E0B" name="GPM" />
                        <Bar yAxisId="right" dataKey="xpm" fill="#3B82F6" name="XPM" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* KDA Chart */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">KDA per Hero</h2>
                    <ResponsiveContainer width="100%" height={300}>
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
                        <Bar dataKey="kda" fill="#EF4444" name="KDA" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-semibold">Statistiche Heroes</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Hero</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Partite</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Vittorie</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Winrate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">KDA</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">GPM</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">XPM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {heroStats.map((hero) => (
                          <tr key={hero.hero_id} className="hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <HeroCard
                                  heroId={hero.hero_id}
                                  heroName={heroes[hero.hero_id]?.name || ''}
                                  size="sm"
                                />
                                <span className="text-white font-medium">{hero.hero_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.games}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.wins}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`font-semibold ${hero.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                {hero.winrate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              <span className="font-medium">{hero.kda || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              <span className="font-medium text-yellow-400">{hero.avg_gpm || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              <span className="font-medium text-blue-400">{hero.avg_xpm || 'N/A'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
