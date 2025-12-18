'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'
import { AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react'

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
    buybackEfficiency: string
    buybackUsageRate: number
    farmEfficiency: number
    phaseAnalysis: {
      early: { matches: number; winrate: string; avgDuration: number }
      mid: { matches: number; winrate: string; avgDuration: number }
      late: { matches: number; winrate: string; avgDuration: number }
    }
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


  return (
    <div className="p-4 md:p-6">
      <HelpButton />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              <h3 className="text-sm text-gray-400 mb-2">Buyback Efficiency</h3>
              <p className="text-3xl font-bold text-purple-400">{stats.farm.buybackEfficiency}%</p>
              <p className="text-xs text-gray-500 mt-2">Winrate con buyback</p>
            </div>
          </div>
          
          {/* Phase Analysis */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Analisi per Fase di Gioco</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm text-gray-400 mb-2">Early Game (0-15min)</h3>
                <p className="text-2xl font-bold text-green-400">{stats.farm.phaseAnalysis.early.winrate}%</p>
                <p className="text-xs text-gray-500 mt-1">{stats.farm.phaseAnalysis.early.matches} partite</p>
                <p className="text-xs text-gray-500">Durata media: {Math.round(stats.farm.phaseAnalysis.early.avgDuration / 60)}min</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm text-gray-400 mb-2">Mid Game (15-30min)</h3>
                <p className="text-2xl font-bold text-blue-400">{stats.farm.phaseAnalysis.mid.winrate}%</p>
                <p className="text-xs text-gray-500 mt-1">{stats.farm.phaseAnalysis.mid.matches} partite</p>
                <p className="text-xs text-gray-500">Durata media: {Math.round(stats.farm.phaseAnalysis.mid.avgDuration / 60)}min</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm text-gray-400 mb-2">Late Game (30+min)</h3>
                <p className="text-2xl font-bold text-purple-400">{stats.farm.phaseAnalysis.late.winrate}%</p>
                <p className="text-xs text-gray-500 mt-1">{stats.farm.phaseAnalysis.late.matches} partite</p>
                <p className="text-xs text-gray-500">Durata media: {Math.round(stats.farm.phaseAnalysis.late.avgDuration / 60)}min</p>
              </div>
            </div>
          </div>

          {/* GPM/XPM Trend Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Trend GPM & XPM</h2>
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
            <h2 className="text-2xl font-semibold mb-4">Net Worth per Partita</h2>
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

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-2xl font-semibold mb-4">Statistiche Farm & Economy</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">GPM Medio</span>
                  <span className="font-bold text-yellow-400">{stats.farm.avgGPM.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">XPM Medio</span>
                  <span className="font-bold text-blue-400">{stats.farm.avgXPM.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Net Worth Medio</span>
                  <span className="font-bold">{Math.round(stats.farm.avgNetWorth).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gold Utilization</span>
                  <span className="font-bold text-green-400">{stats.farm.goldUtilization.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Buyback Medio</span>
                  <span className="font-bold">{stats.farm.avgBuybacks.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Buyback Usage</span>
                  <span className="font-bold">{stats.farm.buybackUsageRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Buyback Efficiency</span>
                  <span className="font-bold text-purple-400">{stats.farm.buybackEfficiency}%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-2xl font-semibold mb-4">Insights</h3>
              <div className="space-y-2 text-sm">
                {stats.farm.goldUtilization < 80 && (
                  <p className="text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Gold Utilization bassa ({stats.farm.goldUtilization.toFixed(1)}%). Prova a spendere più gold in item utili.
                  </p>
                )}
                {stats.farm.avgGPM < 400 && (
                  <p className="text-orange-400 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    GPM sotto la media. Concentrati sul farm più efficiente, ottimizza i percorsi di farm e valuta meglio i timing degli item.
                  </p>
                )}
                {stats.farm.avgBuybacks > 1 && (
                  <p className="text-purple-400 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Buyback frequenti ({stats.farm.avgBuybacks.toFixed(1)}/game). Valuta meglio quando è utile comprare.
                  </p>
                )}
                {parseFloat(stats.farm.buybackEfficiency) < 50 && stats.farm.buybackUsageRate > 30 && (
                  <p className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Buyback efficiency bassa ({stats.farm.buybackEfficiency}%). I tuoi buyback spesso non portano a vittoria. Usali solo in situazioni critiche.
                  </p>
                )}
                {parseFloat(stats.farm.buybackEfficiency) > 70 && (
                  <p className="text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Ottima buyback efficiency ({stats.farm.buybackEfficiency}%). Stai usando i buyback efficacemente.
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
