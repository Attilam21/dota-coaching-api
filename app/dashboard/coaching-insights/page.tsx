'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import PlayerHeader from '@/components/PlayerHeader'
import InsightBadge from '@/components/InsightBadge'
import InsightBulbs from '@/components/InsightBulbs'
import AISuggestionCard from '@/components/AISuggestionCard'
import { buildBulbInsights, buildAISuggestion } from '@/lib/insight-utils'
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Zap, AlertCircle, CheckCircle2, Trophy, XCircle, BarChart as BarChartIcon, Lightbulb, AlertTriangle } from 'lucide-react'

interface MetaComparison {
  role: string
  playerMetrics: {
    avgGPM: number
    avgXPM: number
    avgKDA: number
    winrate: number
    avgDeaths: number
    avgHeroDamage: number
    avgTowerDamage: number
    killParticipation: number
    avgLastHits: number
    avgDenies: number
    denyRate: number
    goldUtilization: number
    visionScore: number
  }
  comparisons: Record<string, {
    player: number
    meta: { p50: number; p75: number; p90: number }
    percentile: number
    gap: number
    gapPercent: number
  }>
  improvementAreas: Array<{
    metric: string
    gap: number
    gapPercent: number
    percentile: number
    player: number
    meta: number
  }>
  aiInsights: Array<{ metric: string; insight: string }>
  strategicInsight: string | null
}

interface PlayerProfile {
  role: string
  roleConfidence: string
  playstyle: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  metrics: {
    avgGPM: string
    avgXPM: string
    avgKDA: string
    winrate: string
    avgDeaths: string
    killParticipation: string
  }
  fzthScore?: number
  trends?: {
    gpm: { value: number; direction: string; label: string }
    xpm?: { value: number; direction: string; label: string }
    kda: { value: number; direction: string; label: string }
    winrate: { value: number; direction: string; label: string }
  }
  avatar?: string
  personaname?: string
  rankTier?: number
  rankMedalUrl?: string
  soloMMR?: number | string | null
}

type TabType = 'overview' | 'meta' | 'win-conditions' | 'recommendations'

