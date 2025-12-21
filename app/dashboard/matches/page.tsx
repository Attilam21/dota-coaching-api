'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import HeroCard from '@/components/HeroCard'
import HeroIcon from '@/components/HeroIcon'
import { List, BarChart as BarChartIcon, Search, Filter, X } from 'lucide-react'

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

type TabType = 'list' | 'stats'

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [matches, setMatches] = useState<Match[]>([])
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('list')
  
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
  const filteredMatches = matches.filter((match) => {
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

  // Get unique heroes from matches for filter dropdown
  const uniqueHeroes = Array.from(
    new Set(matches.filter(m => m.hero_id).map(m => m.hero_id!))
  ).map(heroId => ({
    id: heroId,
    name: getHeroName(heroId)
  })).sort((a, b) => a.name.localeCompare(b.name))

  // Calculate aggregate statistics (using filtered matches)
  const aggregateStats = filteredMatches.length > 0 ? {
    total: filteredMatches.length,
    wins: filteredMatches.filter(m => isWin(m)).length,
    losses: filteredMatches.filter(m => !isWin(m)).length,
    winrate: filteredMatches.length > 0 ? (filteredMatches.filter(m => isWin(m)).length / filteredMatches.length) * 100 : 0,
    avgKDA: filteredMatches.length > 0 ? filteredMatches.reduce((sum, m) => sum + parseFloat(getKDA(m)), 0) / filteredMatches.length : 0,
    avgGPM: filteredMatches.length > 0 ? filteredMatches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / filteredMatches.length : 0,
    avgXPM: filteredMatches.length > 0 ? filteredMatches.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / filteredMatches.length : 0,
    avgDuration: filteredMatches.length > 0 ? filteredMatches.reduce((sum, m) => sum + m.duration, 0) / filteredMatches.length : 0,
  } : null

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
                { id: 'list' as TabType, name: 'Lista', icon: List },
                { id: 'stats' as TabType, name: 'Statistiche', icon: BarChartIcon },
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
                          placeholder="Cerca Match ID..."
                          value={searchMatchId}
                          onChange={(e) => setSearchMatchId(e.target.value)}
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

                  {/* Matches List */}
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => {
            const win = isWin(match)
            const kda = getKDA(match)
            
            return (
              <Link
                key={match.match_id}
                href={`/dashboard/match-analysis/${match.match_id}`}
                className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      {match.hero_id && heroes[match.hero_id] && (
                        <HeroIcon
                          heroId={match.hero_id}
                          heroName={heroes[match.hero_id].name}
                          size={48}
                          className="rounded"
                        />
                      )}
                      <h3 className="text-2xl font-semibold text-white">
                        {getHeroName(match.hero_id)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        win ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                      }`}>
                        {win ? 'Vittoria' : 'Sconfitta'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-400">K/D/A</span>
                        <p className="text-white font-semibold">
                          {match.kills}/{match.deaths}/{match.assists}
                        </p>
                        <p className="text-gray-500 text-xs">KDA: {kda}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">GPM/XPM</span>
                        <p className="text-white font-semibold">
                          {match.gold_per_min || 0} / {match.xp_per_min || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Durata</span>
                        <p className="text-white font-semibold">{formatDuration(match.duration)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Data</span>
                        <p className="text-white font-semibold">{formatDate(match.start_time)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <span className="text-red-400 hover:text-red-300 text-sm font-semibold">
                      Vedi Analisi →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })) : (
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

              {/* Stats Tab */}
              {activeTab === 'stats' && aggregateStats && (
                <div className="space-y-6">
                  {/* Aggregate Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Partite Totali</div>
                      <div className="text-3xl font-bold text-white">{aggregateStats.total}</div>
                    </div>
                    <div className="bg-gray-800 border border-green-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Vittorie</div>
                      <div className="text-3xl font-bold text-green-400">{aggregateStats.wins}</div>
                      <div className="text-xs text-gray-500 mt-1">Winrate: {aggregateStats.winrate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-800 border border-red-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Sconfitte</div>
                      <div className="text-3xl font-bold text-red-400">{aggregateStats.losses}</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">KDA Medio</div>
                      <div className="text-3xl font-bold text-yellow-400">{aggregateStats.avgKDA.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">GPM Medio</div>
                      <div className="text-2xl font-bold text-white">{aggregateStats.avgGPM.toFixed(0)}</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">XPM Medio</div>
                      <div className="text-2xl font-bold text-blue-400">{aggregateStats.avgXPM.toFixed(0)}</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <div className="text-sm text-gray-400 mb-2">Durata Media</div>
                      <div className="text-2xl font-bold text-white">{formatDuration(Math.round(aggregateStats.avgDuration))}</div>
                    </div>
                  </div>
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
