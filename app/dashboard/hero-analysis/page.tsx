'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import HeroCard from '@/components/HeroCard'
import AttributeIcon from '@/components/AttributeIcon'
import Link from 'next/link'
import { Swords, TrendingUp, Search, Target, AlertCircle, CheckCircle } from 'lucide-react'

interface HeroStat {
  hero_id: number
  hero_name: string
  games: number
  wins: number
  losses: number
  winrate: number
  kda: string
  avg_kills: string
  avg_deaths: string
  avg_assists: string
  avg_gpm: string
  avg_xpm: string
  rating: string
  primary_attr: string
  roles: string[]
}

interface HeroAnalysis {
  heroStats: HeroStat[]
  bestHeroes: HeroStat[]
  worstHeroes: HeroStat[]
  overall: {
    totalGames: number
    totalWins: number
    overallWinrate: string
    diverseHeroes: number
    totalHeroesPlayed: number
  }
  mostPlayed: HeroStat | null
  roleStats: Record<string, { games: number; wins: number; winrate: number }>
  insights: string[]
}

interface Matchup {
  playerHeroId: number
  playerHeroName: string
  playerHeroInternalName: string
  matchups: Array<{
    enemyHeroId: number
    enemyHeroName: string
    enemyHeroInternalName: string
    games: number
    wins: number
    winrate: number
  }>
  totalMatchups: number
}

interface MatchupData {
  matchups: Matchup[]
  summary: {
    totalMatches: number
    totalHeroes: number
    totalMatchups: number
  }
  insights: string[]
}

interface HeroTrendData {
  hero_id: number
  hero_name: string
  periods: Array<{
    period: string
    games: number
    wins: number
    winrate: number
    avgKDA: number
  }>
}

type TabType = 'matchup' | 'trend' | 'details'

