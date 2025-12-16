'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerId } from '@/lib/usePlayerId'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

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
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId, loading: playerIdLoading } = usePlayerId()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (playerId && !playerIdLoading) {
      fetchStats()
    }
  }, [playerId, playerIdLoading])

  const fetchStats = async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch player stats')

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || playerIdLoading) {
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

  // Show setup message if player ID is not configured
  if (!playerId) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">FZTH Dota 2 Dashboard</h1>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4 text-yellow-200">Configura il tuo Profilo</h2>
            <p className="text-gray-300 mb-6">
              Per visualizzare le tue statistiche e analisi, devi prima configurare il tuo Dota 2 Account ID nel profilo.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Configura Profilo
            </Link>
          </div>
        </div>
      </div>
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
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento statistiche...</p>
        </div>
      )}

      {stats && !loading && (
        <>
          {/* Panoramica Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Panoramica</h2>
            
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
            <h3 className="text-xl font-semibold mb-4">Snapshot Stato Forma (ultime partite)</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Winrate Trend Card */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Winrate Trend</h4>
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
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">KDA Trend</h4>
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
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Farm Trend</h4>
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
                <h4 className="text-lg font-semibold mb-4">Insight Automatico</h4>
                <p className="text-sm text-gray-300">{getInsight()}</p>
              </div>
            </div>
          </div>

          {/* Trend Ultime 10 Partite */}
          {chartData.length > 0 && (
            <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Trend Ultime 10 Partite</h3>
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

          {/* Identità Giocatore */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Identità Giocatore</h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">Nome giocatore: </span>
                <span className="font-semibold">Giocatore #{playerId}</span>
              </div>
              <div>
                <span className="text-gray-400">Player ID: </span>
                <span className="font-semibold">{playerId}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
