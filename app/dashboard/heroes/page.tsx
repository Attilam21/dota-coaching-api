'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import HeroCard from '@/components/HeroCard'
import HeroIcon from '@/components/HeroIcon'
import { BarChart as BarChartIcon, Table, Target, TrendingUp, Users, CheckCircle, AlertCircle, Grid3x3, List, ArrowUpDown } from 'lucide-react'

interface HeroStats {
  hero_id: number
  hero_name: string
  games: number
  wins: number
  winrate: number
  avg_gpm?: string
  avg_xpm?: string
  kda?: string
  roles?: string[]
  primary_attr?: string
  rating?: string
}

interface HeroAnalysisData {
  heroStats: HeroStats[]
  bestHeroes: HeroStats[]
  worstHeroes: HeroStats[]
  overall: {
    totalGames: number
    totalWins: number
    overallWinrate: string
    diverseHeroes: number
    totalHeroesPlayed: number
  }
  mostPlayed: HeroStats | null
  roleStats: Record<string, { games: number; wins: number; winrate: number }>
  insights: string[]
}

type TabType = 'chart' | 'stats' | 'analysis'

export default function HeroesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [heroStats, setHeroStats] = useState<HeroStats[]>([])
  const [analysisData, setAnalysisData] = useState<HeroAnalysisData | null>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('chart')
  const [statsView, setStatsView] = useState<'grid' | 'table'>('grid')
  const [sortBy, setSortBy] = useState<'games' | 'winrate' | 'kda'>('games')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Fetch heroes list
    let isMounted = true
    
    fetch('/api/opendota/heroes')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && isMounted && Array.isArray(data)) {
          const heroesMap: Record<number, { name: string; localized_name: string }> = {}
          data.forEach((hero: { id: number; name: string; localized_name: string }) => {
            // Only save heroes with valid name and localized_name
            if (hero.name && hero.localized_name) {
              heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
            }
          })
          setHeroes(heroesMap)
        }
      })
      .catch((error) => {
        console.error('Error loading heroes:', error)
      })
    
    return () => {
      isMounted = false
    }
  }, [])

  const fetchHeroStats = useCallback(async () => {
    if (!playerId || Object.keys(heroes).length === 0) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/hero-analysis`)
      if (!response.ok) throw new Error('Failed to fetch hero stats')

      const data = await response.json()
      
      // Save full analysis data
      setAnalysisData({
        heroStats: data.heroStats || [],
        bestHeroes: data.bestHeroes || [],
        worstHeroes: data.worstHeroes || [],
        overall: data.overall || {
          totalGames: 0,
          totalWins: 0,
          overallWinrate: '0',
          diverseHeroes: 0,
          totalHeroesPlayed: 0,
        },
        mostPlayed: data.mostPlayed || null,
        roleStats: data.roleStats || {},
        insights: data.insights || [],
      })
      
      // Keep existing heroStats for backward compatibility (top 10)
      const stats: HeroStats[] = (data.heroStats || [])
        .map((h: any) => ({
          hero_id: h.hero_id,
          hero_name: h.hero_name,
          games: h.games,
          wins: h.wins,
          winrate: h.winrate,
          avg_gpm: h.avg_gpm,
          avg_xpm: h.avg_xpm,
          kda: h.kda,
          roles: h.roles,
          primary_attr: h.primary_attr,
          rating: h.rating,
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
    // Include KDA even if 0 - it's valid data (e.g., support heroes with many assists but few kills)
    kda: hero.kda && hero.kda !== 'N/A' ? parseFloat(hero.kda) : 0,
    gpm: hero.avg_gpm && hero.avg_gpm !== 'N/A' && hero.avg_gpm !== '0' ? parseFloat(hero.avg_gpm) : 0,
    xpm: hero.avg_xpm && hero.avg_xpm !== 'N/A' && hero.avg_xpm !== '0' ? parseFloat(hero.avg_xpm) : 0,
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
              <p className="text-2xl font-bold text-white">{analysisData?.overall.totalHeroesPlayed || heroStats.length}</p>
              <p className="text-xs text-gray-500 mt-1">Heroes giocati</p>
            </div>
            {analysisData && (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">Heroes per Ruolo</h3>
                  <p className="text-2xl font-bold text-blue-400">{Object.keys(analysisData.roleStats).length}</p>
                  <p className="text-xs text-gray-500 mt-1">Ruoli diversi giocati</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">Ruolo Preferito</h3>
                  <p className="text-lg font-bold text-yellow-400">
                    {(() => {
                      const roleEntries = Object.entries(analysisData.roleStats)
                      if (roleEntries.length === 0) return 'N/A'
                      const mostPlayedRole = roleEntries.sort((a, b) => b[1].games - a[1].games)[0]
                      return mostPlayedRole[0].charAt(0).toUpperCase() + mostPlayedRole[0].slice(1)
                    })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Più giocato</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">Pool Completo?</h3>
                  <p className={`text-2xl font-bold ${
                    analysisData.overall.diverseHeroes >= 12 ? 'text-green-400' :
                    analysisData.overall.diverseHeroes >= 8 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {analysisData.overall.diverseHeroes >= 12 ? '✓' : analysisData.overall.diverseHeroes >= 8 ? '~' : '✗'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{analysisData.overall.diverseHeroes} heroes con 5+ partite</p>
                </div>
              </>
            )}
            {!analysisData && (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">KDA Medio</h3>
                  <p className="text-2xl font-bold text-red-400">
                    {(() => {
                      const validKDA = heroStats.filter(h => {
                        if (!h.kda) return false
                        const kdaValue = parseFloat(h.kda)
                        return !isNaN(kdaValue) && kdaValue > 0 && h.kda !== '0.00'
                      })
                      if (validKDA.length === 0) return '0.00'
                      const count = validKDA.length
                      const avg = count > 0 ? validKDA.reduce((acc, h) => acc + parseFloat(h.kda || '0'), 0) / count : 0
                      return isNaN(avg) ? '0.00' : avg.toFixed(2)
                    })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">GPM Medio</h3>
                  <p className="text-2xl font-bold text-yellow-400">
                    {(() => {
                      const validGPM = heroStats.filter(h => {
                        if (!h.avg_gpm) return false
                        const gpmValue = parseFloat(h.avg_gpm)
                        return !isNaN(gpmValue) && gpmValue > 0 && h.avg_gpm !== '0'
                      })
                      if (validGPM.length === 0) return 'N/A'
                      const count = validGPM.length
                      const avg = count > 0 ? validGPM.reduce((acc, h) => acc + parseFloat(h.avg_gpm || '0'), 0) / count : 0
                      return isNaN(avg) ? 'N/A' : Math.round(avg).toString()
                    })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">XPM Medio</h3>
                  <p className="text-2xl font-bold text-blue-400">
                    {(() => {
                      const validXPM = heroStats.filter(h => {
                        if (!h.avg_xpm) return false
                        const xpmValue = parseFloat(h.avg_xpm)
                        return !isNaN(xpmValue) && xpmValue > 0 && h.avg_xpm !== '0'
                      })
                      if (validXPM.length === 0) return 'N/A'
                      const count = validXPM.length
                      const avg = count > 0 ? validXPM.reduce((acc, h) => acc + parseFloat(h.avg_xpm || '0'), 0) / count : 0
                      return isNaN(avg) ? 'N/A' : Math.round(avg).toString()
                    })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
                </div>
              </>
            )}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">KDA Medio</h3>
              <p className="text-2xl font-bold text-red-400">
                {(() => {
                  const validKDA = heroStats.filter(h => {
                    if (!h.kda) return false
                    const kdaValue = parseFloat(h.kda)
                    return !isNaN(kdaValue) && kdaValue > 0 && h.kda !== '0.00'
                  })
                  if (validKDA.length === 0) return '0.00'
                  const count = validKDA.length
                  const avg = count > 0 ? validKDA.reduce((acc, h) => acc + parseFloat(h.kda || '0'), 0) / count : 0
                  return isNaN(avg) ? '0.00' : avg.toFixed(2)
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">GPM Medio</h3>
              <p className="text-2xl font-bold text-yellow-400">
                {(() => {
                  const validGPM = heroStats.filter(h => {
                    if (!h.avg_gpm) return false
                    const gpmValue = parseFloat(h.avg_gpm)
                    return !isNaN(gpmValue) && gpmValue > 0 && h.avg_gpm !== '0'
                  })
                  if (validGPM.length === 0) return 'N/A'
                  const count = validGPM.length
                  const avg = count > 0 ? validGPM.reduce((acc, h) => acc + parseFloat(h.avg_gpm || '0'), 0) / count : 0
                  return isNaN(avg) ? 'N/A' : Math.round(avg).toString()
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Media su tutti gli heroes</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">XPM Medio</h3>
              <p className="text-2xl font-bold text-blue-400">
                {(() => {
                  const validXPM = heroStats.filter(h => {
                    if (!h.avg_xpm) return false
                    const xpmValue = parseFloat(h.avg_xpm)
                    return !isNaN(xpmValue) && xpmValue > 0 && h.avg_xpm !== '0'
                  })
                  if (validXPM.length === 0) return 'N/A'
                  const count = validXPM.length
                  const avg = count > 0 ? validXPM.reduce((acc, h) => acc + parseFloat(h.avg_xpm || '0'), 0) / count : 0
                  return isNaN(avg) ? 'N/A' : Math.round(avg).toString()
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
                { id: 'analysis' as TabType, name: 'Pool Analysis', icon: Target },
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

              {/* Pool Analysis Tab */}
              {activeTab === 'analysis' && analysisData && (
                <div className="space-y-6">
                  {/* Diversity & Role Coverage */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Diversità & Copertura Ruoli
                    </h2>
                    {Object.keys(analysisData.roleStats).length > 0 ? (
                      <div>
                        <h3 className="text-base font-semibold mb-3 text-gray-300">Performance per Ruolo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(analysisData.roleStats)
                            .sort((a, b) => b[1].games - a[1].games)
                            .map(([role, stats]) => {
                              const heroesInRole = analysisData.heroStats.filter(h => 
                                h.roles && h.roles.includes(role) && h.games >= 5
                              ).length
                              const totalGames = Object.values(analysisData.roleStats).reduce((sum, s) => sum + s.games, 0)
                              const percentage = ((stats.games / totalGames) * 100).toFixed(1)
                              
                              return (
                                <div key={role} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                                  <div className="mb-3">
                                    <span className="font-semibold text-white capitalize text-sm">{role}</span>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-400">Partite</span>
                                      <span className="text-sm font-medium text-white">{stats.games} <span className="text-gray-500 text-xs">({percentage}%)</span></span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-400">Winrate</span>
                                      <span className={`text-sm font-bold ${
                                        stats.winrate >= 55 ? 'text-green-400' :
                                        stats.winrate >= 50 ? 'text-blue-400' :
                                        'text-red-400'
                                      }`}>
                                        {stats.winrate.toFixed(1)}%
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-400">Heroes (5+ partite)</span>
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-white">{heroesInRole}</span>
                                        {heroesInRole < 4 && (
                                          <span className="text-xs text-yellow-400" title="Considera di espandere il pool per questo ruolo">⚠</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400">Nessun dato ruolo disponibile</p>
                    )}
                  </div>

                  {/* Specialization Analysis */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Analisi Specializzazione
                    </h2>
                    {Object.keys(analysisData.roleStats).length > 0 && (() => {
                      const roleEntries = Object.entries(analysisData.roleStats)
                      const bestWinrateRole = roleEntries.sort((a, b) => b[1].winrate - a[1].winrate)[0]
                      const mostPlayedRole = roleEntries.sort((a, b) => b[1].games - a[1].games)[0]
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                            <h3 className="text-sm text-gray-400 mb-2">Ruolo con Miglior Winrate</h3>
                            <p className="text-2xl font-bold text-green-400 capitalize">{bestWinrateRole[0]}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {bestWinrateRole[1].winrate.toFixed(1)}% su {bestWinrateRole[1].games} partite
                            </p>
                          </div>
                          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                            <h3 className="text-sm text-gray-400 mb-2">Ruolo Più Giocato</h3>
                            <p className="text-2xl font-bold text-blue-400 capitalize">{mostPlayedRole[0]}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {mostPlayedRole[1].games} partite ({((mostPlayedRole[1].games / analysisData.overall.totalGames) * 100).toFixed(1)}% del totale)
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                    {analysisData.overall.diverseHeroes < 12 && (
                      <div className="mt-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                        <p className="text-yellow-300 text-sm">
                          💡 <strong>Suggerimento:</strong> Hai {analysisData.overall.diverseHeroes} heroes con 5+ partite. 
                          Per un pool completo, considera di avere almeno 4-5 heroes per ruolo principale.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Raccomandazioni
                    </h2>
                    
                    {/* Best Heroes to Play More */}
                    {analysisData.bestHeroes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Heroes da Giocare di Più
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {analysisData.bestHeroes.slice(0, 6).map((hero) => (
                            <div key={hero.hero_id} className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                {heroes[hero.hero_id] && heroes[hero.hero_id].name && (
                                  <HeroIcon
                                    heroId={hero.hero_id}
                                    heroName={heroes[hero.hero_id].name}
                                    size={32}
                                    className="rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-white text-sm">{hero.hero_name}</p>
                                  <p className="text-xs text-gray-400">{hero.games} partite</p>
                                </div>
                                <span className="text-green-400 font-bold">{hero.winrate.toFixed(1)}%</span>
                              </div>
                              <p className="text-xs text-green-300">Winrate eccellente - continua a giocarlo!</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Heroes to Avoid */}
                    {analysisData.worstHeroes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Heroes da Evitare o Praticare
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {analysisData.worstHeroes.slice(0, 6).map((hero) => (
                            <div key={hero.hero_id} className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                {heroes[hero.hero_id] && heroes[hero.hero_id].name && (
                                  <HeroIcon
                                    heroId={hero.hero_id}
                                    heroName={heroes[hero.hero_id].name}
                                    size={32}
                                    className="rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-white text-sm">{hero.hero_name}</p>
                                  <p className="text-xs text-gray-400">{hero.games} partite</p>
                                </div>
                                <span className="text-red-400 font-bold">{hero.winrate.toFixed(1)}%</span>
                              </div>
                              <p className="text-xs text-red-300">Winrate bassa - pratica o evita in ranked</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insights */}
                    {analysisData.insights.length > 0 && (
                      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-200 mb-3">💡 Insights</h3>
                        <ul className="space-y-2">
                          {analysisData.insights.map((insight, idx) => (
                            <li key={idx} className="text-blue-300 text-sm flex items-start gap-2">
                              <span className="text-blue-400 mt-1">→</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  {/* Header con controlli */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-semibold">Statistiche Heroes</h2>
                    <div className="flex items-center gap-2">
                      {/* Sort */}
                      <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'games' | 'winrate' | 'kda')}
                          className="bg-transparent text-sm text-white border-none outline-none cursor-pointer"
                        >
                          <option value="games">Ordina per Partite</option>
                          <option value="winrate">Ordina per Winrate</option>
                          <option value="kda">Ordina per KDA</option>
                        </select>
                      </div>
                      {/* View Toggle */}
                      <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setStatsView('grid')}
                          className={`p-2 rounded transition-colors ${
                            statsView === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
                          }`}
                          title="Vista griglia"
                        >
                          <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStatsView('table')}
                          className={`p-2 rounded transition-colors ${
                            statsView === 'table' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
                          }`}
                          title="Vista tabella"
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Grid View - Compatto */}
                  {statsView === 'grid' && (() => {
                    const allHeroes = analysisData?.heroStats || heroStats
                    const sortedHeroes = [...allHeroes].sort((a, b) => {
                      if (sortBy === 'games') return b.games - a.games
                      if (sortBy === 'winrate') return b.winrate - a.winrate
                      if (sortBy === 'kda') {
                        const aKda = parseFloat(a.kda || '0')
                        const bKda = parseFloat(b.kda || '0')
                        return bKda - aKda
                      }
                      return 0
                    })

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {sortedHeroes.map((hero) => (
                          <div
                            key={hero.hero_id}
                            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 hover:border-gray-500 hover:bg-gray-700/70 transition-all group"
                          >
                            {/* Hero Icon + Name */}
                            <div className="flex flex-col items-center gap-2 mb-2">
                              {heroes[hero.hero_id] && heroes[hero.hero_id].name && (
                                <HeroIcon
                                  heroId={hero.hero_id}
                                  heroName={heroes[hero.hero_id].name}
                                  size={48}
                                  className="rounded"
                                />
                              )}
                              <span className="text-white font-medium text-xs text-center leading-tight">
                                {hero.hero_name}
                              </span>
                            </div>
                            
                            {/* Winrate - Principale */}
                            <div className="text-center mb-2">
                              <span className={`text-lg font-bold ${
                                hero.winrate >= 60 ? 'text-green-400' :
                                hero.winrate >= 50 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {hero.winrate.toFixed(1)}%
                              </span>
                            </div>

                            {/* Stats compatte */}
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between text-gray-400">
                                <span>Partite:</span>
                                <span className="text-white font-medium">{hero.games}</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                <span>KDA:</span>
                                <span className="text-white font-medium">{hero.kda || 'N/A'}</span>
                              </div>
                              {hero.avg_gpm && (
                                <div className="flex justify-between text-gray-400">
                                  <span>GPM:</span>
                                  <span className="text-yellow-400 font-medium">{hero.avg_gpm}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Table View - Compatta */}
                  {statsView === 'table' && (() => {
                    const allHeroes = analysisData?.heroStats || heroStats
                    const sortedHeroes = [...allHeroes].sort((a, b) => {
                      if (sortBy === 'games') return b.games - a.games
                      if (sortBy === 'winrate') return b.winrate - a.winrate
                      if (sortBy === 'kda') {
                        const aKda = parseFloat(a.kda || '0')
                        const bKda = parseFloat(b.kda || '0')
                        return bKda - aKda
                      }
                      return 0
                    })

                    return (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-700">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Hero</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Partite</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Winrate</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">KDA</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">GPM</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">XPM</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {sortedHeroes.map((hero) => (
                                <tr key={hero.hero_id} className="hover:bg-gray-700/50">
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      {heroes[hero.hero_id] && heroes[hero.hero_id].name && (
                                        <HeroIcon
                                          heroId={hero.hero_id}
                                          heroName={heroes[hero.hero_id].name}
                                          size={32}
                                          className="rounded"
                                        />
                                      )}
                                      <span className="text-white font-medium text-sm">{hero.hero_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">{hero.games}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className={`font-semibold text-sm ${
                                      hero.winrate >= 60 ? 'text-green-400' :
                                      hero.winrate >= 50 ? 'text-yellow-400' :
                                      'text-red-400'
                                    }`}>
                                      {hero.winrate.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">
                                    <span className="font-medium">{hero.kda || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">
                                    <span className="font-medium text-yellow-400">{hero.avg_gpm || 'N/A'}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">
                                    <span className="font-medium text-blue-400">{hero.avg_xpm || 'N/A'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })()}
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