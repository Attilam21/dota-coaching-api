'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'

interface PlayerProfile {
  role: string
  roleConfidence: string
  playstyle: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  radarData: Array<{ subject: string; value: number; fullMark: number }>
  metrics: {
    avgGPM: string
    avgKDA: string
    winrate: string
    avgDeaths: string
    killParticipation: string
  }
}

export default function ProfilingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchProfile = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/profile`)
      if (!response.ok) throw new Error('Failed to fetch player profile')

      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchProfile()
    }
  }, [playerId, fetchProfile])

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
        pageTitle="Profilazione FZTH"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per generare il tuo profilo di giocatore. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Profilazione FZTH</h1>
      <p className="text-gray-400 mb-6">Il tuo profilo di giocatore basato sulle tue performance reali</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Generazione profilo...</p>
        </div>
      )}

      {profile && !loading && (
        <div className="space-y-6">
          {/* Profile Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Ruolo Principale</h2>
              <p className="text-3xl font-bold text-red-400 mb-2">{profile.role}</p>
              <p className="text-sm text-gray-400">
                Confidenza: <span className={`font-semibold ${
                  profile.roleConfidence === 'high' ? 'text-green-400' : 
                  profile.roleConfidence === 'medium' ? 'text-yellow-400' : 
                  'text-gray-400'
                }`}>
                  {profile.roleConfidence === 'high' ? 'Alta' : profile.roleConfidence === 'medium' ? 'Media' : 'Bassa'}
                </span>
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Stile di Gioco</h2>
              <p className="text-3xl font-bold text-blue-400">{profile.playstyle}</p>
            </div>
          </div>

          {/* Key Metrics */}
          {profile.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">GPM Medio</p>
                <p className="text-xl font-bold text-yellow-400">{profile.metrics.avgGPM}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">KDA Medio</p>
                <p className="text-xl font-bold text-purple-400">{profile.metrics.avgKDA}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Winrate</p>
                <p className="text-xl font-bold text-green-400">{profile.metrics.winrate}%</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Morte/Game</p>
                <p className="text-xl font-bold text-red-400">{profile.metrics.avgDeaths}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Kill Part.</p>
                <p className="text-xl font-bold text-blue-400">{profile.metrics.killParticipation}%</p>
              </div>
            </div>
          )}

          {/* Radar Chart */}
          {profile.radarData && profile.radarData.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Profilo Completo</h2>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={profile.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                  <Radar name="Profilo" dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-green-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-400">Punti di Forza</h3>
              <ul className="space-y-2">
                {profile.strengths.length > 0 ? (
                  profile.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-400">✓</span>
                      {strength}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">Nessun punto di forza identificato</li>
                )}
              </ul>
            </div>

            <div className="bg-gray-800 border border-red-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-400">Aree di Miglioramento</h3>
              <ul className="space-y-2">
                {profile.weaknesses.length > 0 ? (
                  profile.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-300">
                      <span className="text-red-400">✗</span>
                      {weakness}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">Nessuna area di miglioramento identificata</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {profile.recommendations && profile.recommendations.length > 0 && (
            <div className="bg-gray-800 border border-blue-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Raccomandazioni Personalizzate</h3>
              <ul className="space-y-2">
                {profile.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300">
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
