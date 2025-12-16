'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import Link from 'next/link'

interface AdvancedStats {
  lane: {
    avgLastHits: number
    avgDenies: number
    avgCS: number
    denyRate: number
    firstBloodInvolvement: number
  }
  farm: {
    avgGPM: number
    avgXPM: number
    avgNetWorth: number
    goldUtilization: number
    avgBuybacks: number
    farmEfficiency: number
  }
  fights: {
    avgKills: number
    avgAssists: number
    avgDeaths: number
    killParticipation: number
    avgHeroDamage: number
    avgTowerDamage: number
    avgHealing: number
    damageEfficiency: number
  }
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
  gpm: number
  xpm: number
  last_hits: number
  denies: number
  hero_damage: number
  tower_damage: number
  healing: number
  kda: number
  observer_placed: number
  observer_killed: number
  net_worth: number
  start_time: number
}

export default function FarmEconomyPage() {
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
      setError(err instanceof Error ? err.message : 'Failed to load farm & economy data')
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
        pageTitle="Farm & Economy"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare l'analisi avanzata di farm ed economy. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  // Prepare chart data
  const gpmXpmData = matches.map((m, idx) => ({
    match: `M${idx + 1}`,
    GPM: m.gpm,
    XPM: m.xpm,
    win: m.win,
  }))

  const netWorthData = matches.map((m, idx) => ({
    match: `M${idx + 1}`,
    'Net Worth': m.net_worth,
    win: m.win,
  }))

  const csData = matches.map((m, idx) => ({
    match: `M${idx + 1}`,
    'Last Hits': m.last_hits,
    Denies: m.denies,
    win: m.win,
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard/advanced" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
          ← Torna alle Analisi Avanzate
        </Link>
        <h1 className="text-3xl font-bold mb-2">Farm & Economy</h1>
        <p className="text-gray-400">Analisi dettagliata di farm efficiency, gold utilization e economy management</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento analisi farm & economy...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">GPM Medio</h3>
              <p className="text-3xl font-bold text-yellow-400">{stats.farm.avgGPM.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-2">Gold per minuto</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">XPM Medio</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.farm.avgXPM.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-2">XP per minuto</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Gold Utilization</h3>
              <p className="text-3xl font-bold text-green-400">{stats.farm.goldUtilization.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">Gold speso / guadagnato</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Net Worth Medio</h3>
              <p className="text-3xl font-bold text-purple-400">{Math.round(stats.farm.avgNetWorth).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Net worth finale</p>
            </div>
          </div>

          {/* GPM/XPM Trend Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Trend GPM & XPM</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gpmXpmData}>
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
                <Line type="monotone" dataKey="GPM" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
                <Line type="monotone" dataKey="XPM" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Net Worth Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Net Worth per Partita</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={netWorthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="match" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
                <Legend />
                <Bar dataKey="Net Worth" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CS Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Last Hits & Denies</h2>
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

          {/* Detailed Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiche Farm</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Hits Medio</span>
                  <span className="font-bold">{stats.lane.avgLastHits.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Denies Medio</span>
                  <span className="font-bold">{stats.lane.avgDenies.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deny Rate</span>
                  <span className="font-bold">{stats.lane.denyRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Buyback Medio</span>
                  <span className="font-bold">{stats.farm.avgBuybacks.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Insights</h3>
              <div className="space-y-2 text-sm">
                {stats.farm.goldUtilization < 80 && (
                  <p className="text-yellow-400">
                    ⚠️ Gold Utilization bassa ({stats.farm.goldUtilization.toFixed(1)}%). Prova a spendere più gold in item utili.
                  </p>
                )}
                {stats.farm.avgGPM < 400 && (
                  <p className="text-orange-400">
                    💡 GPM sotto la media. Concentrati sul farm più efficiente e su creeps denies.
                  </p>
                )}
                {stats.lane.denyRate < 10 && (
                  <p className="text-blue-400">
                    💡 Deny rate basso. Prova a negare più creeps all'avversario in lane.
                  </p>
                )}
                {stats.farm.avgBuybacks > 1 && (
                  <p className="text-purple-400">
                    💡 Buyback frequenti. Valuta meglio quando è utile comprare.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!stats && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun dato disponibile per l'analisi farm & economy</p>
        </div>
      )}
    </div>
  )
}
