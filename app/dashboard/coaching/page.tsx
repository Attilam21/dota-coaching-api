'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'

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

export default function CoachingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [metaData, setMetaData] = useState<MetaComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (playerId) {
      fetchMetaComparison()
    }
  }, [playerId, fetchMetaComparison])

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      gpm: 'GPM',
      xpm: 'XPM',
      kda: 'KDA',
      winrate: 'Winrate',
      heroDamage: 'Hero Damage',
      towerDamage: 'Tower Damage',
      lastHits: 'Last Hits',
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

  const formatValue = (metric: string, value: number) => {
    if (metric === 'winrate' || metric === 'killParticipation' || metric === 'denyRate' || metric === 'goldUtilization' || metric === 'visionScore') {
      return `${value.toFixed(1)}%`
    }
    if (metric === 'kda') {
      return value.toFixed(2)
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
                        {comp.gapPercent >= 0 ? '+' : ''}{comp.gapPercent.toFixed(1)}%
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
                        {area.gapPercent.toFixed(1)}%
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

      {!metaData && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun dato disponibile al momento</p>
        </div>
      )}
    </div>
  )
}
