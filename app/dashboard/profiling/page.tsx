'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'

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
    avgXPM: string
    avgKDA: string
    winrate: string
    avgDeaths: string
    killParticipation: string
    avgHeroDamage?: string
    avgTowerDamage?: string
    avgLastHits?: string
    avgDenies?: string
    avgNetWorth?: string
    visionScore?: string
    goldUtilization?: string
    denyRate?: string
    avgAssists?: string
    avgKills?: string
  }
  fzthScore?: number
  trends?: {
    gpm: { value: number; direction: string; label: string }
    xpm?: { value: number; direction: string; label: string }
    kda: { value: number; direction: string; label: string }
    winrate: { value: number; direction: string; label: string }
  }
  patterns?: string[]
  phaseAnalysis?: {
    early: { score: number; strength: string }
    mid: { score: number; strength: string }
    late: { score: number; strength: string }
  }
  trendData?: Array<{ match: string; gpm: number; xpm: number; kda: number; winrate: number }>
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
      <HelpButton />
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
    <div className="p-8 relative min-h-screen">
      <HelpButton />
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-20"
        style={{
          backgroundImage: "url('/profile-bg.jpg')",
          backgroundColor: '#0f172a' // fallback color
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-blue-900/65 to-slate-900/75 -z-10"></div>
      
      <div className="relative z-10">
        <h1 className="text-3xl font-bold mb-2">Profilazione FZTH</h1>
        <p className="text-gray-300 mb-6">Il tuo profilo di giocatore completo basato sulle performance reali</p>

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
          {/* FZTH Score Banner */}
          {profile.fzthScore !== undefined && (
            <div className="bg-gradient-to-r from-red-900/80 to-blue-900/80 border-2 border-red-600 rounded-lg p-6 backdrop-blur-sm relative">
              <InsightBadge
                elementType="fzth-score"
                elementId="fzth-score"
                contextData={{ score: profile.fzthScore, role: profile.role }}
                playerId={playerId || ''}
                position="top-right"
              />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-white">FZTH Score</h2>
                  <p className="text-4xl font-bold text-red-400">{profile.fzthScore}/100</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Score complessivo basato su Farm, Teamfight, Survival, Impact, Vision e Winrate
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-32 relative">
                    <svg className="transform -rotate-90" width="128" height="128">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - profile.fzthScore / 100)}`}
                        className={`${
                          profile.fzthScore >= 75 ? 'text-green-500' :
                          profile.fzthScore >= 50 ? 'text-yellow-500' :
                          'text-red-500'
                        } transition-all`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-3xl font-bold ${
                        profile.fzthScore >= 75 ? 'text-green-400' :
                        profile.fzthScore >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {profile.fzthScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6 relative">
              <InsightBadge
                elementType="role"
                elementId="role"
                contextData={{ role: profile.role, confidence: profile.roleConfidence }}
                playerId={playerId || ''}
                position="top-right"
              />
              <h2 className="text-xl font-semibold mb-4">Ruolo Principale</h2>
              <p className="text-3xl font-bold text-red-400 mb-2">{profile.role}</p>
              <p className="text-sm text-gray-300">
                Confidenza: <span className={`font-semibold ${
                  profile.roleConfidence === 'high' ? 'text-green-400' : 
                  profile.roleConfidence === 'medium' ? 'text-yellow-400' : 
                  'text-gray-400'
                }`}>
                  {profile.roleConfidence === 'high' ? 'Alta' : profile.roleConfidence === 'medium' ? 'Media' : 'Bassa'}
                </span>
              </p>
            </div>
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6 relative">
              <InsightBadge
                elementType="playstyle"
                elementId="playstyle"
                contextData={{ playstyle: profile.playstyle }}
                playerId={playerId || ''}
                position="top-right"
              />
              <h2 className="text-xl font-semibold mb-4">Stile di Gioco</h2>
              <p className="text-3xl font-bold text-blue-400">{profile.playstyle}</p>
            </div>
          </div>

          {/* Trends */}
          {profile.trends && (
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">📈 Trend Performance</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
                  <InsightBadge
                    elementType="trend-gpm"
                    elementId="trend-gpm"
                    contextData={profile.trends.gpm}
                    playerId={playerId || ''}
                    position="top-right"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">GPM Trend</span>
                    <span className={`text-lg font-bold ${
                      profile.trends.gpm.direction === 'up' ? 'text-green-400' :
                      profile.trends.gpm.direction === 'down' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {profile.trends.gpm.direction === 'up' ? '↑' : profile.trends.gpm.direction === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{profile.trends.gpm.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {profile.trends.gpm.value > 0 ? '+' : ''}{profile.trends.gpm.value.toFixed(0)} vs partite precedenti
                  </p>
                </div>
                {profile.trends.xpm && (
                  <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
                    <InsightBadge
                      elementType="trend-xpm"
                      elementId="trend-xpm"
                      contextData={profile.trends.xpm}
                      playerId={playerId || ''}
                      position="top-right"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">XPM Trend</span>
                      <span className={`text-lg font-bold ${
                        profile.trends.xpm.direction === 'up' ? 'text-green-400' :
                        profile.trends.xpm.direction === 'down' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {profile.trends.xpm.direction === 'up' ? '↑' : profile.trends.xpm.direction === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{profile.trends.xpm.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.trends.xpm.value > 0 ? '+' : ''}{profile.trends.xpm.value.toFixed(0)} vs partite precedenti
                    </p>
                  </div>
                )}
                <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
                  <InsightBadge
                    elementType="trend-kda"
                    elementId="trend-kda"
                    contextData={profile.trends.kda}
                    playerId={playerId || ''}
                    position="top-right"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">KDA Trend</span>
                    <span className={`text-lg font-bold ${
                      profile.trends.kda.direction === 'up' ? 'text-green-400' :
                      profile.trends.kda.direction === 'down' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {profile.trends.kda.direction === 'up' ? '↑' : profile.trends.kda.direction === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{profile.trends.kda.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {profile.trends.kda.value > 0 ? '+' : ''}{profile.trends.kda.value.toFixed(2)} vs partite precedenti
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
                  <InsightBadge
                    elementType="trend-winrate"
                    elementId="trend-winrate"
                    contextData={profile.trends.winrate}
                    playerId={playerId || ''}
                    position="top-right"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Winrate Trend</span>
                    <span className={`text-lg font-bold ${
                      profile.trends.winrate.direction === 'up' ? 'text-green-400' :
                      profile.trends.winrate.direction === 'down' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {profile.trends.winrate.direction === 'up' ? '↑' : profile.trends.winrate.direction === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{profile.trends.winrate.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {profile.trends.winrate.value > 0 ? '+' : ''}{profile.trends.winrate.value.toFixed(1)}% vs partite precedenti
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {profile.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-yellow-500 transition-colors">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">GPM Medio</p>
                <p className="text-3xl font-bold text-yellow-400">{profile.metrics.avgGPM}</p>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-orange-500 transition-colors">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">XPM Medio</p>
                <p className="text-3xl font-bold text-orange-400">{profile.metrics.avgXPM}</p>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-purple-500 transition-colors">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">KDA Medio</p>
                <p className="text-3xl font-bold text-purple-400">{profile.metrics.avgKDA}</p>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-green-500 transition-colors">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Winrate</p>
                <p className="text-3xl font-bold text-green-400">{profile.metrics.winrate}%</p>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-red-500 transition-colors">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Morte/Game</p>
                <p className="text-3xl font-bold text-red-400">{profile.metrics.avgDeaths}</p>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-blue-500 transition-colors">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Kill Part.</p>
                <p className="text-3xl font-bold text-blue-400">{profile.metrics.killParticipation}%</p>
              </div>
            </div>
          )}

          {/* Trend Chart */}
          {profile.trendData && profile.trendData.length > 0 && (
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6 relative">
              <InsightBadge
                elementType="trend-chart"
                elementId="trend-chart"
                contextData={{ trends: profile.trends, data: profile.trendData }}
                playerId={playerId || ''}
                position="top-right"
              />
              <h3 className="text-xl font-semibold mb-4">📊 Trend Performance (Ultime 10 Partite)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profile.trendData}>
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
                  <Line type="monotone" dataKey="gpm" stroke="#F59E0B" strokeWidth={2} name="GPM" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="xpm" stroke="#8B5CF6" strokeWidth={2} name="XPM" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="kda" stroke="#EF4444" strokeWidth={2} name="KDA" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Phase Analysis */}
          {profile.phaseAnalysis && (
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">⚔️ Performance per Fase di Gioco</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 relative">
                  <InsightBadge
                    elementType="phase-analysis"
                    elementId="phase-early"
                    contextData={{ phase: 'Early Game', score: profile.phaseAnalysis.early.score, strength: profile.phaseAnalysis.early.strength }}
                    playerId={playerId || ''}
                    position="top-right"
                  />
                  <h4 className="text-lg font-semibold text-green-400 mb-2">Early Game</h4>
                  <p className="text-sm text-gray-300 mb-2">Last Hits, Denies, First Blood</p>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${
                      profile.phaseAnalysis.early.strength === 'Forti' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {profile.phaseAnalysis.early.strength}
                    </span>
                    <span className="text-2xl font-bold">{Math.round(profile.phaseAnalysis.early.score / 2)}/100</span>
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 relative">
                  <InsightBadge
                    elementType="phase-analysis"
                    elementId="phase-mid"
                    contextData={{ phase: 'Mid Game', score: profile.phaseAnalysis.mid.score, strength: profile.phaseAnalysis.mid.strength }}
                    playerId={playerId || ''}
                    position="top-right"
                  />
                  <h4 className="text-lg font-semibold text-blue-400 mb-2">Mid Game</h4>
                  <p className="text-sm text-gray-300 mb-2">Teamfight, Farm, Obiettivi</p>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${
                      profile.phaseAnalysis.mid.strength === 'Forti' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {profile.phaseAnalysis.mid.strength}
                    </span>
                    <span className="text-2xl font-bold">{Math.round(profile.phaseAnalysis.mid.score / 2)}/100</span>
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 relative">
                  <InsightBadge
                    elementType="phase-analysis"
                    elementId="phase-late"
                    contextData={{ phase: 'Late Game', score: profile.phaseAnalysis.late.score, strength: profile.phaseAnalysis.late.strength }}
                    playerId={playerId || ''}
                    position="top-right"
                  />
                  <h4 className="text-lg font-semibold text-purple-400 mb-2">Late Game</h4>
                  <p className="text-sm text-gray-300 mb-2">Decisioni, Item, Chiusura</p>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${
                      profile.phaseAnalysis.late.strength === 'Forti' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {profile.phaseAnalysis.late.strength}
                    </span>
                    <span className="text-2xl font-bold">{Math.round(profile.phaseAnalysis.late.score / 2)}/100</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patterns */}
          {profile.patterns && profile.patterns.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-sm border border-blue-700 rounded-lg p-6 relative">
              <InsightBadge
                elementType="pattern"
                elementId="patterns"
                contextData={{ patterns: profile.patterns }}
                playerId={playerId || ''}
                position="top-right"
              />
              <h3 className="text-xl font-semibold mb-4 text-blue-300">🔍 Pattern di Gioco Identificati</h3>
              <div className="flex flex-wrap gap-2">
                {profile.patterns.map((pattern, idx) => (
                  <span key={idx} className="bg-gray-800/70 px-4 py-2 rounded-full text-sm text-blue-200 border border-blue-600">
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Metrics Grid */}
          {profile.metrics && (
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">📊 Metriche Avanzate</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {profile.metrics.avgHeroDamage && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-red-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Hero Damage</p>
                    <p className="text-xl font-bold text-red-400">{profile.metrics.avgHeroDamage}</p>
                  </div>
                )}
                {profile.metrics.avgTowerDamage && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-orange-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Tower Damage</p>
                    <p className="text-xl font-bold text-orange-400">{profile.metrics.avgTowerDamage}</p>
                  </div>
                )}
                {profile.metrics.avgLastHits && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-green-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Last Hits</p>
                    <p className="text-xl font-bold text-green-400">{profile.metrics.avgLastHits}</p>
                  </div>
                )}
                {profile.metrics.avgDenies && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-blue-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Denies</p>
                    <p className="text-xl font-bold text-blue-400">{profile.metrics.avgDenies}</p>
                  </div>
                )}
                {profile.metrics.avgNetWorth && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-yellow-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Net Worth</p>
                    <p className="text-xl font-bold text-yellow-400">{profile.metrics.avgNetWorth}</p>
                  </div>
                )}
                {profile.metrics.visionScore && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-purple-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Vision Score</p>
                    <p className="text-xl font-bold text-purple-400">{profile.metrics.visionScore}</p>
                  </div>
                )}
                {profile.metrics.goldUtilization && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-emerald-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Gold Util.</p>
                    <p className="text-xl font-bold text-emerald-400">{profile.metrics.goldUtilization}%</p>
                  </div>
                )}
                {profile.metrics.denyRate && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-cyan-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Deny Rate</p>
                    <p className="text-xl font-bold text-cyan-400">{profile.metrics.denyRate}%</p>
                  </div>
                )}
                {profile.metrics.avgAssists && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-pink-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Assist/Game</p>
                    <p className="text-xl font-bold text-pink-400">{profile.metrics.avgAssists}</p>
                  </div>
                )}
                {profile.metrics.avgKills && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-amber-700/30">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Kill/Game</p>
                    <p className="text-xl font-bold text-amber-400">{profile.metrics.avgKills}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparative Analysis */}
          {profile.metrics && profile.role && (
            <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-indigo-700 rounded-lg p-6 relative">
              <InsightBadge
                elementType="comparative-analysis"
                elementId="comparative-analysis"
                contextData={{ role: profile.role, metrics: profile.metrics }}
                playerId={playerId || ''}
                position="top-right"
              />
              <h3 className="text-xl font-semibold mb-4 text-indigo-300">📊 Analisi Comparativa - {profile.role}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-800/60 rounded-lg p-4 border border-indigo-600/30">
                  <p className="text-sm text-gray-300 mb-2">GPM vs Benchmark Ruolo</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-indigo-400">{profile.metrics.avgGPM}</span>
                    <span className="text-sm text-gray-400 mb-1">GPM</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {parseFloat(profile.metrics.avgGPM) > 550 ? 'Sopra la media' : 
                     parseFloat(profile.metrics.avgGPM) > 450 ? 'Nella media' : 'Sotto la media'}
                  </p>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-4 border border-indigo-600/30">
                  <p className="text-sm text-gray-300 mb-2">KDA vs Benchmark Ruolo</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-indigo-400">{profile.metrics.avgKDA}</span>
                    <span className="text-sm text-gray-400 mb-1">KDA</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {parseFloat(profile.metrics.avgKDA) > 2.5 ? 'Eccellente' : 
                     parseFloat(profile.metrics.avgKDA) > 2.0 ? 'Buono' : 'Da migliorare'}
                  </p>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-4 border border-indigo-600/30">
                  <p className="text-sm text-gray-300 mb-2">Winrate vs Benchmark</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-indigo-400">{profile.metrics.winrate}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {parseFloat(profile.metrics.winrate) > 55 ? 'Sopra la media (50%)' : 
                     parseFloat(profile.metrics.winrate) > 50 ? 'Nella media' : 'Sotto la media'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Efficiency & Impact Metrics */}
          {profile.metrics && (
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">⚡ Efficienza & Impatto</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-lg p-4 border border-emerald-700/50">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Gold Efficiency</p>
                  <p className="text-2xl font-bold text-emerald-400">{profile.metrics.goldUtilization || '0'}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {parseFloat(profile.metrics.goldUtilization || '0') > 90 ? 'Eccellente' : 
                     parseFloat(profile.metrics.goldUtilization || '0') > 80 ? 'Buono' : 'Da migliorare'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-lg p-4 border border-cyan-700/50">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Deny Rate</p>
                  <p className="text-2xl font-bold text-cyan-400">{profile.metrics.denyRate || '0'}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {parseFloat(profile.metrics.denyRate || '0') > 15 ? 'Ottimo' : 
                     parseFloat(profile.metrics.denyRate || '0') > 8 ? 'Buono' : 'Da migliorare'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg p-4 border border-blue-700/50">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Kill Part.</p>
                  <p className="text-2xl font-bold text-blue-400">{profile.metrics.killParticipation}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {parseFloat(profile.metrics.killParticipation) > 70 ? 'Alto' : 
                     parseFloat(profile.metrics.killParticipation) > 50 ? 'Medio' : 'Basso'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg p-4 border border-purple-700/50">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Vision Score</p>
                  <p className="text-2xl font-bold text-purple-400">{profile.metrics.visionScore || '0'}</p>
                  <p className="text-xs text-gray-500 mt-1">Controllo mappa</p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Insights */}
          {profile.phaseAnalysis && (
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🎯 Insights Performance per Fase</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-900/40 to-green-800/20 rounded-lg p-4 border border-green-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-green-400">Early Game</h4>
                    <span className="text-2xl font-bold text-green-300">
                      {Math.round(profile.phaseAnalysis.early.score / 2)}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Focus:</strong> Last Hits, Denies, First Blood Involvement
                  </p>
                  <p className="text-xs text-gray-400">
                    {profile.phaseAnalysis.early.strength === 'Forti' 
                      ? '✅ Ottime performance nella fase di laning. Mantieni questo livello di attenzione ai dettagli.'
                      : '⚠️ Concentrati sul miglioramento della fase di laning. Pratica il last hitting e controlla meglio la lane.'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 rounded-lg p-4 border border-blue-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-blue-400">Mid Game</h4>
                    <span className="text-2xl font-bold text-blue-300">
                      {Math.round(profile.phaseAnalysis.mid.score / 2)}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Focus:</strong> Teamfight Participation, Farm Continuity, Objective Control
                  </p>
                  <p className="text-xs text-gray-400">
                    {profile.phaseAnalysis.mid.strength === 'Forti'
                      ? '✅ Eccellente presenza nei teamfight e gestione del farm in mid game.'
                      : '⚠️ Aumenta la partecipazione ai teamfight e mantieni il farm anche durante le rotazioni.'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/20 rounded-lg p-4 border border-purple-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-purple-400">Late Game</h4>
                    <span className="text-2xl font-bold text-purple-300">
                      {Math.round(profile.phaseAnalysis.late.score / 2)}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Focus:</strong> Decision Making, Item Efficiency, Game Closing
                  </p>
                  <p className="text-xs text-gray-400">
                    {profile.phaseAnalysis.late.strength === 'Forti'
                      ? '✅ Ottime decisioni in late game e gestione efficiente delle risorse.'
                      : '⚠️ Migliora il decision making in late game e l\'utilizzo del gold per item critici.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            {profile.radarData && profile.radarData.length > 0 && (
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Profilo Multi-Dimensionale</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={profile.radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <Radar 
                      name="Profilo" 
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
              </div>
            )}

            {/* Performance Breakdown Bar Chart */}
            {profile.radarData && profile.radarData.length > 0 && (
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Breakdown Performance</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={profile.radarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="subject" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-green-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center gap-2">
                <span>✓</span> Punti di Forza
              </h3>
              <ul className="space-y-3">
                {profile.strengths.length > 0 ? (
                  profile.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-200 bg-green-900/20 p-3 rounded-lg">
                      <span className="text-green-400 text-xl mt-0.5">●</span>
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">Nessun punto di forza identificato</li>
                )}
              </ul>
            </div>

            <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-red-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-400 flex items-center gap-2">
                <span>⚠</span> Aree di Miglioramento
              </h3>
              <ul className="space-y-3">
                {profile.weaknesses.length > 0 ? (
                  profile.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-200 bg-red-900/20 p-3 rounded-lg">
                      <span className="text-red-400 text-xl mt-0.5">●</span>
                      <span>{weakness}</span>
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
            <div className="bg-gradient-to-r from-blue-900/80 to-indigo-900/80 backdrop-blur-sm border-2 border-blue-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-300 flex items-center gap-2">
                <span>💡</span> Raccomandazioni Personalizzate
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-gray-800/50 p-4 rounded-lg border border-blue-600/30">
                    <span className="text-blue-400 text-xl font-bold mt-0.5">{idx + 1}.</span>
                    <span className="text-gray-200">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
