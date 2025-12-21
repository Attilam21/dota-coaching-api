'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  Users, 
  TrendingUp, 
  TrendingDown,
  ArrowLeft,
  Gamepad2,
  Shield,
  Zap
} from 'lucide-react'

interface GameAdviceData {
  playerId: number
  matchId: number
  role: string
  teamWon: boolean
  actions: {
    good: Array<{
      category: string
      action: string
      metric: string
      impact: 'high' | 'medium' | 'low'
      phase: 'early' | 'mid' | 'late'
    }>
    bad: Array<{
      category: string
      action: string
      metric: string
      impact: 'high' | 'medium' | 'low'
      phase: 'early' | 'mid' | 'late'
      recommendation: string
    }>
  }
  teamComposition: {
    yourTeam: {
      heroes: number[]
      roles: string[]
      strengths: string[]
      weaknesses: string[]
      synergyScore: number
      synergyIssues: string[]
    }
    enemyTeam: {
      heroes: number[]
      roles: string[]
      strengths: string[]
      weaknesses: string[]
    }
    recommendations: Array<{
      type: 'draft' | 'strategy' | 'itemization'
      priority: 'high' | 'medium' | 'low'
      advice: string
      reasoning: string
    }>
  }
  macroAdvice: Array<{
    phase: 'early' | 'mid' | 'late'
    decision: string
    reasoning: string
    timing: string
    priority: 'high' | 'medium' | 'low'
  }>
  microAdvice: Array<{
    category: string
    issue: string
    recommendation: string
    examples: string[]
  }>
  teamplayAdvice: Array<{
    type: string
    issue: string
    recommendation: string
    teammates: number[]
  }>
}

export default function MatchAdvicePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { playerId } = usePlayerIdContext()
  const matchId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adviceData, setAdviceData] = useState<GameAdviceData | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!matchId || !playerId) return

    async function fetchAdvice() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/match/${matchId}/game-advice?playerId=${playerId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch game advice')
        }
        
        const data = await response.json()
        setAdviceData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAdvice()
  }, [matchId, playerId])

  if (authLoading || loading) {
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

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">Errore: {error}</p>
          <Link href="/dashboard/matches" className="text-red-400 hover:text-red-300 mt-2 inline-block">
            ← Torna a Partite
          </Link>
        </div>
      </div>
    )
  }

  if (!adviceData) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <p className="text-gray-400">Nessun dato disponibile</p>
        </div>
      </div>
    )
  }

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-blue-400'
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-900/30 border-red-700'
      case 'medium': return 'bg-yellow-900/30 border-yellow-700'
      case 'low': return 'bg-blue-900/30 border-blue-700'
    }
  }

  const getPhaseColor = (phase: 'early' | 'mid' | 'late') => {
    switch (phase) {
      case 'early': return 'bg-green-900/30 text-green-400'
      case 'mid': return 'bg-yellow-900/30 text-yellow-400'
      case 'late': return 'bg-red-900/30 text-red-400'
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/dashboard/matches"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Analisi Partita</h1>
            <HelpButton />
          </div>
          <p className="text-gray-400 text-sm">
            Match ID: {matchId} | Ruolo: {adviceData.role} | 
            {adviceData.teamWon ? (
              <span className="text-green-400 ml-1">Vittoria</span>
            ) : (
              <span className="text-red-400 ml-1">Sconfitta</span>
            )}
          </p>
        </div>
        <Link
          href={`/dashboard/match-analysis/${matchId}`}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          Analisi Dettagliata
        </Link>
      </div>

      {/* 1. AZIONI FATTE BENE/MALE */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          Azioni Fatte Bene / Male
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Good Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Azioni Positive ({adviceData.actions.good.length})
            </h3>
            <div className="space-y-3">
              {adviceData.actions.good.length > 0 ? (
                adviceData.actions.good.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-green-900/20 border border-green-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-green-400">{action.action}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getPhaseColor(action.phase)}`}>
                        {action.phase}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{action.metric}</p>
                    <p className="text-xs text-gray-400 mt-1">Categoria: {action.category}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">Nessuna azione positiva identificata</p>
              )}
            </div>
          </div>

          {/* Bad Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Aree di Miglioramento ({adviceData.actions.bad.length})
            </h3>
            <div className="space-y-3">
              {adviceData.actions.bad.length > 0 ? (
                adviceData.actions.bad.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-red-900/20 border border-red-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-red-400">{action.action}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getPhaseColor(action.phase)}`}>
                        {action.phase}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{action.metric}</p>
                    <div className="bg-gray-900/50 rounded p-2 mt-2">
                      <p className="text-xs text-yellow-400 font-semibold mb-1">💡 Consiglio:</p>
                      <p className="text-sm text-gray-300">{action.recommendation}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Categoria: {action.category}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">Nessuna area di miglioramento identificata</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TEAM COMPOSITION */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Analisi Composizione Team
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Your Team */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Il Tuo Team</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Ruoli:</span> {adviceData.teamComposition.yourTeam.roles.join(', ')}
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Synergy Score:</span> {adviceData.teamComposition.yourTeam.synergyScore}/100
              </p>
            </div>
            
            {adviceData.teamComposition.yourTeam.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-green-400 mb-2">Punti di Forza:</p>
                <ul className="space-y-1">
                  {adviceData.teamComposition.yourTeam.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {adviceData.teamComposition.yourTeam.weaknesses.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-400 mb-2">Debolezze:</p>
                <ul className="space-y-1">
                  {adviceData.teamComposition.yourTeam.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Enemy Team */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-400">Team Nemico</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Ruoli:</span> {adviceData.teamComposition.enemyTeam.roles.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {adviceData.teamComposition.recommendations.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Consigli Composizione
            </h3>
            <div className="space-y-3">
              {adviceData.teamComposition.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold">{rec.advice}</span>
                    <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{rec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. MACRO ADVICE */}
      {adviceData.macroAdvice.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-yellow-400" />
            Consigli Macro (Decisioni Strategiche)
          </h2>
          
          <div className="space-y-3">
            {adviceData.macroAdvice.map((advice, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${getPriorityColor(advice.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold">{advice.decision}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getPhaseColor(advice.phase)}`}>
                      {advice.phase}
                    </span>
                    <span className="text-xs text-gray-400">{advice.timing}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{advice.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MICRO ADVICE */}
      {adviceData.microAdvice.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            Consigli Micro (Meccaniche di Gioco)
          </h2>
          
          <div className="space-y-3">
            {adviceData.microAdvice.map((advice, idx) => (
              <div
                key={idx}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-yellow-400">{advice.issue}</span>
                  <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                    {advice.category}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{advice.recommendation}</p>
                {advice.examples.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1">Esempi:</p>
                    <ul className="space-y-1">
                      {advice.examples.map((example, exIdx) => (
                        <li key={exIdx} className="text-xs text-gray-400">• {example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TEAMPLAY ADVICE */}
      {adviceData.teamplayAdvice.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-400" />
            Consigli Teamplay
          </h2>
          
          <div className="space-y-3">
            {adviceData.teamplayAdvice.map((advice, idx) => (
              <div
                key={idx}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-red-400">{advice.issue}</span>
                  <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                    {advice.type}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{advice.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-400">
        <Link href="/dashboard/matches" className="text-blue-400 hover:text-blue-300">
          ← Torna a Storico Partite
        </Link>
      </div>
    </div>
  )
}

