'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'

interface PlayerProfile {
  role: string
  playstyle: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
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

  useEffect(() => {
    if (playerId) {
      fetchProfile()
    }
  }, [playerId])

  const fetchProfile = async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch player stats')

      const data = await response.json()
      if (!data.stats) throw new Error('No stats available')

      // Generate profile based on stats
      const matches = data.stats.matches || []
      const avgGPM = matches.reduce((acc: number, m: { gpm: number }) => acc + m.gpm, 0) / matches.length || 0
      const avgKDA = matches.reduce((acc: number, m: { kda: number }) => acc + m.kda, 0) / matches.length || 0

      let role = 'Core'
      if (avgGPM > 550) role = 'Carry'
      else if (avgGPM < 400) role = 'Support'

      let playstyle = 'Bilanciato'
      if (avgKDA > 3) playstyle = 'Aggressivo'
      else if (avgKDA < 1.5) playstyle = 'Difensivo'

      const strengths: string[] = []
      const weaknesses: string[] = []
      const recommendations: string[] = []

      if (avgGPM > 500) {
        strengths.push('Buon farm rate')
      } else {
        weaknesses.push('Farm rate da migliorare')
        recommendations.push('Concentrati sul migliorare il farm rate')
      }

      if (avgKDA > 2) {
        strengths.push('Buona performance KDA')
      } else {
        weaknesses.push('KDA da migliorare')
        recommendations.push('Riduci le morti e aumenta kill/assist')
      }

      setProfile({
        role,
        playstyle,
        strengths,
        weaknesses,
        recommendations,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
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
        pageTitle="Profilazione FZTH"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per generare il tuo profilo di giocatore. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const radarData = profile
    ? [
        { subject: 'Farm', value: 70, fullMark: 100 },
        { subject: 'Teamfight', value: 65, fullMark: 100 },
        { subject: 'Positioning', value: 60, fullMark: 100 },
        { subject: 'Decision Making', value: 75, fullMark: 100 },
      ]
    : []

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Profilazione FZTH</h1>
      <p className="text-gray-400 mb-6">Il tuo profilo di giocatore basato sulle tue performance</p>

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
              <p className="text-3xl font-bold text-red-400">{profile.role}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Stile di Gioco</h2>
              <p className="text-3xl font-bold text-blue-400">{profile.playstyle}</p>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Profilo Completo</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Profilo" dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

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
          {profile.recommendations.length > 0 && (
            <div className="bg-gray-800 border border-blue-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Raccomandazioni</h3>
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
