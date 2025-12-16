'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (playerId) {
      fetchPerformance()
    }
  }, [playerId])

  const fetchPerformance = async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch player stats')

      const data = await response.json()
      if (!data.stats) throw new Error('No stats available')

      // Calculate performance metrics
      const matches = data.stats.matches || []
      const avgKDA = matches.reduce((acc: number, m: { kda: number }) => acc + m.kda, 0) / matches.length || 0
      const avgGPM = matches.reduce((acc: number, m: { gpm: number }) => acc + m.gpm, 0) / matches.length || 0
      const avgXPM = matches.reduce((acc: number, m: { xpm: number }) => acc + m.xpm, 0) / matches.length || 0
      
      // Determine playstyle
      let playstyle = 'Bilanciato'
      if (avgGPM > 600) playstyle = 'Aggressivo - Farm Focus'
      else if (avgGPM < 400) playstyle = 'Support - Team Focus'

      setStats({
        avgKDA: avgKDA || 0,
        avgGPM: avgGPM || 0,
        avgXPM: avgXPM || 0,
        avgDeaths: 5, // Placeholder
        avgAssists: 10, // Placeholder
        playstyle,
        farmEfficiency: Math.min((avgGPM / 600) * 100, 100),
        teamfightParticipation: 75, // Placeholder
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }

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
          {/* Performance Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">KDA Medio</h3>
              <p className="text-3xl font-bold">{stats.avgKDA.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">GPM Medio</h3>
              <p className="text-3xl font-bold">{stats.avgGPM.toFixed(0)}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">XPM Medio</h3>
              <p className="text-3xl font-bold">{stats.avgXPM.toFixed(0)}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Stile di Gioco</h3>
              <p className="text-lg font-semibold">{stats.playstyle}</p>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Profilo Performance</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Performance" dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
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