export default function CoachingInsightsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [metaData, setMetaData] = useState<MetaComparison | null>(null)
  const [winConditions, setWinConditions] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingWinConditions, setLoadingWinConditions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchProfile = useCallback(async () => {
    if (!playerId) return

    try {
      setLoadingProfile(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/profile`)
      if (!response.ok) throw new Error('Failed to fetch player profile')

      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoadingProfile(false)
    }
  }, [playerId])

  const fetchMetaComparison = useCallback(async () => {
    if (!playerId) return

    try {
      setLoadingMeta(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/meta-comparison`)
      if (!response.ok) throw new Error('Failed to fetch meta comparison data')

      const data = await response.json()
      setMetaData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meta comparison data')
    } finally {
      setLoadingMeta(false)
    }
  }, [playerId])

  const fetchWinConditions = useCallback(async () => {
    if (!playerId) return

    try {
      setLoadingWinConditions(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/win-conditions`)
      if (!response.ok) throw new Error('Failed to fetch win conditions data')

      const data = await response.json()
      setWinConditions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load win conditions data')
    } finally {
      setLoadingWinConditions(false)
    }
  }, [playerId])

  const fetchPlayerStats = useCallback(async () => {
    if (!playerId) return

    try {
      const response = await fetch(`/api/player/${playerId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setPlayerStats(data.stats)
      }
    } catch (err) {
      // Silently fail - stats are optional for insights
      console.warn('Failed to fetch player stats for insights:', err)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchProfile()
      fetchPlayerStats() // Always fetch stats for insights
      if (activeTab === 'meta') {
        fetchMetaComparison()
      }
      if (activeTab === 'win-conditions') {
        fetchWinConditions()
      }
    }
  }, [playerId, fetchProfile, fetchPlayerStats, activeTab])

  useEffect(() => {
    if (playerId && activeTab === 'meta' && !metaData && !loadingMeta) {
      fetchMetaComparison()
    }
  }, [playerId, activeTab, metaData, loadingMeta, fetchMetaComparison])

  useEffect(() => {
    if (playerId && activeTab === 'win-conditions' && !winConditions && !loadingWinConditions) {
      fetchWinConditions()
    }
  }, [playerId, activeTab, winConditions, loadingWinConditions, fetchWinConditions])

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      gpm: 'GPM',
      xpm: 'XPM',
      kda: 'KDA',
      winrate: 'Winrate',
      heroDamage: 'Hero Damage',
      hero_damage: 'Hero Damage',
      towerDamage: 'Tower Damage',
      tower_damage: 'Tower Damage',
      lastHits: 'Last Hits',
      last_hits: 'Last Hits',
      deaths: 'Morti',
      teamfightParticipation: 'Teamfight Part.',
      teamfight_participation: 'Teamfight Part.',
    }
    return labels[metric] || metric
  }

  const getMetricIcon = (metric: string) => {
    const icons: Record<string, React.ReactNode> = {
      gpm: <Zap className="w-5 h-5" />,
      xpm: <TrendingUp className="w-5 h-5" />,
      kda: <Target className="w-5 h-5" />,
      winrate: <CheckCircle2 className="w-5 h-5" />,
      heroDamage: <BarChart3 className="w-5 h-5" />,
      towerDamage: <BarChart3 className="w-5 h-5" />,
      lastHits: <BarChart3 className="w-5 h-5" />,
    }
    return icons[metric] || <BarChart3 className="w-5 h-5" />
  }

  const formatValue = (metric: string, value: number | null | undefined) => {
    if (value == null || isNaN(value)) {
      return 'N/A'
    }
    if (metric === 'winrate' || metric === 'killParticipation' || metric === 'denyRate' || metric === 'goldUtilization' || metric === 'visionScore' || metric === 'teamfightParticipation' || metric === 'teamfight_participation') {
      return `${value.toFixed(1)}%`
    }
    if (metric === 'kda') {
      return value.toFixed(2)
    }
    if (metric === 'gpm' || metric === 'xpm') {
      return Math.round(value).toLocaleString()
    }
    if (metric === 'heroDamage' || metric === 'hero_damage' || metric === 'towerDamage' || metric === 'tower_damage') {
      return Math.round(value).toLocaleString()
    }
    return Math.round(value).toLocaleString()
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-400'
    if (percentile >= 75) return 'text-blue-400'
    if (percentile >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getGapColor = (gapPercent: number) => {
    if (gapPercent >= 10) return 'text-green-400'
    if (gapPercent >= 0) return 'text-yellow-400'
    if (gapPercent >= -10) return 'text-orange-400'
    return 'text-red-400'
  }

  const getTrendIcon = (gapPercent: number) => {
    if (gapPercent > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (gapPercent < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

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
        pageTitle="Coaching & Insights"
        title="Inserisci Player ID"
        description="Analisi completa del tuo profilo con confronto meta, pattern di vittoria e raccomandazioni personalizzate basate su AI avanzata."
      />
    )
  }

  const isLoading = loadingProfile || (activeTab === 'meta' && loadingMeta) || (activeTab === 'win-conditions' && loadingWinConditions)

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Coaching & Insights</h1>
        <p className="text-gray-400">
          Analisi completa del tuo profilo con confronto meta, pattern di vittoria e raccomandazioni personalizzate
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {profile && (
        <div className="mb-6">
          <PlayerHeader
            playerId={playerId || undefined}
            avatarUrl={profile.avatar}
            playerName={profile.personaname}
            rankTier={profile.rankTier}
            rankMedalUrl={profile.rankMedalUrl}
            soloMMR={profile.soloMMR}
            winrate={profile.metrics?.winrate ? parseFloat(profile.metrics.winrate) : undefined}
            showSettingsLink={true}
          />
        </div>
      )}

      {profile && profile.fzthScore !== undefined && (
        <div className="mb-6 bg-gradient-to-r from-red-900/80 to-blue-900/80 border-2 border-red-600 rounded-lg p-6 backdrop-blur-sm relative">
          <InsightBadge
            elementType="fzth-score"
            elementId="fzth-score"
            contextData={{ score: profile.fzthScore, role: profile.role }}
            playerId={playerId || ''}
            position="top-right"
          />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">AttilaLAB Score</h2>
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

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento dati...</p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'meta' as TabType, name: 'Confronto Meta', icon: BarChart3 },
                { id: 'win-conditions' as TabType, name: 'Win Conditions', icon: Trophy },
                { id: 'recommendations' as TabType, name: 'Raccomandazioni', icon: Lightbulb },
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
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && profile && (
                <div className="space-y-6">
                  {/* Profile Overview */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 relative">
                      <InsightBadge
                        elementType="role"
                        elementId="role"
                        contextData={{ role: profile.role, confidence: profile.roleConfidence }}
                        playerId={playerId || ''}
                        position="top-right"
                      />
                      <h2 className="text-xl font-semibold mb-3 pr-8">Ruolo Principale</h2>
                      <p className="text-2xl font-bold text-red-400 mb-2">{profile.role}</p>
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
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 relative">
                      <InsightBadge
                        elementType="playstyle"
                        elementId="playstyle"
                        contextData={{ playstyle: profile.playstyle }}
                        playerId={playerId || ''}
                        position="top-right"
                      />
                      <h2 className="text-xl font-semibold mb-3 pr-8">Stile di Gioco</h2>
                      <p className="text-2xl font-bold text-blue-400">{profile.playstyle}</p>
                    </div>
                  </div>

                  {/* Trends */}
                  {profile.trends && (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Trend Performance
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
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
                            {profile.trends.gpm.value > 0 ? '+' : ''}{profile.trends.gpm.value.toFixed(0)} vs media 5 partite precedenti
                          </p>
                        </div>
                        {profile.trends.xpm && (
                          <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
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
                              {profile.trends.xpm.value > 0 ? '+' : ''}{profile.trends.xpm.value.toFixed(0)} vs media 5 partite precedenti
                            </p>
                          </div>
                        )}
                        <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
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
                            {profile.trends.kda.value > 0 ? '+' : ''}{profile.trends.kda.value.toFixed(2)} vs media 5 partite precedenti
                          </p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors relative">
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
                            {profile.trends.winrate.value > 0 ? '+' : ''}{profile.trends.winrate.value.toFixed(1)}% vs media 5 partite precedenti
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Metrics */}
                  {profile.metrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">GPM Medio</p>
                        <p className="text-2xl font-bold text-yellow-400">{profile.metrics.avgGPM}</p>
                      </div>
                      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">XPM Medio</p>
                        <p className="text-2xl font-bold text-orange-400">{profile.metrics.avgXPM}</p>
                      </div>
                      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">KDA Medio</p>
                        <p className="text-2xl font-bold text-purple-400">{profile.metrics.avgKDA}</p>
                      </div>
                      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Winrate</p>
                        <p className="text-2xl font-bold text-green-400">{profile.metrics.winrate}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Meta Comparison Tab */}
              {activeTab === 'meta' && (
                <div className="space-y-6">
                  {metaData ? (
                    <>
                      {/* Insight Bulbs - Deterministic insights */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-300">Insight Deterministici</h3>
                        <InsightBulbs
                          insights={buildBulbInsights(playerStats, metaData)}
                          isLoading={loadingMeta || !playerStats}
                        />
                      </div>

                      {/* AI Suggestion - Structured recommendation */}
                      <AISuggestionCard
                        suggestion={buildAISuggestion(playerStats, metaData)}
                        isLoading={loadingMeta || !playerStats}
                      />

                      {/* Strategic Insight - Keep existing but make it optional */}
                      {metaData.strategicInsight && (
                        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Target className="w-6 h-6 text-blue-400" />
                            <h2 className="text-2xl font-semibold text-blue-200">Raccomandazione Strategica</h2>
                          </div>
                          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{metaData.strategicInsight}</p>
                        </div>
                      )}

                      {/* Role Badge */}
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">Ruolo Analizzato:</span>
                          <span className="px-3 py-1 bg-red-600/20 border border-red-600 rounded-full text-red-400 font-semibold">
                            {metaData.role}
                          </span>
                        </div>
                      </div>

                      {/* Key Metrics Comparison */}
                      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                          <BarChart3 className="w-6 h-6" />
                          Confronto Performance vs Meta
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(metaData.comparisons).map(([metric, comp]) => (
                            <div
                              key={metric}
                              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {getMetricIcon(metric)}
                                  <span className="font-semibold text-gray-300">{getMetricLabel(metric)}</span>
                                </div>
                                {getTrendIcon(comp.gapPercent)}
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-baseline justify-between">
                                  <span className="text-xs text-gray-400">Tuo</span>
                                  <span className="text-lg font-bold text-white">{formatValue(metric, comp.player)}</span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                  <span className="text-xs text-gray-400">Meta (p50)</span>
                                  <span className="text-sm font-semibold text-gray-300">{formatValue(metric, comp.meta.p50)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                                  <span className="text-xs text-gray-400">Gap</span>
                                  <span className={`text-sm font-semibold ${getGapColor(comp.gapPercent)}`}>
                                    {comp.gapPercent != null ? (comp.gapPercent >= 0 ? '+' : '') + comp.gapPercent.toFixed(1) : '0.0'}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Percentile</span>
                                  <span className={`text-sm font-semibold ${getPercentileColor(comp.percentile)}`}>
                                    Top {100 - comp.percentile}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Insights for Improvement Areas */}
                      {metaData.aiInsights && metaData.aiInsights.length > 0 && (
                        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <AlertCircle className="w-6 h-6 text-orange-400" />
                            <h2 className="text-2xl font-semibold">Aree di Miglioramento Prioritario</h2>
                          </div>
                          <div className="space-y-4">
                            {metaData.aiInsights.map((insight, idx) => (
                              <div
                                key={idx}
                                className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-700/50 rounded-lg p-5"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  {getMetricIcon(insight.metric)}
                                  <h3 className="text-lg font-semibold text-orange-300">
                                    {getMetricLabel(insight.metric)}
                                  </h3>
                                  <span className="text-xs px-2 py-1 bg-orange-600/20 border border-orange-600 rounded text-orange-400">
                                    Priorità {idx + 1}
                                  </span>
                                </div>
                                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{insight.insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">Caricamento dati confronto meta...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Win Conditions Tab */}
              {activeTab === 'win-conditions' && (
                <div className="space-y-6">
                  {winConditions && !loadingWinConditions ? (
                    <>
                      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <Trophy className="w-6 h-6 text-green-400" />
                          <h2 className="text-2xl font-semibold">Analisi Pattern di Vittoria</h2>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-green-700/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-5 h-5 text-green-400" />
                              <span className="text-sm text-gray-400">Vittorie</span>
                            </div>
                            <p className="text-2xl font-bold text-green-400">{winConditions.summary.wins}</p>
                            <p className="text-xs text-gray-500 mt-1">Winrate: {winConditions.summary.winrate ? winConditions.summary.winrate.toFixed(1) : '0.0'}%</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-red-700/30">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-5 h-5 text-red-400" />
                              <span className="text-sm text-gray-400">Sconfitte</span>
                            </div>
                            <p className="text-2xl font-bold text-red-400">{winConditions.summary.losses}</p>
                            <p className="text-xs text-gray-500 mt-1">Totale: {winConditions.summary.totalMatches} partite</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-700/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-blue-400" />
                              <span className="text-sm text-gray-400">Replicabilità</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-400">{winConditions.winConditionScore?.overallScore ? winConditions.winConditionScore.overallScore.toFixed(0) : '0'}%</p>
                            <p className="text-xs text-gray-500 mt-1">Quanto replichi i pattern vincenti</p>
                          </div>
                        </div>

                        {/* Key Differentiators */}
                        {winConditions.keyDifferentiators && winConditions.keyDifferentiators.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 text-green-300">Cosa Fai di Diverso Quando Vinci</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {winConditions.keyDifferentiators.map((diff: any, idx: number) => (
                                <div key={idx} className="bg-gray-800/70 rounded-lg p-4 border border-green-600/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-300">{getMetricLabel(diff.metric)}</span>
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">Vittorie:</span>
                                      <span className="text-green-400 font-semibold">{formatValue(diff.metric, diff.winValue)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">Sconfitte:</span>
                                      <span className="text-red-400 font-semibold">{formatValue(diff.metric, diff.lossValue)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
                                      <span className="text-xs text-gray-400">Differenza</span>
                                      <span className="text-sm font-bold text-green-400">
                                        {diff.differencePercent != null ? (diff.differencePercent > 0 ? '+' : '') + diff.differencePercent.toFixed(1) : '0.0'}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Insight */}
                        {winConditions.aiInsight && (
                          <div className="bg-gray-800/70 rounded-lg p-5 border border-green-600/30">
                            <div className="flex items-center gap-2 mb-3">
                              <Zap className="w-5 h-5 text-yellow-400" />
                              <h3 className="text-lg font-semibold text-yellow-300">Insight AI: Pattern di Vittoria</h3>
                            </div>
                            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{winConditions.aiInsight}</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : loadingWinConditions ? (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-4 text-gray-400">Analisi pattern di vittoria in corso...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                      <div className="text-center py-8">
                        <p className="text-gray-400">Carica i dati per visualizzare l'analisi Win Conditions</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && profile && (
                <div className="space-y-6">
                  {/* Strengths */}
                  {profile.strengths && profile.strengths.length > 0 && (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-green-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                        <h2 className="text-2xl font-semibold">Punti di Forza</h2>
                      </div>
                      <div className="space-y-3">
                        {profile.strengths.map((strength, idx) => (
                          <div key={idx} className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                            <p className="text-gray-200 leading-relaxed">{strength}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {profile.weaknesses && profile.weaknesses.length > 0 && (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-orange-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        <h2 className="text-2xl font-semibold">Aree di Miglioramento</h2>
                      </div>
                      <div className="space-y-3">
                        {profile.weaknesses.map((weakness, idx) => (
                          <div key={idx} className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                            <p className="text-gray-200 leading-relaxed">{weakness}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {profile.recommendations && profile.recommendations.length > 0 && (
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-blue-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-6 h-6 text-blue-400" />
                        <h2 className="text-2xl font-semibold">Raccomandazioni Personalizzate</h2>
                      </div>
                      <div className="space-y-3">
                        {profile.recommendations.map((recommendation, idx) => (
                          <div key={idx} className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/30 border border-blue-600 flex items-center justify-center text-blue-400 font-semibold text-sm">
                                {idx + 1}
                              </span>
                              <p className="text-gray-200 leading-relaxed flex-1">{recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!profile.strengths || profile.strengths.length === 0) && 
                   (!profile.weaknesses || profile.weaknesses.length === 0) && 
                   (!profile.recommendations || profile.recommendations.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-400">Nessuna raccomandazione disponibile al momento</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
