'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import { BarChart as BarChartIcon, Target, Lightbulb, Coins, Sword, Shield, Scale, Info, Activity, Eye } from 'lucide-react'

interface PerformanceStats {
  avgKDA: number
  avgGPM: number
  avgXPM: number
  avgDeaths: number
  avgAssists: number
  playstyle: string
  farmEfficiency: number
  teamfightParticipation: number
  matches?: Array<{
    match_id: number
    win: boolean
    kda: number
    gpm: number
    xpm: number
    start_time: number
  }>
  advanced?: {
    lane: { avgLastHits: number; avgDenies: number; firstBloodInvolvement: number }
    farm: { avgGPM: number; avgXPM: number; goldUtilization: number; avgNetWorth: number }
    fights: { killParticipation: number; avgHeroDamage: number; avgTowerDamage: number; avgDeaths: number }
    vision: { avgObserverPlaced: number; visionScore: number }
  }
}

interface Benchmarks {
  percentiles?: {
    gpm?: { percentile: number; label: string }
    xpm?: { percentile: number; label: string }
    kda?: { percentile: number; label: string }
  }
  calculatedPercentiles?: {
    gpm: { value: number; percentile: number; label: string }
    xpm: { value: number; percentile: number; label: string }
    kda: { value: number; percentile: number; label: string }
  }
  rankings?: {
    [key: string]: unknown
  }
  source: string
}

type TabType = 'overview' | 'charts' | 'analysis'

