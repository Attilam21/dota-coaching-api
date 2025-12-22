'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import HeroCard from '@/components/HeroCard'
import HeroIcon from '@/components/HeroIcon'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { List, BarChart as BarChartIcon, Search, Filter, X, TrendingUp, Target, Lightbulb, Activity, CheckCircle, AlertCircle } from 'lucide-react'

interface Match {
  match_id: number
  player_slot: number
  radiant_win: boolean
  kills: number
  deaths: number
  assists: number
  gold_per_min?: number
  xp_per_min?: number
  start_time: number
  duration: number
  hero_id?: number
}

type TabType = 'overview' | 'list' | 'insights'

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [matches, setMatches] = useState<Match[]>([])
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Filter states
  const [filterWin, setFilterWin] = useState<'all' | 'win' | 'loss'>('all')
  const [filterHero, setFilterHero] = useState<number | 'all'>('all')
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all')
  const [filterDate, setFilterDate] = useState<'all' | 'week' | 'month'>('all')
  const [searchMatchId, setSearchMatchId] = useState<string>('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Fetch heroes list
    fetch('/api/opendota/heroes')
      .then((res) => res.json())
      .then((data) => {
        const heroesMap: Record<number, { name: string; localized_name: string }> = {}
        data.forEach((hero: { id: number; name: string; localized_name: string }) => {
          heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
        })
        setHeroes(heroesMap)
      })
      .catch(console.error)
  }, [])

  const fetchMatches = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch matches')

      const data = await response.json()
      // Extract matches from response (matches are at root level, not in stats)
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchMatches()
    }
  }, [playerId, fetchMatches])

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
        pageTitle="Partite"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le tue ultime partite. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const getHeroName = (heroId?: number) => {
    if (!heroId) return 'Sconosciuto'
    return heroes[heroId]?.localized_name || `Hero ${heroId}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isWin = (match: Match) => {
    return (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win)
  }

  const getKDA = (match: Match) => {
    return ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2)
  }

  // Filter matches based on active filters
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // Win/Loss filter
      if (filterWin !== 'all') {
        const win = isWin(match)
        if (filterWin === 'win' && !win) return false
        if (filterWin === 'loss' && win) return false
      }

      // Hero filter
      if (filterHero !== 'all' && match.hero_id !== filterHero) return false

      // Duration filter
      if (filterDuration !== 'all') {
        const durationMinutes = match.duration / 60
        if (filterDuration === 'short' && durationMinutes >= 30) return false
        if (filterDuration === 'medium' && (durationMinutes < 30 || durationMinutes > 45)) return false
        if (filterDuration === 'long' && durationMinutes <= 45) return false
      }

      // Date filter
      if (filterDate !== 'all') {
        const matchDate = new Date(match.start_time * 1000)
        const now = new Date()
        const diffTime = now.getTime() - matchDate.getTime()
        const diffDays = diffTime / (1000 * 60 * 60 * 24)
        
        if (filterDate === 'week' && diffDays > 7) return false
        if (filterDate === 'month' && diffDays > 30) return false
      }

      // Search filter (match ID)
      if (searchMatchId && !match.match_id.toString().includes(searchMatchId)) return false

      return true
    })
  }, [matches, filterWin, filterHero, filterDuration, filterDate, searchMatchId])

  // Get unique heroes from matches for filter dropdown
  const uniqueHeroes = useMemo(() => {
    return Array.from(
      new Set(matches.filter(m => m.hero_id).map(m => m.hero_id!))
    ).map(heroId => ({
      id: heroId,
      name: getHeroName(heroId)
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [matches, heroes])

  // Calculate aggregate statistics (using all matches for overview, filtered for list)
  const allMatchesStats = useMemo(() => {
    if (matches.length === 0) return null
    
    const wins = matches.filter(m => isWin(m)).length
    const losses = matches.length - wins
    
    return {
      total: matches.length,
      wins,
      losses,
      winrate: (wins / matches.length) * 100,
      avgKDA: matches.reduce((sum, m) => sum + parseFloat(getKDA(m)), 0) / matches.length,
      avgGPM: matches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / matches.length,
      avgXPM: matches.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / matches.length,
      avgDuration: matches.reduce((sum, m) => sum + m.duration, 0) / matches.length,
    }
  }, [matches])

  const filteredMatchesStats = useMemo(() => {
    if (filteredMatches.length === 0) return null
    
    const wins = filteredMatches.filter(m => isWin(m)).length
    const losses = filteredMatches.length - wins
    
    return {
      total: filteredMatches.length,
      wins,
      losses,
      winrate: (wins / filteredMatches.length) * 100,
      avgKDA: filteredMatches.reduce((sum, m) => sum + parseFloat(getKDA(m)), 0) / filteredMatches.length,
      avgGPM: filteredMatches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / filteredMatches.length,
      avgXPM: filteredMatches.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / filteredMatches.length,
    }
  }, [filteredMatches])

  // Prepare trend data for charts
  const trendData = useMemo(() => {
    return matches.slice(0, 20).reverse().map((match, idx) => {
      const win = isWin(match)
      return {
        match: idx + 1,
        winrate: win ? 100 : 0,
        kda: parseFloat(getKDA(match)),
        gpm: match.gold_per_min || 0,
        xpm: match.xp_per_min || 0,
        win: win ? 1 : 0,
      }
    }).map((match, idx, arr) => {
      // Calculate cumulative winrate
      const wins = arr.slice(0, idx + 1).filter(m => m.win === 1).length
      return {
        ...match,
        cumulativeWinrate: ((wins / (idx + 1)) * 100).toFixed(1),
      }
    })
  }, [matches])

  // Calculate win vs loss comparison
  const winLossComparison = useMemo(() => {
    if (matches.length === 0) return null
    
    const wins = matches.filter(m => isWin(m))
    const losses = matches.filter(m => !isWin(m))
    
    if (wins.length === 0 || losses.length === 0) return null
    
    return {
      kda: {
        win: wins.reduce((sum, m) => sum + parseFloat(getKDA(m)), 0) / wins.length,
        loss: losses.reduce((sum, m) => sum + parseFloat(getKDA(m)), 0) / losses.length,
      },
      gpm: {
        win: wins.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / wins.length,
        loss: losses.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / losses.length,
      },
      xpm: {
        win: wins.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / wins.length,
        loss: losses.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / losses.length,
      },
    }
  }, [matches])

  // Calculate hero performance
  const heroPerformance = useMemo(() => {
    const heroMap: Record<number, { games: number; wins: number; avgKDA: number; avgGPM: number }> = {}
    
    matches.forEach(match => {
      if (!match.hero_id) return
      
      if (!heroMap[match.hero_id]) {
        heroMap[match.hero_id] = { games: 0, wins: 0, avgKDA: 0, avgGPM: 0 }
      }
      
      heroMap[match.hero_id].games++
      if (isWin(match)) heroMap[match.hero_id].wins++
      heroMap[match.hero_id].avgKDA += parseFloat(getKDA(match))
      heroMap[match.hero_id].avgGPM += (match.gold_per_min || 0)
    })
    
    return Object.entries(heroMap)
      .map(([heroId, stats]) => ({
        hero_id: parseInt(heroId),
        games: stats.games,
        wins: stats.wins,
        winrate: (stats.wins / stats.games) * 100,
        avgKDA: stats.avgKDA / stats.games,
        avgGPM: stats.avgGPM / stats.games,
      }))
      .filter(h => h.games >= 2)
      .sort((a, b) => b.games - a.games)
      .slice(0, 10)
  }, [matches])

  // Generate insights
  const insights = useMemo(() => {
    const insightsList: string[] = []
    
    if (matches.length === 0) return insightsList
    
    // Recent performance
    const recent5 = matches.slice(0, 5)
    const recent5Wins = recent5.filter(m => isWin(m)).length
    const recent5Winrate = (recent5Wins / recent5.length) * 100
    
    if (recent5Winrate >= 80) {
      insightsList.push(`🔥 Forma eccellente! ${recent5Wins}/5 nelle ultime 5 partite (${recent5Winrate.toFixed(0)}% winrate)`)
    } else if (recent5Winrate <= 20) {
      insightsList.push(`⚠️ Forma in calo. Solo ${recent5Wins}/5 nelle ultime 5 partite. Analizza le partite perse.`)
    }
    
    // Hero insights
    if (heroPerformance.length > 0) {
      const bestHero = heroPerformance.sort((a, b) => b.winrate - a.winrate)[0]
      if (bestHero.winrate >= 60 && bestHero.games >= 3) {
        insightsList.push(`⭐ ${getHeroName(bestHero.hero_id)} è il tuo hero migliore: ${bestHero.winrate.toFixed(0)}% winrate su ${bestHero.games} partite`)
      }
      
      const worstHero = heroPerformance.sort((a, b) => a.winrate - b.winrate)[0]
      if (worstHero.winrate < 40 && worstHero.games >= 3) {
        insightsList.push(`📉 ${getHeroName(worstHero.hero_id)} ha solo ${worstHero.winrate.toFixed(0)}% winrate. Considera di praticare di più o evitarlo.`)
      }
    }
    
    // Win vs Loss comparison
    if (winLossComparison) {
      const kdaDiff = winLossComparison.kda.win - winLossComparison.kda.loss
      if (kdaDiff > 1.0) {
        insightsList.push(`💡 Nelle vittorie hai KDA ${kdaDiff.toFixed(1)} punti più alto. Focus su positioning e survival.`)
      }
      
      const gpmDiff = winLossComparison.gpm.win - winLossComparison.gpm.loss
      if (gpmDiff > 100) {
        insightsList.push(`💰 Nelle vittorie hai ${gpmDiff.toFixed(0)} GPM in più. Migliora il farm efficiency.`)
      }
    }
    
    // Trend analysis
    if (trendData.length >= 10) {
      const last5 = trendData.slice(-5)
      const first5 = trendData.slice(0, 5)
      const last5Winrate = last5.filter(m => m.win === 1).length / 5 * 100
      const first5Winrate = first5.filter(m => m.win === 1).length / 5 * 100
      
      if (last5Winrate > first5Winrate + 20) {
        insightsList.push(`📈 Trend positivo! Winrate migliorato di ${(last5Winrate - first5Winrate).toFixed(0)}% nelle ultime partite.`)
      } else if (last5Winrate < first5Winrate - 20) {
        insightsList.push(`📉 Trend negativo. Winrate calato di ${(first5Winrate - last5Winrate).toFixed(0)}%. Analizza cosa è cambiato.`)
      }
    }
    
    return insightsList
  }, [matches, heroPerformance, winLossComparison, trendData])

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-4">Partite</h1>
      <p className="text-gray-400 mb-6">Le tue ultime partite</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento partite...</p>
        </div>
      )}

      {matches.length > 0 && !loading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'list' as TabType, name: 'Lista', icon: List },
                { id: 'insights' as TabType, name: 'Insights', icon: Lightbulb },
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
              {activeTab === 'overview' && allMatchesStats && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Partite Totali</h3>
                      <p className="text-2xl font-bold text-white">{allMatchesStats.total}</p>
                      <p className="text-xs text-gray-500 mt-1">Ultime 20 partite</p>
                    </div>
                    <div className="bg-gray-800 border border-green-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Winrate</h3>
                      <p className="text-2xl font-bold text-green-400">{allMatchesStats.winrate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">{allMatchesStats.wins}V / {allMatchesStats.losses}L</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">KDA Medio</h3>
                      <p className="text-2xl font-bold text-yellow-400">{allMatchesStats.avgKDA.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">Performance media</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">GPM Medio</h3>
                      <p className="text-2xl font-bold text-blue-400">{allMatchesStats.avgGPM.toFixed(0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Gold per minuto</p>
                    </div>
                  </div>

                  {/* Trend Charts */}
                  {trendData.length > 0 && (
                    <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Winrate Trend */}
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-gray-300">Trend Winrate</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="match" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                              labelStyle={{ color: '#D1D5DB' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="cumulativeWinrate" 
                              stroke="#10B981" 
                              strokeWidth={2}
                              dot={{ fill: '#10B981', r: 3 }}
                              name="Winrate %"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* KDA Trend */}
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-gray-300">Trend KDA</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="match" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                              labelStyle={{ color: '#D1D5DB' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="kda" 
                              stroke="#FBBF24" 
                              strokeWidth={2}
                              dot={{ fill: '#FBBF24', r: 3 }}
                              name="KDA"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      </div>
                    </>
                  )}

                  {/* Hero Performance Preview */}
                  {heroPerformance.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-3 text-gray-300">Performance per Hero (Top 5)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {heroPerformance.slice(0, 5).map((hero) => (
                          <div key={hero.hero_id} className="bg-gray-700/50 rounded-lg p-3 text-center">
                            {heroes[hero.hero_id] && (
                              <HeroCard
                                heroId={hero.hero_id}
                                heroName={heroes[hero.hero_id].name}
                                size="sm"
                              />
                            )}
                            <p className="text-xs text-gray-400 mt-2">{getHeroName(hero.hero_id)}</p>
                            <p className={`text-sm font-bold mt-1 ${
                              hero.winrate >= 60 ? 'text-green-400' :
                              hero.winrate >= 50 ? 'text-blue-400' :
                              'text-red-400'
                            }`}>
                              {hero.winrate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-gray-500">{hero.games}p</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* List Tab */}
              {activeTab === 'list' && (
                <div className="space-y-4">
                  {/* Filters Section */}
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-white">Filtri</h3>
                      {(filterWin !== 'all' || filterHero !== 'all' || filterDuration !== 'all' || filterDate !== 'all' || searchMatchId) && (
                        <button
                          onClick={() => {
                            setFilterWin('all')
                            setFilterHero('all')
                            setFilterDuration('all')
                            setFilterDate('all')
                            setSearchMatchId('')
                          }}
                          className="ml-auto flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                        >
                          <X className="w-4 h-4" />
                          Reset
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Search Match ID */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cerca Match ID... (Premi Enter per analizzare)"
                          value={searchMatchId}
                          onChange={(e) => setSearchMatchId(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchMatchId.trim()) {
                              e.preventDefault()
                              router.push(`/dashboard/match-analysis/${searchMatchId.trim()}`)
                            }
                          }}
                          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      {/* Win/Loss Filter */}
                      <select
                        value={filterWin}
                        onChange={(e) => setFilterWin(e.target.value as 'all' | 'win' | 'loss')}
                        className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="all">Tutte le Partite</option>
                        <option value="win">Solo Vittorie</option>
                        <option value="loss">Solo Sconfitte</option>
                      </select>

                      {/* Hero Filter */}
                      <select
                        value={filterHero}
                        onChange={(e) => setFilterHero(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="all">Tutti gli Heroes</option>
                        {uniqueHeroes.map((hero) => (
                          <option key={hero.id} value={hero.id}>
                            {hero.name}
                          </option>
                        ))}
                      </select>

                      {/* Duration Filter */}
                      <select
                        value={filterDuration}
                        onChange={(e) => setFilterDuration(e.target.value as 'all' | 'short' | 'medium' | 'long')}
                        className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="all">Tutte le Durate</option>
                        <option value="short">Corte (&lt;30min)</option>
                        <option value="medium">Medie (30-45min)</option>
                        <option value="long">Lunghe (&gt;45min)</option>
                      </select>

                      {/* Date Filter */}
                      <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value as 'all' | 'week' | 'month')}
                        className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="all">Tutte le Date</option>
                        <option value="week">Ultima Settimana</option>
                        <option value="month">Ultimo Mese</option>
                      </select>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 text-sm text-gray-400">
                      Mostrando <span className="font-semibold text-white">{filteredMatches.length}</span> di <span className="font-semibold text-white">{matches.length}</span> partite
                    </div>
                  </div>

                  {/* Matches List - Compact Layout */}
                  {filteredMatches.length > 0 ? (
                    <div className="space-y-3">
                      {filteredMatches.map((match) => {
                        const win = isWin(match)
                        const kda = getKDA(match)
                        
                        return (
                          <div
                            key={match.match_id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700/50 transition"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <Link
                                href={`/dashboard/match-analysis/${match.match_id}`}
                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                              >
                                {match.hero_id && heroes[match.hero_id] && (
                                  <HeroIcon
                                    heroId={match.hero_id}
                                    heroName={heroes[match.hero_id].name}
                                    size={40}
                                    className="rounded flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-white truncate">
                                      {getHeroName(match.hero_id)}
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                                      win ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                                    }`}>
                                      {win ? 'V' : 'L'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span>KDA: <span className="text-white font-semibold">{match.kills}/{match.deaths}/{match.assists}</span> ({kda})</span>
                                    <span>GPM: <span className="text-white">{match.gold_per_min || 0}</span></span>
                                    <span>{formatDuration(match.duration)}</span>
                                  </div>
                                </div>
                              </Link>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-right mr-2">
                                  <p className="text-xs text-gray-500 mb-1">{formatDate(match.start_time)}</p>
                                </div>
                                <Link
                                  href={`/dashboard/match-advice/${match.match_id}`}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold text-white transition-colors whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Analisi Tommaso
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
                      <p className="text-gray-400">Nessuna partita corrisponde ai filtri selezionati</p>
                      <button
                        onClick={() => {
                          setFilterWin('all')
                          setFilterHero('all')
                          setFilterDuration('all')
                          setFilterDate('all')
                          setSearchMatchId('')
                        }}
                        className="mt-4 text-red-400 hover:text-red-300 text-sm font-semibold"
                      >
                        Reset Filtri
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  {/* Insights List */}
                  {insights.length > 0 ? (
                    <div className="space-y-3">
                      {insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-200">{insight}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                      <p className="text-gray-400">Non ci sono insights disponibili. Gioca più partite per ottenere analisi dettagliate.</p>
                    </div>
                  )}

                  {/* Win vs Loss Comparison */}
                  {winLossComparison && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Confronto Vittorie vs Sconfitte
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm text-gray-400 mb-2">KDA Medio</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-400 font-semibold">Vittorie: {winLossComparison.kda.win.toFixed(2)}</p>
                              <p className="text-red-400 font-semibold">Sconfitte: {winLossComparison.kda.loss.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${
                                winLossComparison.kda.win > winLossComparison.kda.loss ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {winLossComparison.kda.win > winLossComparison.kda.loss ? '+' : ''}
                                {(winLossComparison.kda.win - winLossComparison.kda.loss).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm text-gray-400 mb-2">GPM Medio</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-400 font-semibold">Vittorie: {winLossComparison.gpm.win.toFixed(0)}</p>
                              <p className="text-red-400 font-semibold">Sconfitte: {winLossComparison.gpm.loss.toFixed(0)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${
                                winLossComparison.gpm.win > winLossComparison.gpm.loss ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {winLossComparison.gpm.win > winLossComparison.gpm.loss ? '+' : ''}
                                {(winLossComparison.gpm.win - winLossComparison.gpm.loss).toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm text-gray-400 mb-2">XPM Medio</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-400 font-semibold">Vittorie: {winLossComparison.xpm.win.toFixed(0)}</p>
                              <p className="text-red-400 font-semibold">Sconfitte: {winLossComparison.xpm.loss.toFixed(0)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${
                                winLossComparison.xpm.win > winLossComparison.xpm.loss ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {winLossComparison.xpm.win > winLossComparison.xpm.loss ? '+' : ''}
                                {(winLossComparison.xpm.win - winLossComparison.xpm.loss).toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hero Performance Chart */}
                  {heroPerformance.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChartIcon className="w-5 h-5" />
                        Winrate per Hero
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={heroPerformance.slice(0, 8)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hero_id" 
                            stroke="#9CA3AF" 
                            fontSize={12}
                            tickFormatter={(value) => {
                              const hero = heroPerformance.find(h => h.hero_id === value)
                              return hero ? getHeroName(hero.hero_id).substring(0, 8) : ''
                            }}
                          />
                          <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            labelStyle={{ color: '#D1D5DB' }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Winrate']}
                            labelFormatter={(label) => {
                              const hero = heroPerformance.find(h => h.hero_id === parseInt(label))
                              return hero ? getHeroName(hero.hero_id) : ''
                            }}
                          />
                          <Bar 
                            dataKey="winrate" 
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {matches.length === 0 && !loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400">Nessuna partita trovata</p>
        </div>
      )}
    </div>
  )
}