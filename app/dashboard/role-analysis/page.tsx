'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'

interface RolePerformance {
  games: number
  wins: number
  winrate: number
  avgGPM: number
  avgKDA: number
  avgDeaths: number
  avgObserverPlaced: number
  heroes: Array<{
    hero_id: number
    hero_name: string
    games: number
    winrate: number
  }>
}

interface RoleAnalysis {
  roles: Record<string, RolePerformance>
  preferredRole: {
    role: string
    games: number
    winrate: number
    confidence: string
  } | null
  recommendations: string[]
  summary: {
    totalRolesPlayed: number
    mostPlayedRole: string
    bestRole: string
  }
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B']

export default function RoleAnalysisPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [analysis, setAnalysis] = useState<RoleAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchAnalysis = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/role-analysis`)
      if (!response.ok) throw new Error('Failed to fetch role analysis')

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role analysis')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchAnalysis()
    }
  }, [playerId, fetchAnalysis])

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
        pageTitle="Analisi Ruolo"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare l'analisi delle tue performance per ruolo. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  // Prepare chart data
  const roleWinrateData = analysis?.roles ? Object.entries(analysis.roles)
    .filter(([_, perf]) => perf.games > 0)
    .map(([role, perf]) => ({
      role,
      winrate: perf.winrate,
      games: perf.games,
    })) : []

  const roleGamesData = roleWinrateData.map(r => ({
    name: r.role,
    value: r.games,
  }))

  return (
    <div className="p-8">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-4">Analisi Ruolo</h1>
      <p className="text-gray-400 mb-6">Analisi delle tue performance per ruolo di gioco</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento analisi ruoli...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Preferred Role */}
          {analysis.preferredRole && (
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-red-600 rounded-lg p-6 relative">
              {playerId && (
                <InsightBadge
                  elementType="role"
                  elementId="role-analysis-preferred"
                  contextData={{ role: analysis.preferredRole.role, confidence: analysis.preferredRole.confidence }}
                  playerId={playerId}
                  position="top-right"
                />
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Ruolo Preferito</h2>
                  <p className="text-3xl font-bold text-red-400">{analysis.preferredRole.role}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {analysis.preferredRole.games} partite • Winrate: {analysis.preferredRole.winrate.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    analysis.preferredRole.confidence === 'high' ? 'bg-green-600' :
                    analysis.preferredRole.confidence === 'medium' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  }`}>
                    Confidenza: {analysis.preferredRole.confidence === 'high' ? 'Alta' :
                                analysis.preferredRole.confidence === 'medium' ? 'Media' : 'Bassa'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Ruoli Giocati</h3>
              <p className="text-3xl font-bold">{analysis.summary.totalRolesPlayed}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Ruolo Più Giocato</h3>
              <p className="text-2xl font-bold text-blue-400">{analysis.summary.mostPlayedRole}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">Ruolo Migliore</h3>
              <p className="text-2xl font-bold text-green-400">{analysis.summary.bestRole}</p>
            </div>
          </div>

          {/* Role Performance Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Winrate per Ruolo</h2>
              {roleWinrateData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roleWinrateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="role" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="winrate" fill="#EF4444" name="Winrate %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-12">Nessun dato disponibile</p>
              )}
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Distribuzione Partite per Ruolo</h2>
              {roleGamesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleGamesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleGamesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-12">Nessun dato disponibile</p>
              )}
            </div>
          </div>

          {/* Role Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(analysis.roles)
              .filter(([_, perf]) => perf.games > 0)
              .map(([role, perf]) => (
                <div key={role} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">{role}</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Partite</span>
                      <span className="font-bold">{perf.games}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Winrate</span>
                      <span className={`font-bold ${perf.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {perf.winrate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPM Medio</span>
                      <span className="font-bold">{perf.avgGPM.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">KDA Medio</span>
                      <span className="font-bold">{perf.avgKDA.toFixed(2)}</span>
                    </div>
                    {role === 'Support' && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wards/Game</span>
                        <span className="font-bold">{perf.avgObserverPlaced.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {perf.heroes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Heroes più Giocati</h4>
                      <div className="space-y-2">
                        {perf.heroes.map((hero) => (
                          <div key={hero.hero_id} className="flex justify-between text-sm">
                            <span className="text-gray-300">{hero.hero_name}</span>
                            <div className="flex gap-2">
                              <span className="text-gray-400">{hero.games}p</span>
                              <span className={`font-semibold ${hero.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                {hero.winrate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-200">💡 Raccomandazioni</h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-blue-300">
                    <span className="text-blue-400 mt-1">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

