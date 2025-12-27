'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { useDashboardStyles } from '@/lib/hooks/useDashboardStyles'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import Link from 'next/link'
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Trophy,
  Route
} from 'lucide-react'

interface AggregatedRecommendations {
  totalMatches: number
  totalRecommendations: number
  recommendations: Array<{
    text: string
    category: string
    impact: 'high' | 'medium' | 'low'
    frequency: number
    phase: 'early' | 'mid' | 'late'
  }>
  topPatterns: Array<{
    recommendation: string
    frequency: number
    percentage: number
    impact: 'high' | 'medium' | 'low'
    category: string
  }>
  impactScore: number
  projectedWinrateImprovement: number
  summary: {
    mostCommonCategory: string
    highImpactCount: number
    mediumImpactCount: number
    lowImpactCount: number
  }
}

export default function PredictionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const styles = useDashboardStyles()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AggregatedRecommendations | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!playerId) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/player/${playerId}/predictions/aggregated-recommendations`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch predictions')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [playerId])

  if (authLoading || loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className={`mt-4 ${styles.textSecondary}`}>Analizzando le tue partite...</p>
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
        pageTitle="Analisi Predittive"
        title="Inserisci Player ID"
        description="Scopri cosa succederà se segui i consigli delle tue partite. Analizziamo tutte le tue partite per identificare pattern e creare proiezioni future."
      />
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">Errore: {error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.totalMatches === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <p className={styles.textSecondary}>Nessun dato disponibile. Gioca alcune partite per vedere le analisi predittive.</p>
        </div>
      </div>
    )
  }

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'low': return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'farming': return <Zap className="w-4 h-4" />
      case 'positioning': return <Target className="w-4 h-4" />
      case 'teamfight': return <Trophy className="w-4 h-4" />
      case 'macro': return <BarChart3 className="w-4 h-4" />
      case 'micro': return <Zap className="w-4 h-4" />
      case 'teamplay': return <CheckCircle2 className="w-4 h-4" />
      case 'warding': return <Target className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            Analisi Predittive
          </h1>
          <p className={styles.textSecondary}>
            Scopri cosa succederà se segui i consigli delle tue partite
          </p>
        </div>
        <HelpButton />
      </div>

      {/* Impact Score Card - WOW Factor */}
      <div className={`${styles.hasBackground ? 'bg-cyan-900/40 backdrop-blur-sm' : 'bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-purple-900/30'} border border-cyan-500/50 rounded-xl p-6 shadow-lg shadow-cyan-500/20`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Impact Score</h2>
            <p className={`text-sm ${styles.textSecondary}`}>Quanto impatto avrebbero i tuoi miglioramenti</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-cyan-400">{data.impactScore}</div>
            <div className={`text-sm ${styles.textSecondary}`}>/ 100</div>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${data.impactScore}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">+{data.projectedWinrateImprovement.toFixed(1)}%</div>
            <div className={`text-xs ${styles.textMuted}`}>Winrate Previsto</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{data.totalRecommendations}</div>
            <div className={`text-xs ${styles.textMuted}`}>Recommendations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{data.totalMatches}</div>
            <div className={`text-xs ${styles.textMuted}`}>Partite Analizzate</div>
          </div>
        </div>
      </div>

      {/* Top Patterns - Most Important */}
      <div className={`${styles.card} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" />
            I Tuoi Errori Più Comuni
          </h2>
          <span className={`text-sm ${styles.textSecondary}`}>
            Basato su {data.totalMatches} partite
          </span>
        </div>
        <p className={`text-sm ${styles.textSecondary} mb-4`}>
          Questi sono i consigli che appaiono più spesso nelle tue partite. Seguirli avrebbe il massimo impatto.
        </p>
        <div className="space-y-3">
          {data.topPatterns.map((pattern, idx) => (
            <div
              key={idx}
              className={`${styles.cardSubtle} p-4 hover:border-cyan-500/50 transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getImpactColor(pattern.impact)}`}>
                    {getCategoryIcon(pattern.category)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${styles.textPrimary} mb-1`}>{pattern.recommendation}</p>
                    <div className={`flex items-center gap-4 text-xs ${styles.textSecondary}`}>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Appare in {pattern.frequency} partite ({pattern.percentage.toFixed(0)}%)
                      </span>
                      <span className="capitalize">{pattern.category}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-semibold ${getImpactColor(pattern.impact)}`}>
                  {pattern.impact.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/predictions/improvement-path"
          className={`${styles.hasBackground ? 'bg-cyan-900/40 backdrop-blur-sm' : 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30'} border border-cyan-500/50 rounded-lg p-6 hover:border-cyan-400 transition-all group`}
        >
          <div className="flex items-center justify-between mb-3">
            <Route className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className={`w-5 h-5 ${styles.textSecondary} group-hover:text-cyan-400 group-hover:translate-x-1 transition-all`} />
          </div>
          <h3 className="text-lg font-bold mb-2">Path to Improvement</h3>
          <p className={`text-sm ${styles.textSecondary}`}>
            Percorso step-by-step per raggiungere i tuoi obiettivi
          </p>
        </Link>

        <Link
          href="/dashboard/predictions/what-if"
          className={`${styles.hasBackground ? 'bg-purple-900/40 backdrop-blur-sm' : 'bg-gradient-to-r from-purple-900/30 to-pink-900/30'} border border-purple-500/50 rounded-lg p-6 hover:border-purple-400 transition-all group`}
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className={`w-5 h-5 ${styles.textSecondary} group-hover:text-purple-400 group-hover:translate-x-1 transition-all`} />
          </div>
          <h3 className="text-lg font-bold mb-2">What-If Analysis</h3>
          <p className={`text-sm ${styles.textSecondary}`}>
            Simula cosa succede se migliori metriche specifiche
          </p>
        </Link>
      </div>

      {/* Recommendations by Category */}
      <div className={`${styles.card} p-6`}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          Recommendations per Categoria
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.summary).map(([key, value]) => {
            if (key === 'mostCommonCategory') return null
            const label = key === 'highImpactCount' ? 'Alto Impatto' :
                         key === 'mediumImpactCount' ? 'Medio Impatto' :
                         'Basso Impatto'
            const color = key === 'highImpactCount' ? 'text-red-400' :
                         key === 'mediumImpactCount' ? 'text-yellow-400' :
                         'text-blue-400'
            
            return (
              <div key={key} className={`${styles.cardSubtle} p-4`}>
                <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
                <div className={`text-sm ${styles.textSecondary}`}>{label}</div>
              </div>
            )
          })}
          <div className={`${styles.cardSubtle} p-4`}>
            <div className="text-3xl font-bold text-cyan-400 mb-1 capitalize">
              {data.summary.mostCommonCategory}
            </div>
            <div className={`text-sm ${styles.textSecondary}`}>Categoria Più Comune</div>
          </div>
        </div>
      </div>
    </div>
  )
}