export default function HeroAnalysisPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [analysis, setAnalysis] = useState<HeroAnalysis | null>(null)
  const [matchupData, setMatchupData] = useState<MatchupData | null>(null)
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [matchupLoading, setMatchupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedHeroForMatchup, setSelectedHeroForMatchup] = useState<number | null>(null)
  const [selectedEnemyHero, setSelectedEnemyHero] = useState<number | null>(null)
  const [selectedHeroForDetails, setSelectedHeroForDetails] = useState<number | null>(null)
  const [selectedHeroForTrend, setSelectedHeroForTrend] = useState<number | null>(null)
  const [trendData, setTrendData] = useState<HeroTrendData[]>([])
  const [trendLoading, setTrendLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('matchup')

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

      const response = await fetch(`/api/player/${playerId}/hero-analysis`)
      if (!response.ok) throw new Error('Failed to fetch hero analysis')

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hero analysis')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  const fetchMatchups = useCallback(async () => {
    if (!playerId) return

    try {
      setMatchupLoading(true)
      const response = await fetch(`/api/player/${playerId}/matchups`)
      if (!response.ok) throw new Error('Failed to fetch matchups')

      const data = await response.json()
      setMatchupData(data)
    } catch (err) {
      console.error('Error fetching matchups:', err)
    } finally {
      setMatchupLoading(false)
    }
  }, [playerId])

  const fetchTrendData = useCallback(async () => {
    if (!playerId || !selectedHeroForTrend) return

    try {
      setTrendLoading(true)
      // Use backend API instead of direct OpenDota calls
      const response = await fetch(`/api/player/${playerId}/hero-analysis`)
      if (!response.ok) return

      const data = await response.json()
      if (!data || !data.heroStats) return

      // Extract matches from response
      const matches = data.matches || []
      if (matches.length === 0) return

      // Use cached match data from API response
      const matchesToFetch = matches.slice(0, 50)
      const fullMatches = data.fullMatches || []

      // Group matches by period (last 10, 20, 30, 50 matches) for selected hero
      const heroMatches = fullMatches
        .map((match: any, idx: number) => {
          if (!match?.players) return null
          const listMatch = matchesToFetch[idx]
          if (!listMatch) return null
          
          const player = match.players.find((p: any) => 
            p.player_slot === listMatch.player_slot
          )
          if (!player || player.hero_id !== selectedHeroForTrend) return null

          const playerTeam = listMatch.player_slot < 128 ? 'radiant' : 'dire'
          const won = (playerTeam === 'radiant' && match.radiant_win) || (playerTeam === 'dire' && !match.radiant_win)
          const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : (player.kills + player.assists)

          return {
            match_id: match.match_id,
            start_time: match.start_time,
            won,
            kda,
            games: 1,
          }
        })
        .filter((m: any) => m !== null)
        .reverse() // Most recent first

      if (heroMatches.length === 0) return

      // Calculate periods
      const periods = [
        { name: 'Ultime 10', count: Math.min(10, heroMatches.length) },
        { name: 'Ultime 20', count: Math.min(20, heroMatches.length) },
        { name: 'Ultime 30', count: Math.min(30, heroMatches.length) },
        { name: 'Ultime 50', count: heroMatches.length },
      ]

      const trendPeriods = periods.map(period => {
        const periodMatches = heroMatches.slice(0, period.count)
        const wins = periodMatches.filter((m: any) => m.won).length
        const avgKDA = periodMatches.reduce((sum: number, m: any) => sum + m.kda, 0) / periodMatches.length

        return {
          period: period.name,
          games: periodMatches.length,
          wins,
          winrate: (wins / periodMatches.length) * 100,
          avgKDA: parseFloat(avgKDA.toFixed(2)),
        }
      })

      const heroName = heroes[selectedHeroForTrend]?.localized_name || `Hero ${selectedHeroForTrend}`
      setTrendData([{
        hero_id: selectedHeroForTrend,
        hero_name: heroName,
        periods: trendPeriods,
      }])
    } catch (err) {
      console.error('Error fetching trend data:', err)
    } finally {
      setTrendLoading(false)
    }
  }, [playerId, selectedHeroForTrend, heroes])

  useEffect(() => {
    if (playerId) {
      fetchAnalysis()
      fetchMatchups()
    }
  }, [playerId, fetchAnalysis, fetchMatchups])

  useEffect(() => {
    if (selectedHeroForTrend) {
      fetchTrendData()
    }
  }, [selectedHeroForTrend, fetchTrendData])

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
        pageTitle="Analisi Eroi"
        title="Inserisci Player ID"
        description="Analisi approfondita per decisioni di pick/ban e matchup. Scopri quali heroes pickare contro nemici specifici e come migliorare le tue performance."
      />
    )
  }

  // Calculate Counter Analysis: which heroes to pick against specific enemies
  const getCounterAnalysis = (enemyHeroId: number) => {
    if (!matchupData) return []

    const counters: Array<{
      heroId: number
      heroName: string
      heroInternalName: string
      winrate: number
      games: number
    }> = []

    matchupData.matchups.forEach(matchup => {
      const enemyMatchup = matchup.matchups.find(m => m.enemyHeroId === enemyHeroId)
      if (enemyMatchup && enemyMatchup.games >= 2) {
        counters.push({
          heroId: matchup.playerHeroId,
          heroName: matchup.playerHeroName,
          heroInternalName: matchup.playerHeroInternalName,
          winrate: enemyMatchup.winrate,
          games: enemyMatchup.games,
        })
      }
    })

    return counters
      .sort((a, b) => {
        // Sort by winrate first, then by games
        if (Math.abs(a.winrate - b.winrate) > 5) {
          return b.winrate - a.winrate
        }
        return b.games - a.games
      })
      .slice(0, 10)
  }

  // Get pick recommendations for a hero
  const getPickRecommendations = (heroId: number) => {
    if (!matchupData) return { favorable: [], unfavorable: [] }

    const matchup = matchupData.matchups.find(m => m.playerHeroId === heroId)
    if (!matchup) return { favorable: [], unfavorable: [] }

    const favorable = matchup.matchups
      .filter(m => m.games >= 3 && m.winrate >= 60)
      .sort((a, b) => b.winrate - a.winrate)
      .slice(0, 5)

    const unfavorable = matchup.matchups
      .filter(m => m.games >= 3 && m.winrate <= 40)
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 5)

    return { favorable, unfavorable }
  }

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
        ← Torna a Dashboard
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Analisi Eroi</h1>
      <p className="text-gray-400 mb-6">Decisioni di pick/ban e analisi matchup per migliorare le tue performance</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {[
              { id: 'matchup' as TabType, name: 'Matchup & Counters', icon: Swords },
              { id: 'trend' as TabType, name: 'Performance Trend', icon: TrendingUp },
              { id: 'details' as TabType, name: 'Dettagli Hero', icon: Search },
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
            {/* Matchup Tab */}
            {activeTab === 'matchup' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold">Matchup & Counter Analysis</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Analizza le tue performance hero vs hero e scopri quali heroes pickare contro nemici specifici
                    </p>
                  </div>
                  {matchupLoading && (
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  )}
                </div>

                {matchupData && matchupData.matchups.length > 0 ? (
                  <div className="space-y-6">
                    {/* Matchup Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <h3 className="text-sm text-gray-400 mb-1">Partite Analizzate</h3>
                        <p className="text-2xl font-bold">{matchupData.summary.totalMatches}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <h3 className="text-sm text-gray-400 mb-1">Heroes con Matchup</h3>
                        <p className="text-2xl font-bold">{matchupData.summary.totalHeroes}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <h3 className="text-sm text-gray-400 mb-1">Matchup Totali</h3>
                        <p className="text-2xl font-bold">{matchupData.summary.totalMatchups}</p>
                      </div>
                    </div>

                    {/* Matchup Insights */}
                    {matchupData.insights.length > 0 && (
                      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2 text-purple-200 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Matchup Insights
                        </h3>
                        <ul className="space-y-1">
                          {matchupData.insights.map((insight, idx) => (
                            <li key={idx} className="text-purple-300 text-sm">• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Counter Analysis Section */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Counter Analysis: Quali Heroes Pickare Contro un Nemico
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Seleziona un eroe nemico per vedere quali tuoi heroes performano meglio contro di lui
                      </p>
                      
                      {/* Enemy Hero Selector */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(
                            matchupData.matchups.flatMap(m => m.matchups.map(e => e.enemyHeroId))
                          )).slice(0, 20).map((enemyHeroId) => {
                            const enemyHero = heroes[enemyHeroId]
                            if (!enemyHero) return null
                            
                            return (
                              <button
                                key={enemyHeroId}
                                onClick={() => setSelectedEnemyHero(
                                  selectedEnemyHero === enemyHeroId ? null : enemyHeroId
                                )}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  selectedEnemyHero === enemyHeroId
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                <HeroCard
                                  heroId={enemyHeroId}
                                  heroName={enemyHero.name}
                                  size="sm"
                                />
                                <span>{enemyHero.localized_name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Counter Results */}
                      {selectedEnemyHero && (() => {
                        const counters = getCounterAnalysis(selectedEnemyHero)
                        const enemyHeroName = heroes[selectedEnemyHero]?.localized_name || `Hero ${selectedEnemyHero}`
                        
                        return (
                          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                            <h4 className="text-base font-semibold mb-3">
                              Heroes da Pickare Contro {enemyHeroName}
                            </h4>
                            {counters.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {counters.map((counter) => (
                                  <div
                                    key={counter.heroId}
                                    className={`bg-gray-800/50 rounded-lg p-3 border ${
                                      counter.winrate >= 60 ? 'border-green-500' :
                                      counter.winrate >= 50 ? 'border-blue-500' :
                                      'border-gray-600'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <HeroCard
                                        heroId={counter.heroId}
                                        heroName={counter.heroInternalName}
                                        size="sm"
                                      />
                                      <span className="font-medium text-white text-sm">{counter.heroName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-400">Winrate</span>
                                      <span className={`text-sm font-bold ${
                                        counter.winrate >= 60 ? 'text-green-400' :
                                        counter.winrate >= 50 ? 'text-blue-400' :
                                        'text-red-400'
                                      }`}>
                                        {counter.winrate.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs text-gray-400">Partite</span>
                                      <span className="text-sm text-gray-300">{counter.games}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm">
                                Nessun dato matchup disponibile contro {enemyHeroName}. Gioca più partite per vedere le analisi.
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Hero Matchup Analysis */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Swords className="w-5 h-5" />
                        Analisi Matchup per Hero
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Seleziona un tuo hero per vedere le performance contro nemici specifici e le raccomandazioni di pick
                      </p>

                      {/* Hero Selector */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {matchupData.matchups.map((matchup) => (
                            <button
                              key={matchup.playerHeroId}
                              onClick={() => setSelectedHeroForMatchup(
                                selectedHeroForMatchup === matchup.playerHeroId ? null : matchup.playerHeroId
                              )}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedHeroForMatchup === matchup.playerHeroId
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              <HeroCard
                                heroId={matchup.playerHeroId}
                                heroName={matchup.playerHeroInternalName}
                                size="sm"
                              />
                              <span>{matchup.playerHeroName} ({matchup.totalMatchups} matchup)</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Hero Matchups & Recommendations */}
                      {selectedHeroForMatchup && (() => {
                        const selectedMatchup = matchupData.matchups.find(
                          m => m.playerHeroId === selectedHeroForMatchup
                        )
                        if (!selectedMatchup) return null

                        const sortedMatchups = [...selectedMatchup.matchups].sort(
                          (a, b) => b.winrate - a.winrate
                        )
                        const recommendations = getPickRecommendations(selectedHeroForMatchup)

                        return (
                          <div className="space-y-4">
                            {/* Pick Recommendations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Favorable Matchups */}
                              {recommendations.favorable.length > 0 && (
                                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                                  <h4 className="text-base font-semibold mb-3 text-green-400 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Matchup Favorabili (Pick Consigliato)
                                  </h4>
                                  <div className="space-y-2">
                                    {recommendations.favorable.map((matchup) => (
                                      <div key={matchup.enemyHeroId} className="flex items-center justify-between bg-gray-800/50 rounded p-2">
                                        <div className="flex items-center gap-2">
                                          <HeroCard
                                            heroId={matchup.enemyHeroId}
                                            heroName={matchup.enemyHeroInternalName}
                                            size="sm"
                                          />
                                          <span className="text-sm text-white">{matchup.enemyHeroName}</span>
                                        </div>
                                        <span className="text-sm font-bold text-green-400">
                                          {matchup.winrate.toFixed(1)}% ({matchup.games} partite)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Unfavorable Matchups */}
                              {recommendations.unfavorable.length > 0 && (
                                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                                  <h4 className="text-base font-semibold mb-3 text-red-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Matchup Sfavorevoli (Evita o Banna)
                                  </h4>
                                  <div className="space-y-2">
                                    {recommendations.unfavorable.map((matchup) => (
                                      <div key={matchup.enemyHeroId} className="flex items-center justify-between bg-gray-800/50 rounded p-2">
                                        <div className="flex items-center gap-2">
                                          <HeroCard
                                            heroId={matchup.enemyHeroId}
                                            heroName={matchup.enemyHeroInternalName}
                                            size="sm"
                                          />
                                          <span className="text-sm text-white">{matchup.enemyHeroName}</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-400">
                                          {matchup.winrate.toFixed(1)}% ({matchup.games} partite)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* All Matchups Table */}
                            <div className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-600 bg-gray-700/50">
                                <h4 className="text-base font-semibold">
                                  Tutti i Matchup per {selectedMatchup.playerHeroName}
                                </h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-600">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Eroe Nemico</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Partite</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Vittorie</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Winrate</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-600">
                                    {sortedMatchups.map((matchup) => (
                                      <tr key={matchup.enemyHeroId} className="hover:bg-gray-600/50">
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <HeroCard
                                              heroId={matchup.enemyHeroId}
                                              heroName={matchup.enemyHeroInternalName}
                                              size="sm"
                                            />
                                            <span className="text-white font-medium text-sm">{matchup.enemyHeroName}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-300 text-sm">{matchup.games}</td>
                                        <td className="px-4 py-3 text-gray-300 text-sm">{matchup.wins}</td>
                                        <td className="px-4 py-3">
                                          <span
                                            className={`font-semibold text-sm ${
                                              matchup.winrate >= 60
                                                ? 'text-green-400'
                                                : matchup.winrate >= 40
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                            }`}
                                          >
                                            {matchup.winrate.toFixed(1)}%
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                ) : matchupData && !matchupLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>Nessun dato matchup disponibile. Gioca più partite per vedere le analisi.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Performance Trend Tab */}
            {activeTab === 'trend' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">Performance Trend per Hero</h2>
                  <p className="text-gray-400 text-sm">
                    Visualizza come è cambiata la tua performance con un hero nel tempo
                  </p>
                </div>

                {/* Hero Selector for Trend */}
                {analysis && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-base font-semibold mb-3">Seleziona Hero</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.heroStats
                        .filter(h => h.games >= 5)
                        .slice(0, 20)
                        .map((hero) => (
                          <button
                            key={hero.hero_id}
                            onClick={() => {
                              setSelectedHeroForTrend(hero.hero_id)
                              setTrendData([])
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedHeroForTrend === hero.hero_id
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {heroes[hero.hero_id] && (
                              <HeroCard
                                heroId={hero.hero_id}
                                heroName={heroes[hero.hero_id].name}
                                size="sm"
                              />
                            )}
                            <span>{hero.hero_name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Trend Chart */}
                {trendLoading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="mt-2 text-gray-400 text-sm">Caricamento trend...</p>
                  </div>
                )}

                {!trendLoading && trendData.length > 0 && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Trend Performance: {trendData[0].hero_name}
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
                              <span className="text-xs text-gray-400">Partite</span>
                              <span className="text-sm text-gray-300">{period.games}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!trendLoading && !selectedHeroForTrend && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Seleziona un hero per vedere il trend di performance</p>
                  </div>
                )}

                {!trendLoading && selectedHeroForTrend && trendData.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Nessun dato disponibile per questo hero. Gioca più partite per vedere il trend.</p>
                  </div>
                )}
              </div>
            )}

            {/* Hero Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">Dettagli Hero</h2>
                  <p className="text-gray-400 text-sm">
                    Visualizza statistiche dettagliate e performance per un hero specifico
                  </p>
                </div>

                {/* Hero Selector for Details */}
                {analysis && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-base font-semibold mb-3">Seleziona Hero</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.heroStats
                        .sort((a, b) => b.games - a.games)
                        .map((hero) => (
                          <button
                            key={hero.hero_id}
                            onClick={() => setSelectedHeroForDetails(hero.hero_id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedHeroForDetails === hero.hero_id
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {heroes[hero.hero_id] && (
                              <HeroCard
                                heroId={hero.hero_id}
                                heroName={heroes[hero.hero_id].name}
                                size="sm"
                              />
                            )}
                            <span>{hero.hero_name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Hero Details */}
                {selectedHeroForDetails && analysis && (() => {
                  const hero = analysis.heroStats.find(h => h.hero_id === selectedHeroForDetails)
                  if (!hero) return null

                  const recommendations = matchupData ? getPickRecommendations(selectedHeroForDetails) : { favorable: [], unfavorable: [] }

                  return (
                    <div className="space-y-4">
                      {/* Hero Stats Card */}
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center gap-4 mb-4">
                          {heroes[hero.hero_id] && (
                            <HeroCard
                              heroId={hero.hero_id}
                              heroName={heroes[hero.hero_id].name}
                              size="md"
                            />
                          )}
                          <div>
                            <h3 className="text-xl font-semibold text-white">{hero.hero_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {hero.primary_attr && hero.primary_attr !== 'unknown' && (
                                <AttributeIcon
                                  attribute={hero.primary_attr as 'str' | 'agi' | 'int'}
                                  size="sm"
                                />
                              )}
                              {hero.roles && hero.roles.length > 0 && (
                                <div className="flex gap-1">
                                  {hero.roles.slice(0, 3).map((role, idx) => (
                                    <span key={idx} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded capitalize">
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <h4 className="text-xs text-gray-400 mb-1">Partite</h4>
                            <p className="text-2xl font-bold">{hero.games}</p>
                            <p className="text-xs text-gray-500 mt-1">{hero.wins}W / {hero.losses}L</p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <h4 className="text-xs text-gray-400 mb-1">Winrate</h4>
                            <p className={`text-2xl font-bold ${
                              hero.winrate >= 55 ? 'text-green-400' :
                              hero.winrate >= 50 ? 'text-blue-400' :
                              'text-red-400'
                            }`}>
                              {hero.winrate.toFixed(1)}%
                            </p>
                            <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                              hero.rating === 'Eccellente' ? 'bg-green-600 text-white' :
                              hero.rating === 'Buona' ? 'bg-blue-600 text-white' :
                              hero.rating === 'Media' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {hero.rating}
                            </span>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <h4 className="text-xs text-gray-400 mb-1">KDA</h4>
                            <p className="text-2xl font-bold">{hero.kda}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {hero.avg_kills}K / {hero.avg_deaths}D / {hero.avg_assists}A
                            </p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <h4 className="text-xs text-gray-400 mb-1">Farm</h4>
                            <p className="text-lg font-bold">{hero.avg_gpm || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">GPM</p>
                            {hero.avg_xpm && (
                              <p className="text-xs text-gray-400">{hero.avg_xpm} XPM</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pick Recommendations */}
                      {matchupData && (recommendations.favorable.length > 0 || recommendations.unfavorable.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {recommendations.favorable.length > 0 && (
                            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                              <h4 className="text-base font-semibold mb-3 text-green-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Pick Consigliato Contro
                              </h4>
                              <div className="space-y-2">
                                {recommendations.favorable.map((matchup) => (
                                  <div key={matchup.enemyHeroId} className="flex items-center justify-between bg-gray-800/50 rounded p-2">
                                    <div className="flex items-center gap-2">
                                      <HeroCard
                                        heroId={matchup.enemyHeroId}
                                        heroName={matchup.enemyHeroInternalName}
                                        size="sm"
                                      />
                                      <span className="text-sm text-white">{matchup.enemyHeroName}</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-400">
                                      {matchup.winrate.toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {recommendations.unfavorable.length > 0 && (
                            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                              <h4 className="text-base font-semibold mb-3 text-red-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Evita o Banna Contro
                              </h4>
                              <div className="space-y-2">
                                {recommendations.unfavorable.map((matchup) => (
                                  <div key={matchup.enemyHeroId} className="flex items-center justify-between bg-gray-800/50 rounded p-2">
                                    <div className="flex items-center gap-2">
                                      <HeroCard
                                        heroId={matchup.enemyHeroId}
                                        heroName={matchup.enemyHeroInternalName}
                                        size="sm"
                                      />
                                      <span className="text-sm text-white">{matchup.enemyHeroName}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-400">
                                      {matchup.winrate.toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Link to Builds */}
                      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-semibold text-blue-200 mb-1">Build & Items</h4>
                            <p className="text-sm text-blue-300">
                              Visualizza build e items consigliati per {hero.hero_name}
                            </p>
                          </div>
                          <Link
                            href="/dashboard/builds"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Vai a Builds
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {!selectedHeroForDetails && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Seleziona un hero per vedere i dettagli</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
