'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { useDashboardStyles } from '@/lib/hooks/useDashboardStyles'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'
import { Lightbulb, AlertTriangle, CheckCircle2, BarChart as BarChartIcon, Target } from 'lucide-react'
import type { AdvancedStats, AdvancedStatsMatch } from '@/types/advanced-stats'

interface Match {
  match_id: number
  win: boolean
  observer_placed: number
  observer_killed: number
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

type TabType = 'statistics' | 'trends'

export default function VisionControlPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const styles = useDashboardStyles()
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('statistics')

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

      setStats(data.stats as AdvancedStats)
      setMatches((data.matches || []) as Match[])
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
    <div className="p-4 md:p-6">
      <HelpButton />
      <div className="mb-6">
        <Link href="/dashboard/advanced" className={`${styles.textLink} text-sm mb-4 inline-block`}>
          ← Torna alle Analisi Avanzate
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Vision & Map Control</h1>
        <p className={`${styles.textSecondary} mb-6`}>Analisi di visione, wards e controllo mappa</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className={`mt-4 ${styles.textSecondary}`}>Caricamento analisi vision & map control...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'statistics' as TabType, name: 'Statistiche', icon: Target },
                { id: 'trends' as TabType, name: 'Trend', icon: BarChartIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gray-700 border-b-2 border-red-500'
                      : `${styles.textSecondary} hover:text-white hover:bg-gray-700/50`
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-6">
              {/* Statistics Tab */}
              {activeTab === 'statistics' && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className={`text-sm ${styles.textSecondary} mb-2`}>Observer Placed</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.vision.avgObserverPlaced.toFixed(1)}</p>
              <p className={`text-xs ${styles.textMuted} mt-2`}>Observer wards per partita</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Deward Efficiency</h3>
              <p className="text-3xl font-bold text-green-400">{stats.vision.dewardEfficiency}%</p>
              <p className="text-xs text-gray-500 mt-2">Sentry killed / placed</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Rune Control</h3>
              <p className="text-3xl font-bold text-yellow-400">{stats.vision.runesPerMinute}</p>
              <p className="text-xs text-gray-500 mt-2">Rune per minuto</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Roshan Control</h3>
              <p className="text-3xl font-bold text-purple-400">{stats.vision.roshanControlRate}%</p>
              <p className="text-xs text-gray-500 mt-2">% partite con Roshan</p>
                  </div>
                </div>
                  
                  {/* Support Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Camps Stacked</h3>
              <p className="text-2xl font-bold text-cyan-400">{stats.vision.avgCampsStacked}</p>
              <p className="text-xs text-gray-500 mt-2">Camp stacked per partita</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Courier Kills</h3>
              <p className="text-2xl font-bold text-orange-400">{stats.vision.avgCourierKills}</p>
              <p className="text-xs text-gray-500 mt-2">Courier uccisi per partita</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Roshan Kills</h3>
              <p className="text-2xl font-bold text-red-400">{stats.vision.avgRoshanKills}</p>
              <p className="text-xs text-gray-500 mt-2">Roshan uccisi per partita</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Vision Score</h3>
              <p className="text-2xl font-bold text-purple-400">{Math.round(stats.vision.visionScore)}</p>
              <p className="text-xs text-gray-500 mt-2">Score totale vision</p>
                  </div>
                </div>

                  {/* Detailed Stats & Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-xl md:text-2xl font-semibold mb-4">Statistiche Dettagliate</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Sentry Placed</span>
                          <span className="font-bold">{stats.vision.avgSentryPlaced.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Sentry Killed</span>
                          <span className="font-bold">{stats.vision.avgSentryKilled.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Rune Raccolte</span>
                          <span className="font-bold">{stats.vision.avgRunes.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Rune per Minuto</span>
                          <span className="font-bold text-yellow-400">{stats.vision.runesPerMinute}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Camps Stacked</span>
                          <span className="font-bold text-cyan-400">{stats.vision.avgCampsStacked}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Courier Kills</span>
                          <span className="font-bold text-orange-400">{stats.vision.avgCourierKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Roshan Kills</span>
                          <span className="font-bold text-red-400">{stats.vision.avgRoshanKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={styles.textSecondary}>Deward Efficiency</span>
                          <span className="font-bold text-green-400">{stats.vision.dewardEfficiency}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                      <h3 className="text-xl md:text-2xl font-semibold mb-4 text-blue-200 flex items-center gap-2">
                        <Lightbulb className="w-6 h-6" />
                        Insights Vision & Map Control
                      </h3>
                      <div className="space-y-2 text-sm text-blue-300">
                        {stats.vision.avgObserverPlaced < 5 && (
                          <p className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            Observer wards piazzate basse ({stats.vision.avgObserverPlaced.toFixed(1)}). Se giochi support, aumenta il numero di wards.
                          </p>
                        )}
                        {stats.vision.wardEfficiency > 40 && (
                          <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Ottima ward efficiency ({stats.vision.wardEfficiency.toFixed(1)}%). Stai uccidendo efficacemente le wards nemiche.
                          </p>
                        )}
                        {stats.vision.avgObserverKilled < 1 && (
                          <p className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-400" />
                            Observer killed basse. Cerca attivamente le wards nemiche con sentry o con visione.
                          </p>
                        )}
                        {parseFloat(stats.vision.runesPerMinute) < 0.1 && (
                          <p className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-400" />
                            Rune per minuto basse ({stats.vision.runesPerMinute}). Controlla più spesso le rune spawn (ogni 2 minuti).
                          </p>
                        )}
                        {parseFloat(stats.vision.avgCampsStacked) < 2 && (
                          <p className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-400" />
                            Camps stacked bassi ({stats.vision.avgCampsStacked}). Come support, aiuta il farm dei tuoi carry con lo stacking.
                          </p>
                        )}
                        {parseFloat(stats.vision.dewardEfficiency) < 30 && stats.vision.avgSentryPlaced > 0 && (
                          <p className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            Deward efficiency bassa ({stats.vision.dewardEfficiency}%). Migliora il posizionamento delle sentry per trovare più wards nemiche.
                          </p>
                        )}
                        {parseFloat(stats.vision.roshanControlRate) < 20 && (
                          <p className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-400" />
                            Roshan control basso ({stats.vision.roshanControlRate}%). Partecipa di più al controllo di Roshan nelle partite lunghe.
                          </p>
                        )}
                        {parseFloat(stats.vision.avgCourierKills) > 0 && (
                          <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Ottimo controllo courier ({stats.vision.avgCourierKills} courier uccisi/game). Stai negando risorse agli avversari.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="space-y-6">
                  {/* Grafici Section */}
                  <div>
                    <h2 className={`text-xl md:text-2xl font-semibold mb-6 ${styles.textPrimary}`}>Grafici</h2>
                    <div className="space-y-6">
                      {/* Wards Chart */}
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Observer Wards per Partita</h2>
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
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold mb-4">Distribuzione Wards</h2>
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!stats && !loading && (
        <div className="text-center py-12">
          <p className={styles.textSecondary}>Nessun dato disponibile per l'analisi vision & map control</p>
        </div>
      )}
    </div>
  )
}
