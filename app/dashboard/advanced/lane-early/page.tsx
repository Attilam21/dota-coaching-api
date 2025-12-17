'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'

interface AdvancedStats {
  lane: {
    avgLastHits: number
    avgDenies: number
    avgCS: number
    csPerMinute: string
    estimatedCSAt10Min: string
    denyRate: number
    firstBloodInvolvement: number
  }
}

interface Match {
  match_id: number
  win: boolean
  last_hits: number
  denies: number
}

export default function LaneEarlyPage() {
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
      setError(err instanceof Error ? err.message : 'Failed to load lane & early game data')
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
        pageTitle="Lane & Early Game"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare l'analisi avanzata di lane e early game. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  // Prepare chart data
  const csData = matches.map((m, idx) => ({
    match: `M${idx + 1}`,
    'Last Hits': m.last_hits,
    Denies: m.denies,
    win: m.win,
  }))

  return (
    <div className="p-8">
      <HelpButton />
      <div className="mb-6">
        <Link href="/dashboard/advanced" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
          ← Torna alle Analisi Avanzate
        </Link>
        <h1 className="text-3xl font-bold mb-2">Lane & Early Game</h1>
        <p className="text-gray-400">Analisi della fase di lane: CS, denies, lane efficiency e first blood</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento analisi lane & early game...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">CS per Minuto</h3>
              <p className="text-3xl font-bold text-green-400">{stats.lane.csPerMinute}</p>
              <p className="text-xs text-gray-500 mt-2">Creep score per minuto</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">CS Stimato a 10min</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.lane.estimatedCSAt10Min}</p>
              <p className="text-xs text-gray-500 mt-2">CS previsto a 10 minuti</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Deny Rate</h3>
              <p className="text-3xl font-bold text-yellow-400">{stats.lane.denyRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">% denies su CS totale</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">First Blood</h3>
              <p className="text-3xl font-bold text-purple-400">{stats.lane.firstBloodInvolvement.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">% partite con FB</p>
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Last Hits Medio</h3>
              <p className="text-2xl font-bold text-green-400">{stats.lane.avgLastHits.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-2">CS medio per partita</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Denies Medio</h3>
              <p className="text-2xl font-bold text-red-400">{stats.lane.avgDenies.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-2">Denies medio per partita</p>
            </div>
          </div>

          {/* CS Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Last Hits & Denies per Partita</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={csData}>
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
                <Bar dataKey="Last Hits" fill="#10B981" />
                <Bar dataKey="Denies" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Benchmark Comparison */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Benchmark CS</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">CS per Minuto</span>
                  <span className="font-bold">{stats.lane.csPerMinute}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full"
                    style={{ width: `${Math.min((parseFloat(stats.lane.csPerMinute) / 8) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Obiettivo: 6-8 per carry, 4-6 per mid, 3-5 per offlane</p>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">CS Stimato a 10min</span>
                  <span className="font-bold">{stats.lane.estimatedCSAt10Min}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ width: `${Math.min((parseFloat(stats.lane.estimatedCSAt10Min) / 80) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Obiettivo: 60-80 per carry, 40-60 per mid</p>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Il tuo Deny Rate</span>
                  <span className="font-bold">{stats.lane.denyRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-red-600 h-4 rounded-full"
                    style={{ width: `${Math.min(stats.lane.denyRate, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Obiettivo: 15-25% per core, 5-10% per support</p>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-200">💡 Insights Lane & Early Game</h3>
            <div className="space-y-2 text-sm text-blue-300">
              {stats.lane.avgLastHits < 50 && (
                <p>
                  ⚠️ Last Hits sotto la media. Migliora il timing di attacco e la gestione delle lane creeps.
                </p>
              )}
              {stats.lane.denyRate < 10 && (
                <p>
                  💡 Deny Rate basso ({stats.lane.denyRate.toFixed(1)}%). Prova a negare più creeps all'avversario per limitare il suo XP.
                </p>
              )}
              {stats.lane.firstBloodInvolvement > 30 && (
                <p>
                  ✅ Ottima partecipazione a First Blood ({stats.lane.firstBloodInvolvement.toFixed(1)}%). Aggressività in early game efficace.
                </p>
              )}
              {stats.lane.avgCS < 80 && (
                <p>
                  💡 CS totale migliorabile. Concentrati sul farm più efficiente e sulla gestione delle lane.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!stats && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun dato disponibile per l'analisi lane & early game</p>
        </div>
      )}
    </div>
  )
}
