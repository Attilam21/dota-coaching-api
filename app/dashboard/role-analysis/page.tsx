'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import HeroCard from '@/components/HeroCard'
import Link from 'next/link'
import { Lightbulb, BarChart as BarChartIcon, Target, TrendingUp, CheckCircle, AlertCircle, ArrowRight, Users } from 'lucide-react'

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

interface RoleTrendData {
  role: string
  periods: Array<{
    period: string
    games: number
    wins: number
    winrate: number
    avgGPM: number
    avgKDA: number
  }>
}

type TabType = 'overview' | 'improvement' | 'trend'

export default function RoleAnalysisPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [analysis, setAnalysis] = useState<RoleAnalysis | null>(null)
  const [advancedStats, setAdvancedStats] = useState<any>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedRoleForTrend, setSelectedRoleForTrend] = useState<string | null>(null)
  const [trendData, setTrendData] = useState<RoleTrendData[]>([])
  const [trendLoading, setTrendLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Fetch heroes list
    let isMounted = true
    
    fetch('/api/opendota/heroes')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && isMounted && Array.isArray(data)) {
          const heroesMap: Record<number, { name: string; localized_name: string }> = {}
          data.forEach((hero: { id: number; name: string; localized_name: string }) => {
            // Only save heroes with valid name and localized_name
            if (hero.name && hero.localized_name) {
              heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
            }
          })
          setHeroes(heroesMap)
        }
      })
      .catch((error) => {
        console.error('Error loading heroes:', error)
      })
    
    return () => {
      isMounted = false
    }
  }, [])

  const fetchAnalysis = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const [roleResponse, advancedResponse] = await Promise.all([
        fetch(`/api/player/${playerId}/role-analysis`),
        fetch(`/api/player/${playerId}/advanced-stats`).catch(() => null)
      ])

      if (!roleResponse.ok) throw new Error('Failed to fetch role analysis')

      const roleData = await roleResponse.json()
      setAnalysis(roleData)

      if (advancedResponse?.ok) {
        const advancedData = await advancedResponse.json()
        setAdvancedStats(advancedData.stats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role analysis')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  const fetchTrendData = useCallback(async () => {
    if (!playerId || !selectedRoleForTrend) return

    try {
      setTrendLoading(true)
      // Fetch recent matches to calculate trend
      const response = await fetch(`https://api.opendota.com/api/players/${playerId}/matches?limit=100`, {
        next: { revalidate: 3600 }
      })
      if (!response.ok) return

      const matches = await response.json()
      if (!matches || matches.length === 0) return

      // Fetch heroes data to get role info
      const heroesResponse = await fetch('https://api.opendota.com/api/heroes', {
        next: { revalidate: 86400 }
      })
      const allHeroes = heroesResponse.ok ? await heroesResponse.json() : []
      const heroesMap: Record<number, string[]> = {}
      allHeroes.forEach((hero: any) => {
        heroesMap[hero.id] = hero.roles || []
      })

      // Fetch full match details for first 50 matches
      const matchesToFetch = matches.slice(0, 50)
      const fullMatchesPromises = matchesToFetch.map((m: any) =>
        fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
          next: { revalidate: 3600 }
        }).then(res => res.ok ? res.json() : null).catch(() => null)
      )
      const fullMatches = await Promise.all(fullMatchesPromises)

      // Group matches by period (last 10, 20, 30, 50 matches) for selected role
      const roleMatches = fullMatches
        .map((match: any, idx: number) => {
          if (!match?.players) return null
          const listMatch = matchesToFetch[idx]
          if (!listMatch) return null
          
          const player = match.players.find((p: any) => 
            p.player_slot === listMatch.player_slot
          )
          if (!player || !player.hero_id) return null

          const heroRoles = heroesMap[player.hero_id] || []
          if (!heroRoles.includes(selectedRoleForTrend)) return null

          const playerTeam = listMatch.player_slot < 128 ? 'radiant' : 'dire'
          const won = (playerTeam === 'radiant' && match.radiant_win) || (playerTeam === 'dire' && !match.radiant_win)
          const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : (player.kills + player.assists)
          const gpm = player.gold_per_min || 0

          return {
            match_id: match.match_id,
            start_time: match.start_time,
            won,
            kda,
            gpm,
            games: 1,
          }
        })
        .filter((m: any) => m !== null)
        .reverse() // Most recent first

      if (roleMatches.length === 0) return

      // Calculate periods
      const periods = [
        { name: 'Ultime 10', count: Math.min(10, roleMatches.length) },
        { name: 'Ultime 20', count: Math.min(20, roleMatches.length) },
        { name: 'Ultime 30', count: Math.min(30, roleMatches.length) },
        { name: 'Ultime 50', count: roleMatches.length },
      ]

      const trendPeriods = periods.map(period => {
        const periodMatches = roleMatches.slice(0, period.count)
        const wins = periodMatches.filter((m: any) => m.won).length
        const avgKDA = periodMatches.reduce((sum: number, m: any) => sum + m.kda, 0) / periodMatches.length
        const avgGPM = periodMatches.reduce((sum: number, m: any) => sum + m.gpm, 0) / periodMatches.length

        return {
          period: period.name,
          games: periodMatches.length,
          wins,
          winrate: (wins / periodMatches.length) * 100,
          avgKDA: parseFloat(avgKDA.toFixed(2)),
          avgGPM: Math.round(avgGPM),
        }
      })

      setTrendData([{
        role: selectedRoleForTrend,
        periods: trendPeriods,
      }])
    } catch (err) {
      console.error('Error fetching trend data:', err)
    } finally {
      setTrendLoading(false)
    }
  }, [playerId, selectedRoleForTrend])

  useEffect(() => {
    if (playerId) {
      fetchAnalysis()
    }
  }, [playerId, fetchAnalysis])

  useEffect(() => {
    if (selectedRoleForTrend) {
      fetchTrendData()
    }
  }, [selectedRoleForTrend, fetchTrendData])

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
        pageTitle="Analisi Ruolo"
        title="Inserisci Player ID"
        description="Analisi approfondita delle tue performance per ruolo. Scopri i tuoi punti di forza, come migliorare e monitora i tuoi progressi nel tempo."
      />
    )
  }

  // Calculate role strengths and weaknesses
  const getRoleStrengthsWeaknesses = (role: string, perf: RolePerformance) => {
    const strengths: string[] = []
    const weaknesses: string[] = []

    // Winrate analysis
    if (perf.winrate >= 55) {
      strengths.push(`Winrate eccellente (${perf.winrate.toFixed(1)}%)`)
    } else if (perf.winrate < 45) {
      weaknesses.push(`Winrate basso (${perf.winrate.toFixed(1)}%) - focus su decisioni di gioco`)
    }

    // GPM analysis (role-specific expectations)
    const roleGPMThresholds: Record<string, { good: number; bad: number }> = {
      Carry: { good: 500, bad: 400 },
      Mid: { good: 480, bad: 380 },
      Offlane: { good: 450, bad: 350 },
      Support: { good: 300, bad: 250 },
    }
    const threshold = roleGPMThresholds[role] || { good: 450, bad: 350 }
    if (perf.avgGPM >= threshold.good) {
      strengths.push(`Farm efficiente (${perf.avgGPM.toFixed(0)} GPM)`)
    } else if (perf.avgGPM < threshold.bad) {
      weaknesses.push(`Farm da migliorare (${perf.avgGPM.toFixed(0)} GPM) - focus su CS e farm patterns`)
    }

    // KDA analysis
    const roleKDAThresholds: Record<string, { good: number; bad: number }> = {
      Carry: { good: 2.5, bad: 1.8 },
      Mid: { good: 2.8, bad: 2.0 },
      Offlane: { good: 2.2, bad: 1.5 },
      Support: { good: 1.8, bad: 1.2 },
    }
    const kdaThreshold = roleKDAThresholds[role] || { good: 2.0, bad: 1.5 }
    if (perf.avgKDA >= kdaThreshold.good) {
      strengths.push(`KDA solido (${perf.avgKDA.toFixed(2)})`)
    } else if (perf.avgKDA < kdaThreshold.bad) {
      weaknesses.push(`KDA basso (${perf.avgKDA.toFixed(2)}) - focus su positioning e survival`)
    }

    // Deaths analysis
    if (perf.avgDeaths > 7 && role !== 'Offlane') {
      weaknesses.push(`Morti elevate (${perf.avgDeaths.toFixed(1)}/game) - focus su map awareness`)
    } else if (perf.avgDeaths <= 5 && role !== 'Offlane') {
      strengths.push(`Buona sopravvivenza (${perf.avgDeaths.toFixed(1)} morti/game)`)
    }

    // Support-specific
    if (role === 'Support' && perf.avgObserverPlaced >= 8) {
      strengths.push(`Warding eccellente (${perf.avgObserverPlaced.toFixed(1)} wards/game)`)
    } else if (role === 'Support' && perf.avgObserverPlaced < 6) {
      weaknesses.push(`Warding da migliorare (${perf.avgObserverPlaced.toFixed(1)} wards/game) - focus su vision control`)
    }

    // Hero pool analysis
    if (perf.heroes.length >= 4) {
      strengths.push(`Pool diversificato (${perf.heroes.length} heroes)`)
    } else if (perf.heroes.length < 3) {
      weaknesses.push(`Pool limitato (${perf.heroes.length} heroes) - considera di espandere`)
    }

    return { strengths, weaknesses }
  }

  // Get actionable recommendations for a role
  const getRoleRecommendations = (role: string, perf: RolePerformance, strengths: string[], weaknesses: string[]) => {
    const recommendations: string[] = []

    if (weaknesses.length === 0 && strengths.length >= 3) {
      recommendations.push(`Stai performando molto bene come ${role}. Continua così e considera di aiutare i tuoi compagni a migliorare.`)
      return recommendations
    }

    // Winrate recommendations
    if (perf.winrate < 45) {
      recommendations.push(`Il tuo winrate come ${role} è basso (${perf.winrate.toFixed(1)}%). Analizza le tue partite perse e identifica pattern comuni.`)
    }

    // Farm recommendations
    const roleGPMThresholds: Record<string, { good: number }> = {
      Carry: { good: 500 },
      Mid: { good: 480 },
      Offlane: { good: 450 },
      Support: { good: 300 },
    }
    const threshold = roleGPMThresholds[role] || { good: 450 }
    if (perf.avgGPM < threshold.good) {
      if (role === 'Carry' || role === 'Mid') {
        recommendations.push(`Focus su farm efficiency: pratica last-hitting, stacka campi, e ottimizza i tuoi farm patterns.`)
      } else if (role === 'Offlane') {
        recommendations.push(`Come Offlane, bilancia farm e space creation. Non sacrificare troppo farm per creare spazio.`)
      }
    }

    // KDA recommendations
    if (perf.avgKDA < 2.0 && role !== 'Support') {
      recommendations.push(`Migliora il tuo KDA: focus su positioning, evita morti inutili, e partecipa ai teamfight in modo più efficace.`)
    }

    // Deaths recommendations
    if (perf.avgDeaths > 7 && role !== 'Offlane') {
      recommendations.push(`Riduci le morti: migliora map awareness, posizionati meglio nei teamfight, e non overextend.`)
    }

    // Support-specific
    if (role === 'Support' && perf.avgObserverPlaced < 6) {
      recommendations.push(`Come Support, aumenta il warding: minimo 8-10 observer wards per partita. Focus su vision control.`)
    }

    // Hero pool recommendations
    if (perf.heroes.length < 3) {
      recommendations.push(`Espandi il tuo pool per ${role}: gioca almeno 3-4 heroes diversi per essere più versatile.`)
    }

    return recommendations
  }

  // Get role-specific key metrics
  const getRoleKeyMetrics = (role: string, perf: RolePerformance) => {
    const metrics: Array<{ label: string; value: string; description: string }> = []

    metrics.push({
      label: 'Winrate',
      value: `${perf.winrate.toFixed(1)}%`,
      description: `${perf.wins}W / ${perf.games - perf.wins}L`
    })

    metrics.push({
      label: 'GPM',
      value: `${perf.avgGPM.toFixed(0)}`,
      description: 'Gold per minuto'
    })

    metrics.push({
      label: 'KDA',
      value: `${perf.avgKDA.toFixed(2)}`,
      description: 'Kill/Death/Assist ratio'
    })

    if (role === 'Support') {
      metrics.push({
        label: 'Wards/Game',
        value: `${perf.avgObserverPlaced.toFixed(1)}`,
        description: 'Observer wards piazzati'
      })
    } else {
      metrics.push({
        label: 'Deaths/Game',
        value: `${perf.avgDeaths.toFixed(1)}`,
        description: 'Morti medie per partita'
      })
    }

    return metrics
  }

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
        ← Torna a Dashboard
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Analisi Ruolo</h1>
      <p className="text-gray-400 mb-6">Migliora le tue performance per ruolo con insights actionable e metriche specifiche</p>

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
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'improvement' as TabType, name: 'Miglioramento', icon: Target },
                { id: 'trend' as TabType, name: 'Trend', icon: TrendingUp },
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
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Ruoli Giocati</h3>
                      <p className="text-2xl font-bold text-white">{analysis.summary.totalRolesPlayed}</p>
                      <p className="text-xs text-gray-500 mt-1">Ruoli diversi</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Ruolo Più Giocato</h3>
                      <p className="text-lg font-bold text-blue-400 capitalize">{analysis.summary.mostPlayedRole}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analysis.roles[analysis.summary.mostPlayedRole]?.games || 0} partite
                      </p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Ruolo Migliore</h3>
                      <p className="text-lg font-bold text-green-400 capitalize">{analysis.summary.bestRole}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analysis.roles[analysis.summary.bestRole]?.winrate ? 
                          `${analysis.roles[analysis.summary.bestRole].winrate.toFixed(1)}% winrate` : 
                          'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Versatilità</h3>
                      <p className={`text-2xl font-bold ${
                        analysis.summary.totalRolesPlayed >= 3 ? 'text-green-400' :
                        analysis.summary.totalRolesPlayed >= 2 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {analysis.summary.totalRolesPlayed >= 3 ? 'Alta' :
                         analysis.summary.totalRolesPlayed >= 2 ? 'Media' : 'Bassa'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analysis.summary.totalRolesPlayed >= 3 ? 'Pool versatile' :
                         analysis.summary.totalRolesPlayed >= 2 ? 'Diversifica di più' : 'Focus su 1-2 ruoli'}
                      </p>
                    </div>
                  </div>

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
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h2 className="text-xl md:text-2xl font-semibold mb-2">Ruolo Preferito</h2>
                          <div className="flex items-center gap-4 flex-wrap">
                            <p className="text-3xl font-bold text-red-400 capitalize">{analysis.preferredRole.role}</p>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              analysis.preferredRole.confidence === 'high' ? 'bg-green-600' :
                              analysis.preferredRole.confidence === 'medium' ? 'bg-yellow-600' :
                              'bg-gray-600'
                            }`}>
                              Confidenza: {analysis.preferredRole.confidence === 'high' ? 'Alta' :
                                          analysis.preferredRole.confidence === 'medium' ? 'Media' : 'Bassa'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-2">
                            {analysis.preferredRole.games} partite • Winrate: {analysis.preferredRole.winrate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Role Performance Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Performance per Ruolo
                      </h3>
                      <span className="text-xs text-gray-500">Clicca su una card per vedere l'analisi dettagliata</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analysis.roles)
                        .filter(([_, perf]) => perf.games > 0)
                        .sort((a, b) => b[1].games - a[1].games)
                        .map(([role, perf]) => {
                          const { strengths, weaknesses } = getRoleStrengthsWeaknesses(role, perf)
                          const totalGames = Object.values(analysis.roles).reduce((sum, r) => sum + r.games, 0)
                          const percentage = ((perf.games / totalGames) * 100).toFixed(1)

                          return (
                            <div
                              key={role}
                              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500 hover:bg-gray-800 transition-all cursor-pointer group"
                              onClick={() => {
                                setSelectedRole(role)
                                setActiveTab('improvement')
                              }}
                              title="Clicca per vedere l'analisi dettagliata"
                            >
                              <div className="mb-3">
                                <span className="font-semibold text-white capitalize text-sm">{role}</span>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Partite</span>
                                  <span className="text-sm font-medium text-white">{perf.games} <span className="text-gray-500 text-xs">({percentage}%)</span></span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Winrate</span>
                                  <span className={`text-sm font-bold ${
                                    perf.winrate >= 55 ? 'text-green-400' :
                                    perf.winrate >= 50 ? 'text-blue-400' :
                                    'text-red-400'
                                  }`}>
                                    {perf.winrate.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">GPM</span>
                                  <span className="text-sm font-medium text-white">{perf.avgGPM.toFixed(0)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">KDA</span>
                                  <span className="text-sm font-medium text-white">{perf.avgKDA.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Quick insights */}
                              <div className="mt-3 pt-3 border-t border-gray-700">
                                {strengths.length > 0 && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                    <span className="text-xs text-green-400">{strengths.length} punti di forza</span>
                                  </div>
                                )}
                                {weaknesses.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                                    <span className="text-xs text-yellow-400">{weaknesses.length} da migliorare</span>
                                  </div>
                                )}
                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 group-hover:text-blue-400 transition-colors">
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Vedi dettagli</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Role Comparison & Insights */}
                  {Object.entries(analysis.roles).filter(([_, perf]) => perf.games > 0).length >= 2 && (() => {
                    const rolesWithGames = Object.entries(analysis.roles)
                      .filter(([_, perf]) => perf.games >= 5)
                      .sort((a, b) => b[1].winrate - a[1].winrate)
                    
                    if (rolesWithGames.length < 2) return null

                    const bestRole = rolesWithGames[0]
                    const worstRole = rolesWithGames[rolesWithGames.length - 1]
                    const winrateDiff = bestRole[1].winrate - worstRole[1].winrate

                    return (
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Confronto Ruoli
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                            <h4 className="text-sm text-gray-400 mb-2">Ruolo con Miglior Winrate</h4>
                            <p className="text-2xl font-bold text-green-400 capitalize">{bestRole[0]}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {bestRole[1].winrate.toFixed(1)}% su {bestRole[1].games} partite
                            </p>
                            {bestRole[1].heroes.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-green-700/50">
                                <p className="text-xs text-gray-400 mb-2">Top Heroes:</p>
                                <div className="flex gap-2 flex-wrap">
                                  {bestRole[1].heroes.slice(0, 3).map((hero) => (
                                    heroes[hero.hero_id] ? (
                                      <div key={hero.hero_id} className="flex items-center gap-1">
                                        <HeroCard
                                          heroId={hero.hero_id}
                                          heroName={heroes[hero.hero_id].name}
                                          size="sm"
                                        />
                                        <span className="text-xs text-gray-300">{hero.winrate.toFixed(0)}%</span>
                                      </div>
                                    ) : null
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {worstRole[0] !== bestRole[0] && (
                            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                              <h4 className="text-sm text-gray-400 mb-2">Ruolo da Migliorare</h4>
                              <p className="text-2xl font-bold text-yellow-400 capitalize">{worstRole[0]}</p>
                              <p className="text-sm text-gray-400 mt-1">
                                {worstRole[1].winrate.toFixed(1)}% su {worstRole[1].games} partite
                              </p>
                              {winrateDiff > 10 && (
                                <p className="text-xs text-yellow-300 mt-2">
                                  ⚠️ Differenza di {winrateDiff.toFixed(1)}% rispetto al tuo ruolo migliore
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Top Heroes per Ruolo Preview */}
                  {Object.entries(analysis.roles)
                    .filter(([_, perf]) => perf.games > 0 && perf.heroes.length > 0)
                    .length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Top Heroes per Ruolo
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(analysis.roles)
                          .filter(([_, perf]) => perf.games > 0 && perf.heroes.length > 0)
                          .sort((a, b) => b[1].games - a[1].games)
                          .slice(0, 4)
                          .map(([role, perf]) => (
                            <div key={role} className="bg-gray-700/50 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-white capitalize mb-3">{role}</h4>
                              <div className="space-y-2">
                                {perf.heroes.slice(0, 3).map((hero) => (
                                  <div key={hero.hero_id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {heroes[hero.hero_id] && (
                                        <HeroCard
                                          heroId={hero.hero_id}
                                          heroName={heroes[hero.hero_id].name}
                                          size="sm"
                                        />
                                      )}
                                      <span className="text-sm text-white">{hero.hero_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400">{hero.games}p</span>
                                      <span className={`text-xs font-semibold ${
                                        hero.winrate >= 50 ? 'text-green-400' : 'text-red-400'
                                      }`}>
                                        {hero.winrate.toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Items */}
                  {(() => {
                    const rolesWithGames = Object.entries(analysis.roles)
                      .filter(([_, perf]) => perf.games >= 5)
                    const weakRoles = rolesWithGames.filter(([_, perf]) => perf.winrate < 45)
                    const strongRoles = rolesWithGames.filter(([_, perf]) => perf.winrate >= 55)
                    const needsDiversity = analysis.summary.totalRolesPlayed < 2

                    if (weakRoles.length === 0 && strongRoles.length === 0 && !needsDiversity) return null

                    return (
                      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-purple-200 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Quick Actions
                        </h3>
                        <div className="space-y-3">
                          {strongRoles.length > 0 && (
                            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-green-300 mb-1">
                                    Continua a giocare: {strongRoles.map(([role]) => role).join(', ')}
                                  </p>
                                  <p className="text-xs text-green-400">
                                    Stai performando molto bene in questi ruoli. Mantieni questo livello!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {weakRoles.length > 0 && (
                            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-yellow-300 mb-1">
                                    Focus su: {weakRoles.map(([role]) => role).join(', ')}
                                  </p>
                                  <p className="text-xs text-yellow-400">
                                    Winrate basso in questi ruoli. Clicca sulle card per vedere come migliorare.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {needsDiversity && (
                            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Users className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-blue-300 mb-1">
                                    Diversifica il tuo pool
                                  </p>
                                  <p className="text-xs text-blue-400">
                                    Stai giocando principalmente un solo ruolo. Prova altri ruoli per migliorare la comprensione del gioco.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4 text-blue-200 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Raccomandazioni Generali
                      </h3>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-blue-300">
                            <span className="text-blue-400 mt-1">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Role Improvement Tab */}
              {activeTab === 'improvement' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold mb-2">Miglioramento per Ruolo</h2>
                    <p className="text-gray-400 text-sm">
                      Analisi dettagliata e raccomandazioni specifiche per migliorare le tue performance in un ruolo
                    </p>
                  </div>

                  {/* Role Selector */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-base font-semibold mb-3">Seleziona Ruolo</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(analysis.roles)
                        .filter(([_, perf]) => perf.games > 0)
                        .map(([role, perf]) => (
                          <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                              selectedRole === role
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {role} ({perf.games} partite)
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Role Analysis */}
                  {selectedRole && analysis.roles[selectedRole] && (() => {
                    const perf = analysis.roles[selectedRole]
                    const { strengths, weaknesses } = getRoleStrengthsWeaknesses(selectedRole, perf)
                    const recommendations = getRoleRecommendations(selectedRole, perf, strengths, weaknesses)
                    const keyMetrics = getRoleKeyMetrics(selectedRole, perf)

                    return (
                      <div className="space-y-4">
                        {/* Key Metrics */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold mb-4 capitalize">Metriche Chiave: {selectedRole}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {keyMetrics.map((metric, idx) => (
                              <div key={idx} className="bg-gray-700/50 rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
                                <div className="text-2xl font-bold text-white">{metric.value}</div>
                                <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {strengths.length > 0 && (
                            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                              <h4 className="text-base font-semibold mb-3 text-green-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Punti di Forza
                              </h4>
                              <ul className="space-y-2">
                                {strengths.map((strength, idx) => (
                                  <li key={idx} className="text-green-300 text-sm flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {weaknesses.length > 0 && (
                            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                              <h4 className="text-base font-semibold mb-3 text-yellow-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Aree da Migliorare
                              </h4>
                              <ul className="space-y-2">
                                {weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="text-yellow-300 text-sm flex items-start gap-2">
                                    <span className="text-yellow-400 mt-1">⚠</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Actionable Recommendations */}
                        {recommendations.length > 0 && (
                          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                            <h4 className="text-lg font-semibold mb-4 text-blue-200 flex items-center gap-2">
                              <Target className="w-5 h-5" />
                              Raccomandazioni Actionable
                            </h4>
                            <ul className="space-y-3">
                              {recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-blue-300">
                                  <ArrowRight className="w-4 h-4 mt-1 text-blue-400 flex-shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Top Heroes for Role */}
                        {perf.heroes.length > 0 && (
                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                            <h4 className="text-base font-semibold mb-4">Heroes Più Giocati come {selectedRole}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {perf.heroes.map((hero) => (
                                <div
                                  key={hero.hero_id}
                                  className="bg-gray-700/50 rounded-lg p-3 text-center"
                                >
                                  {heroes[hero.hero_id] && (
                                    <HeroCard
                                      heroId={hero.hero_id}
                                      heroName={heroes[hero.hero_id].name}
                                      size="sm"
                                    />
                                  )}
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-400">{hero.hero_name}</div>
                                    <div className="text-xs text-gray-500">{hero.games} partite</div>
                                    <div className={`text-xs font-semibold ${
                                      hero.winrate >= 50 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {hero.winrate.toFixed(0)}% WR
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Link to Builds */}
                        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-purple-200 mb-1">Build & Items</h4>
                              <p className="text-sm text-purple-300">
                                Visualizza build e items consigliati per {selectedRole}
                              </p>
                            </div>
                            <Link
                              href="/dashboard/builds"
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              Vai a Builds
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {!selectedRole && (
                    <div className="text-center py-8 text-gray-400">
                      <p>Seleziona un ruolo per vedere l'analisi dettagliata</p>
                    </div>
                  )}
                </div>
              )}

              {/* Role Trend Tab */}
              {activeTab === 'trend' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold mb-2">Trend Performance per Ruolo</h2>
                    <p className="text-gray-400 text-sm">
                      Visualizza come è cambiata la tua performance in un ruolo nel tempo
                    </p>
                  </div>

                  {/* Role Selector for Trend */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-base font-semibold mb-3">Seleziona Ruolo</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(analysis.roles)
                        .filter(([_, perf]) => perf.games >= 5)
                        .map(([role, perf]) => (
                          <button
                            key={role}
                            onClick={() => {
                              setSelectedRoleForTrend(role)
                              setTrendData([])
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                              selectedRoleForTrend === role
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {role} ({perf.games} partite)
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Trend Chart */}
                  {trendLoading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <p className="mt-2 text-gray-400 text-sm">Caricamento trend...</p>
                    </div>
                  )}

                  {!trendLoading && trendData.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 capitalize">
                        Trend Performance: {trendData[0].role}
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData[0].periods}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="period" stroke="#9CA3AF" />
                          <YAxis yAxisId="left" stroke="#9CA3AF" />
                          <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="winrate"
                            stroke="#10B981"
                            strokeWidth={2}
                            name="Winrate %"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avgKDA"
                            stroke="#EF4444"
                            strokeWidth={2}
                            name="KDA Medio"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Trend Summary */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {trendData[0].periods.map((period, idx) => (
                          <div key={idx} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                            <h4 className="text-xs text-gray-400 mb-2">{period.period}</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Winrate</span>
                                <span className={`text-sm font-bold ${
                                  period.winrate >= 55 ? 'text-green-400' :
                                  period.winrate >= 50 ? 'text-blue-400' :
                                  'text-red-400'
                                }`}>
                                  {period.winrate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-400">KDA</span>
                                <span className="text-sm font-medium text-white">{period.avgKDA}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-400">GPM</span>
                                <span className="text-sm font-medium text-white">{period.avgGPM}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Partite</span>
                                <span className="text-sm text-gray-300">{period.games}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!trendLoading && !selectedRoleForTrend && (
                    <div className="text-center py-8 text-gray-400">
                      <p>Seleziona un ruolo per vedere il trend di performance</p>
                    </div>
                  )}

                  {!trendLoading && selectedRoleForTrend && trendData.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p>Nessun dato disponibile per questo ruolo. Gioca più partite per vedere il trend.</p>
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