'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

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

export default function MatchAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params)
  const [match, setMatch] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true)
        // Try backend first, fallback to OpenDota directly
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        
        let response
        try {
          response = await fetch(`${backendUrl}/opendota/match/${matchId}`)
        } catch {
          // Fallback to OpenDota API directly if backend is down
          response = await fetch(`https://api.opendota.com/api/matches/${matchId}`)
        }

        if (!response.ok) throw new Error('Failed to fetch match')
        
        const data = await response.json()
        setMatch(data)
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading match data...</p>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Match</h2>
          <p className="text-red-600">{error || 'Match not found'}</p>
          <a href="/" className="inline-block mt-4 text-red-600 hover:text-red-800">
            ← Back to Home
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Match Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Match {matchId}</h1>
            <p className="text-gray-600">Duration: {formatDuration(match.duration)}</p>
          </div>
          <div className={`text-2xl font-bold ${match.radiant_win ? 'text-green-600' : 'text-red-600'}`}>
            {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
          </div>
        </div>
        <div className="flex justify-center items-center gap-8 text-4xl font-bold">
          <span className="text-green-600">{match.radiant_score}</span>
          <span className="text-gray-400">-</span>
          <span className="text-red-600">{match.dire_score}</span>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Player Performance</h2>
        </div>
        
        {/* Radiant Team */}
        <div className="p-6 bg-green-50">
          <h3 className="font-semibold text-green-800 mb-3">Radiant</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-2">Hero</th>
                  <th className="pb-2">K/D/A</th>
                  <th className="pb-2">LH/D</th>
                  <th className="pb-2">GPM</th>
                  <th className="pb-2">XPM</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {match.players.slice(0, 5).map((player, idx) => (
                  <tr key={idx} className="border-t border-green-200">
                    <td className="py-2">Hero {player.hero_id}</td>
                    <td className="py-2 font-semibold">
                      {player.kills}/{player.deaths}/{player.assists}
                    </td>
                    <td className="py-2">{player.last_hits}/{player.denies}</td>
                    <td className="py-2">{player.gold_per_min}</td>
                    <td className="py-2">{player.xp_per_min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dire Team */}
        <div className="p-6 bg-red-50">
          <h3 className="font-semibold text-red-800 mb-3">Dire</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-2">Hero</th>
                  <th className="pb-2">K/D/A</th>
                  <th className="pb-2">LH/D</th>
                  <th className="pb-2">GPM</th>
                  <th className="pb-2">XPM</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {match.players.slice(5, 10).map((player, idx) => (
                  <tr key={idx} className="border-t border-red-200">
                    <td className="py-2">Hero {player.hero_id}</td>
                    <td className="py-2 font-semibold">
                      {player.kills}/{player.deaths}/{player.assists}
                    </td>
                    <td className="py-2">{player.last_hits}/{player.denies}</td>
                    <td className="py-2">{player.gold_per_min}</td>
                    <td className="py-2">{player.xp_per_min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Analysis Section (Coming Soon) */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🤖 AI Analysis Coming Soon</h3>
        <p className="text-blue-700">
          Advanced insights on farm efficiency, positioning, teamfight participation, and itemization will be available soon.
        </p>
      </div>
    </div>
  )
}