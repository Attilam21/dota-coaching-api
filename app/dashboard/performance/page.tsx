'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import { BarChart as BarChartIcon, Target, Lightbulb, Coins, Sword, Shield, Scale, Info, Activity, Eye } from 'lucide-react'
import { useBackgroundPreference } from '@/lib/hooks/useBackgroundPreference'
import { useDashboardStyles } from '@/lib/hooks/useDashboardStyles'

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

type TabType = 'overview' | 'charts' | 'focus'

export default function PerformancePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const { backgroundUrl } = useBackgroundPreference()
  const styles = useDashboardStyles()
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

  const fetchPerformance = useCallback(async (abortSignal?: AbortSignal) => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const [statsResponse, advancedResponse, benchmarksResponse] = await Promise.all([
        fetch(`/api/player/${playerId}/stats`, { signal: abortSignal }),
        fetch(`/api/player/${playerId}/advanced-stats`, { signal: abortSignal }),
        fetch(`/api/player/${playerId}/benchmarks`, { signal: abortSignal }).catch(() => null) // Non bloccare se fallisce
      ])
      
      if (abortSignal?.aborted) return

      if (!statsResponse.ok) throw new Error('Failed to fetch player stats')

      let statsData
      let advancedData = null
      let benchmarksData = null
      
      try {
        statsData = await statsResponse.json()
      } catch (err) {
        throw new Error('Failed to parse stats response')
      }
      
      if (advancedResponse.ok) {
        try {
          advancedData = await advancedResponse.json()
        } catch (err) {
          console.warn('Failed to parse advanced stats, continuing without them')
        }
      }
      
      if (benchmarksResponse?.ok) {
        try {
          benchmarksData = await benchmarksResponse.json()
        } catch (err) {
          console.warn('Failed to parse benchmarks, continuing without them')
        }
      }

      if (abortSignal?.aborted) return
      if (!statsData || !statsData.stats) throw new Error('No stats available')
      
      // Set benchmarks if available
      if (benchmarksData && !abortSignal?.aborted) {
        setBenchmarks(benchmarksData)
      }

      // Calculate performance metrics from basic stats
      const matches = Array.isArray(statsData.stats.matches) ? statsData.stats.matches : []
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
      
      // Calculate farmEfficiency: use advanced-stats definition if available, otherwise fallback to GPM-based
      // Advanced-stats: (avgLastHits + avgDenies) / (avgDuration / 60) = CS per minute
      // For percentage: normalize to reasonable max (e.g., 8 CS/min = 100%)
      const farmEfficiencyFromAdvanced = advanced?.farm?.farmEfficiency || 0
      const farmEfficiency = farmEfficiencyFromAdvanced > 0
        ? Math.min((farmEfficiencyFromAdvanced / 8) * 100, 100) // Normalize CS/min to percentage (8 CS/min = 100%)
        : Math.min((avgGPM / 600) * 100, 100) // Fallback: GPM-based
      
      // teamfightParticipation: use killParticipation (percentage) as it's more meaningful than raw count
      // Note: advanced-stats has teamfightParticipation as raw number, but killParticipation is more useful
      const teamfightParticipation = killParticipation
      
      // Determine playstyle with advanced data
      let playstyle = 'Bilanciato'
      if (avgGPM > 600 && goldUtilization > 90) playstyle = 'Farm Focus - Late Game'
      else if (avgGPM > 550 && killParticipation > 70) playstyle = 'Aggressivo - Teamfight Focus'
      else if (avgGPM < 400 && advanced?.vision?.avgObserverPlaced > 5) playstyle = 'Support - Utility Focus'
      else if (killParticipation > 75) playstyle = 'Team Player - High Impact'
      else if (avgGPM > 600) playstyle = 'Farm Focus'
      else if (avgGPM < 400) playstyle = 'Support - Team Focus'

      if (!abortSignal?.aborted) {
        setStats({
          avgKDA: avgKDA || 0,
          avgGPM: avgGPM || 0,
          avgXPM: avgXPM || 0,
          avgDeaths,
          avgAssists,
          playstyle,
          farmEfficiency,
          teamfightParticipation,
          matches: matches.slice(0, 20),
          advanced: advanced || undefined,
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      if (!abortSignal?.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load performance data')
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false)
      }
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      const abortController = new AbortController()
      fetchPerformance(abortController.signal)
      
      return () => {
        abortController.abort()
      }
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
          <p className={`mt-4 ${styles.textSecondary}`}>Caricamento performance...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className={`${styles.tabContainer} mb-6`}>
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'charts' as TabType, name: 'Grafici', icon: Activity },
                { id: 'focus' as TabType, name: 'Focus Areas', icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gray-700 border-b-2 border-red-500'
                      : `${styles.textSecondary} hover:${styles.textPrimary} hover:bg-gray-700/50`
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
                  <div className={`${styles.hasBackground ? 'bg-blue-900/40 backdrop-blur-sm' : 'bg-gradient-to-r from-blue-900/30 to-purple-900/30'} border border-blue-700 rounded-lg p-6`}>
                    <h2 className={`text-2xl font-semibold ${styles.hasBackground ? 'text-blue-200 drop-shadow-sm' : 'text-blue-300'} mb-4 flex items-center gap-2`}>
                      <BarChartIcon className="w-6 h-6" />
                      Benchmarks & Percentili
                    </h2>
                    <p className={`${styles.textSecondary} text-sm mb-4`}>
                      Come ti posizioni rispetto alla comunità Dota 2
                    </p>
                    {benchmarks && (benchmarks.percentiles || benchmarks.calculatedPercentiles) ? (
                      <>
                        <div className="grid md:grid-cols-3 gap-4">
                          {benchmarks.percentiles?.gpm && (
                            <div className={`${styles.cardSubtle} rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors`}>
                              <div className={`text-sm ${styles.textSecondary} mb-2`}>GPM (Gold per Minuto)</div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${styles.textMuted}`}>Percentile:</span>
                                <span className={`text-2xl font-bold ${
                                  benchmarks.percentiles.gpm.percentile >= 75 ? 'text-green-400' :
                                  benchmarks.percentiles.gpm.percentile >= 50 ? 'text-blue-400' :
                                  styles.textSecondary
                                }`}>
                                  {benchmarks.percentiles.gpm.label}
                                </span>
                              </div>
                              <p className={`text-xs ${styles.textMuted} mt-2`}>Posizionamento rispetto alla community</p>
                            </div>
                          )}
                          {benchmarks.percentiles?.xpm && (
                            <div className={`${styles.cardSubtle} rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors`}>
                              <div className={`text-sm ${styles.textSecondary} mb-2`}>XPM (XP per Minuto)</div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${styles.textMuted}`}>Percentile:</span>
                                <span className={`text-2xl font-bold ${
                                  benchmarks.percentiles.xpm.percentile >= 75 ? 'text-green-400' :
                                  benchmarks.percentiles.xpm.percentile >= 50 ? 'text-blue-400' :
                                  styles.textSecondary
                                }`}>
                                  {benchmarks.percentiles.xpm.label}
                                </span>
                              </div>
                              <p className={`text-xs ${styles.textMuted} mt-2`}>Posizionamento rispetto alla community</p>
                            </div>
                          )}
                          {benchmarks.percentiles?.kda && (
                            <div className={`${styles.cardSubtle} rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors`}>
                              <div className={`text-sm ${styles.textSecondary} mb-2`}>KDA Ratio</div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${styles.textMuted}`}>Percentile:</span>
                                <span className={`text-2xl font-bold ${
                                  benchmarks.percentiles.kda.percentile >= 75 ? 'text-green-400' :
                                  benchmarks.percentiles.kda.percentile >= 50 ? 'text-blue-400' :
                                  styles.textSecondary
                                }`}>
                                  {benchmarks.percentiles.kda.label}
                                </span>
                              </div>
                              <p className={`text-xs ${styles.textMuted} mt-2`}>Posizionamento rispetto alla community</p>
                            </div>
                          )}
                          {/* Fallback to calculated percentiles if OpenDota ratings not available */}
                          {!benchmarks.percentiles && benchmarks.calculatedPercentiles && (
                            <>
                              <div className={`${styles.cardSubtle} rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors`}>
                                <div className={`text-sm ${styles.textSecondary} mb-2`}>GPM (Gold per Minuto)</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${styles.textMuted}`}>Percentile:</span>
                                  <span className={`text-2xl font-bold ${
                                    benchmarks.calculatedPercentiles.gpm.percentile >= 75 ? 'text-green-400' :
                                    benchmarks.calculatedPercentiles.gpm.percentile >= 50 ? 'text-blue-400' :
                                    styles.textSecondary
                                  }`}>
                                    {benchmarks.calculatedPercentiles.gpm.label}
                                  </span>
                                </div>
                                <p className={`text-xs ${styles.textMuted} mt-2`}>Posizionamento rispetto alla community</p>
                              </div>
                              <div className={`${styles.cardSubtle} rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors`}>
                                <div className={`text-sm ${styles.textSecondary} mb-2`}>XPM (XP per Minuto)</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${styles.textMuted}`}>Percentile:</span>
                                  <span className={`text-2xl font-bold ${
                                    benchmarks.calculatedPercentiles.xpm.percentile >= 75 ? 'text-green-400' :
                                    benchmarks.calculatedPercentiles.xpm.percentile >= 50 ? 'text-blue-400' :
                                    styles.textSecondary
                                  }`}>
                                    {benchmarks.calculatedPercentiles.xpm.label}
                                  </span>
                                </div>
                                <p className={`text-xs ${styles.textMuted} mt-2`}>Posizionamento rispetto alla community</p>
                              </div>
                              <div className={`${styles.cardSubtle} rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors`}>
                                <div className={`text-sm ${styles.textSecondary} mb-2`}>KDA Ratio</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${styles.textMuted}`}>Percentile:</span>
                                  <span className={`text-2xl font-bold ${
                                    benchmarks.calculatedPercentiles.kda.percentile >= 75 ? 'text-green-400' :
                                    benchmarks.calculatedPercentiles.kda.percentile >= 50 ? 'text-blue-400' :
                                    styles.textSecondary
                                  }`}>
                                    {benchmarks.calculatedPercentiles.kda.label}
                                  </span>
                                </div>
                                <p className={`text-xs ${styles.textMuted} mt-2`}>Posizionamento rispetto alla community</p>
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
                  <div className={`${styles.hasBackground ? 'bg-red-900/40 backdrop-blur-sm' : 'bg-gradient-to-r from-red-900/50 to-gray-800'} border border-red-700 rounded-lg p-6 relative`}>
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
                        <h2 className={`text-2xl font-semibold mb-3 flex items-center gap-2 ${styles.textPrimary}`}>
                          <Target className="w-6 h-6 text-red-400" />
                          Stile di Gioco Identificato
                        </h2>
                        <p className={`text-3xl font-bold ${styles.hasBackground ? 'text-red-300 drop-shadow-sm' : 'text-red-400'} mb-2`}>{stats.playstyle}</p>
                        <p className={`text-sm ${styles.textSecondary} mb-3`}>Basato su {stats.matches?.length || 20} partite recenti</p>
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
                    <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gradient-to-br from-gray-800 to-gray-900'} border border-gray-700 rounded-lg p-4 hover:border-red-500 transition-colors relative shadow-lg`}>
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
                        <h3 className={`text-xs ${styles.textSecondary} uppercase tracking-wider font-semibold`}>KDA</h3>
                        <Sword className="w-5 h-5 text-red-400" />
                      </div>
                      <p className={`text-3xl font-bold ${styles.textPrimary} mb-1 pr-8`}>{stats.avgKDA.toFixed(2)}</p>
                      <p className={`text-xs ${styles.hasBackground ? 'text-gray-400 drop-shadow-sm' : 'text-gray-500'} mb-2`}>Media su {stats.matches?.length || 20} partite</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">KP:</span>
                        <span className="font-semibold text-gray-300">{stats.teamfightParticipation.toFixed(0)}%</span>
                      </div>
                      {benchmarks?.percentiles?.kda ? (
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
                      ) : (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-xs text-gray-500">Percentile non disponibile</p>
                        </div>
                      )}
                    </div>
                    <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gradient-to-br from-gray-800 to-gray-900'} border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors relative shadow-lg`}>
                      {playerId && (
                        <InsightBadge
                          elementType="metric-card"
                          elementId="performance-gpm"
                          contextData={{ metricName: 'GPM', value: stats.avgGPM.toFixed(0), benchmark: '500' }}
                          playerId={playerId}
                          position="top-right"
                        />
                      )}
                      <div className="flex items-center justify-between mb-2 pr-8">
                        <h3 className={`text-xs ${styles.textSecondary} uppercase tracking-wider font-semibold`}>GPM</h3>
                        <Coins className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className={`text-3xl font-bold ${styles.hasBackground ? 'text-yellow-300 drop-shadow-sm' : 'text-yellow-400'} mb-1 pr-8`}>{stats.avgGPM.toFixed(0)}</p>
                      <p className={`text-xs ${styles.hasBackground ? 'text-gray-400 drop-shadow-sm' : 'text-gray-500'} mb-2`}>Media su {stats.matches?.length || 20} partite</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Efficienza:</span>
                        <span className="font-semibold text-gray-300">{stats.farmEfficiency.toFixed(0)}%</span>
                      </div>
                      {benchmarks?.percentiles?.gpm ? (
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
                      ) : (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-xs text-gray-500">Percentile non disponibile</p>
                        </div>
                      )}
                    </div>
                    <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gradient-to-br from-gray-800 to-gray-900'} border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors shadow-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-xs ${styles.textSecondary} uppercase tracking-wider font-semibold`}>XPM</h3>
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className={`text-3xl font-bold ${styles.hasBackground ? 'text-blue-300 drop-shadow-sm' : 'text-blue-400'} mb-1`}>{stats.avgXPM.toFixed(0)}</p>
                      <p className={`text-xs ${styles.hasBackground ? 'text-gray-400 drop-shadow-sm' : 'text-gray-500'} mb-2`}>Media su {stats.matches?.length || 20} partite</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">XP acquisita</span>
                        <span className="font-semibold text-gray-300">/min</span>
                      </div>
                      {benchmarks?.percentiles?.xpm ? (
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
                      ) : (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-xs text-gray-500">Percentile non disponibile</p>
                        </div>
                      )}
                    </div>
                    <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gradient-to-br from-gray-800 to-gray-900'} border border-gray-700 rounded-lg p-4 hover:border-red-500 transition-colors shadow-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-xs ${styles.textSecondary} uppercase tracking-wider font-semibold`}>Deaths</h3>
                        <Shield className="w-5 h-5 text-red-400" />
                      </div>
                      <p className={`text-3xl font-bold ${styles.hasBackground ? 'text-red-300 drop-shadow-sm' : 'text-red-400'} mb-2`}>{stats.avgDeaths.toFixed(1)}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Assist:</span>
                        <span className="font-semibold text-gray-300">{stats.avgAssists.toFixed(1)}</span>
                      </div>
                      {stats.advanced ? (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-500">Survival Score:</div>
                          <div className="text-sm font-bold text-gray-300">
                            {Math.max(100 - (stats.avgDeaths * 10), 0).toFixed(0)}%
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-xs text-gray-500">Dati avanzati non disponibili</p>
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
                    <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gray-800'} border border-gray-700 rounded-lg p-4 relative`}>
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
                    <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gray-800'} border border-gray-700 rounded-lg p-4`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-xl font-semibold ${styles.textPrimary}`}>Profilo Performance</h3>
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
                  <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gray-800'} border border-gray-700 rounded-lg p-4`}>
                    <h3 className={`text-xl font-semibold mb-3 ${styles.textPrimary}`}>Metriche Chiave</h3>
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

              {/* Focus Areas Tab - Risponde a "Cosa devo migliorare PRIMA?" */}
              {activeTab === 'focus' && (
                <div className="space-y-6">
                  <div className={`${styles.hasBackground ? 'bg-red-900/40 backdrop-blur-sm' : 'bg-gradient-to-r from-red-900/30 to-orange-900/30'} border border-red-700 rounded-lg p-6`}>
                    <h2 className={`text-2xl font-semibold ${styles.hasBackground ? 'text-red-200 drop-shadow-sm' : 'text-red-300'} mb-2 flex items-center gap-2`}>
                      <Target className="w-6 h-6" />
                      Focus Areas - Priorità di Miglioramento
                    </h2>
                    <p className={`text-sm mb-4 ${styles.textSecondary}`}>
                      Le 3 aree su cui concentrarti per massimizzare il tuo impatto
                    </p>
                  
                  {/* Calcola priorità basate su metriche - sempre mostra le 3 più importanti */}
                  {(() => {
                    const allAreas: Array<{ area: string; priority: number; current: number; target: number; action: string; icon: any; score: number }> = []
                    
                    // 1. Deaths (alta priorità se > 5, critico se > 7)
                    if (stats.avgDeaths > 5) {
                      const severity = stats.avgDeaths > 7 ? 100 : stats.avgDeaths > 6 ? 80 : 60
                      allAreas.push({
                        area: 'Survival',
                        priority: 1,
                        current: stats.avgDeaths,
                        target: 5,
                        action: 'Riduci morti migliorando positioning e mappa awareness',
                        icon: Shield,
                        score: severity
                      })
                    }
                    
                    // 2. Farm Efficiency (priorità se < 75%, critico se < 60%)
                    if (stats.farmEfficiency < 75) {
                      const severity = stats.farmEfficiency < 60 ? 90 : stats.farmEfficiency < 70 ? 70 : 50
                      allAreas.push({
                        area: 'Farm Efficiency',
                        priority: 2,
                        current: stats.farmEfficiency,
                        target: 80,
                        action: stats.advanced && stats.advanced.farm.goldUtilization < 85 
                          ? 'Spendi gold più velocemente in item utili'
                          : 'Ottimizza percorsi di farm per massimizzare GPM',
                        icon: Coins,
                        score: severity
                      })
                    }
                    
                    // 3. Teamfight Participation (priorità se < 65%, critico se < 50%)
                    if (stats.teamfightParticipation < 65) {
                      const severity = stats.teamfightParticipation < 50 ? 85 : stats.teamfightParticipation < 60 ? 65 : 45
                      allAreas.push({
                        area: 'Teamfight Impact',
                        priority: 3,
                        current: stats.teamfightParticipation,
                        target: 70,
                        action: 'Partecipa di più ai teamfight principali per aumentare impatto',
                        icon: Sword,
                        score: severity
                      })
                    }
                    
                    // 4. KDA (priorità se < 2.2)
                    if (stats.avgKDA < 2.2) {
                      const severity = stats.avgKDA < 1.5 ? 95 : stats.avgKDA < 2.0 ? 75 : 55
                      allAreas.push({
                        area: 'KDA Ratio',
                        priority: 4,
                        current: stats.avgKDA,
                        target: 2.5,
                        action: 'Bilancia kills, assist e morti per migliorare KDA',
                        icon: Target,
                        score: severity
                      })
                    }
                    
                    // 5. Gold Utilization (se disponibile e < 85%)
                    if (stats.advanced && stats.advanced.farm.goldUtilization < 85) {
                      const severity = stats.advanced.farm.goldUtilization < 70 ? 70 : 50
                      allAreas.push({
                        area: 'Gold Utilization',
                        priority: 5,
                        current: stats.advanced.farm.goldUtilization,
                        target: 90,
                        action: 'Spendi gold più velocemente in item utili invece di accumularlo',
                        icon: Coins,
                        score: severity
                      })
                    }
                    
                    // 6. Vision/Warding (solo se support o vision bassa)
                    if (stats.advanced && stats.advanced.vision && stats.advanced.vision.avgObserverPlaced < 5) {
                      const severity = stats.advanced.vision.avgObserverPlaced < 3 ? 75 : 55
                      allAreas.push({
                        area: 'Vision Control',
                        priority: 6,
                        current: stats.advanced.vision.avgObserverPlaced,
                        target: 6,
                        action: 'Aumenta warding per migliorare visione e controllo mappa',
                        icon: Eye,
                        score: severity
                      })
                    }
                    
                    // 7. GPM basso (se < 400, indipendentemente da farmEfficiency)
                    if (stats.avgGPM < 400) {
                      const severity = stats.avgGPM < 350 ? 80 : 60
                      allAreas.push({
                        area: 'GPM',
                        priority: 7,
                        current: stats.avgGPM,
                        target: 450,
                        action: 'Migliora farming patterns e timing per aumentare gold per minuto',
                        icon: Coins,
                        score: severity
                      })
                    }
                    
                    // Se abbiamo meno di 3 aree, aggiungi aree "migliorabili" anche se non critiche
                    if (allAreas.length < 3) {
                      // Aggiungi GPM se non presente e < 500 (non critico ma migliorabile)
                      if (!allAreas.find(a => a.area === 'GPM') && stats.avgGPM < 500 && stats.avgGPM >= 400) {
                        allAreas.push({
                          area: 'GPM',
                          priority: 7,
                          current: stats.avgGPM,
                          target: 500,
                          action: 'Migliora farming per raggiungere 500+ GPM',
                          icon: Coins,
                          score: 40
                        })
                      }
                      
                      // Aggiungi Teamfight se non presente e < 70% (migliorabile)
                      if (!allAreas.find(a => a.area === 'Teamfight Impact') && stats.teamfightParticipation < 70 && stats.teamfightParticipation >= 65) {
                        allAreas.push({
                          area: 'Teamfight Impact',
                          priority: 3,
                          current: stats.teamfightParticipation,
                          target: 75,
                          action: 'Aumenta partecipazione ai teamfight per massimizzare impatto',
                          icon: Sword,
                          score: 35
                        })
                      }
                      
                      // Aggiungi Farm Efficiency se non presente e < 80% (migliorabile)
                      if (!allAreas.find(a => a.area === 'Farm Efficiency') && stats.farmEfficiency < 80 && stats.farmEfficiency >= 75) {
                        allAreas.push({
                          area: 'Farm Efficiency',
                          priority: 2,
                          current: stats.farmEfficiency,
                          target: 85,
                          action: 'Ottimizza farm per raggiungere efficienza superiore',
                          icon: Coins,
                          score: 30
                        })
                      }
                      
                      // Aggiungi KDA se non presente e < 2.5 (migliorabile)
                      if (!allAreas.find(a => a.area === 'KDA Ratio') && stats.avgKDA < 2.5 && stats.avgKDA >= 2.2) {
                        allAreas.push({
                          area: 'KDA Ratio',
                          priority: 4,
                          current: stats.avgKDA,
                          target: 2.8,
                          action: 'Migliora KDA bilanciando kills, assist e morti',
                          icon: Target,
                          score: 25
                        })
                      }
                    }
                    
                    // Ordina per score (severità) decrescente, poi per priorità
                    allAreas.sort((a, b) => {
                      if (b.score !== a.score) return b.score - a.score
                      return a.priority - b.priority
                    })
                    
                    // Prendi le top 3
                    const focusAreas = allAreas.slice(0, 3)
                    
                    return focusAreas.length > 0 ? (
                      <div className="space-y-4">
                        {focusAreas.slice(0, 3).map((area, idx) => {
                          // Per Survival: progress inverso (meno morti = meglio)
                          // Per altri: progress basato su valore corrente vs target
                          let progress: number
                          let progressLabel: string
                          
                          if (area.area === 'Survival') {
                            // Survival: meno morti = meglio, quindi progress inverso
                            const gap = area.current - area.target
                            const maxGap = Math.max(area.current, area.target * 1.5) // worst case realistico
                            progress = maxGap > 0 ? Math.max(0, ((maxGap - gap) / maxGap) * 100) : 100
                            progressLabel = `${area.current.toFixed(1)} → ${area.target}`
                          } else if (area.area === 'KDA Ratio') {
                            // KDA: progress basato su valore corrente vs target
                            progress = (area.current / area.target) * 100
                            progressLabel = `${area.current.toFixed(2)} → ${area.target}`
                          } else if (area.area === 'GPM') {
                            // GPM: mostra valore corrente, target come riferimento
                            progress = (area.current / area.target) * 100
                            progressLabel = `${area.current.toFixed(0)} → ${area.target}`
                          } else if (area.area === 'Vision Control') {
                            // Vision: mostra valore corrente (wards per game)
                            progress = (area.current / area.target) * 100
                            progressLabel = `${area.current.toFixed(1)} → ${area.target}`
                          } else {
                            // Percentuali (Farm Efficiency, Teamfight Impact, Gold Utilization): mostra valore corrente
                            progress = area.current // Valore corrente come percentuale
                            progressLabel = `${area.current.toFixed(1)}%`
                          }
                          
                          const isGood = area.area === 'Survival' 
                            ? area.current <= area.target
                            : area.current >= area.target * 0.9 // 90% del target = buono
                          
                          return (
                            <div key={idx} className={`${styles.cardSubtle} border border-gray-700 rounded-lg p-4 hover:border-red-500 transition-colors`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${isGood ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                    <area.icon className={`w-5 h-5 ${isGood ? 'text-green-400' : 'text-red-400'}`} />
                                  </div>
                                  <div>
                                    <h3 className={`text-lg font-semibold ${styles.textPrimary} flex items-center gap-2`}>
                                      #{idx + 1} {area.area}
                                    </h3>
                                    <p className={`text-sm ${styles.textSecondary} mt-1`}>{area.action}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-white">
                                    {progressLabel}
                                  </div>
                                  <div className="text-xs text-gray-500">Target: {area.target}{area.area !== 'Survival' && area.area !== 'KDA Ratio' && area.area !== 'GPM' && area.area !== 'Vision Control' ? '%' : ''}</div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 mt-3 relative">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    isGood ? 'bg-green-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                                ></div>
                                {/* Target indicator line - solo per percentuali */}
                                {area.area !== 'Survival' && area.area !== 'KDA Ratio' && area.area !== 'GPM' && area.area !== 'Vision Control' && (
                                  <div
                                    className="absolute top-0 h-2 w-0.5 bg-yellow-400 opacity-60"
                                    style={{ left: `${Math.min(area.target, 100)}%` }}
                                    title={`Target: ${area.target}%`}
                                  ></div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-300 font-semibold mb-2">Ottime performance!</p>
                        <p className="text-gray-400 text-sm">Tutte le metriche principali sono in buono stato. Continua così!</p>
                      </div>
                    )
                  })()}
                  </div>
                  
                  {/* Link a Profiling per analisi dettagliata */}
                  <div className={`${styles.hasBackground ? 'bg-gray-800 backdrop-blur-sm' : 'bg-gray-800'} border border-gray-700 rounded-lg p-4`}>
                    <p className={`text-sm ${styles.textSecondary}`}>
                      💡 Per un'analisi completa con raccomandazioni dettagliate, visita la sezione{' '}
                      <Link href="/dashboard/coaching-insights" className="text-red-400 hover:text-red-300 underline">
                        Coaching & Insights
                      </Link>
                    </p>
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
