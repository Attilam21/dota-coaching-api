'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import { AlertTriangle, Clock, TrendingDown, Shield, Lightbulb, RefreshCw, XCircle, CheckCircle, Calendar } from 'lucide-react'
import Link from 'next/link'
import InsightBulbs from '@/components/InsightBulbs'
import { buildAntiTiltInsights } from '@/lib/insight-utils'

interface AntiTiltData {
  isTilted: boolean
  lossStreak: number
  winStreak: number
  recentWinrate: {
    last3: number
    last5: number
    today: number
  }
  recoveryStats: {
    avgRecoveryTime: number
    bestWinStreak: number
    recoveryWinrate: number
  }
  negativePatterns: {
    worstHours: Array<{ hour: number; winrate: number; total: number }>
    worstDays: Array<{ day: string; winrate: number; total: number }>
    worstHeroes: Array<{ hero_id: number; hero_name: string; winrate: number; games: number }>
  }
  suggestions: string[]
  tiltLevel: 'low' | 'medium' | 'high' | 'critical'
}

export default function AntiTiltPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [data, setData] = useState<AntiTiltData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pauseTimer, setPauseTimer] = useState<number | null>(null)
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  // Load pause timer from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anti_tilt_pause_timer')
      if (saved) {
        const savedTime = parseInt(saved)
        const now = Date.now()
        const elapsed = Math.floor((now - savedTime) / 1000) // seconds
        const remaining = Math.max(0, 30 * 60 - elapsed) // 30 minutes in seconds
        if (remaining > 0) {
          setPauseTimer(remaining)
          setPauseStartTime(savedTime)
        } else {
          localStorage.removeItem('anti_tilt_pause_timer')
        }
      }
    }
  }, [])

  // Update pause timer every second
  useEffect(() => {
    if (pauseTimer !== null && pauseTimer > 0) {
      const interval = setInterval(() => {
        setPauseTimer(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            localStorage.removeItem('anti_tilt_pause_timer')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [pauseTimer])

  const fetchAntiTiltData = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/anti-tilt`)
      if (!response.ok) throw new Error('Failed to fetch anti-tilt data')

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchAntiTiltData()
    }
  }, [playerId, fetchAntiTiltData])

  const startPause = () => {
    const now = Date.now()
    localStorage.setItem('anti_tilt_pause_timer', now.toString())
    setPauseStartTime(now)
    setPauseTimer(30 * 60) // 30 minutes
  }

  const resetPause = () => {
    localStorage.removeItem('anti_tilt_pause_timer')
    setPauseTimer(null)
    setPauseStartTime(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTiltColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-900/50 border-red-700 text-red-200'
      case 'high': return 'bg-orange-900/50 border-orange-700 text-orange-200'
      case 'medium': return 'bg-yellow-900/50 border-yellow-700 text-yellow-200'
      default: return 'bg-green-900/50 border-green-700 text-green-200'
    }
  }

  const getTiltIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="w-6 h-6" />
      case 'high': return <AlertTriangle className="w-6 h-6" />
      case 'medium': return <AlertTriangle className="w-5 h-5" />
      default: return <CheckCircle className="w-6 h-6" />
    }
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
        pageTitle="Anti-Tilt - PRO DOTA ANALISI"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le statistiche anti-tilt."
      />
    )
  }

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Anti-Tilt</h1>
        <p className="text-gray-400">Monitora il tuo stato emotivo e previeni il tilt</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento dati anti-tilt...</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Alert Card - Mostrato solo se tilted */}
          {data.isTilted && (
            <div className={`mb-6 border-2 rounded-lg p-6 ${getTiltColor(data.tiltLevel)}`}>
              <div className="flex items-start gap-4">
                {getTiltIcon(data.tiltLevel)}
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2">⚠️ Sei in Tilt!</h2>
                  <p className="mb-4">
                    {data.tiltLevel === 'critical' 
                      ? 'Il tuo stato è CRITICO. Fermati immediatamente e fai una pausa.'
                      : 'Il tuo stato indica un alto livello di tilt. Fai una pausa prima di continuare a giocare.'}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={startPause}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                    >
                      Avvia Pausa (30 min)
                    </button>
                    <Link
                      href="/dashboard"
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition inline-block"
                    >
                      Torna alla Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pause Timer */}
          {pauseTimer !== null && pauseTimer > 0 && (
            <div className="mb-6 bg-blue-900/50 border border-blue-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-blue-400" />
                  <div>
                    <h3 className="text-xl font-semibold">Pausa in Corso</h3>
                    <p className="text-sm text-gray-300">Tempo rimanente: {formatTime(pauseTimer)}</p>
                  </div>
                </div>
                <button
                  onClick={resetPause}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                >
                  Ho Fatto Pausa
                </button>
              </div>
            </div>
          )}

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Loss Streak */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider">Loss Streak</h3>
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-400">{data.lossStreak}</p>
              <p className="text-xs text-gray-500 mt-1">Partite perse consecutive</p>
            </div>

            {/* Win Streak */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider">Win Streak</h3>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">{data.winStreak}</p>
              <p className="text-xs text-gray-500 mt-1">Migliore: {data.recoveryStats.bestWinStreak}</p>
            </div>

            {/* Winrate Ultime 5 */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 relative">
              {playerId && (
                <InsightBadge
                  elementType="metric-card"
                  elementId="anti-tilt-winrate-last5"
                  contextData={{ 
                    metricName: 'Winrate Ultime 5 Partite', 
                    value: `${data.recentWinrate.last5.toFixed(1)}%`,
                    last3: data.recentWinrate.last3,
                    today: data.recentWinrate.today
                  }}
                  playerId={playerId}
                  position="top-right"
                />
              )}
              <div className="flex items-center justify-between mb-2 pr-8">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider">Winrate Ultime 5</h3>
                <RefreshCw className="w-6 h-6 text-yellow-400" />
              </div>
              <p className={`text-3xl font-bold ${data.recentWinrate.last5 < 40 ? 'text-red-400' : data.recentWinrate.last5 < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                {data.recentWinrate.last5.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Ultime 3: {data.recentWinrate.last3.toFixed(1)}%</p>
            </div>

            {/* Winrate Oggi */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider">Winrate Oggi</h3>
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <p className={`text-3xl font-bold ${data.recentWinrate.today < 40 ? 'text-red-400' : data.recentWinrate.today < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                {data.recentWinrate.today.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Ultime 24 ore</p>
            </div>
          </div>

          {/* Recovery Stats */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6 relative">
            {/* Insight Bulbs - Deterministic insights */}
            {data && (
              <div className="mb-4">
                <InsightBulbs
                  insights={buildAntiTiltInsights(data)}
                  isLoading={loading}
                />
              </div>
            )}
            {playerId && (
              <InsightBadge
                elementType="metric-card"
                elementId="anti-tilt-recovery-stats"
                contextData={{ 
                  metricName: 'Statistiche di Recupero', 
                  value: `${data.recoveryStats.avgRecoveryTime.toFixed(1)}h`,
                  recoveryWinrate: data.recoveryStats.recoveryWinrate,
                  bestWinStreak: data.recoveryStats.bestWinStreak
                }}
                playerId={playerId}
                position="top-right"
              />
            )}
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Statistiche di Recupero
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Tempo Medio di Recupero</p>
                <p className="text-2xl font-bold text-blue-400">
                  {data.recoveryStats.avgRecoveryTime > 0 
                    ? `${data.recoveryStats.avgRecoveryTime.toFixed(1)}h`
                    : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tempo tra sconfitta e prima vittoria</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Winrate Dopo Sconfitta</p>
                <p className={`text-2xl font-bold ${data.recoveryStats.recoveryWinrate < 40 ? 'text-red-400' : 'text-green-400'}`}>
                  {data.recoveryStats.recoveryWinrate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Probabilità di vincere dopo una sconfitta</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Serie di Vittorie Migliore</p>
                <p className="text-2xl font-bold text-green-400">{data.recoveryStats.bestWinStreak}</p>
                <p className="text-xs text-gray-500 mt-1">Record personale</p>
              </div>
            </div>
          </div>

          {/* Negative Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Worst Hours */}
            {data.negativePatterns.worstHours.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 relative">
                {playerId && (
                  <InsightBadge
                    elementType="metric-card"
                    elementId="anti-tilt-worst-hours"
                    contextData={{ 
                      metricName: 'Orari Peggiori',
                      worstHours: data.negativePatterns.worstHours.slice(0, 3),
                      pattern: 'temporal'
                    }}
                    playerId={playerId}
                    position="top-right"
                  />
                )}
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Orari Peggiori
                </h3>
                <div className="space-y-3">
                  {data.negativePatterns.worstHours.map((hour, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                      <div>
                        <p className="font-semibold">{hour.hour}:00 - {hour.hour + 1}:00</p>
                        <p className="text-xs text-gray-400">{hour.total} partite</p>
                      </div>
                      <p className={`text-lg font-bold ${hour.winrate < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {hour.winrate.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Worst Days */}
            {data.negativePatterns.worstDays.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Giorni Peggiori
                </h3>
                <div className="space-y-3">
                  {data.negativePatterns.worstDays.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                      <div>
                        <p className="font-semibold">{day.day}</p>
                        <p className="text-xs text-gray-400">{day.total} partite</p>
                      </div>
                      <p className={`text-lg font-bold ${day.winrate < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {day.winrate.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Worst Heroes */}
            {data.negativePatterns.worstHeroes.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Eroi da Evitare
                </h3>
                <div className="space-y-3">
                  {data.negativePatterns.worstHeroes.map((hero, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                      <div>
                        <p className="font-semibold">{hero.hero_name}</p>
                        <p className="text-xs text-gray-400">{hero.games} partite</p>
                      </div>
                      <p className={`text-lg font-bold ${hero.winrate < 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {hero.winrate.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-6 h-6" />
              Suggerimenti Personalizzati
            </h2>
            <div className="space-y-3">
              {data.suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 bg-gray-700/50 rounded-lg border-l-4 border-red-500">
                  <p className="text-gray-200">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={fetchAntiTiltData}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Aggiorna Dati
            </button>
          </div>
        </>
      )}
    </div>
  )
}

