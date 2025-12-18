'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Zap, AlertCircle, CheckCircle2, Trophy, XCircle, BarChart as BarChartIcon } from 'lucide-react'

interface MetaComparison {
  role: string
  playerMetrics: {
    avgGPM: number
    avgXPM: number
    avgKDA: number
    winrate: number
    avgDeaths: number
    avgHeroDamage: number
    avgTowerDamage: number
    killParticipation: number
    avgLastHits: number
    avgDenies: number
    denyRate: number
    goldUtilization: number
    visionScore: number
  }
  comparisons: Record<string, {
    player: number
    meta: { p50: number; p75: number; p90: number }
    percentile: number
    gap: number
    gapPercent: number
  }>
  improvementAreas: Array<{
    metric: string
    gap: number
    gapPercent: number
    percentile: number
    player: number
    meta: number
  }>
  aiInsights: Array<{ metric: string; insight: string }>
  strategicInsight: string | null
}

type TabType = 'meta' | 'win-conditions'

export default function CoachingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [metaData, setMetaData] = useState<MetaComparison | null>(null)
  const [winConditions, setWinConditions] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingWinConditions, setLoadingWinConditions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('meta')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchMetaComparison = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/meta-comparison`)
      if (!response.ok) throw new Error('Failed to fetch meta comparison data')

      const data = await response.json()
      setMetaData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meta comparison data')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  const fetchWinConditions = useCallback(async () => {
    if (!playerId) return

    try {
      setLoadingWinConditions(true)
      const response = await fetch(`/api/player/${playerId}/win-conditions`)
      if (response.ok) {
        const data = await response.json()
        setWinConditions(data)
      }
    } catch (err) {
      console.error('Failed to fetch win conditions:', err)
    } finally {
      setLoadingWinConditions(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchMetaComparison()
      // Fetch win conditions when tab is active or when playerId changes
      if (activeTab === 'win-conditions') {
        fetchWinConditions()
      }
    }
  }, [playerId, fetchMetaComparison, activeTab])

  // Fetch win conditions when switching to win-conditions tab
  useEffect(() => {
    if (playerId && activeTab === 'win-conditions' && !winConditions && !loadingWinConditions) {
      fetchWinConditions()
    }
  }, [playerId, activeTab, winConditions, loadingWinConditions, fetchWinConditions])

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      gpm: 'GPM',
      xpm: 'XPM',
      kda: 'KDA',
      winrate: 'Winrate',
      heroDamage: 'Hero Damage',
      hero_damage: 'Hero Damage',
      towerDamage: 'Tower Damage',
      tower_damage: 'Tower Damage',
      lastHits: 'Last Hits',
      last_hits: 'Last Hits',
      deaths: 'Morti',
      teamfightParticipation: 'Teamfight Part.',
      teamfight_participation: 'Teamfight Part.',
    }
    return labels[metric] || metric
  }

  const getMetricIcon = (metric: string) => {
    const icons: Record<string, React.ReactNode> = {
      gpm: <Zap className="w-5 h-5" />,
      xpm: <TrendingUp className="w-5 h-5" />,
      kda: <Target className="w-5 h-5" />,
      winrate: <CheckCircle2 className="w-5 h-5" />,
      heroDamage: <BarChart3 className="w-5 h-5" />,
      towerDamage: <BarChart3 className="w-5 h-5" />,
      lastHits: <BarChart3 className="w-5 h-5" />,
    }
    return icons[metric] || <BarChart3 className="w-5 h-5" />
  }

  const formatValue = (metric: string, value: number | null | undefined) => {
    if (value == null || isNaN(value)) {
      return 'N/A'
    }
    if (metric === 'winrate' || metric === 'killParticipation' || metric === 'denyRate' || metric === 'goldUtilization' || metric === 'visionScore' || metric === 'teamfightParticipation' || metric === 'teamfight_participation') {
      return `${value.toFixed(1)}%`
    }
    if (metric === 'kda') {
      return value.toFixed(2)
    }
    if (metric === 'gpm' || metric === 'xpm') {
      return Math.round(value).toLocaleString()
    }
    if (metric === 'heroDamage' || metric === 'hero_damage' || metric === 'towerDamage' || metric === 'tower_damage') {
      return Math.round(value).toLocaleString()
    }
    return Math.round(value).toLocaleString()
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-400'
    if (percentile >= 75) return 'text-blue-400'
    if (percentile >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getGapColor = (gapPercent: number) => {
    if (gapPercent >= 10) return 'text-green-400'
    if (gapPercent >= 0) return 'text-yellow-400'
    if (gapPercent >= -10) return 'text-orange-400'
    return 'text-red-400'
  }

  const getTrendIcon = (gapPercent: number) => {
    if (gapPercent > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (gapPercent < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

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
        pageTitle="Coaching & Confronto Meta"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare il confronto con il meta attuale e ricevere suggerimenti personalizzati basati su analisi AI avanzate."
      />
    )
  }

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Coaching & Confronto Meta</h1>
        <p className="text-gray-400">
          Analisi enterprise delle tue performance rispetto al meta attuale con suggerimenti AI personalizzati
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Analisi in corso...</p>
        </div>
      )}

      {metaData && !loading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg">
            <div className="flex border-b border-gray-700">
              {[
                { id: 'meta' as TabType, name: 'Confronto Meta', icon: BarChartIcon },
                { id: 'win-conditions' as TabType, name: 'Win Conditions', icon: Trophy },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
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
              {/* Meta Comparison Tab */}
              {activeTab === 'meta' && (
                <div className="space-y-6">
                  {/* Strategic Insight */}
                  {metaData.strategicInsight && (
                    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="w-6 h-6 text-blue-400" />
                        <h2 className="text-2xl font-semibold text-blue-200">Raccomandazione Strategica</h2>
                      </div>
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{metaData.strategicInsight}</p>
                    </div>
                  )}

                  {/* Role Badge */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">Ruolo Analizzato:</span>
                      <span className="px-3 py-1 bg-red-600/20 border border-red-600 rounded-full text-red-400 font-semibold">
                        {metaData.role}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics Comparison */}
                  <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6" />
                      Confronto Performance vs Meta
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(metaData.comparisons).map(([metric, comp]) => (
                        <div
                          key={metric}
                          className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getMetricIcon(metric)}
                              <span className="font-semibold text-gray-300">{getMetricLabel(metric)}</span>
                            </div>
                            {getTrendIcon(comp.gapPercent)}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-gray-400">Tuo</span>
                              <span className="text-lg font-bold text-white">{formatValue(metric, comp.player)}</span>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-gray-400">Meta (p50)</span>
                              <span className="text-sm font-semibold text-gray-300">{formatValue(metric, comp.meta.p50)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                              <span className="text-xs text-gray-400">Gap</span>
                              <span className={`text-sm font-semibold ${getGapColor(comp.gapPercent)}`}>
                                {comp.gapPercent != null ? (comp.gapPercent >= 0 ? '+' : '') + comp.gapPercent.toFixed(1) : '0.0'}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Percentile</span>
                              <span className={`text-sm font-semibold ${getPercentileColor(comp.percentile)}`}>
                                Top {100 - comp.percentile}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Insights for Improvement Areas */}
                  {metaData.aiInsights && metaData.aiInsights.length > 0 && (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="w-6 h-6 text-orange-400" />
                        <h2 className="text-2xl font-semibold">Aree di Miglioramento Prioritario</h2>
                      </div>
                      <div className="space-y-4">
                        {metaData.aiInsights.map((insight, idx) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-700/50 rounded-lg p-5"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              {getMetricIcon(insight.metric)}
                              <h3 className="text-lg font-semibold text-orange-300">
                                {getMetricLabel(insight.metric)}
                              </h3>
                              <span className="text-xs px-2 py-1 bg-orange-600/20 border border-orange-600 rounded text-orange-400">
                                Priorità {idx + 1}
                              </span>
                            </div>
                            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{insight.insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvement Areas Summary */}
                  {metaData.improvementAreas && metaData.improvementAreas.length > 0 && (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-4">Riepilogo Gap vs Meta</h2>
                      <div className="space-y-3">
                        {metaData.improvementAreas.map((area, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-300">{getMetricLabel(area.metric)}</span>
                              <span className="text-xs text-gray-500">
                                {formatValue(area.metric, area.player)} vs {formatValue(area.metric, area.meta)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${getGapColor(area.gapPercent)}`}>
                                {area.gapPercent != null ? area.gapPercent.toFixed(1) : '0.0'}%
                              </span>
                              <span className={`text-xs ${getPercentileColor(area.percentile)}`}>
                                ({area.percentile}° percentile)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Win Conditions Tab */}
              {activeTab === 'win-conditions' && (
                <div className="space-y-6">
                  {winConditions && !loadingWinConditions ? (
                    <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Trophy className="w-6 h-6 text-green-400" />
                        <h2 className="text-2xl font-semibold">Analisi Pattern di Vittoria</h2>
                      </div>

                      {/* Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-green-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-400">Vittorie</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{winConditions.summary.wins}</p>
                  <p className="text-xs text-gray-500 mt-1">Winrate: {winConditions.summary.winrate ? winConditions.summary.winrate.toFixed(1) : '0.0'}%</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-red-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-gray-400">Sconfitte</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{winConditions.summary.losses}</p>
                  <p className="text-xs text-gray-500 mt-1">Totale: {winConditions.summary.totalMatches} partite</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Replicabilità</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{winConditions.winConditionScore?.overallScore ? winConditions.winConditionScore.overallScore.toFixed(0) : '0'}%</p>
                  <p className="text-xs text-gray-500 mt-1">Quanto replichi i pattern vincenti</p>
                </div>
              </div>

              {/* Key Differentiators */}
              {winConditions.keyDifferentiators && winConditions.keyDifferentiators.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-300">Cosa Fai di Diverso Quando Vinci</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {winConditions.keyDifferentiators.map((diff: any, idx: number) => (
                      <div key={idx} className="bg-gray-800/70 rounded-lg p-4 border border-green-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-300">{getMetricLabel(diff.metric)}</span>
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Vittorie:</span>
                            <span className="text-green-400 font-semibold">{formatValue(diff.metric, diff.winValue)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Sconfitte:</span>
                            <span className="text-red-400 font-semibold">{formatValue(diff.metric, diff.lossValue)}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
                            <span className="text-xs text-gray-400">Differenza</span>
                            <span className="text-sm font-bold text-green-400">
                              {diff.differencePercent != null ? (diff.differencePercent > 0 ? '+' : '') + diff.differencePercent.toFixed(1) : '0.0'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insight */}
              {winConditions.aiInsight && (
                <div className="bg-gray-800/70 rounded-lg p-5 border border-green-600/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-yellow-300">Insight AI: Pattern di Vittoria</h3>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{winConditions.aiInsight}</p>
                </div>
              )}

              {/* Detailed Comparison Table */}
              <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-md font-semibold mb-4 text-gray-300">Confronto Dettagliato: Vittorie vs Sconfitte</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-gray-400">Metrica</th>
                        <th className="text-right py-2 text-green-400">Vittorie</th>
                        <th className="text-right py-2 text-red-400">Sconfitte</th>
                        <th className="text-right py-2 text-gray-400">Differenza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(winConditions.differences || {}).map(([metric, data]: [string, any]) => (
                        <tr key={metric} className="border-b border-gray-800">
                          <td className="py-2 text-gray-300">{getMetricLabel(metric)}</td>
                          <td className="text-right py-2 text-green-400 font-semibold">
                            {formatValue(metric, data.win)}
                          </td>
                          <td className="text-right py-2 text-red-400 font-semibold">
                            {formatValue(metric, data.loss)}
                          </td>
                          <td className="text-right py-2">
                            <span className={`font-semibold ${data.diffPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {data.diffPercent != null ? (data.diffPercent > 0 ? '+' : '') + data.diffPercent.toFixed(1) : '0.0'}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                      </div>
                    </div>
                  ) : loadingWinConditions ? (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-4 text-gray-400">Analisi pattern di vittoria in corso...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                      <div className="text-center py-8">
                        <p className="text-gray-400">Carica i dati per visualizzare l'analisi Win Conditions</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!metaData && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun dato disponibile al momento</p>
        </div>
      )}
    </div>
  )
}
