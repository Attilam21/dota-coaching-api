'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import Link from 'next/link'
import { 
  Route, 
  TrendingUp, 
  Target, 
  CheckCircle2,
  ArrowLeft,
  Trophy,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react'

interface ImprovementStep {
  id: number
  title: string
  category: string
  currentValue: number
  targetValue: number
  gap: number
  gapPercent: number
  impact: string
  priority: 'high' | 'medium' | 'low'
  actionable: string
  estimatedMatches: number
  matchIds: number[]
}

interface ImprovementPath {
  currentStats: {
    winrate: string
    gpm: number
    xpm: number
    kda: string
    deaths: string
    role: string
  }
  steps: ImprovementStep[]
  projectedOutcome: {
    winrate: string
    winrateImprovement: string
    mmrGain: number
    estimatedMatches: number
    timeframe: string
  }
  metaComparison: {
    role: string
    gaps: {
      gpm: number
      xpm: number
      kda: string
      deaths: string
    }
  }
}

export default function ImprovementPathPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ImprovementPath | null>(null)

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

        const response = await fetch(`/api/player/${playerId}/predictions/improvement-path`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch improvement path')
        }

        const result = await response.json()
        
        // Handle API errors gracefully
        if (result.error) {
          // If error but we have some data, still show it
          if (result.steps && result.steps.length > 0) {
            setData(result)
          } else {
            throw new Error(result.error || 'Failed to fetch improvement path')
          }
        } else {
          setData(result)
        }
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
          <p className="mt-4 text-gray-400">Calcolando il tuo percorso di miglioramento...</p>
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
        pageTitle="Path to Improvement"
        title="Inserisci Player ID"
        description="Crea un percorso personalizzato step-by-step per migliorare le tue performance basato sulle tue partite."
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

  if (!data) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <Route className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Nessun percorso disponibile. Gioca alcune partite per vedere il tuo path to improvement.</p>
        </div>
      </div>
    )
  }

  if (data.steps.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/predictions"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Route className="w-8 h-8 text-cyan-400" />
                Path to Improvement
              </h1>
              <p className="text-gray-400">
                Percorso step-by-step per raggiungere i tuoi obiettivi
              </p>
            </div>
          </div>
          <HelpButton />
        </div>

        {/* Current Stats */}
        {data.currentStats && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Le Tue Statistiche Attuali
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Winrate</div>
                <div className="text-2xl font-bold text-white">{data.currentStats.winrate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">GPM</div>
                <div className="text-2xl font-bold text-white">{data.currentStats.gpm}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">KDA</div>
                <div className="text-2xl font-bold text-white">{data.currentStats.kda}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Morti</div>
                <div className="text-2xl font-bold text-white">{data.currentStats.deaths}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Ruolo</div>
                <div className="text-2xl font-bold text-white capitalize">{data.currentStats.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State with helpful message */}
        <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/50 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ottimo Lavoro!</h2>
          <p className="text-gray-300 mb-4">
            Le tue statistiche sono già molto buone rispetto al meta. Continua a giocare e monitora le tue performance.
          </p>
          <p className="text-sm text-gray-400">
            Il percorso di miglioramento verrà aggiornato automaticamente quando ci saranno nuove opportunità di ottimizzazione.
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link 
            href="/dashboard/predictions"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna a Overview Predittivo
          </Link>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'low': return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'farming': return <Zap className="w-5 h-5" />
      case 'positioning': return <Target className="w-5 h-5" />
      case 'teamfight': return <Trophy className="w-5 h-5" />
      case 'teamplay': return <CheckCircle2 className="w-5 h-5" />
      case 'vision': return <Target className="w-5 h-5" />
      default: return <TrendingUp className="w-5 h-5" />
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/predictions"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Route className="w-8 h-8 text-cyan-400" />
              Path to Improvement
            </h1>
            <p className="text-gray-400">
              Percorso step-by-step per raggiungere i tuoi obiettivi
            </p>
          </div>
        </div>
        <HelpButton />
      </div>

      {/* Current Stats vs Projected Outcome - WOW Card */}
      <div className="bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-purple-900/30 border border-cyan-500/50 rounded-xl p-6 shadow-lg shadow-cyan-500/20">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">STATO ATTUALE</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Winrate:</span>
                <span className="text-white font-bold">{data.currentStats.winrate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GPM:</span>
                <span className="text-white font-bold">{data.currentStats.gpm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">KDA:</span>
                <span className="text-white font-bold">{data.currentStats.kda}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Morti:</span>
                <span className="text-white font-bold">{data.currentStats.deaths}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ruolo:</span>
                <span className="text-white font-bold capitalize">{data.currentStats.role}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">RISULTATO PREVISTO</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Winrate:</span>
                <span className="text-green-400 font-bold text-xl">{data.projectedOutcome.winrate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Miglioramento:</span>
                <span className="text-cyan-400 font-bold">+{data.projectedOutcome.winrateImprovement}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">MMR Gain:</span>
                <span className="text-yellow-400 font-bold">+{data.projectedOutcome.mmrGain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tempo Stimato:</span>
                <span className="text-blue-400 font-bold">{data.projectedOutcome.estimatedMatches} partite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Timeframe:</span>
                <span className="text-purple-400 font-bold">{data.projectedOutcome.timeframe}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-cyan-400" />
          Step da Seguire ({data.steps.length})
        </h2>
        {data.steps.map((step, idx) => (
          <div
            key={step.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-lg ${getPriorityColor(step.priority)}`}>
                  {getCategoryIcon(step.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">Step {idx + 1}: {step.title}</h3>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getPriorityColor(step.priority)}`}>
                      {step.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{step.actionable}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Attuale: {typeof step.currentValue === 'number' ? step.currentValue.toFixed(1) : step.currentValue}</span>
                      <span className="text-cyan-400 font-semibold">Target: {typeof step.targetValue === 'number' ? step.targetValue.toFixed(1) : step.targetValue}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(100, (step.currentValue / step.targetValue) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Gap: {typeof step.gap === 'number' ? step.gap.toFixed(1) : step.gap} ({typeof step.gapPercent === 'number' ? step.gapPercent.toFixed(1) : step.gapPercent}%)</span>
                      <span>{step.estimatedMatches} partite stimate</span>
                    </div>
                  </div>

                  {/* Impact */}
                  <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">{step.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Meta Comparison */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          Confronto con Meta ({data.metaComparison.role})
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">GPM Gap</div>
            <div className={`text-2xl font-bold ${data.metaComparison.gaps.gpm > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {data.metaComparison.gaps.gpm > 0 ? '+' : ''}{data.metaComparison.gaps.gpm}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">XPM Gap</div>
            <div className={`text-2xl font-bold ${data.metaComparison.gaps.xpm > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {data.metaComparison.gaps.xpm > 0 ? '+' : ''}{data.metaComparison.gaps.xpm}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">KDA Gap</div>
            <div className={`text-2xl font-bold ${parseFloat(data.metaComparison.gaps.kda) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {parseFloat(data.metaComparison.gaps.kda) > 0 ? '+' : ''}{data.metaComparison.gaps.kda}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Deaths Gap</div>
            <div className={`text-2xl font-bold ${parseFloat(data.metaComparison.gaps.deaths) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {parseFloat(data.metaComparison.gaps.deaths) > 0 ? '+' : ''}{data.metaComparison.gaps.deaths}
            </div>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link 
          href="/dashboard/predictions"
          className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna a Overview Predittivo
        </Link>
      </div>
    </div>
  )
}