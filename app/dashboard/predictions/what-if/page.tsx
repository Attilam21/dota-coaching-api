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
  TrendingUp, 
  ArrowLeft,
  Sparkles,
  Calculator,
  Target,
  Zap
} from 'lucide-react'

interface WhatIfScenario {
  title: string
  description: string
  currentValue: number
  improvedValue: number
  improvement: string
  projectedWinrate: string
  winrateChange: number
  projectedMMR: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

interface WhatIfData {
  currentStats: {
    winrate: string
    gpm: number
    deaths: string | number
    kda: string | number
    teamfight: string | number
  }
  scenarios: WhatIfScenario[]
  summary: {
    bestScenario: WhatIfScenario
    combinedImpact: {
      winrate: string
      winrateChange: string
      mmrGain: number
    }
  }
}

export default function WhatIfPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const styles = useDashboardStyles()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WhatIfData | null>(null)
  const [customScenario, setCustomScenario] = useState({
    gpm: 0,
    deaths: 0,
    kda: 0,
    teamfight: 0
  })

  // Helper function to format numeric values safely
  const formatStat = (value: string | number, decimals: number = 1): string => {
    if (typeof value === 'string') {
      return value
    }
    return typeof value === 'number' ? value.toFixed(decimals) : '0'
  }

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

        const params = new URLSearchParams()
        if (customScenario.gpm > 0) params.set('gpm', customScenario.gpm.toString())
        if (customScenario.deaths > 0) params.set('deaths', customScenario.deaths.toString())
        if (customScenario.kda > 0) params.set('kda', customScenario.kda.toString())
        if (customScenario.teamfight > 0) params.set('teamfight', customScenario.teamfight.toString())

