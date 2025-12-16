'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

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
  const [playerId, setPlayerId] = useState<string>('')
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchPerformance = async () => {
    if (!playerId.trim()) return

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPerformance()
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

  const radarData = stats ? [
    { subject: 'KDA', value: Math.min(stats.avgKDA * 10, 100), fullMark: 100 },
    { subject: 'GPM', value: stats.farmEfficiency, fullMark: 100 },
    { subject: 'Teamfight', value: stats.teamfightParticipation, fullMark: 100 },
    { subject: 'Survival', value: Math.max(100 - stats.avgDeaths * 10, 0), fullMark: 100 },
  ] : []

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Performance & Stile di Gioco</h1>
      
      <div className="mb-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="Player Account ID"
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            {loading ? 'Caricamento...' : 'Analizza'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {stats && (
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

      {!stats && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Inserisci un Player ID per vedere le performance</p>
        </div>
      )}
    </div>
  )
}

