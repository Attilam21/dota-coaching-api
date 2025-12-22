'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import DashboardLayout from '@/components/DashboardLayout'
import HeroIcon from '@/components/HeroIcon'

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

export default function MatchAnalysisPage() {
  const params = useParams()
  const matchId = params.id as string
  const { user } = useAuth()
  const [match, setMatch] = useState<MatchData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [timeline, setTimeline] = useState<any>(null)

  useEffect(() => {
    // Fetch heroes list
    let isMounted = true
    
    const fetchHeroes = async () => {
      try {
        const response = await fetch('/api/opendota/heroes')
        if (response.ok && isMounted) {
          const heroesData = await response.json()
          if (Array.isArray(heroesData)) {
            const heroesMap: Record<number, { name: string; localized_name: string }> = {}
            heroesData.forEach((hero: { id: number; name: string; localized_name: string }) => {
              // Only save heroes with valid name and localized_name
              if (hero.name && hero.localized_name) {
                heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
              }
            })
            setHeroes(heroesMap)
          }
        }
      } catch (err) {
        console.error('Failed to fetch heroes:', err)
      }
    }
    fetchHeroes()
    
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true)
        // Try API route first (uses OpenDota)
        let response = await fetch(`/api/opendota/match/${matchId}`)
        
        if (!response.ok) {
          // Fallback to OpenDota API directly
          response = await fetch(`https://api.opendota.com/api/matches/${matchId}`)
        }

        if (!response.ok) throw new Error('Failed to fetch match')
        
        const data = await response.json()
        setMatch(data)

        // Fetch timeline data
        try {
          const timelineResponse = await fetch(`/api/match/${matchId}/timeline`)
          if (timelineResponse.ok) {
            const timelineData = await timelineResponse.json()
            setTimeline(timelineData)
          }
        } catch (err) {
          console.error('Failed to fetch timeline:', err)
        }

        // Fetch AI analysis
        try {
          const analysisResponse = await fetch(`/api/analysis/match/${matchId}`)
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json()
            setAnalysis(analysisData)
          }
        } catch (err) {
          console.error('Failed to fetch analysis:', err)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchMatch()
  }, [matchId])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Loading match data...</p>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="p-8">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-200 mb-2">Error Loading Match</h2>
          <p className="text-red-300">{error || 'Match not found'}</p>
          <a href="/dashboard" className="inline-block mt-4 text-red-400 hover:text-red-300">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

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

  // Prepare chart data
  const gpmData = match?.players.map((player, idx) => ({
    name: getHeroName(player.hero_id).substring(0, 10),
    'GPM': player.gold_per_min,
    'XPM': player.xp_per_min
  })) || []

  const kdaData = match?.players.map((player) => ({
    name: getHeroName(player.hero_id).substring(0, 10),
    'Kills': player.kills,
    'Deaths': player.deaths,
    'Assists': player.assists
  })) || []

  return (
    <DashboardLayout>
    <div className="p-8">
      {/* Match Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Match {matchId}</h1>
            <p className="text-gray-400">Duration: {formatDuration(match.duration)}</p>
            {match.start_time && (
              <p className="text-gray-500 text-sm mt-1">{formatDate(match.start_time)}</p>
            )}
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${match.radiant_win ? 'text-green-400' : 'text-red-400'}`}>
              {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center gap-8 text-4xl font-bold">
          <span className="text-green-400">{match.radiant_score || 0}</span>
          <span className="text-gray-500">-</span>
          <span className="text-red-400">{match.dire_score || 0}</span>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Player Performance</h2>
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
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <HeroIcon
                          heroId={player.hero_id}
                          heroName={heroes[player.hero_id]?.name}
                          size={32}
                          className="rounded"
                        />
                        <span className="font-medium text-white">{getHeroName(player.hero_id)}</span>
                      </div>
                    </td>
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
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <HeroIcon
                          heroId={player.hero_id}
                          heroName={heroes[player.hero_id]?.name}
                          size={32}
                          className="rounded"
                        />
                        <span className="font-medium text-white">{getHeroName(player.hero_id)}</span>
                      </div>
                    </td>
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
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Timeline Partita - Gold & XP Advantage</h3>
          <p className="text-sm text-gray-400 mb-4">
            Grafico basato su dati reali da OpenDota. Gli eventi mostrati sono eventi reali della partita.
          </p>
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
              <h4 className="text-sm font-semibold text-gray-400 mb-3">📅 Eventi Reali della Partita</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {timeline.keyEvents.map((event: any, idx: number) => {
                  const timeStr = `${event.minute}:${String(event.second || 0).padStart(2, '0')}`
                  const getEventColor = () => {
                    switch (event.type) {
                      case 'first_blood':
                        return 'bg-red-900/50 border-red-700 text-red-300'
                      case 'kill':
                        return 'bg-orange-900/50 border-orange-700 text-orange-300'
                      case 'tower':
                        return 'bg-yellow-900/50 border-yellow-700 text-yellow-300'
                      case 'roshan':
                        return 'bg-purple-900/50 border-purple-700 text-purple-300'
                      case 'match_start':
                        return 'bg-green-900/50 border-green-700 text-green-300'
                      case 'match_end':
                        return event.team === 'radiant' 
                          ? 'bg-blue-900/50 border-blue-700 text-blue-300'
                          : 'bg-red-900/50 border-red-700 text-red-300'
                      default:
                        return 'bg-gray-700 border-gray-600 text-gray-300'
                    }
                  }
                  
                  const getEventIcon = () => {
                    switch (event.type) {
                      case 'first_blood':
                        return '🩸'
                      case 'kill':
                        return '⚔️'
                      case 'tower':
                        return '🏰'
                      case 'roshan':
                        return '🐉'
                      case 'match_start':
                        return '▶️'
                      case 'match_end':
                        return '🏆'
                      default:
                        return '•'
                    }
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getEventColor()}`}
                    >
                      <span className="text-xs font-mono font-semibold min-w-[50px]">{timeStr}</span>
                      <span className="text-sm">{getEventIcon()}</span>
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
      <div className="grid md:grid-cols-2 gap-6 mt-6">
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
        <div className="mt-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-6">
            <h3 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center gap-2">
              🤖 AI Analysis & Insights
            </h3>
            <p className="text-blue-200 mb-4">{analysis.overview}</p>

            {analysis.keyMoments && analysis.keyMoments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-blue-300 mb-2">⏱️ Momenti Chiave:</h4>
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

          {/* Team Comparison */}
          {analysis.teamStats && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">⚔️ Confronto Team</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <h4 className="font-semibold text-green-400 mb-3">Radiant</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">GPM Medio:</span>
                      <span className="text-green-400 font-semibold">{analysis.teamStats.radiant.avgGpm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">KDA Medio:</span>
                      <span className="text-green-400 font-semibold">{analysis.teamStats.radiant.avgKda}</span>
                    </div>
                    {analysis.teamStats.radiant.totalDamage && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">Hero Damage:</span>
                        <span className="text-green-400 font-semibold">
                          {(analysis.teamStats.radiant.totalDamage / 1000).toFixed(1)}K
                        </span>
                      </div>
                    )}
                    {analysis.teamStats.radiant.totalWards !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">Wards:</span>
                        <span className="text-green-400 font-semibold">{analysis.teamStats.radiant.totalWards}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-3">Dire</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">GPM Medio:</span>
                      <span className="text-red-400 font-semibold">{analysis.teamStats.dire.avgGpm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">KDA Medio:</span>
                      <span className="text-red-400 font-semibold">{analysis.teamStats.dire.avgKda}</span>
                    </div>
                    {analysis.teamStats.dire.totalDamage && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">Hero Damage:</span>
                        <span className="text-red-400 font-semibold">
                          {(analysis.teamStats.dire.totalDamage / 1000).toFixed(1)}K
                        </span>
                      </div>
                    )}
                    {analysis.teamStats.dire.totalWards !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">Wards:</span>
                        <span className="text-red-400 font-semibold">{analysis.teamStats.dire.totalWards}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Player Performance Ratings */}
          {analysis.playerPerformance && analysis.playerPerformance.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">📊 Performance Dettagliate</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.playerPerformance.map((perf, idx) => (
                  <div key={idx} className="border border-gray-700 rounded-lg p-4 bg-gray-700/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-white">{getHeroName(perf.heroId)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        perf.rating === 'excellent' 
                          ? 'bg-blue-600 text-white'
                          : perf.rating === 'good' 
                          ? 'bg-green-600 text-white' 
                          : perf.rating === 'average'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {perf.rating === 'excellent' ? '⭐ Eccellente' :
                         perf.rating === 'good' ? '✓ Buona' :
                         perf.rating === 'average' ? '⚠️ Media' : '❌ Da migliorare'}
                      </span>
                    </div>
                    
                    {perf.role && (
                      <div className="mb-2">
                        <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">
                          {perf.role}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div><span className="text-gray-400">K/D/A:</span> <span className="text-white font-semibold">{perf.kills}/{perf.deaths}/{perf.assists}</span></div>
                      <div><span className="text-gray-400">GPM/XPM:</span> <span className="text-white font-semibold">{perf.gpm}/{perf.xpm}</span></div>
                      {perf.heroDamage !== undefined && (
                        <div><span className="text-gray-400">Hero Dmg:</span> <span className="text-red-400 font-semibold">{(perf.heroDamage / 1000).toFixed(1)}K</span></div>
                      )}
                      {perf.lastHits !== undefined && (
                        <div><span className="text-gray-400">LH/D:</span> <span className="text-green-400 font-semibold">{perf.lastHits}/{perf.denies || 0}</span></div>
                      )}
                      {perf.csPerMin && (
                        <div><span className="text-gray-400">CS/Min:</span> <span className="text-green-400 font-semibold">{perf.csPerMin}</span></div>
                      )}
                      {perf.farmEfficiency && (
                        <div><span className="text-gray-400">Farm Eff:</span> <span className="text-green-400 font-semibold">{perf.farmEfficiency}</span></div>
                      )}
                      {perf.killParticipation && (
                        <div><span className="text-gray-400">Kill Part:</span> <span className="text-blue-400 font-semibold">{perf.killParticipation}%</span></div>
                      )}
                      {perf.goldUtilization && (
                        <div><span className="text-gray-400">Gold Util:</span> <span className="text-purple-400 font-semibold">{perf.goldUtilization}%</span></div>
                      )}
                      {perf.supportScore && (
                        <div><span className="text-gray-400">Support Score:</span> <span className="text-cyan-400 font-semibold">{perf.supportScore}</span></div>
                      )}
                      {perf.carryImpactScore && (
                        <div><span className="text-gray-400">Impact Score:</span> <span className="text-orange-400 font-semibold">{perf.carryImpactScore}</span></div>
                      )}
                    </div>
                    
                    {(perf.stuns || perf.runePickups || perf.campsStacked || perf.roshKills || perf.firstBloodClaimed) && (
                      <div className="mb-3 pt-2 border-t border-gray-600 grid grid-cols-2 gap-2 text-xs">
                        {perf.stuns && (
                          <div><span className="text-gray-400">Stun:</span> <span className="text-gray-300">{perf.stuns}s</span></div>
                        )}
                        {perf.runePickups && (
                          <div><span className="text-gray-400">Rune:</span> <span className="text-gray-300">{perf.runePickups}</span></div>
                        )}
                        {perf.campsStacked && (
                          <div><span className="text-gray-400">Stacked:</span> <span className="text-gray-300">{perf.campsStacked}</span></div>
                        )}
                        {perf.roshKills && (
                          <div><span className="text-gray-400">Roshan:</span> <span className="text-orange-400 font-semibold">{perf.roshKills}</span></div>
                        )}
                        {perf.firstBloodClaimed && (
                          <div><span className="text-gray-400">First Blood:</span> <span className="text-red-400 font-semibold">✓</span></div>
                        )}
                        {perf.towersKilled && (
                          <div><span className="text-gray-400">Towers:</span> <span className="text-yellow-400">{perf.towersKilled}</span></div>
                        )}
                      </div>
                    )}
                    
                    {perf.roleRecommendations && perf.roleRecommendations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="text-xs font-semibold text-blue-400 mb-1">💡 Consigli Personalizzati:</p>
                        <ul className="text-xs text-gray-300 space-y-1">
                          {perf.roleRecommendations.slice(0, 3).map((rec, recIdx) => (
                            <li key={recIdx} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback message if no analysis */}
      {!analysis && !loading && (
        <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">🤖 AI Analysis</h3>
          <p className="text-blue-200">
            L'analisi AI avanzata è in caricamento. Le funzionalità includeranno insights su farm efficiency, positioning, teamfight participation e itemization.
          </p>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}