        const response = await fetch(
          `/api/player/${playerId}/predictions/what-if?${params.toString()}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch what-if analysis')
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
  }, [playerId, customScenario.gpm, customScenario.deaths, customScenario.kda, customScenario.teamfight])

  const handleCustomScenario = () => {
    // Trigger refetch with custom values
    setCustomScenario({ ...customScenario })
  }

  if (authLoading || loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className={`mt-4 ${styles.textSecondary}`}>Calcolando scenari...</p>
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
        pageTitle="What-If Analysis"
        title="Inserisci Player ID"
        description="Simula cosa succede se migliori metriche specifiche. Scopri l'impatto dei tuoi miglioramenti."
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

  if (!data || data.scenarios.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <p className={styles.textSecondary}>Nessun dato disponibile. Gioca alcune partite per vedere le analisi what-if.</p>
        </div>
      </div>
    )
  }

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'low': return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/predictions"
            className={`${styles.textLink} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              What-If Analysis
            </h1>
            <p className={styles.textSecondary}>
              Simula cosa succede se migliori metriche specifiche
            </p>
          </div>
        </div>
        <HelpButton />
      </div>

      {/* Current Stats */}
      <div className={`${styles.card} p-6`}>
        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.textPrimary}`}>
          <Target className="w-5 h-5 text-cyan-400" />
          Le Tue Statistiche Attuali
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className={`text-sm ${styles.textSecondary} mb-1`}>Winrate</div>
            <div className={`text-2xl font-bold ${styles.textPrimary}`}>{data.currentStats.winrate}%</div>
          </div>
          <div>
            <div className={`text-sm ${styles.textSecondary} mb-1`}>GPM</div>
            <div className={`text-2xl font-bold ${styles.textPrimary}`}>{data.currentStats.gpm}</div>
          </div>
          <div>
            <div className={`text-sm ${styles.textSecondary} mb-1`}>Morti</div>
            <div className={`text-2xl font-bold ${styles.textPrimary}`}>{formatStat(data.currentStats.deaths, 1)}</div>
          </div>
          <div>
            <div className={`text-sm ${styles.textSecondary} mb-1`}>KDA</div>
            <div className={`text-2xl font-bold ${styles.textPrimary}`}>{formatStat(data.currentStats.kda, 2)}</div>
          </div>
          <div>
            <div className={`text-sm ${styles.textSecondary} mb-1`}>Teamfight</div>
            <div className={`text-2xl font-bold ${styles.textPrimary}`}>{formatStat(data.currentStats.teamfight, 1)}</div>
          </div>
        </div>
      </div>

      {/* Best Scenario Highlight */}
      {data.summary.bestScenario && (
        <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/50 rounded-xl p-6 shadow-lg shadow-green-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">Scenario con Maggior Impatto</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-2`}>{data.summary.bestScenario.title}</h3>
              <p className={`text-sm ${styles.textSecondary} mb-4`}>{data.summary.bestScenario.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={styles.textSecondary}>Miglioramento:</span>
                  <span className="text-green-400 font-bold">{data.summary.bestScenario.improvement}</span>
                </div>
                <div className="flex justify-between">
                  <span className={styles.textSecondary}>Winrate Previsto:</span>
                  <span className="text-cyan-400 font-bold text-xl">{data.summary.bestScenario.projectedWinrate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={styles.textSecondary}>Miglioramento Winrate:</span>
                  <span className="text-green-400 font-bold">+{data.summary.bestScenario.winrateChange.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={styles.textSecondary}>MMR Gain:</span>
                  <span className="text-yellow-400 font-bold">+{data.summary.bestScenario.projectedMMR}</span>
                </div>
              </div>
            </div>
            <div>
              <div className={`p-3 rounded-lg mb-3 ${getConfidenceColor(data.summary.bestScenario.confidence)}`}>
                <div className="text-sm font-semibold mb-1">Confidenza: {data.summary.bestScenario.confidence.toUpperCase()}</div>
                <p className={`text-xs ${styles.textSecondary}`}>{data.summary.bestScenario.reasoning}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Scenarios */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-cyan-400" />
          Tutti gli Scenari ({data.scenarios.length})
        </h2>
        {data.scenarios.map((scenario, idx) => (
          <div
            key={idx}
            className={`${styles.cardSubtle} p-6 hover:border-cyan-500/50 transition-all`}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className={`text-lg font-bold ${styles.textPrimary} mb-2`}>{scenario.title}</h3>
                <p className={`text-sm ${styles.textSecondary} mb-4`}>{scenario.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${getConfidenceColor(scenario.confidence)}`}>
                    {scenario.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
                <p className={`text-xs ${styles.textSecondary} italic`}>{scenario.reasoning}</p>
              </div>
              <div className="space-y-3">
                <div className={`${styles.cardSubtle} p-4`}>
                  <div className={`text-sm ${styles.textSecondary} mb-2`}>Risultato Previsto</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className={`text-xs ${styles.textMuted}`}>Winrate</div>
                      <div className="text-2xl font-bold text-cyan-400">{scenario.projectedWinrate}%</div>
                    </div>
                    <div>
                      <div className={`text-xs ${styles.textMuted}`}>Miglioramento</div>
                      <div className="text-xl font-bold text-green-400">+{scenario.winrateChange.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className={`text-xs ${styles.textMuted}`}>MMR Gain</div>
                      <div className="text-xl font-bold text-yellow-400">+{scenario.projectedMMR}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${styles.textMuted}`}>Valore</div>
                      <div className={`text-lg font-bold ${styles.textPrimary}`}>
                        {typeof scenario.currentValue === 'number' ? scenario.currentValue.toFixed(1) : scenario.currentValue} → {typeof scenario.improvedValue === 'number' ? scenario.improvedValue.toFixed(1) : scenario.improvedValue}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Combined Impact */}
      {data.summary.combinedImpact && (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-xl p-6 shadow-lg shadow-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Impatto Combinato</h2>
          </div>
          <p className={`text-sm ${styles.textSecondary} mb-4`}>
            Se migliori TUTTE le metriche insieme, questo è il risultato previsto:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`${styles.cardSubtle} p-4`}>
              <div className={`text-sm ${styles.textSecondary} mb-1`}>Winrate Finale</div>
              <div className="text-3xl font-bold text-purple-400">{data.summary.combinedImpact.winrate}%</div>
            </div>
            <div className={`${styles.cardSubtle} p-4`}>
              <div className={`text-sm ${styles.textSecondary} mb-1`}>Miglioramento</div>
              <div className="text-3xl font-bold text-green-400">+{data.summary.combinedImpact.winrateChange}%</div>
            </div>
            <div className={`${styles.cardSubtle} p-4`}>
              <div className={`text-sm ${styles.textSecondary} mb-1`}>MMR Gain Totale</div>
              <div className="text-3xl font-bold text-yellow-400">+{data.summary.combinedImpact.mmrGain}</div>
            </div>
          </div>
        </div>
      )}

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

