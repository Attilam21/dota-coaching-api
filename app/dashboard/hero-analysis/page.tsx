'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'
import HeroCard from '@/components/HeroCard'
import AttributeIcon from '@/components/AttributeIcon'
import Link from 'next/link'
import { BarChart as BarChartIcon, Target, Table, Swords } from 'lucide-react'

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

type TabType = 'overview' | 'charts' | 'stats' | 'matchup'

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
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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
      // Don't show error for matchups, it's optional data
    } finally {
      setMatchupLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchAnalysis()
      fetchMatchups()
    }
  }, [playerId, fetchAnalysis, fetchMatchups])

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
        pageTitle="Hero Analysis"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare l'analisi approfondita dei tuoi heroes. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  // Prepare chart data
  const winrateChartData = analysis?.heroStats ? analysis.heroStats.slice(0, 10).map(h => ({
    name: h.hero_name.length > 10 ? h.hero_name.substring(0, 10) : h.hero_name,
    winrate: Number(h.winrate.toFixed(1)),
    games: h.games,
  })) : []

  const roleChartData = analysis?.roleStats ? Object.entries(analysis.roleStats)
    .filter(([_, stats]) => stats.games > 0)
    .map(([role, stats]) => ({
      role,
      winrate: Number(stats.winrate.toFixed(1)),
      games: stats.games,
    })) : []

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
        ← Torna a Dashboard
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Hero Analysis</h1>
      <p className="text-gray-400 mb-6">Analisi approfondita delle tue performance per hero</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento analisi heroes...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'charts' as TabType, name: 'Grafici', icon: Target },
                { id: 'stats' as TabType, name: 'Statistiche', icon: Table },
                { id: 'matchup' as TabType, name: 'Matchup', icon: Swords },
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
                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
              {playerId && (
                <InsightBadge
                  elementType="metric-card"
                  elementId="hero-analysis-total-games"
                  contextData={{ metricName: 'Partite Totali', value: analysis.overall.totalGames }}
                  playerId={playerId}
                  position="top-right"
                />
              )}
              <h3 className="text-sm text-gray-400 mb-2">Partite Totali</h3>
              <p className="text-3xl font-bold">{analysis.overall.totalGames}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Winrate Globale</h3>
              <p className="text-3xl font-bold text-green-400">{analysis.overall.overallWinrate}%</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Hero Pool</h3>
              <p className="text-3xl font-bold text-blue-400">{analysis.overall.diverseHeroes}</p>
              <p className="text-xs text-gray-500 mt-1">Heroes con 5+ partite</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2">Hero Più Giocato</h3>
              <p className="text-lg font-bold">{analysis.mostPlayed?.hero_name || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">{analysis.mostPlayed?.games || 0} partite</p>
                  </div>
                </div>

                  {/* Best & Worst Heroes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-green-700 rounded-lg p-6">
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-green-400">🏆 Heroes Migliori</h3>
              {analysis.bestHeroes.length > 0 ? (
                <div className="space-y-3">
                  {analysis.bestHeroes.map((hero) => (
                    <div key={hero.hero_id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{hero.hero_name}</p>
                        <p className="text-sm text-gray-400">{hero.games} partite</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">{hero.winrate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">KDA: {hero.kda}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nessun hero con winrate {'>='} 55% e almeno 5 partite</p>
              )}
            </div>

            <div className="bg-gray-800 border border-red-700 rounded-lg p-6">
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-red-400">⚠️ Heroes da Migliorare</h3>
              {analysis.worstHeroes.length > 0 ? (
                <div className="space-y-3">
                  {analysis.worstHeroes.map((hero) => (
                    <div key={hero.hero_id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{hero.hero_name}</p>
                        <p className="text-sm text-gray-400">{hero.games} partite</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-400">{hero.winrate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">KDA: {hero.kda}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nessun hero con winrate {'<'} 45% e almeno 5 partite</p>
              )}
                  </div>
                </div>

                  {/* Insights */}
                  {analysis.insights.length > 0 && (
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                      <h3 className="text-xl md:text-2xl font-semibold mb-4 text-blue-200">💡 Insights</h3>
                      <ul className="space-y-2">
                        {analysis.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-blue-300">
                            <span className="text-blue-400 mt-1">→</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Charts Tab */}
              {activeTab === 'charts' && (
                <div className="space-y-6">
                  {/* Winrate Chart */}
                  {winrateChartData.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Winrate Top 10 Heroes</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={winrateChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={120} />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="winrate" fill="#EF4444" name="Winrate %" />
                </BarChart>
              </ResponsiveContainer>
                  </div>
                  )}

                  {/* Role Performance */}
                  {roleChartData.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Performance per Ruolo</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="role" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="winrate" fill="#10B981" name="Winrate %" />
                  <Bar dataKey="games" fill="#3B82F6" name="Partite" />
                </BarChart>
              </ResponsiveContainer>
                  </div>
                  )}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 bg-gray-700">
              <h2 className="text-xl md:text-2xl font-semibold">Tutti i Heroes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Hero</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Partite</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Vittorie</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Winrate</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">KDA</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">GPM</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {analysis.heroStats.map((hero) => (
                    <tr key={hero.hero_id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {heroes[hero.hero_id] && (
                            <HeroCard
                              heroId={hero.hero_id}
                              heroName={heroes[hero.hero_id].name}
                              size="sm"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            {hero.primary_attr && hero.primary_attr !== 'unknown' && (
                              <AttributeIcon
                                attribute={hero.primary_attr as 'str' | 'agi' | 'int'}
                                size="xs"
                              />
                            )}
                            <span className="text-white font-medium">{hero.hero_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.games}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.wins}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-semibold ${hero.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {hero.winrate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.kda}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hero.avg_gpm}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          hero.rating === 'Eccellente' ? 'bg-green-600 text-white' :
                          hero.rating === 'Buona' ? 'bg-blue-600 text-white' :
                          hero.rating === 'Media' ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {hero.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </div>
              )}

              {/* Matchup Tab */}
              {activeTab === 'matchup' && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">Matchup Analysis (Hero vs Hero)</h2>
              {matchupLoading && (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              )}
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              Analisi delle tue performance con ogni eroe contro eroi specifici. Solo matchup con 2+ partite.
            </p>

            {matchupData && matchupData.matchups.length > 0 ? (
              <div className="space-y-6">
                {/* Matchup Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400 mb-1">Partite Analizzate</h3>
                    <p className="text-2xl font-bold">{matchupData.summary.totalMatches}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400 mb-1">Heroes con Matchup</h3>
                    <p className="text-2xl font-bold">{matchupData.summary.totalHeroes}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400 mb-1">Matchup Totali</h3>
                    <p className="text-2xl font-bold">{matchupData.summary.totalMatchups}</p>
                  </div>
                </div>

                {/* Matchup Insights */}
                {matchupData.insights.length > 0 && (
                  <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-purple-200">Matchup Insights</h3>
                    <ul className="space-y-1">
                      {matchupData.insights.map((insight, idx) => (
                        <li key={idx} className="text-purple-300 text-sm">• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hero Selector */}
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-3">Seleziona Hero per vedere i Matchup</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchupData.matchups.map((matchup) => (
                      <button
                        key={matchup.playerHeroId}
                        onClick={() => setSelectedHeroForMatchup(
                          selectedHeroForMatchup === matchup.playerHeroId ? null : matchup.playerHeroId
                        )}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

                {/* Selected Hero Matchups */}
                {selectedHeroForMatchup && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                    {(() => {
                      const selectedMatchup = matchupData.matchups.find(
                        m => m.playerHeroId === selectedHeroForMatchup
                      )
                      if (!selectedMatchup) return null

                      // Sort matchups by winrate (best first)
                      const sortedMatchups = [...selectedMatchup.matchups].sort(
                        (a, b) => b.winrate - a.winrate
                      )

                      return (
                        <>
                          <h3 className="text-lg md:text-xl font-semibold mb-4">
                            Matchup per {selectedMatchup.playerHeroName}
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-600">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Eroe Nemico
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Partite
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Vittorie
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Winrate
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-600">
                                {sortedMatchups.map((matchup) => (
                                  <tr key={matchup.enemyHeroId} className="hover:bg-gray-600/50">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        <HeroCard
                                          heroId={matchup.enemyHeroId}
                                          heroName={matchup.enemyHeroInternalName}
                                          size="sm"
                                        />
                                        <span className="text-white font-medium">
                                          {matchup.enemyHeroName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{matchup.games}</td>
                                    <td className="px-6 py-4 text-gray-300">{matchup.wins}</td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`font-semibold ${
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
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            ) : matchupData && !matchupLoading ? (
              <div className="text-center py-8 text-gray-400">
                <p>Nessun dato matchup disponibile. Gioca più partite per vedere le analisi.</p>
              </div>
            ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

