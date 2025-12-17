'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'
import WardMap from '@/components/WardMap'
import { BarChart as BarChartIcon, Clock, Shield, Sword, Map, Timer, Droplet, Building2, Skull, Play, Trophy } from 'lucide-react'

interface MatchData {
  match_id: number
  duration: number
  radiant_win: boolean
  radiant_score: number
  dire_score: number
  start_time: number
  players: Array<{
    account_id: number
    hero_id: number
    kills: number
    deaths: number
    assists: number
    last_hits: number
    denies: number
    gold_per_min: number
    xp_per_min: number
    net_worth?: number
    hero_damage?: number
    tower_damage?: number
    hero_healing?: number
    player_slot: number
  }>
}

interface AnalysisData {
  matchId: string
  duration: number
  radiantWin: boolean
  overview: string
  keyMoments: Array<{ time: number; event: string; description: string }>
  playerPerformance: Array<{
    heroId: number
    kills: number
    deaths: number
    assists: number
    gpm: number
    xpm: number
    rating: string
    roleRecommendations?: string[]
    lastHits?: number
    denies?: number
    heroDamage?: number
    towerDamage?: number
    heroHealing?: number
    netWorth?: number
    goldSpent?: number
    observerWards?: number
    sentryWards?: number
    observerKilled?: number
    buybackCount?: number
    farmEfficiency?: string
    damageEfficiency?: string
    goldUtilization?: string
    killParticipation?: string
    csPerMin?: string
    xpmGpmRatio?: string
    supportScore?: string
    carryImpactScore?: string
    stuns?: number
    runePickups?: number
    campsStacked?: number
    courierKills?: number
    roshKills?: number
    firstBloodClaimed?: number
    teamfightParticipations?: number
    towersKilled?: number
    role?: string
  }>
  teamStats?: {
    radiant: {
      avgGpm: number
      avgKda: string
      totalDamage?: number
      totalWards?: number
      totalTowerDamage?: number
    }
    dire: {
      avgGpm: number
      avgKda: string
      totalDamage?: number
      totalWards?: number
      totalTowerDamage?: number
    }
  }
}

interface PlayerAverageStats {
  avgGpm: number
  avgXpm: number
  avgKda: number
  avgKills: number
  avgDeaths: number
  avgAssists: number
  avgLastHits: number
  avgDenies: number
  avgHeroDamage: number
  avgTowerDamage: number
}

type TabType = 'overview' | 'phases' | 'items' | 'teamfights' | 'vision'