export default function PerformancePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchPerformance = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const [statsResponse, advancedResponse, benchmarksResponse] = await Promise.all([
        fetch(`/api/player/${playerId}/stats`),
        fetch(`/api/player/${playerId}/advanced-stats`),
        fetch(`/api/player/${playerId}/benchmarks`).catch(() => null) // Non bloccare se fallisce
      ])

      if (!statsResponse.ok) throw new Error('Failed to fetch player stats')

      const statsData = await statsResponse.json()
      const advancedData = advancedResponse.ok ? await advancedResponse.json() : null
      const benchmarksData = benchmarksResponse?.ok ? await benchmarksResponse.json() : null

      if (!statsData.stats) throw new Error('No stats available')
      
      // Set benchmarks if available
      if (benchmarksData) {
        setBenchmarks(benchmarksData)
      }

      // Calculate performance metrics from basic stats
      const matches = statsData.stats.matches || []
      // Prevent division by zero - always check array length before dividing
      const matchCount = matches.length
      const avgKDA = matchCount > 0 ? matches.reduce((acc: number, m: { kda: number }) => acc + m.kda, 0) / matchCount : 0
      const avgGPM = matchCount > 0 ? matches.reduce((acc: number, m: { gpm: number }) => acc + m.gpm, 0) / matchCount : 0
      const avgXPM = matchCount > 0 ? matches.reduce((acc: number, m: { xpm: number }) => acc + m.xpm, 0) / matchCount : 0
      
      // Use advanced stats if available
      const advanced = advancedData?.stats
      const avgDeaths = advanced?.fights?.avgDeaths || 0
      const avgAssists = advanced?.fights?.avgAssists || 0
      const killParticipation = advanced?.fights?.killParticipation || 0
      const goldUtilization = advanced?.farm?.goldUtilization || 0
      
      // Determine playstyle with advanced data
      let playstyle = 'Bilanciato'
      if (avgGPM > 600 && goldUtilization > 90) playstyle = 'Farm Focus - Late Game'
      else if (avgGPM > 550 && killParticipation > 70) playstyle = 'Aggressivo - Teamfight Focus'
      else if (avgGPM < 400 && advanced?.vision?.avgObserverPlaced > 5) playstyle = 'Support - Utility Focus'
      else if (killParticipation > 75) playstyle = 'Team Player - High Impact'
      else if (avgGPM > 600) playstyle = 'Farm Focus'
      else if (avgGPM < 400) playstyle = 'Support - Team Focus'

      setStats({
        avgKDA: avgKDA || 0,
        avgGPM: avgGPM || 0,
        avgXPM: avgXPM || 0,
        avgDeaths,
        avgAssists,
        playstyle,
        farmEfficiency: Math.min((avgGPM / 600) * 100, 100),
        teamfightParticipation: killParticipation,
        matches: matches.slice(0, 20),
        advanced: advanced || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchPerformance()
    }
  }, [playerId, fetchPerformance])

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
        pageTitle="Performance & Stile di Gioco"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le performance. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const radarData = stats ? [
    { subject: 'KDA', value: Math.min(stats.avgKDA * 10, 100), fullMark: 100 },
    { subject: 'GPM', value: stats.farmEfficiency, fullMark: 100 },
    { subject: 'Teamfight', value: stats.teamfightParticipation, fullMark: 100 },
    { subject: 'Survival', value: Math.max(100 - stats.avgDeaths * 10, 0), fullMark: 100 },
  ] : []

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-4">Performance & Stile di Gioco</h1>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento performance...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'charts' as TabType, name: 'Grafici', icon: Activity },
                { id: 'analysis' as TabType, name: 'Analisi', icon: Eye },
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
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Benchmarks Section */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center gap-2">
                      <BarChartIcon className="w-6 h-6" />
                      Benchmarks & Percentili
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                      Come ti posizioni rispetto alla comunità Dota 2
                    </p>
                    {benchmarks && (benchmarks.percentiles || benchmarks.calculatedPercentiles) ? (
                      <>
                        <div className="grid md:grid-cols-3 gap-4">
                          {benchmarks.percentiles?.gpm && (
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                              <div className="text-sm text-gray-400 mb-2">GPM (Gold per Minuto)</div>
                              <div className="flex items-baseline gap-2 mb-2">
                                <div className="text-3xl font-bold text-yellow-400">{stats.avgGPM.toFixed(0)}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Percentile:</span>
                                <span className={`text-sm font-bold ${
                                  benchmarks.percentiles.gpm.percentile >= 75 ? 'text-green-400' :
                                  benchmarks.percentiles.gpm.percentile >= 50 ? 'text-blue-400' :
                                  'text-gray-400'
                                }`}>
                                  {benchmarks.percentiles.gpm.label}
                                </span>
                              </div>
                            </div>
                          )}
                          {benchmarks.percentiles?.xpm && (
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                              <div className="text-sm text-gray-400 mb-2">XPM (XP per Minuto)</div>
                              <div className="flex items-baseline gap-2 mb-2">
                                <div className="text-3xl font-bold text-blue-400">{stats.avgXPM.toFixed(0)}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Percentile:</span>
                                <span className={`text-sm font-bold ${
                                  benchmarks.percentiles.xpm.percentile >= 75 ? 'text-green-400' :
                                  benchmarks.percentiles.xpm.percentile >= 50 ? 'text-blue-400' :
                                  'text-gray-400'
                                }`}>
                                  {benchmarks.percentiles.xpm.label}
                                </span>
                              </div>
                            </div>
                          )}
                          {benchmarks.percentiles?.kda && (
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                              <div className="text-sm text-gray-400 mb-2">KDA Ratio</div>
                              <div className="flex items-baseline gap-2 mb-2">
                                <div className="text-3xl font-bold text-red-400">{stats.avgKDA.toFixed(2)}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Percentile:</span>
                                <span className={`text-sm font-bold ${
                                  benchmarks.percentiles.kda.percentile >= 75 ? 'text-green-400' :
                                  benchmarks.percentiles.kda.percentile >= 50 ? 'text-blue-400' :
                                  'text-gray-400'
                                }`}>
                                  {benchmarks.percentiles.kda.label}
                                </span>
                              </div>
                            </div>
                          )}
                          {/* Fallback to calculated percentiles if OpenDota ratings not available */}
                          {!benchmarks.percentiles && benchmarks.calculatedPercentiles && (
                            <>
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                                <div className="text-sm text-gray-400 mb-2">GPM (Gold per Minuto)</div>
                                <div className="flex items-baseline gap-2 mb-2">
                                  <div className="text-3xl font-bold text-yellow-400">{benchmarks.calculatedPercentiles.gpm.value.toFixed(0)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Percentile:</span>
                                  <span className={`text-sm font-bold ${
                                    benchmarks.calculatedPercentiles.gpm.percentile >= 75 ? 'text-green-400' :
                                    benchmarks.calculatedPercentiles.gpm.percentile >= 50 ? 'text-blue-400' :
                                    'text-gray-400'
                                  }`}>
                                    {benchmarks.calculatedPercentiles.gpm.label}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                                <div className="text-sm text-gray-400 mb-2">XPM (XP per Minuto)</div>
                                <div className="flex items-baseline gap-2 mb-2">
                                  <div className="text-3xl font-bold text-blue-400">{benchmarks.calculatedPercentiles.xpm.value.toFixed(0)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Percentile:</span>
                                  <span className={`text-sm font-bold ${
                                    benchmarks.calculatedPercentiles.xpm.percentile >= 75 ? 'text-green-400' :
                                    benchmarks.calculatedPercentiles.xpm.percentile >= 50 ? 'text-blue-400' :
                                    'text-gray-400'
                                  }`}>
                                    {benchmarks.calculatedPercentiles.xpm.label}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                                <div className="text-sm text-gray-400 mb-2">KDA Ratio</div>
                                <div className="flex items-baseline gap-2 mb-2">
                                  <div className="text-3xl font-bold text-red-400">{benchmarks.calculatedPercentiles.kda.value.toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Percentile:</span>
                                  <span className={`text-sm font-bold ${
                                    benchmarks.calculatedPercentiles.kda.percentile >= 75 ? 'text-green-400' :
                                    benchmarks.calculatedPercentiles.kda.percentile >= 50 ? 'text-blue-400' :
                                    'text-gray-400'
                                  }`}>
                                    {benchmarks.calculatedPercentiles.kda.label}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {benchmarks && benchmarks.source === 'calculated' && (
                          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Percentili calcolati basati su standard Dota 2. Per percentili più accurati, assicurati che il tuo profilo OpenDota sia pubblico.
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <BarChartIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm mb-2">Benchmarks non disponibili</p>
                        <p className="text-gray-500 text-xs">
                          I dati di benchmark vengono calcolati in base alle tue performance recenti
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Playstyle Banner - Enhanced */}
                  <div className="bg-gradient-to-r from-red-900/50 to-gray-800 border border-red-700 rounded-lg p-6 relative">
                    {playerId && (
                      <InsightBadge
                        elementType="playstyle"
                        elementId="performance-playstyle"
                        contextData={{ playstyle: stats.playstyle }}
                        playerId={playerId}
                        position="top-right"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                          <Target className="w-6 h-6 text-red-400" />
                          Stile di Gioco Identificato
                        </h2>
                        <p className="text-3xl font-bold text-red-400 mb-2">{stats.playstyle}</p>
                        <p className="text-sm text-gray-400 mb-3">Basato su {stats.matches?.length || 20} partite recenti</p>
                        {stats.advanced && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-red-700/50">
                            <div>
                              <div className="text-xs text-gray-500">Kill Participation</div>
                              <div className="text-lg font-semibold text-white">{stats.teamfightParticipation.toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Gold Utilization</div>
                              <div className="text-lg font-semibold text-white">{stats.advanced.farm.goldUtilization.toFixed(0)}%</div>
                            </div>
                            {stats.advanced.vision && (
                              <div>
                                <div className="text-xs text-gray-500">Wards/Game</div>
                                <div className="text-lg font-semibold text-white">{stats.advanced.vision.avgObserverPlaced.toFixed(1)}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-gray-500">Hero Damage</div>
                              <div className="text-lg font-semibold text-white">{Math.round(stats.advanced.fights.avgHeroDamage / 1000)}k</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Overview - Enhanced Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-5 hover:border-red-500 transition-colors relative shadow-lg">
                      {playerId && (
                        <InsightBadge
                          elementType="metric-card"
                          elementId="performance-kda"
                          contextData={{ metricName: 'KDA', value: stats.avgKDA.toFixed(2), benchmark: '2.5' }}
                          playerId={playerId}
                          position="top-right"
                        />
                      )}
                      <div className="flex items-center justify-between mb-2 pr-8">
                        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">KDA</h3>
                        <Sword className="w-5 h-5 text-red-400" />
                      </div>
                      <p className="text-3xl font-bold text-white mb-2">{stats.avgKDA.toFixed(2)}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">KP:</span>
                        <span className="font-semibold text-gray-300">{stats.teamfightParticipation.toFixed(0)}%</span>
                      </div>
                      {benchmarks?.percentiles?.kda && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-500">Percentile:</div>
                          <div className={`text-sm font-bold ${
                            benchmarks.percentiles.kda.percentile >= 75 ? 'text-green-400' :
                            benchmarks.percentiles.kda.percentile >= 50 ? 'text-blue-400' :
                            'text-gray-400'
                          }`}>
                            {benchmarks.percentiles.kda.label}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-5 hover:border-yellow-500 transition-colors relative shadow-lg">
                      {playerId && (
                        <InsightBadge
                          elementType="metric-card"
                          elementId="performance-gpm"
                          contextData={{ metricName: 'GPM', value: stats.avgGPM.toFixed(0), benchmark: '500' }}
                          playerId={playerId}
                          position="top-right"
                        />
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">GPM</h3>
                        <Coins className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className="text-3xl font-bold text-yellow-400 mb-2">{stats.avgGPM.toFixed(0)}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Efficienza:</span>
                        <span className="font-semibold text-gray-300">{stats.farmEfficiency.toFixed(0)}%</span>
                      </div>
                      {benchmarks?.percentiles?.gpm && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-500">Percentile:</div>
                          <div className={`text-sm font-bold ${
                            benchmarks.percentiles.gpm.percentile >= 75 ? 'text-green-400' :
                            benchmarks.percentiles.gpm.percentile >= 50 ? 'text-blue-400' :
                            'text-gray-400'
                          }`}>
                            {benchmarks.percentiles.gpm.label}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-5 hover:border-blue-500 transition-colors shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">XPM</h3>
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-3xl font-bold text-blue-400 mb-2">{stats.avgXPM.toFixed(0)}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">XP acquisita</span>
                        <span className="font-semibold text-gray-300">/min</span>
                      </div>
                      {benchmarks?.percentiles?.xpm && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-500">Percentile:</div>
                          <div className={`text-sm font-bold ${
                            benchmarks.percentiles.xpm.percentile >= 75 ? 'text-green-400' :
                            benchmarks.percentiles.xpm.percentile >= 50 ? 'text-blue-400' :
                            'text-gray-400'
                          }`}>
                            {benchmarks.percentiles.xpm.label}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-5 hover:border-red-500 transition-colors shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Deaths</h3>
                        <Shield className="w-5 h-5 text-red-400" />
                      </div>
                      <p className="text-3xl font-bold text-red-400 mb-2">{stats.avgDeaths.toFixed(1)}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Assist:</span>
                        <span className="font-semibold text-gray-300">{stats.avgAssists.toFixed(1)}</span>
                      </div>
                      {stats.advanced && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-500">Survival Score:</div>
                          <div className="text-sm font-bold text-gray-300">
                            {Math.max(100 - (stats.avgDeaths * 10), 0).toFixed(0)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Tab */}
              {activeTab === 'charts' && (
                <div className="space-y-6">
                  {/* Trend Chart */}
                  {stats.matches && stats.matches.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
              {playerId && (
                <InsightBadge
                  elementType="trend-chart"
                  elementId="performance-trend-chart"
                  contextData={{ trends: { kda: stats.avgKDA, gpm: stats.avgGPM, xpm: stats.avgXPM }, data: stats.matches.slice(0, 10) }}
                  playerId={playerId}
                  position="top-right"
                />
              )}
              <h3 className="text-xl font-semibold mb-3">Trend Performance (Ultime 20 Partite)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.matches.slice(0, 20).map((m, idx) => ({
                  match: `M${idx + 1}`,
                  kda: m.kda,
                  gpm: m.gpm,
                  xpm: m.xpm,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="match" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="kda" stroke="#EF4444" strokeWidth={2} name="KDA" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="gpm" stroke="#F59E0B" strokeWidth={2} name="GPM" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="xpm" stroke="#3B82F6" strokeWidth={2} name="XPM" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
                  </div>
                  )}

                  {/* Charts Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Radar Chart - Compact */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold">Profilo Performance</h3>
                <span className="text-xs text-gray-400">Multi-dimensionale</span>
              </div>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <Radar 
                      name="Performance" 
                      dataKey="value" 
                      stroke="#EF4444" 
                      fill="#EF4444" 
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Dati non disponibili
                </div>
              )}
            </div>

                {/* Additional Metrics Bar Chart */}
                {stats.advanced && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3">Metriche Chiave</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Last Hits', value: stats.advanced.lane.avgLastHits },
                    { name: 'Hero Damage', value: Math.round(stats.advanced.fights.avgHeroDamage / 1000) },
                    { name: 'Tower Dmg', value: Math.round(stats.advanced.fights.avgTowerDamage / 100) },
                    { name: 'Wards', value: stats.advanced.vision.avgObserverPlaced },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
                </div>
              )}

              {/* Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {/* Performance Metrics - Compact */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-semibold">Efficienza Farm</h3>
                        <span className="text-sm font-bold text-red-400">{stats.farmEfficiency.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-red-600 h-3 rounded-full transition-all"
                          style={{ width: `${stats.farmEfficiency}%` }}
                        ></div>
                      </div>
                      {stats.advanced && (
                        <div className="mt-2 text-xs text-gray-400">
                          Gold Utilization: {stats.advanced.farm.goldUtilization.toFixed(1)}%
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-semibold">Partecipazione Teamfight</h3>
                        <span className="text-sm font-bold text-blue-400">{stats.teamfightParticipation.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${stats.teamfightParticipation}%` }}
                        ></div>
                      </div>
                      {stats.advanced && (
                        <div className="mt-2 text-xs text-gray-400">
                          Hero Damage medio: {Math.round(stats.advanced.fights.avgHeroDamage).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Playstyle-Specific Recommendations */}
                  <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-700 rounded-lg p-6">
                    <h3 className="text-2xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                      <Target className="w-6 h-6" />
                      Suggerimenti per il Tuo Stile di Gioco
                    </h3>
                    <div className="space-y-3">
              {stats.playstyle.includes('Farm Focus') && (
                <>
                  <p className="text-sm text-purple-200 flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <strong>Farm Focus:</strong> Il tuo stile è orientato al farm. Per migliorare:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-200 ml-4 space-y-1">
                    <li>Ottimizza i percorsi di farm per massimizzare GPM</li>
                    <li>Valuta meglio i timing degli item per essere efficace nei teamfight</li>
                    {stats.teamfightParticipation < 60 && (
                      <li>Partecipa di più ai teamfight quando hai item chiave completati</li>
                    )}
                    {stats.advanced && stats.advanced.farm.goldUtilization < 85 && (
                      <li>Spendi il gold più velocemente in item utili invece di accumularlo</li>
                    )}
                  </ul>
                </>
              )}
              {(stats.playstyle.includes('Aggressivo') || stats.playstyle.includes('Teamfight')) && (
                <>
                  <p className="text-sm text-purple-200 flex items-center gap-2">
                    <Sword className="w-4 h-4" />
                    <strong>Aggressivo/Teamfight Focus:</strong> Sei un giocatore da teamfight. Per migliorare:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-200 ml-4 space-y-1">
                    <li>Continua a partecipare attivamente ai teamfight</li>
                    {stats.avgGPM < 500 && (
                      <li>Bilancia la partecipazione ai fight con il farm per non rimanere indietro negli item</li>
                    )}
                    {stats.avgDeaths > 6 && (
                      <li>Migliora il positioning per ridurre le morti mantenendo l'impatto nei fight</li>
                    )}
                    {stats.advanced && stats.advanced.fights.killParticipation > 80 && (
                      <li>Ottima kill participation! Continua così, sei un asset fondamentale per la squadra</li>
                    )}
                  </ul>
                </>
              )}
              {stats.playstyle.includes('Support') && (
                <>
                  <p className="text-sm text-purple-200 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <strong>Support/Utility Focus:</strong> Il tuo ruolo è di supporto. Per migliorare:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-200 ml-4 space-y-1">
                    {stats.advanced && stats.advanced.vision.avgObserverPlaced < 5 && (
                      <li>Aumenta il warding per migliorare la visione della squadra</li>
                    )}
                    {stats.teamfightParticipation < 70 && (
                      <li>Partecipa di più ai teamfight, il tuo supporto è cruciale</li>
                    )}
                    {stats.avgGPM < 350 && (
                      <li>Trova un equilibrio tra supporto e farm per non rimanere troppo indietro</li>
                    )}
                    {stats.avgAssists < 10 && (
                      <li>Migliora il positioning per aumentare gli assist nei teamfight</li>
                    )}
                  </ul>
                </>
              )}
              {stats.playstyle === 'Bilanciato' && (
                <>
                  <p className="text-sm text-purple-200 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <strong>Bilanciato:</strong> Hai uno stile equilibrato. Per migliorare:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-200 ml-4 space-y-1">
                    {stats.avgGPM < 450 && (
                      <li>Migliora l'efficienza di farm per aumentare il GPM</li>
                    )}
                    {stats.teamfightParticipation < 60 && (
                      <li>Aumenta la partecipazione ai teamfight per avere più impatto</li>
                    )}
                    {stats.avgDeaths > 5 && (
                      <li>Riduci le morti migliorando il positioning e la mappa awareness</li>
                    )}
                    <li>Continua a bilanciare farm e teamfight per mantenere un impatto costante</li>
                  </ul>
                </>
              )}
              {stats.playstyle.includes('Team Player') && (
                <>
                  <p className="text-sm text-purple-200">
                    🤝 <strong>Team Player:</strong> Sei un giocatore di squadra. Per migliorare:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-200 ml-4 space-y-1">
                    <li>Ottima kill participation! Continua a supportare la squadra</li>
                    {stats.avgGPM < 500 && (
                      <li>Non trascurare il farm personale, anche i team player hanno bisogno di item</li>
                    )}
                    {stats.advanced && stats.advanced.fights.avgHeroDamage < 15000 && (
                      <li>Aumenta il damage output nei teamfight per massimizzare l'impatto</li>
                    )}
                  </ul>
                </>
              )}
            </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
