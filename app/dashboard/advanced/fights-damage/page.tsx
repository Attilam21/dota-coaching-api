'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, Legend, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'
import { AlertTriangle, Lightbulb, BarChart as BarChartIcon, Target } from 'lucide-react'

interface AdvancedStats {
  fights: {
    avgKills: number
    avgAssists: number
    avgDeaths: number
    deathsPerMinute: string
    killParticipation: number
    teamfightParticipation: string
    avgHeroDamage: number
    avgTowerDamage: number
    avgHealing: number
    damageEfficiency: number
    damagePerMinute: string
  }
}

interface Match {
  match_id: number
  win: boolean
  hero_damage: number
  tower_damage: number
  healing: number
  kda: number
}

type TabType = 'overview' | 'charts'

export default function FightsDamagePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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
      setError(err instanceof Error ? err.message : 'Failed to load fights & damage data')
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
        pageTitle="Fights & Damage"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare l'analisi avanzata di fight e damage. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  // Prepare chart data
  const damageData = matches.map((m, idx) => ({
    match: `M${idx + 1}`,
    'Hero Damage': m.hero_damage,
    'Tower Damage': m.tower_damage,
    Healing: m.healing,
    win: m.win,
  }))

  const radarData = stats ? [
    { subject: 'Kills', value: Math.min(stats.fights.avgKills * 10, 100), fullMark: 100 },
    { subject: 'Assists', value: Math.min(stats.fights.avgAssists * 5, 100), fullMark: 100 },
    { subject: 'KP %', value: stats.fights.killParticipation, fullMark: 100 },
    { subject: 'Hero Dmg', value: Math.min(stats.fights.avgHeroDamage / 50, 100), fullMark: 100 },
    { subject: 'Tower Dmg', value: Math.min(stats.fights.avgTowerDamage / 10, 100), fullMark: 100 },
    { subject: 'Healing', value: Math.min(stats.fights.avgHealing / 30, 100), fullMark: 100 },
  ] : []

  const kdaTrend = matches.map((m, idx) => ({
    match: `M${idx + 1}`,
    KDA: m.kda,
    win: m.win,
  }))

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <div className="mb-6">
        <Link href="/dashboard/advanced" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
          ← Torna alle Analisi Avanzate
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Fights & Damage</h1>
        <p className="text-gray-400 mb-6">Analisi del contributo ai fight, damage output e teamfight impact</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento analisi fights & damage...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: Target },
                { id: 'charts' as TabType, name: 'Grafici', icon: BarChartIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Kill Participation</h3>
              <p className="text-3xl font-bold text-green-400">{stats.fights.killParticipation.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">Partecipazione ai kill</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Damage per Minuto</h3>
              <p className="text-3xl font-bold text-red-400">{stats.fights.damagePerMinute}</p>
              <p className="text-xs text-gray-500 mt-2">Hero damage al minuto</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Deaths per Minuto</h3>
              <p className="text-3xl font-bold text-orange-400">{stats.fights.deathsPerMinute}</p>
              <p className="text-xs text-gray-500 mt-2">Morti al minuto</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Teamfight Participation</h3>
              <p className="text-3xl font-bold text-purple-400">{stats.fights.teamfightParticipation}</p>
              <p className="text-xs text-gray-500 mt-2">Partecipazione ai teamfight</p>
                  </div>
                </div>
                  
                  {/* Additional Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Hero Damage Medio</h3>
              <p className="text-2xl font-bold text-red-400">{Math.round(stats.fights.avgHeroDamage).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Damage ai nemici</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Tower Damage Medio</h3>
              <p className="text-2xl font-bold text-yellow-400">{Math.round(stats.fights.avgTowerDamage).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Damage alle torri</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Damage Efficiency</h3>
              <p className="text-2xl font-bold text-purple-400">{Math.round(stats.fights.damageEfficiency).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Dmg / Death</p>
                  </div>
                </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-xl md:text-2xl font-semibold mb-4">Statistiche Fight</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Kills Medio</span>
                          <span className="font-bold">{stats.fights.avgKills.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Assists Medio</span>
                          <span className="font-bold">{stats.fights.avgAssists.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Deaths Medio</span>
                          <span className="font-bold">{stats.fights.avgDeaths.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Healing Medio</span>
                          <span className="font-bold">{Math.round(stats.fights.avgHealing).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-xl md:text-2xl font-semibold mb-4">Insights</h3>
                      <div className="space-y-2 text-sm">
                        {stats.fights.killParticipation < 50 && (
                          <p className="text-yellow-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Kill Participation bassa ({stats.fights.killParticipation.toFixed(1)}%). Partecipa di più ai teamfight.
                          </p>
                        )}
                        {parseFloat(stats.fights.damagePerMinute) < 300 && (
                          <p className="text-orange-400 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Damage per minuto basso ({stats.fights.damagePerMinute}). Aumenta la partecipazione ai fight.
                          </p>
                        )}
                        {parseFloat(stats.fights.deathsPerMinute) > 0.15 && (
                          <p className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Troppe morti per minuto ({stats.fights.deathsPerMinute}). Migliora il positioning e la mappa awareness.
                          </p>
                        )}
                        {parseFloat(stats.fights.teamfightParticipation) < 5 && (
                          <p className="text-yellow-400 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Teamfight participation bassa ({stats.fights.teamfightParticipation}). Sii più presente nei fight principali.
                          </p>
                        )}
                        {stats.fights.damageEfficiency < 10000 && (
                          <p className="text-orange-400 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Damage Efficiency migliorabile ({Math.round(stats.fights.damageEfficiency).toLocaleString()}). Prova a fare più damage prima di morire.
                          </p>
                        )}
                        {stats.fights.avgTowerDamage < 1000 && (
                          <p className="text-blue-400 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Tower Damage basso. Concentrati di più sul push delle torri.
                          </p>
                        )}
                        {stats.fights.avgDeaths > 8 && (
                          <p className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Troppe morti in media ({stats.fights.avgDeaths.toFixed(1)}). Migliora il positioning.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Tab */}
              {activeTab === 'charts' && (
                <div className="space-y-6">
                  {/* Radar Chart */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Profilo Fight Contribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                <Radar name="Performance" dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              </RadarChart>
                  </ResponsiveContainer>
                </div>

                  {/* Damage Breakdown Chart */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Damage Breakdown per Partita</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={damageData}>
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
                <Bar dataKey="Hero Damage" fill="#EF4444" />
                <Bar dataKey="Tower Damage" fill="#F59E0B" />
                <Bar dataKey="Healing" fill="#10B981" />
              </BarChart>
                  </ResponsiveContainer>
                </div>

                  {/* KDA Trend */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">KDA Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kdaTrend}>
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
                <Line type="monotone" dataKey="KDA" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
              </LineChart>
                  </ResponsiveContainer>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!stats && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun dato disponibile per l'analisi fights & damage</p>
        </div>
      )}
    </div>
  )
}
