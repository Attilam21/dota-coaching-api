'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'

interface PerformanceStats {
  avgKDA: number
  avgGPM: number
  avgXPM: number
  avgDeaths: number
  avgAssists: number
  playstyle: string
  farmEfficiency: number
  teamfightParticipation: number
}

export default function PerformancePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchPerformance = useCallback(async () => {
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

      if (!statsData.stats) throw new Error('No stats available')

      // Calculate performance metrics from basic stats
      const matches = statsData.stats.matches || []
      const avgKDA = matches.reduce((acc: number, m: { kda: number }) => acc + m.kda, 0) / matches.length || 0
      const avgGPM = matches.reduce((acc: number, m: { gpm: number }) => acc + m.gpm, 0) / matches.length || 0
      const avgXPM = matches.reduce((acc: number, m: { xpm: number }) => acc + m.xpm, 0) / matches.length || 0
      
      // Use advanced stats if available
      const advanced = advancedData?.stats
      const avgDeaths = advanced?.fights?.avgDeaths || 5
      const avgAssists = advanced?.fights?.avgAssists || 10
      const killParticipation = advanced?.fights?.killParticipation || 0
      const goldUtilization = advanced?.farm?.goldUtilization || 0
      
      // Determine playstyle with advanced data
      let playstyle = 'Bilanciato'
      if (avgGPM > 600 && goldUtilization > 90) playstyle = 'Farm Focus - Late Game'
      else if (avgGPM > 550 && killParticipation > 70) playstyle = 'Aggressivo - Teamfight Focus'
      else if (avgGPM < 400 && advanced?.vision?.avgObserverPlaced > 5) playstyle = 'Support - Utility Focus'
      else if (killParticipation > 75) playstyle = 'Team Player - High Impact'
      else if (avgGPM > 600) playstyle = 'Farm Focus'
      else if (avgGPM < 400) playstyle = 'Support - Team Focus'

      setStats({
        avgKDA: avgKDA || 0,
        avgGPM: avgGPM || 0,
        avgXPM: avgXPM || 0,
        avgDeaths,
        avgAssists,
        playstyle,
        farmEfficiency: Math.min((avgGPM / 600) * 100, 100),
        teamfightParticipation: killParticipation,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchPerformance()
    }
  }, [playerId, fetchPerformance])

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
        pageTitle="Performance & Stile di Gioco"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le performance. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const radarData = stats ? [
    { subject: 'KDA', value: Math.min(stats.avgKDA * 10, 100), fullMark: 100 },
    { subject: 'GPM', value: stats.farmEfficiency, fullMark: 100 },
    { subject: 'Teamfight', value: stats.teamfightParticipation, fullMark: 100 },
    { subject: 'Survival', value: Math.max(100 - stats.avgDeaths * 10, 0), fullMark: 100 },
  ] : []

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Performance & Stile di Gioco</h1>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento performance...</p>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-6">
          {/* Playstyle Banner */}
          <div className="bg-gradient-to-r from-red-900/50 to-gray-800 border border-red-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Stile di Gioco Identificato</h2>
                <p className="text-3xl font-bold text-red-400">{stats.playstyle}</p>
                <p className="text-sm text-gray-400 mt-2">Basato sulle tue performance recenti</p>
              </div>
              <div className="text-6xl">🎯</div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-600 transition-colors">
              <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">KDA Medio</h3>
              <p className="text-3xl font-bold text-white mb-1">{stats.avgKDA.toFixed(2)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Kill Participation: {stats.teamfightParticipation.toFixed(0)}%</span>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-yellow-600 transition-colors">
              <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">GPM Medio</h3>
              <p className="text-3xl font-bold text-yellow-400 mb-1">{stats.avgGPM.toFixed(0)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Efficienza: {stats.farmEfficiency.toFixed(0)}%</span>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-600 transition-colors">
              <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">XPM Medio</h3>
              <p className="text-3xl font-bold text-blue-400 mb-1">{stats.avgXPM.toFixed(0)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Exp acquisita</span>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-600 transition-colors">
              <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Morti Medie</h3>
              <p className="text-3xl font-bold text-red-400 mb-1">{stats.avgDeaths.toFixed(1)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Assist: {stats.avgAssists.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Profilo Performance Multi-Dimensionale</h2>
              <span className="text-sm text-gray-400">Analisi su 20 partite recenti</span>
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                  <Radar 
                    name="Performance" 
                    dataKey="value" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Dati non disponibili
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Efficienza Farm</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Efficienza</span>
                  <span className="font-bold">{stats.farmEfficiency.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-red-600 h-4 rounded-full"
                    style={{ width: `${stats.farmEfficiency}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Partecipazione Teamfight</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Partecipazione</span>
                  <span className="font-bold">{stats.teamfightParticipation}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ width: `${stats.teamfightParticipation}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
