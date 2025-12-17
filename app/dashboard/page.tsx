'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { Sword, Zap, DollarSign, Search, Target, FlaskConical, BookOpen, Sparkles } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import { PlayerStatsSkeleton, StatsCardSkeleton, ChartSkeleton, MatchCardSkeleton } from '@/components/SkeletonLoader'
import InsightBadge from '@/components/InsightBadge'

interface PlayerStats {
  winrate: {
    last5: number
    last10: number
    delta: number
  }
  kda: {
    last5: number
    last10: number
    delta: number
  }
  farm: {
    gpm: { last5: number; last10: number }
    xpm: { last5: number; last10: number }
  }
  matches: Array<{
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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchStats = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const [statsResponse, advancedResponse] = await Promise.all([
        fetch(`/api/player/${playerId}/stats`),
        fetch(`/api/player/${playerId}/advanced-stats`)
      ])

      if (!statsResponse.ok) throw new Error('Failed to fetch player stats')

      const statsData = await statsResponse.json()
      const advancedData = advancedResponse.ok ? await advancedResponse.json() : null

      // Enhance stats with advanced data if available
      if (advancedData?.stats) {
        setStats({
          ...statsData.stats,
          advanced: advancedData.stats
        })
      } else {
        setStats(statsData.stats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchStats()
    }
  }, [playerId, fetchStats])

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show input option if no player ID available
  if (!playerId) {
    return (
      <PlayerIdInput
        pageTitle="FZTH Dota 2 Dashboard"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le statistiche. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const getWinrateTrend = () => {
    if (!stats) return { label: '', color: '' }
    const delta = stats.winrate.delta
    if (delta > 5) return { label: 'In aumento', color: 'bg-green-500' }
    if (delta < -5) return { label: 'In calo', color: 'bg-red-500' }
    return { label: 'Stabile', color: 'bg-gray-500' }
  }

  const getKDATrend = () => {
    if (!stats) return { label: '', color: '' }
    const delta = stats.kda.delta
    if (delta > 0.5) return { label: 'Migliora', color: 'bg-green-500' }
    if (delta < -0.5) return { label: 'Peggiora', color: 'bg-red-500' }
    return { label: 'Stabile', color: 'bg-gray-500' }
  }

  const getInsight = () => {
    if (!stats) return ''
    const winrateDelta = stats.winrate.delta
    if (winrateDelta < -10) {
      return 'Il winrate recente è peggiorato rispetto al tuo storico. Potrebbe indicare un momento di forma negativo.'
    }
    if (winrateDelta > 10) {
      return 'Ottimo momento di forma! Il winrate recente è migliorato significativamente.'
    }
    return 'Le tue performance sono stabili rispetto al tuo storico recente.'
  }

  // Prepare chart data
  const chartData = stats?.matches.map((m, idx) => ({
    match: `Match ${idx + 1}`,
    winrate: m.win ? 100 : 0,
    kda: m.kda,
    gpm: m.gpm,
  })) || []

  const winrateTrend = getWinrateTrend()
  const kdaTrend = getKDATrend()

  return (
    <div className="p-8">
      <HelpButton />
      {/* Header */}
      <div className="mb-8">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">FZTH Dota 2 Dashboard</h1>
            <p className="text-gray-400">Player #{playerId}</p>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-sm text-gray-400 hover:text-white"
          >
            Modifica Profilo
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse" />
          </div>

          {/* Snapshot Cards Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Chart Skeleton */}
          <ChartSkeleton />

          {/* Recent Matches Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {stats && !loading && (
        <>
          {/* Panoramica Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Panoramica</h2>
            
            {/* Analysis info box */}
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
              <p className="text-green-200">
                Analisi basata sul tuo storico recente (fino a 10 partite) – Valori medi/aggregati
              </p>
              <p className="text-green-300 text-sm mt-2">
                Questa sezione mostra valori medi e aggregati sulle ultime N partite. Per analizzare una singola partita in dettaglio, vai alla sezione 'Analisi partita'.
              </p>
            </div>
          </div>

          {/* Snapshot Stato Forma */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3">Snapshot Stato Forma (ultime partite)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Winrate Trend Card */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                {playerId && (
                  <InsightBadge
                    elementType="trend-winrate"
                    elementId="dashboard-winrate-trend"
                    contextData={{ direction: stats.winrate.delta >= 0 ? 'up' : 'down', value: stats.winrate.delta, label: winrateTrend.label, last5: stats.winrate.last5, last10: stats.winrate.last10 }}
                    playerId={playerId}
                    position="top-right"
                  />
                )}
                <h4 className="text-lg font-semibold mb-2">Winrate Trend</h4>
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${winrateTrend.color} text-white`}>
                    {winrateTrend.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Ultime 5 partite: </span>
                    <span className="font-bold">{stats.winrate.last5.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ultime 10 partite: </span>
                    <span className="font-bold">{stats.winrate.last10.toFixed(1)}%</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Delta: </span>
                    <span className={`font-bold ${stats.winrate.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.winrate.delta >= 0 ? '+' : ''}{stats.winrate.delta.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Trend basato su 5/10 partite</p>
              </div>

              {/* KDA Trend Card */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                {playerId && (
                  <InsightBadge
                    elementType="trend-kda"
                    elementId="dashboard-kda-trend"
                    contextData={{ direction: stats.kda.delta >= 0 ? 'up' : 'down', value: stats.kda.delta, label: kdaTrend.label, last5: stats.kda.last5, last10: stats.kda.last10 }}
                    playerId={playerId}
                    position="top-right"
                  />
                )}
                <h4 className="text-lg font-semibold mb-2">KDA Trend</h4>
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${kdaTrend.color} text-white`}>
                    {kdaTrend.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Ultime 5 partite: </span>
                    <span className="font-bold">{stats.kda.last5.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ultime 10 partite: </span>
                    <span className="font-bold">{stats.kda.last10.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Delta: </span>
                    <span className={`font-bold ${stats.kda.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.kda.delta >= 0 ? '+' : ''}{stats.kda.delta.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">KDA = (Kill + Assist) / Death</p>
              </div>

              {/* Farm Trend Card */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-2">Farm Trend</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">GPM: </span>
                    <span className="font-bold text-yellow-400">{stats.farm.gpm.last5.toFixed(0)}</span>
                    <span className="text-gray-500 ml-2">/ {stats.farm.gpm.last10.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">XPM: </span>
                    <span className="font-bold text-blue-400">{stats.farm.xpm.last5.toFixed(0)}</span>
                    <span className="text-gray-500 ml-2">/ {stats.farm.xpm.last10.toFixed(0)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Media ultime 5/10 partite</p>
              </div>

              {/* Insight Automatico Card */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-2">Insight Automatico</h4>
                <p className="text-sm text-gray-300">{getInsight()}</p>
              </div>
            </div>
          </div>

          {/* Trend Ultime 10 Partite */}
          {chartData.length > 0 && (
            <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6 relative">
              {playerId && (
                <InsightBadge
                  elementType="trend-chart"
                  elementId="dashboard-trend-chart"
                  contextData={{ trends: { winrate: stats.winrate, kda: stats.kda, farm: stats.farm }, data: chartData }}
                  playerId={playerId}
                  position="top-right"
                />
              )}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold mb-3">Trend Ultime 10 Partite</h3>
                <span className="text-sm text-gray-400">{chartData.length} partite analizzate</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
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
                  <Line
                    type="monotone"
                    dataKey="kda"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="KDA"
                    dot={{ fill: '#F59E0B' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gpm"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="GPM"
                    dot={{ fill: '#10B981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="winrate"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Winrate %"
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Stats Cards */}
          {stats.advanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-gray-400 uppercase tracking-wider">Last Hits</h4>
                  <Sword className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.advanced.lane.avgLastHits.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">Media per partita</p>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-gray-400 uppercase tracking-wider">Hero Damage</h4>
                  <Sparkles className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-red-400">{Math.round(stats.advanced.fights.avgHeroDamage).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Danno medio</p>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-gray-400 uppercase tracking-wider">Kill Participation</h4>
                  <Zap className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">{stats.advanced.fights.killParticipation.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Partecipazione fight</p>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-gray-400 uppercase tracking-wider">Net Worth</h4>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-yellow-400">{Math.round(stats.advanced.farm.avgNetWorth).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Valore medio</p>
              </div>
            </div>
          )}

          {/* Recent Matches Grid */}
          {stats.matches.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold mb-3">Ultime Partite</h3>
                <Link
                  href="/dashboard/matches"
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Vedi tutte →
                </Link>
              </div>
              <div className="grid md:grid-cols-5 gap-4">
                {stats.matches.slice(0, 5).map((match, idx) => (
                  <Link
                    key={match.match_id}
                    href={`/analysis/match/${match.match_id}`}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Match {idx + 1}</span>
                      <span className={`text-xs px-2 py-1 rounded ${match.win ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                        {match.win ? 'V' : 'S'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">KDA:</span>
                        <span className="font-bold">{match.kda.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">GPM:</span>
                        <span className="font-bold">{match.gpm}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links to Deep Analysis */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Analisi Approfondite
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/performance"
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-8 h-8 text-yellow-400" />
                  <h4 className="font-semibold">Performance</h4>
                </div>
                <p className="text-xs text-gray-400">Stile di gioco e profilo performance</p>
              </Link>
              <Link
                href="/dashboard/profiling"
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-8 h-8 text-purple-400" />
                  <h4 className="font-semibold">Profilazione FZTH</h4>
                </div>
                <p className="text-xs text-gray-400">Profilo completo con IA</p>
              </Link>
              <Link
                href="/dashboard/advanced"
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-8 h-8 text-blue-400" />
                  <h4 className="font-semibold">Analisi Avanzate</h4>
                </div>
                <p className="text-xs text-gray-400">Lane, Farm, Fight, Vision</p>
              </Link>
              <Link
                href="/dashboard/coaching"
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-8 h-8 text-indigo-400" />
                  <h4 className="font-semibold">Coaching</h4>
                </div>
                <p className="text-xs text-gray-400">Task e raccomandazioni</p>
              </Link>
            </div>
          </div>

          {/* Identità Giocatore */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-3">Profilo Giocatore</h3>
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-400">Player ID: </span>
                    <span className="font-semibold text-red-400">{playerId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Partite analizzate: </span>
                    <span className="font-semibold">{stats.matches.length}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/profiling"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Profilo Completo →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