export default function MatchAnalysisDetailPage() {
  const params = useParams()
  const matchId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [match, setMatch] = useState<MatchData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerAverageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [timeline, setTimeline] = useState<any>(null)
  const [phasesData, setPhasesData] = useState<any>(null)
  const [itemTimingData, setItemTimingData] = useState<any>(null)
  const [teamfightsData, setTeamfightsData] = useState<any>(null)
  const [wardmapData, setWardmapData] = useState<any>(null)
  const [loadingPhases, setLoadingPhases] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingTeamfights, setLoadingTeamfights] = useState(false)
  const [loadingWardmap, setLoadingWardmap] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
  }, [user, router])

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await fetch('/api/opendota/heroes')
        if (response.ok) {
          const heroesData = await response.json()
          const heroesMap: Record<number, { name: string; localized_name: string }> = {}
          heroesData.forEach((hero: { id: number; name: string; localized_name: string }) => {
            heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
          })
          setHeroes(heroesMap)
        }
      } catch (err) {
        console.error('Failed to fetch heroes:', err)
      }
    }
    fetchHeroes()
  }, [])

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch match data
        let response = await fetch(`/api/opendota/match/${matchId}`)
        if (!response.ok) {
          response = await fetch(`https://api.opendota.com/api/matches/${matchId}`)
        }
        if (!response.ok) throw new Error('Failed to fetch match')
        const matchData = await response.json()
        setMatch(matchData)

        // Fetch timeline
        try {
          const timelineResponse = await fetch(`/api/match/${matchId}/timeline`)
          if (timelineResponse.ok) {
            setTimeline(await timelineResponse.json())
          }
        } catch (err) {
          console.error('Failed to fetch timeline:', err)
        }

        // Fetch AI analysis
        try {
          const analysisResponse = await fetch(`/api/analysis/match/${matchId}`)
          if (analysisResponse.ok) {
            setAnalysis(await analysisResponse.json())
          }
        } catch (err) {
          console.error('Failed to fetch analysis:', err)
        }

        // Fetch player average stats for comparison (if playerId available)
        if (playerId) {
          try {
            const statsResponse = await fetch(`/api/player/${playerId}/stats`)
            if (statsResponse.ok) {
              const statsData = await statsResponse.json()
              if (statsData.stats) {
                // Calculate averages from last 10 matches
                const matches = statsData.stats.matches || []
                if (matches.length > 0) {
                  const avgGpm = matches.reduce((acc: number, m: any) => acc + (m.gpm || 0), 0) / matches.length
                  const avgXpm = matches.reduce((acc: number, m: any) => acc + (m.xpm || 0), 0) / matches.length
                  const avgKda = matches.reduce((acc: number, m: any) => acc + (m.kda || 0), 0) / matches.length
                  
                  // Fetch advanced stats for more detailed averages
                  const advancedResponse = await fetch(`/api/player/${playerId}/advanced-stats`)
                  if (advancedResponse.ok) {
                    const advancedData = await advancedResponse.json()
                    const stats = advancedData.stats
                    
                    setPlayerStats({
                      avgGpm,
                      avgXpm,
                      avgKda,
                      avgKills: stats?.fights?.avgKills || 0,
                      avgDeaths: stats?.fights?.avgDeaths || 0,
                      avgAssists: stats?.fights?.avgAssists || 0,
                      avgLastHits: stats?.lane?.avgLastHits || 0,
                      avgDenies: stats?.lane?.avgDenies || 0,
                      avgHeroDamage: stats?.fights?.avgHeroDamage || 0,
                      avgTowerDamage: stats?.fights?.avgTowerDamage || 0,
                    })
                  } else {
                    // Fallback to basic stats
                    setPlayerStats({
                      avgGpm,
                      avgXpm,
                      avgKda,
                      avgKills: 0,
                      avgDeaths: 0,
                      avgAssists: 0,
                      avgLastHits: 0,
                      avgDenies: 0,
                      avgHeroDamage: 0,
                      avgTowerDamage: 0,
                    })
                  }
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch player stats:', err)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (matchId) {
      fetchMatch()
    }
  }, [matchId, playerId])

  // Fetch phases data when phases tab is active
  useEffect(() => {
    if (activeTab === 'phases' && matchId && !phasesData && !loadingPhases) {
      setLoadingPhases(true)
      fetch(`/api/match/${matchId}/phases`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setPhasesData(data)
        })
        .catch(err => console.error('Failed to fetch phases:', err))
        .finally(() => setLoadingPhases(false))
    }
  }, [activeTab, matchId, phasesData, loadingPhases])

  // Fetch item timing data when items tab is active
  useEffect(() => {
    if (activeTab === 'items' && matchId && !itemTimingData && !loadingItems) {
      setLoadingItems(true)
      fetch(`/api/match/${matchId}/item-timing`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setItemTimingData(data)
        })
        .catch(err => console.error('Failed to fetch item timing:', err))
        .finally(() => setLoadingItems(false))
    }
  }, [activeTab, matchId, itemTimingData, loadingItems])

  // Fetch teamfights data when teamfights tab is active
  useEffect(() => {
    if (activeTab === 'teamfights' && matchId && !teamfightsData && !loadingTeamfights) {
      setLoadingTeamfights(true)
      fetch(`/api/match/${matchId}/teamfights`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setTeamfightsData(data)
        })
        .catch(err => console.error('Failed to fetch teamfights:', err))
        .finally(() => setLoadingTeamfights(false))
    }
  }, [activeTab, matchId, teamfightsData, loadingTeamfights])

  // Fetch wardmap data when vision tab is active
  useEffect(() => {
    if (activeTab === 'vision' && matchId && !wardmapData && !loadingWardmap) {
      setLoadingWardmap(true)
      fetch(`/api/match/${matchId}/wardmap`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setWardmapData(data)
        })
        .catch(err => console.error('Failed to fetch wardmap:', err))
        .finally(() => setLoadingWardmap(false))
    }
  }, [activeTab, matchId, wardmapData, loadingWardmap])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getHeroName = (heroId: number) => {
    return heroes[heroId]?.localized_name || `Hero ${heroId}`
  }

  // Find current player in match
  const currentPlayer = match?.players.find((p) => 
    playerId && p.account_id && p.account_id.toString() === playerId.toString()
  ) || match?.players[0] // Fallback to first player if not found

  // Calculate comparison with average
  const getComparison = (current: number, average: number) => {
    if (!average || average === 0) return null
    const diff = current - average
    const percent = ((diff / average) * 100).toFixed(1)
    return {
      diff,
      percent: parseFloat(percent),
      isBetter: diff > 0
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento analisi partita...</p>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="p-8">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-200 mb-2">Errore nel caricamento</h2>
          <p className="text-red-300 mb-4">{error || 'Partita non trovata'}</p>
          <Link href="/dashboard/match-analysis" className="inline-block text-red-400 hover:text-red-300">
            ← Torna a Seleziona Partita
          </Link>
        </div>
      </div>
    )
  }

  const tabs: Array<{ id: TabType; name: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', name: 'Overview', icon: BarChartIcon },
    { id: 'phases', name: 'Fasi di Gioco', icon: Clock },
    { id: 'items', name: 'Item Timing', icon: Shield },
    { id: 'teamfights', name: 'Teamfight', icon: Sword },
    { id: 'vision', name: 'Vision', icon: Map },
  ]

  // Prepare chart data
  const gpmData = match.players.map((player) => ({
    name: getHeroName(player.hero_id).substring(0, 10),
    'GPM': player.gold_per_min,
    'XPM': player.xp_per_min
  }))

  const kdaData = match.players.map((player) => ({
    name: getHeroName(player.hero_id).substring(0, 10),
    'Kills': player.kills,
    'Deaths': player.deaths,
    'Assists': player.assists
  }))

  return (
    <div className="p-8">
      <HelpButton />
      <div className="mb-6">
        <Link href="/dashboard/match-analysis" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
          ← Torna a Seleziona Partita
        </Link>
        <h1 className="text-3xl font-bold mb-2">Analisi Partita #{matchId}</h1>
        <p className="text-gray-400">
          Durata: {formatDuration(match.duration)} • {formatDate(match.start_time)}
        </p>
      </div>

      {/* Match Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className={`text-2xl font-bold mb-2 ${match.radiant_win ? 'text-green-400' : 'text-red-400'}`}>
              {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
            </div>
            <div className="flex items-center gap-8 text-3xl font-bold">
              <span className="text-green-400">{match.radiant_score || 0}</span>
              <span className="text-gray-500">-</span>
              <span className="text-red-400">{match.dire_score || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Confronto con Media - NEW FEATURE */}
              {currentPlayer && playerStats && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                  <h3 className="text-2xl font-semibold mb-4 text-blue-300">📈 Confronto con la Tua Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'GPM', current: currentPlayer.gold_per_min, avg: playerStats.avgGpm },
                      { label: 'XPM', current: currentPlayer.xp_per_min, avg: playerStats.avgXpm },
                      { label: 'KDA', current: ((currentPlayer.kills + currentPlayer.assists) / Math.max(currentPlayer.deaths, 1)), avg: playerStats.avgKda },
                      { label: 'Kills', current: currentPlayer.kills, avg: playerStats.avgKills },
                      { label: 'Deaths', current: currentPlayer.deaths, avg: playerStats.avgDeaths },
                      { label: 'Assists', current: currentPlayer.assists, avg: playerStats.avgAssists },
                      { label: 'Last Hits', current: currentPlayer.last_hits, avg: playerStats.avgLastHits },
                      { label: 'Denies', current: currentPlayer.denies, avg: playerStats.avgDenies },
                    ].map((metric) => {
                      const comparison = getComparison(metric.current, metric.avg)
                      return (
                        <div key={metric.label} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">{metric.label}</div>
                          <div className="text-2xl font-bold text-white mb-1">{metric.current.toFixed(metric.label === 'KDA' ? 2 : 0)}</div>
                          {comparison && (
                            <div className={`text-sm font-semibold ${comparison.isBetter ? 'text-green-400' : 'text-red-400'}`}>
                              vs media: {metric.avg.toFixed(metric.label === 'KDA' ? 2 : 0)} ({comparison.isBetter ? '+' : ''}{comparison.percent}% {comparison.isBetter ? '↗️' : '↘️'})
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Players Table */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
                  <h2 className="text-xl font-semibold text-white">Performance Giocatori</h2>
                </div>
                
                {/* Radiant Team */}
                <div className="p-6 bg-green-900/20">
                  <h3 className="font-semibold text-green-400 mb-3">Radiant</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400">
                          <th className="pb-2">Hero</th>
                          <th className="pb-2">K/D/A</th>
                          <th className="pb-2">LH/D</th>
                          <th className="pb-2">GPM</th>
                          <th className="pb-2">XPM</th>
                          {match.players[0]?.net_worth && <th className="pb-2">Net Worth</th>}
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {match.players.slice(0, 5).map((player, idx) => (
                          <tr key={idx} className="border-t border-green-800/50">
                            <td className="py-2 font-medium text-white">{getHeroName(player.hero_id)}</td>
                            <td className="py-2 font-semibold text-gray-300">
                              {player.kills}/{player.deaths}/{player.assists}
                            </td>
                            <td className="py-2 text-gray-300">{player.last_hits}/{player.denies}</td>
                            <td className="py-2 text-gray-300">{player.gold_per_min}</td>
                            <td className="py-2 text-gray-300">{player.xp_per_min}</td>
                            {player.net_worth && <td className="py-2 text-gray-300">{player.net_worth.toLocaleString()}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dire Team */}
                <div className="p-6 bg-red-900/20">
                  <h3 className="font-semibold text-red-400 mb-3">Dire</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400">
                          <th className="pb-2">Hero</th>
                          <th className="pb-2">K/D/A</th>
                          <th className="pb-2">LH/D</th>
                          <th className="pb-2">GPM</th>
                          <th className="pb-2">XPM</th>
                          {match.players[5]?.net_worth && <th className="pb-2">Net Worth</th>}
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {match.players.slice(5, 10).map((player, idx) => (
                          <tr key={idx} className="border-t border-red-800/50">
                            <td className="py-2 font-medium text-white">{getHeroName(player.hero_id)}</td>
                            <td className="py-2 font-semibold text-gray-300">
                              {player.kills}/{player.deaths}/{player.assists}
                            </td>
                            <td className="py-2 text-gray-300">{player.last_hits}/{player.denies}</td>
                            <td className="py-2 text-gray-300">{player.gold_per_min}</td>
                            <td className="py-2 text-gray-300">{player.xp_per_min}</td>
                            {player.net_worth && <td className="py-2 text-gray-300">{player.net_worth.toLocaleString()}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Timeline Chart */}
              {timeline && timeline.timeline && timeline.timeline.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Timeline Partita - Gold & XP Advantage</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeline.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                      <XAxis 
                        dataKey="minute" 
                        stroke="#9ca3af"
                        label={{ value: 'Minuti', position: 'insideBottom', offset: -5, style: { fill: '#9ca3af' } }}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                        itemStyle={{ color: '#e5e7eb' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'radiant_gold_adv') return [`${value > 0 ? '+' : ''}${value}`, 'Radiant Gold Advantage']
                          if (name === 'radiant_xp_adv') return [`${value > 0 ? '+' : ''}${value}`, 'Radiant XP Advantage']
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="radiant_gold_adv" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Radiant Gold Advantage"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="radiant_xp_adv" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Radiant XP Advantage"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {timeline.keyEvents && timeline.keyEvents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Eventi Reali della Partita
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {timeline.keyEvents.map((event: any, idx: number) => {
                          const timeStr = `${event.minute}:${String(event.second || 0).padStart(2, '0')}`
                          const getEventColor = () => {
                            switch (event.type) {
                              case 'first_blood': return 'bg-red-900/50 border-red-700 text-red-300'
                              case 'kill': return 'bg-orange-900/50 border-orange-700 text-orange-300'
                              case 'tower': return 'bg-yellow-900/50 border-yellow-700 text-yellow-300'
                              case 'roshan': return 'bg-purple-900/50 border-purple-700 text-purple-300'
                              case 'match_start': return 'bg-green-900/50 border-green-700 text-green-300'
                              case 'match_end': return event.team === 'radiant' ? 'bg-blue-900/50 border-blue-700 text-blue-300' : 'bg-red-900/50 border-red-700 text-red-300'
                              default: return 'bg-gray-700 border-gray-600 text-gray-300'
                            }
                          }
                          const getEventIcon = () => {
                            switch (event.type) {
                              case 'first_blood': return <Droplet className="w-4 h-4 text-red-400" />
                              case 'kill': return <Sword className="w-4 h-4 text-orange-400" />
                              case 'tower': return <Building2 className="w-4 h-4 text-yellow-400" />
                              case 'roshan': return <Skull className="w-4 h-4 text-purple-400" />
                              case 'match_start': return <Play className="w-4 h-4 text-green-400" />
                              case 'match_end': return <Trophy className="w-4 h-4 text-blue-400" />
                              default: return <span className="text-gray-400">•</span>
                            }
                          }
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getEventColor()}`}
                            >
                              <span className="text-xs font-mono font-semibold min-w-[50px]">{timeStr}</span>
                              <span className="flex items-center">{getEventIcon()}</span>
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{event.event}</div>
                                {event.description && (
                                  <div className="text-xs opacity-80 mt-0.5">{event.description}</div>
                                )}
                              </div>
                              {event.team && (
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  event.team === 'radiant' 
                                    ? 'bg-green-900/50 text-green-300' 
                                    : 'bg-red-900/50 text-red-300'
                                }`}>
                                  {event.team === 'radiant' ? 'Radiant' : 'Dire'}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Statistics Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Gold & Experience per Minute</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gpmData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                        itemStyle={{ color: '#e5e7eb' }}
                      />
                      <Legend />
                      <Bar dataKey="GPM" fill="#10b981" />
                      <Bar dataKey="XPM" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Kills, Deaths & Assists</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={kdaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                        itemStyle={{ color: '#e5e7eb' }}
                      />
                      <Legend />
                      <Bar dataKey="Kills" fill="#10b981" />
                      <Bar dataKey="Deaths" fill="#ef4444" />
                      <Bar dataKey="Assists" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Analysis Section */}
              {analysis && (
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-6">
                  <h3 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    🤖 AI Analysis & Insights
                  </h3>
                  <p className="text-blue-200 mb-4">{analysis.overview}</p>

                  {analysis.keyMoments && analysis.keyMoments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                        <Timer className="w-5 h-5" />
                        Momenti Chiave:
                      </h4>
                      <div className="space-y-2">
                        {analysis.keyMoments.map((moment, idx) => (
                          <div key={idx} className="bg-gray-800/50 rounded p-2 text-sm text-gray-300">
                            <span className="font-semibold">{formatDuration(moment.time)}</span> - {moment.event}: {moment.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white">Analisi Fase per Fase</h2>
                <p className="text-gray-400 mb-6">
                  Analisi dettagliata delle performance divise in Early Game (0-10min), Mid Game (10-25min), e Late Game (25+min)
                </p>

                {loadingPhases && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-400">Caricamento dati fasi...</p>
                  </div>
                )}

                {phasesData && !loadingPhases && (
                  <div className="space-y-6">
                    {/* Phase Overview */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-400 mb-2">Early Game</h3>
                        <p className="text-sm text-gray-300">0 - 10 minuti</p>
                        <p className="text-sm text-gray-400">Durata: {Math.floor(phasesData.phases.early.duration / 60)}:{(phasesData.phases.early.duration % 60).toString().padStart(2, '0')}</p>
                      </div>
                      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-2">Mid Game</h3>
                        <p className="text-sm text-gray-300">10 - 25 minuti</p>
                        <p className="text-sm text-gray-400">Durata: {Math.floor(phasesData.phases.mid.duration / 60)}:{(phasesData.phases.mid.duration % 60).toString().padStart(2, '0')}</p>
                      </div>
                      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Late Game</h3>
                        <p className="text-sm text-gray-300">25+ minuti</p>
                        <p className="text-sm text-gray-400">Durata: {Math.floor(phasesData.phases.late.duration / 60)}:{(phasesData.phases.late.duration % 60).toString().padStart(2, '0')}</p>
                      </div>
                    </div>

                    {/* Player Phase Performance */}
                    {phasesData.playerPhases && phasesData.playerPhases.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Performance per Fase</h3>
                        {phasesData.playerPhases.map((playerPhase: any, idx: number) => {
                          const player = match?.players.find(p => p.player_slot === playerPhase.player_slot)
                          if (!player) return null

                          return (
                            <div key={idx} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white">
                                  {heroes[playerPhase.hero_id]?.localized_name || `Hero ${playerPhase.hero_id}`}
                                </h4>
                                <span className={`px-3 py-1 rounded text-sm ${
                                  playerPhase.player_slot < 128 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                                }`}>
                                  {playerPhase.player_slot < 128 ? 'Radiant' : 'Dire'}
                                </span>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4">
                                {(['early', 'mid', 'late'] as const).map((phase) => {
                                  const phaseData = playerPhase.phases[phase]
                                  return (
                                    <div key={phase} className={`rounded-lg p-3 ${
                                      phase === 'early' ? 'bg-green-900/20 border border-green-700' :
                                      phase === 'mid' ? 'bg-yellow-900/20 border border-yellow-700' :
                                      'bg-red-900/20 border border-red-700'
                                    }`}>
                                      <h5 className="font-semibold text-sm mb-2 capitalize">
                                        {phase === 'early' ? 'Early' : phase === 'mid' ? 'Mid' : 'Late'} Game
                                      </h5>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">K/D/A:</span>
                                          <span className="text-white font-semibold">
                                            {phaseData.kills}/{phaseData.deaths}/{phaseData.assists}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">LH/D:</span>
                                          <span className="text-white font-semibold">
                                            {phaseData.lastHits}/{phaseData.denies}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Gold:</span>
                                          <span className="text-yellow-400 font-semibold">
                                            {Math.round(phaseData.goldEarned).toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">XP:</span>
                                          <span className="text-blue-400 font-semibold">
                                            {Math.round(phaseData.xpEarned).toLocaleString()}
                                          </span>
                                        </div>
                                        {phaseData.heroDamage > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-400">Damage:</span>
                                            <span className="text-red-400 font-semibold">
                                              {Math.round(phaseData.heroDamage).toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!phasesData && !loadingPhases && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Nessun dato disponibile per questa partita</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white">Item Timing Analysis</h2>
                <p className="text-gray-400 mb-6">
                  Analisi dei tempi di acquisto degli item e confronto con timing ottimali
                </p>

                {loadingItems && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-400">Caricamento item timing...</p>
                  </div>
                )}

                {itemTimingData && !loadingItems && (
                  <div className="space-y-6">
                    {itemTimingData.playerItemTimings && itemTimingData.playerItemTimings.map((playerTiming: any, idx: number) => {
                      const player = match?.players.find(p => p.player_slot === playerTiming.player_slot)
                      if (!player) return null

                      return (
                        <div key={idx} className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">
                              {heroes[playerTiming.hero_id]?.localized_name || `Hero ${playerTiming.hero_id}`}
                            </h3>
                            <span className={`px-3 py-1 rounded text-sm ${
                              playerTiming.player_slot < 128 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                            }`}>
                              {playerTiming.player_slot < 128 ? 'Radiant' : 'Dire'}
                            </span>
                          </div>

                          {playerTiming.items && playerTiming.items.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {playerTiming.items.map((item: any, itemIdx: number) => (
                                <div
                                  key={itemIdx}
                                  className={`border rounded-lg p-3 ${
                                    item.timingRating === 'on_time' ? 'bg-green-900/20 border-green-700' :
                                    item.timingRating === 'early' ? 'bg-blue-900/20 border-blue-700' :
                                    item.timingRating === 'late' ? 'bg-red-900/20 border-red-700' :
                                    'bg-gray-800 border-gray-600'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-white text-sm">{item.itemName}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                      item.timingRating === 'on_time' ? 'bg-green-600 text-white' :
                                      item.timingRating === 'early' ? 'bg-blue-600 text-white' :
                                      item.timingRating === 'late' ? 'bg-red-600 text-white' :
                                      'bg-gray-600 text-gray-300'
                                    }`}>
                                      {item.timingRating === 'on_time' ? '✓' :
                                       item.timingRating === 'early' ? '↑' :
                                       item.timingRating === 'late' ? '↓' : '?'}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Acquistato:</span>
                                      <span className="text-white font-semibold">
                                        {item.purchaseMinute}:{item.purchaseSecond.toString().padStart(2, '0')}
                                      </span>
                                    </div>
                                    {item.optimalMinute !== null && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Ottimale:</span>
                                        <span className="text-gray-300">
                                          {item.optimalMinute} min
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Costo:</span>
                                      <span className="text-yellow-400 font-semibold">
                                        {item.itemCost.toLocaleString()} gold
                                      </span>
                                    </div>
                                    {item.isEarly && (
                                      <p className="text-blue-400 text-xs mt-1">✓ Acquistato in anticipo</p>
                                    )}
                                    {item.isLate && (
                                      <p className="text-red-400 text-xs mt-1">⚠ Acquistato in ritardo</p>
                                    )}
                                    {item.isOnTime && (
                                      <p className="text-green-400 text-xs mt-1">✓ Timing ottimale</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-center py-4">Nessun item trovato per questo giocatore</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {!itemTimingData && !loadingItems && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Nessun dato disponibile per questa partita</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'teamfights' && (
            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white">Teamfight Analysis</h2>
                <p className="text-gray-400 mb-6">
                  Analisi dettagliata dei teamfight: partecipazione, outcome, e performance individuali
                </p>

                {loadingTeamfights && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-400">Caricamento teamfight...</p>
                  </div>
                )}

                {teamfightsData && !loadingTeamfights && (
                  <div className="space-y-6">
                    {/* Teamfight Overview */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Total Teamfights</h3>
                        <p className="text-3xl font-bold text-red-400">{teamfightsData.totalTeamfights}</p>
                      </div>
                      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Durata Media</h3>
                        <p className="text-3xl font-bold text-blue-400">
                          {teamfightsData.teamfights && teamfightsData.teamfights.length > 0
                            ? Math.round(teamfightsData.teamfights.reduce((acc: number, tf: any) => acc + tf.duration, 0) / teamfightsData.teamfights.length)
                            : 0}s
                        </p>
                      </div>
                      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Durata Partita</h3>
                        <p className="text-3xl font-bold text-green-400">
                          {Math.floor(teamfightsData.duration / 60)}:{(teamfightsData.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>

                    {/* Teamfight List */}
                    {teamfightsData.teamfights && teamfightsData.teamfights.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Teamfight Dettagliati</h3>
                        {teamfightsData.teamfights.map((tf: any, idx: number) => (
                          <div
                            key={idx}
                            className={`border rounded-lg p-4 ${
                              tf.winner === 'radiant' ? 'bg-green-900/20 border-green-700' :
                              tf.winner === 'dire' ? 'bg-red-900/20 border-red-700' :
                              'bg-gray-700/50 border-gray-600'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="text-lg font-semibold text-white">
                                  Teamfight #{idx + 1}
                                </h4>
                                <p className="text-sm text-gray-400">
                                  {tf.startMinute}:{tf.startSecond.toString().padStart(2, '0')} - {tf.endMinute}:{tf.endSecond.toString().padStart(2, '0')}
                                  {' '}({tf.duration}s)
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded text-sm font-semibold ${
                                tf.winner === 'radiant' ? 'bg-green-600 text-white' :
                                tf.winner === 'dire' ? 'bg-red-600 text-white' :
                                'bg-gray-600 text-gray-300'
                              }`}>
                                {tf.winner === 'radiant' ? 'Radiant Win' :
                                 tf.winner === 'dire' ? 'Dire Win' : 'Draw'}
                              </span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-green-900/30 rounded p-3">
                                <p className="text-sm font-semibold text-green-400 mb-1">Radiant Kills</p>
                                <p className="text-2xl font-bold text-white">{tf.radiantKills}</p>
                              </div>
                              <div className="bg-red-900/30 rounded p-3">
                                <p className="text-sm font-semibold text-red-400 mb-1">Dire Kills</p>
                                <p className="text-2xl font-bold text-white">{tf.direKills}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-600">
                              <p className="text-xs text-gray-400 mb-2">Partecipanti: {tf.participants.filter((p: any) => p.participated).length}/10</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Player Teamfight Stats */}
                    {teamfightsData.playerStats && teamfightsData.playerStats.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Statistiche Giocatori</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="text-left text-sm text-gray-400 border-b border-gray-600">
                                <th className="pb-2">Hero</th>
                                <th className="pb-2">Partecipazione</th>
                                <th className="pb-2">Vittorie</th>
                                <th className="pb-2">Sconfitte</th>
                                <th className="pb-2">Winrate</th>
                                <th className="pb-2">Avg Damage</th>
                                <th className="pb-2">Avg Healing</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {teamfightsData.playerStats.map((playerStat: any, idx: number) => {
                                const player = match?.players.find(p => p.player_slot === playerStat.player_slot)
                                return (
                                  <tr key={idx} className="border-b border-gray-700">
                                    <td className="py-2 font-medium text-white">
                                      {heroes[playerStat.hero_id]?.localized_name || `Hero ${playerStat.hero_id}`}
                                    </td>
                                    <td className="py-2 text-gray-300">
                                      {playerStat.participated}/{playerStat.totalTeamfights} ({playerStat.participationRate.toFixed(1)}%)
                                    </td>
                                    <td className="py-2 text-green-400 font-semibold">{playerStat.won}</td>
                                    <td className="py-2 text-red-400 font-semibold">{playerStat.lost}</td>
                                    <td className="py-2 text-gray-300">
                                      {playerStat.winRate.toFixed(1)}%
                                    </td>
                                    <td className="py-2 text-red-400 font-semibold">
                                      {playerStat.avgDamagePerFight.toLocaleString()}
                                    </td>
                                    <td className="py-2 text-green-400 font-semibold">
                                      {playerStat.avgHealingPerFight.toLocaleString()}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!teamfightsData && !loadingTeamfights && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Nessun dato disponibile per questa partita</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vision' && (
            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                  <Map className="w-6 h-6" />
                  Ward Map - Posizioni Wards
                </h2>
                <p className="text-gray-400 mb-6 text-sm">
                  Visualizza le heatmap interattive delle posizioni delle Observer e Sentry wards piazzate in questa partita.
                </p>

                {loadingWardmap && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-400">Caricamento dati wardmap...</p>
                  </div>
                )}

                {!loadingWardmap && wardmapData && (
                  <div className="relative w-full">
                    <WardMap
                      observerWards={wardmapData.observerWards || []}
                      sentryWards={wardmapData.sentryWards || []}
                    />
                  </div>
                )}

                {!loadingWardmap && !wardmapData && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Nessun dato wardmap disponibile per questa partita</p>
                    <p className="text-gray-500 text-sm mt-2">
                      La partita potrebbe non avere replay disponibili o dati wardmap analizzati.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

