'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import Link from 'next/link'

interface AdvancedStats {
  vision: {
    avgObserverPlaced: number
    avgObserverKilled: number
    avgSentryPlaced: number
    avgSentryKilled: number
    wardEfficiency: number
    avgRunes: number
    visionScore: number
  }
}

interface Match {
  match_id: number
  win: boolean
  observer_placed: number
  observer_killed: number
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

export default function VisionControlPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchAdvancedStats = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/advanced-stats`)
      if (!response.ok) throw new Error('Failed to fetch advanced stats')

      const data = await response.json()
      if (!data.stats) throw new Error('No stats available')

      setStats(data.stats)
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vision & map control data')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchAdvancedStats()
    }
  }, [playerId, fetchAdvancedStats])

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

  if (!playerId) {
    return (
      <PlayerIdInput
        pageTitle="Vision & Map Control"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare l'analisi avanzata di vision e map control. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  // Prepare chart data
  const wardData = matches.map((m, idx) => ({
    match: `M${idx + 1}`,
    'Observer Placed': m.observer_placed,
    'Observer Killed': m.observer_killed,
    win: m.win,
  }))

  const pieData = stats ? [
    { name: 'Observer Placed', value: Math.round(stats.vision.avgObserverPlaced) },
    { name: 'Observer Killed', value: Math.round(stats.vision.avgObserverKilled) },
    { name: 'Sentry Placed', value: Math.round(stats.vision.avgSentryPlaced) },
    { name: 'Sentry Killed', value: Math.round(stats.vision.avgSentryKilled) },
  ] : []

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard/advanced" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
          ← Torna alle Analisi Avanzate
        </Link>
        <h1 className="text-3xl font-bold mb-2">Vision & Map Control</h1>
        <p className="text-gray-400">Analisi di visione, wards e controllo mappa</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento analisi vision & map control...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Observer Placed</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.vision.avgObserverPlaced.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-2">Observer wards per partita</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Observer Killed</h3>
              <p className="text-3xl font-bold text-green-400">{stats.vision.avgObserverKilled.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-2">Observer uccise per partita</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Ward Efficiency</h3>
              <p className="text-3xl font-bold text-yellow-400">{stats.vision.wardEfficiency.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">Observer killed / placed</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Vision Score</h3>
              <p className="text-3xl font-bold text-purple-400">{Math.round(stats.vision.visionScore)}</p>
              <p className="text-xs text-gray-500 mt-2">Score totale vision</p>
            </div>
          </div>

          {/* Wards Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Observer Wards per Partita</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wardData}>
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
                <Bar dataKey="Observer Placed" fill="#3B82F6" />
                <Bar dataKey="Observer Killed" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Distribuzione Wards</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiche Dettagliate</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sentry Placed</span>
                  <span className="font-bold">{stats.vision.avgSentryPlaced.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sentry Killed</span>
                  <span className="font-bold">{stats.vision.avgSentryKilled.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rune Raccolte</span>
                  <span className="font-bold">{stats.vision.avgRunes.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-200">💡 Insights Vision & Map Control</h3>
            <div className="space-y-2 text-sm text-blue-300">
              {stats.vision.avgObserverPlaced < 5 && (
                <p>
                  ⚠️ Observer wards piazzate basse ({stats.vision.avgObserverPlaced.toFixed(1)}). Se giochi support, aumenta il numero di wards.
                </p>
              )}
              {stats.vision.wardEfficiency > 40 && (
                <p>
                  ✅ Ottima ward efficiency ({stats.vision.wardEfficiency.toFixed(1)}%). Stai uccidendo efficacemente le wards nemiche.
                </p>
              )}
              {stats.vision.avgObserverKilled < 1 && (
                <p>
                  💡 Observer killed basse. Cerca attivamente le wards nemiche con sentry o con visione.
                </p>
              )}
              {stats.vision.avgRunes < 2 && (
                <p>
                  💡 Rune raccolte basse. Controlla più spesso le rune spawn (ogni 2 minuti).
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!stats && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun dato disponibile per l'analisi vision & map control</p>
        </div>
      )}
    </div>
  )
}
