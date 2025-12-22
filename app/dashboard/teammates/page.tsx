'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import InsightBulbs from '@/components/InsightBulbs'
import { buildTeammatesInsights } from '@/lib/insight-utils'
import PlayerAvatar from '@/components/PlayerAvatar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Trophy, AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Star, BarChart as BarChartIcon, List, Users, Sparkles } from 'lucide-react'
import TeamChemistryScore from '@/components/TeamChemistryScore'
import SynergyMatrix from '@/components/SynergyMatrix'
import OptimalTeams from '@/components/OptimalTeams'

interface Teammate {
  account_id: number
  name: string
  games: number
  wins: number
  winrate: number
  avatar?: string
  personaname?: string
}

interface TeammateInsights {
  bestTeammate: Teammate | null
  worstTeammate: Teammate | null
  highWinrateTeammates: Teammate[]
  insights: string[]
}

type FilterType = 'all' | 'best' | 'most-played' | 'synergies'
type SortField = 'games' | 'winrate' | 'name' | null
type SortDirection = 'asc' | 'desc'
type TabType = 'overview' | 'chart' | 'list' | 'chemistry' | 'synergy' | 'optimal'

export default function TeammatesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [teammates, setTeammates] = useState<Teammate[]>([])
  const [insights, setInsights] = useState<TeammateInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (playerId) {
      fetchTeammates()
    }
  }, [playerId])

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (teammates.length === 0) return null
    
    const totalGames = teammates.reduce((sum, t) => sum + t.games, 0)
    const avgWinrate = teammates.reduce((sum, t) => sum + t.winrate, 0) / teammates.length
    const mostFrequent = teammates.reduce((most, current) => 
      current.games > most.games ? current : most
    )
    const totalTeammates = teammates.length
    
    return {
      totalTeammates,
      avgWinrate,
      totalGames,
      mostFrequent,
    }
  }, [teammates])

  // Filter and sort teammates
  const filteredAndSortedTeammates = useMemo(() => {
    let filtered = [...teammates]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    switch (filter) {
      case 'best':
        filtered = filtered.filter(t => t.winrate >= 60 && t.games >= 10)
        break
      case 'most-played':
        filtered = filtered.sort((a, b) => b.games - a.games).slice(0, 10)
        break
      case 'synergies':
        filtered = filtered.filter(t => t.winrate >= 55 && t.games >= 10)
        break
      default:
        break
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal: number | string = a[sortField as keyof Teammate] as number | string
        let bVal: number | string = b[sortField as keyof Teammate] as number | string
        
        if (sortField === 'name') {
          aVal = (aVal as string).toLowerCase()
          bVal = (bVal as string).toLowerCase()
        }
        
        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
        }
      })
    }

    return filtered
  }, [teammates, filter, searchQuery, sortField, sortDirection])

  // Chart data (top 10 by winrate)
  const chartData = useMemo(() => {
    return teammates
      .filter(t => t.games >= 5)
      .sort((a, b) => b.winrate - a.winrate)
      .slice(0, 10)
      .map(t => ({
        name: t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name,
        winrate: Number(t.winrate.toFixed(1)),
        games: t.games,
      }))
  }, [teammates])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const fetchTeammates = async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/peers`)
      if (!response.ok) throw new Error('Failed to fetch teammates')

      const data = await response.json()
      const teammatesData: Teammate[] = data
        .filter((t: { games?: number }) => t.games && t.games > 0)
        .map((t: { account_id: number; games: number; win: number; personaname?: string; avatarfull?: string }) => ({
          account_id: t.account_id,
          name: t.personaname || `Player ${t.account_id}`,
          games: t.games,
          wins: t.win,
          winrate: (t.win / t.games) * 100,
          avatar: t.avatarfull || undefined,
          personaname: t.personaname || undefined,
        }))
        .sort((a: Teammate, b: Teammate) => b.games - a.games)
        .slice(0, 20)

      setTeammates(teammatesData)

      // Calculate insights
      if (teammatesData.length > 0) {
        const minGames = 5 // Minimum games for meaningful insights
        const validTeammates = teammatesData.filter(t => t.games >= minGames)
        
        if (validTeammates.length > 0) {
          const bestTeammate = validTeammates.reduce((best, current) => 
            current.winrate > best.winrate ? current : best
          )
          
          const worstTeammate = validTeammates.reduce((worst, current) => 
            current.winrate < worst.winrate ? current : worst
          )
          
          const highWinrateTeammates = validTeammates
            .filter(t => t.winrate >= 60 && t.games >= 10)
            .sort((a, b) => b.winrate - a.winrate)
            .slice(0, 3)
          
          const insightsList: string[] = []
          
          if (bestTeammate && bestTeammate.winrate >= 60) {
            insightsList.push(`Winrate migliore con ${bestTeammate.name}: ${bestTeammate.winrate.toFixed(1)}% (${bestTeammate.games} partite)`)
          }
          
          if (highWinrateTeammates.length > 0) {
            const names = highWinrateTeammates.map(t => t.name).join(', ')
            insightsList.push(`✨ Sinergie migliori: ${names}`)
          }
          
          if (worstTeammate && worstTeammate.winrate < 40 && worstTeammate.games >= 10) {
            insightsList.push(`Winrate bassa con ${worstTeammate.name}: ${worstTeammate.winrate.toFixed(1)}% (${worstTeammate.games} partite)`)
          }
          
          const avgWinrate = validTeammates.reduce((sum, t) => sum + t.winrate, 0) / validTeammates.length
          if (avgWinrate > 55) {
            insightsList.push(`Winrate medio con i tuoi compagni: ${avgWinrate.toFixed(1)}% - Ottima sinergia di squadra!`)
          } else if (avgWinrate < 45) {
            insightsList.push(`Winrate medio con i tuoi compagni: ${avgWinrate.toFixed(1)}% - Potresti beneficiare di un cambio di compagni`)
          }
          
          setInsights({
            bestTeammate: bestTeammate.winrate >= 50 ? bestTeammate : null,
            worstTeammate: worstTeammate.winrate < 50 ? worstTeammate : null,
            highWinrateTeammates,
            insights: insightsList,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teammates')
    } finally {
      setLoading(false)
    }
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
        pageTitle="Team & Compagni"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare i tuoi compagni di squadra. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-2">Team & Compagni</h1>
      <p className="text-gray-400 mb-6">Statistiche dei giocatori con cui hai giocato più spesso</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento compagni...</p>
        </div>
      )}

      {!loading && aggregateStats && (
        <>
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'chemistry' as TabType, name: 'Chemistry Score', icon: Sparkles },
                { id: 'synergy' as TabType, name: 'Synergy Matrix', icon: Users },
                { id: 'optimal' as TabType, name: 'Team Ottimali', icon: Trophy },
                { id: 'chart' as TabType, name: 'Grafico', icon: TrendingUp },
                { id: 'list' as TabType, name: 'Lista', icon: List },
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
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Insight Bulbs - Deterministic insights */}
                  {teammates && teammates.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h3 className="text-sm font-semibold text-gray-400">Insight Deterministici</h3>
                      <InsightBulbs
                        insights={buildTeammatesInsights(teammates, insights)}
                        isLoading={loading}
                      />
                    </div>
                  )}

                  {/* Aggregate Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Totale Compagni</div>
                      <div className="text-2xl font-bold text-white">{aggregateStats.totalTeammates}</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Winrate Medio</div>
                      <div className={`text-2xl font-bold ${aggregateStats.avgWinrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {aggregateStats.avgWinrate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Media dei top 20 compagni</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Partite Totali (storico)</div>
                      <div className="text-2xl font-bold text-white">{aggregateStats.totalGames}</div>
                      <div className="text-xs text-gray-500 mt-1">Somma partite con top 20 compagni</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Compagno Più Frequente</div>
                      <div className="text-lg font-bold text-blue-400 truncate" title={aggregateStats.mostFrequent.name}>
                        {aggregateStats.mostFrequent.name.length > 20 
                          ? aggregateStats.mostFrequent.name.substring(0, 20) + '...' 
                          : aggregateStats.mostFrequent.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{aggregateStats.mostFrequent.games} partite</div>
                    </div>
                  </div>

                  {/* Compact Insights */}
                  {insights && insights.insights.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-lg p-4">
                      <h2 className="text-2xl font-semibold mb-4 text-blue-300 flex items-center gap-2">
                        <Lightbulb className="w-6 h-6" />
                        Insights & Sinergie
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {insights.insights.map((insight, idx) => (
                          <span 
                            key={idx} 
                            className="inline-block bg-blue-800/50 text-blue-200 text-xs px-3 py-1 rounded-full border border-blue-600"
                          >
                            {insight}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chart Tab */}
              {activeTab === 'chart' && (
                <div className="space-y-6">
                  {/* Winrate Chart */}
                  {chartData.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                      {playerId && (
                        <InsightBadge
                          elementType="trend-chart"
                          elementId="teammates-chart"
                          contextData={{ teammates: chartData, totalTeammates: teammates.length }}
                          playerId={playerId}
                          position="top-right"
                        />
                      )}
                      <h3 className="text-2xl font-semibold mb-4">Top 10 Winrate</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F3F4F6'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="winrate" fill="#EF4444" name="Winrate %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* List Tab */}
              {activeTab === 'list' && (
                <div className="space-y-6">
                  {/* Filters and Search */}
                  <div className="space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          filter === 'all'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Tutti
                      </button>
                      <button
                        onClick={() => setFilter('best')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          filter === 'best'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <Trophy className="w-4 h-4 inline mr-1" /> Migliori (≥60%)
                      </button>
                      <button
                        onClick={() => setFilter('most-played')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          filter === 'most-played'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <Star className="w-4 h-4 inline mr-1" /> Più Giocati
                      </button>
                      <button
                        onClick={() => setFilter('synergies')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          filter === 'synergies'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <Star className="w-4 h-4 inline mr-1" /> Sinergie (≥55%)
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cerca compagno per nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-96 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  {/* Compact Table */}
                  {filteredAndSortedTeammates.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-2xl font-semibold">Lista Compagni</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {filteredAndSortedTeammates.length} {filteredAndSortedTeammates.length === 1 ? 'compagno trovato' : 'compagni trovati'}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase cursor-pointer hover:bg-gray-600 transition"
                        onClick={() => handleSort('name')}
                      >
                        Giocatore {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase cursor-pointer hover:bg-gray-600 transition"
                        onClick={() => handleSort('games')}
                      >
                        Partite {sortField === 'games' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Vittorie</th>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase cursor-pointer hover:bg-gray-600 transition"
                        onClick={() => handleSort('winrate')}
                      >
                        Winrate {sortField === 'winrate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredAndSortedTeammates.map((teammate) => {
                      const isBest = insights?.bestTeammate?.account_id === teammate.account_id
                      const isHighWinrate = insights?.highWinrateTeammates.some(t => t.account_id === teammate.account_id)
                      
                      return (
                        <tr 
                          key={teammate.account_id} 
                          className={`hover:bg-gray-700/50 transition ${isBest ? 'bg-green-900/20' : isHighWinrate ? 'bg-blue-900/20' : ''}`}
                        >
                          <td className="px-4 py-2 whitespace-nowrap text-white font-medium">
                            <div className="flex items-center gap-2">
                              {isBest && <span title="Miglior winrate"><Trophy className="w-4 h-4 text-yellow-400" /></span>}
                              {isHighWinrate && !isBest && <span title="Alta sinergia"><Star className="w-4 h-4 text-blue-400" /></span>}
                              <PlayerAvatar
                                accountId={teammate.account_id}
                                avatarUrl={teammate.avatar}
                                playerName={teammate.name}
                                size="sm"
                              />
                              <span className="text-sm">{teammate.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-300 text-sm">{teammate.games}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-300 text-sm">{teammate.wins}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`font-semibold text-sm ${teammate.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                              {teammate.winrate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <Link
                              href={`/analysis/player/${teammate.account_id}`}
                              className="text-red-400 hover:text-red-300 text-xs font-medium"
                            >
                              Profilo
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
                    </div>
                  )}

                  {filteredAndSortedTeammates.length === 0 && !loading && (
                    <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
                      <p className="text-gray-400">
                        {searchQuery ? 'Nessun compagno trovato con questo nome' : 'Nessun compagno trovato con questi filtri'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chemistry Score Tab */}
              {activeTab === 'chemistry' && playerId && (
                <div className="space-y-6">
                  <TeamChemistryScore playerId={playerId} />
                </div>
              )}

              {/* Synergy Matrix Tab */}
              {activeTab === 'synergy' && playerId && (
                <div className="space-y-6">
                  <SynergyMatrix playerId={playerId} />
                </div>
              )}

              {/* Optimal Teams Tab */}
              {activeTab === 'optimal' && playerId && (
                <div className="space-y-6">
                  <OptimalTeams playerId={playerId} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {teammates.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun compagno trovato</p>
        </div>
      )}
    </div>
  )
}
