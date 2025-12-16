'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import DashboardLayout from '@/components/DashboardLayout'

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
  recommendations: string[]
  playerPerformance: Array<{
    heroId: number
    kills: number
    deaths: number
    assists: number
    gpm: number
    xpm: number
    rating: string
  }>
}

export default function MatchAnalysisPage() {
  const params = useParams()
  const matchId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const [match, setMatch] = useState<MatchData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [timeline, setTimeline] = useState<any>(null)

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

  const handleSaveAnalysis = async () => {
    if (!match || !analysis) return

    if (!user) {
      if (confirm('Please sign in to save your analysis. Would you like to go to the login page?')) {
        router.push('/auth/login')
      }
      return
    }

    try {
      setSaving(true)

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('match_analyses')
        .upsert({
          user_id: user.id,
          match_id: parseInt(matchId),
          analysis_data: {
            match: match,
            analysis: analysis,
            saved_at: new Date().toISOString()
          }
        }, {
          onConflict: 'user_id,match_id'
        })

      if (saveError) throw saveError

      // Update user stats (if function exists)
      try {
        const { error: statsError } = await supabase.rpc('add_user_xp', {
          p_user_id: user.id,
          p_xp: 50 // XP for saving an analysis
        })
        if (statsError) console.error('Failed to update XP:', statsError)
      } catch (rpcError) {
        // RPC might not exist yet, ignore
        console.log('XP update skipped (RPC might not be configured)')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save analysis:', err)
      alert(`Failed to save analysis: ${err instanceof Error ? err.message : 'Please try again.'}`)
    } finally {
      setSaving(false)
    }
  }

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
            <div className={`text-2xl font-bold mb-2 ${match.radiant_win ? 'text-green-400' : 'text-red-400'}`}>
              {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
            </div>
            <button
              onClick={handleSaveAnalysis}
              disabled={saving || saved}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                saved
                  ? 'bg-green-600 text-white'
                  : saving
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {saved ? '✓ Salvato!' : saving ? 'Salvataggio...' : '💾 Salva Analisi'}
            </button>
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
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
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
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Eventi Chiave</h4>
              <div className="flex flex-wrap gap-2">
                {timeline.keyEvents.map((event: any, idx: number) => (
                  <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {event.minute}' - {event.event}
                  </span>
                ))}
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
            
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-blue-300 mb-2">💡 Consigli Personalizzati:</h4>
                <ul className="list-disc list-inside space-y-2 text-blue-200">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

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

          {/* Player Performance Ratings */}
          {analysis.playerPerformance && analysis.playerPerformance.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">📊 Performance Ratings</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.playerPerformance.map((perf, idx) => (
                  <div key={idx} className="border border-gray-700 rounded-lg p-4 bg-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">{getHeroName(perf.heroId)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        perf.rating === 'good' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {perf.rating === 'good' ? '✓ Buona' : '⚠️ Migliorabile'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      K/D/A: {perf.kills}/{perf.deaths}/{perf.assists} | GPM: {perf.gpm} | XPM: {perf.xpm}
                    </div>
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