'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { Sword, Zap, DollarSign, Search, Target, FlaskConical, BookOpen, Sparkles, BarChart as BarChartIcon, Activity, Gamepad2, Trophy, TrendingUp, Award, Clock, Lightbulb, Info, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import { PlayerStatsSkeleton, StatsCardSkeleton, ChartSkeleton, MatchCardSkeleton } from '@/components/SkeletonLoader'
import InsightBadge from '@/components/InsightBadge'
import InsightBulb from '@/components/InsightBulb'
import PlayerAvatar from '@/components/PlayerAvatar'
import ProfileHeaderCard from '@/components/ProfileHeaderCard'
import KpiCard from '@/components/KpiCard'
import AdPlaceholder from '@/components/AdPlaceholder'
import KeyMatchesCard from '@/components/KeyMatchesCard'
import AnimatedCard from '@/components/AnimatedCard'
import HeroIcon from '@/components/HeroIcon'
import { motion } from 'framer-motion'

interface PlayerStats {
  winrate: {
    last5: number
    last10: number
    delta: number
  }
  kda: {
    last5: number
    last10: number
    delta: number
  }
  farm: {
    gpm: { last5: number; last10: number }
    xpm: { last5: number; last10: number }
  }
  matches: Array<{
    match_id: number
    win: boolean
    kda: number
    gpm: number
    xpm: number
    start_time: number
    hero_id?: number
    duration?: number
    kills?: number
    deaths?: number
    assists?: number
  }>
  advanced?: {
    lane: { avgLastHits: number; avgDenies: number; firstBloodInvolvement: number }
    farm: { avgGPM: number; avgXPM: number; goldUtilization: number; avgNetWorth: number }
    fights: { killParticipation: number; avgHeroDamage: number; avgTowerDamage: number; avgDeaths: number }
    vision: { avgObserverPlaced: number; visionScore: number }
  }
}

type TabType = 'overview' | 'trends' | 'matches'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [playerProfile, setPlayerProfile] = useState<{ avatar?: string; personaname?: string; rankTier?: number; rankMedalUrl?: string; soloMMR?: number | string | null } | null>(null)
  const [fullProfile, setFullProfile] = useState<{ recommendations?: string[]; phaseAnalysis?: { early: { score: number; strength: string }; mid: { score: number; strength: string }; late: { score: number; strength: string } } } | null>(null)
  const [benchmarks, setBenchmarks] = useState<{ percentiles?: { gpm?: { percentile: number; label: string }; xpm?: { percentile: number; label: string }; kda?: { percentile: number; label: string } }; calculatedPercentiles?: { gpm: { value: number; percentile: number; label: string }; xpm: { value: number; percentile: number; label: string }; kda: { value: number; percentile: number; label: string } }; source?: string } | null>(null)
  const [winLoss, setWinLoss] = useState<{ win: number; lose: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [heroes, setHeroes] = useState<Record<number, { name: string; localized_name: string }>>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  // Load heroes data
  useEffect(() => {
    fetch('/api/opendota/heroes')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          const heroesMap: Record<number, { name: string; localized_name: string }> = {}
          data.forEach((hero: { id: number; name: string; localized_name: string }) => {
            heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
          })
          setHeroes(heroesMap)
        }
      })
      .catch(console.error)
  }, [])

  const fetchStats = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const [statsResponse, advancedResponse, profileResponse, wlResponse, benchmarksResponse] = await Promise.all([
        fetch(`/api/player/${playerId}/stats`),
        fetch(`/api/player/${playerId}/advanced-stats`),
        fetch(`/api/player/${playerId}/profile`).catch(() => null), // Non bloccare se fallisce
        fetch(`/api/player/${playerId}/wl`).catch(() => null), // Non bloccare se fallisce
        fetch(`/api/player/${playerId}/benchmarks`).catch(() => null) // Non bloccare se fallisce
      ])

      if (!statsResponse.ok) throw new Error('Failed to fetch player stats')

      const statsData = await statsResponse.json()
      const advancedData = advancedResponse.ok ? await advancedResponse.json() : null
      const profileData = profileResponse?.ok ? await profileResponse.json() : null
      const wlData = wlResponse?.ok ? await wlResponse.json() : null
      const benchmarksData = benchmarksResponse?.ok ? await benchmarksResponse.json() : null

      // Enhance stats with advanced data if available
      if (advancedData?.stats) {
        setStats({
          ...statsData.stats,
          advanced: advancedData.stats
        })
      } else {
        setStats(statsData.stats)
      }

      // Extract avatar and rank from profile
      if (profileData) {
        setPlayerProfile({
          avatar: profileData.avatar || null,
          personaname: profileData.personaname || null,
          rankTier: profileData.rankTier || 0,
          rankMedalUrl: profileData.rankMedalUrl || null,
          soloMMR: profileData.soloMMR || null,
        })
        
        // Store full profile for recommendations and phase analysis
        setFullProfile({
          recommendations: profileData.recommendations || null,
          phaseAnalysis: profileData.phaseAnalysis || null
        })
      }

      // Set benchmarks if available
      if (benchmarksData) {
        setBenchmarks(benchmarksData)
      }

      // Set win/loss global stats
      if (wlData && (wlData.win !== undefined || wlData.lose !== undefined)) {
        setWinLoss({
          win: wlData.win || 0,
          lose: wlData.lose || 0
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchStats()
    }
  }, [playerId, fetchStats])


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

  // Show input option if no player ID available
  if (!playerId) {
    return (
      <PlayerIdInput
        pageTitle="PRO DOTA ANALISI - AttilaLAB"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare le statistiche. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const getWinrateTrend = () => {
    if (!stats || !stats.winrate) return { label: 'N/A', color: 'bg-gray-500' }
    const delta = stats.winrate.delta || 0
    if (delta > 5) return { label: 'In aumento', color: 'bg-green-500' }
    if (delta < -5) return { label: 'In calo', color: 'bg-red-500' }
    return { label: 'Stabile', color: 'bg-gray-500' }
  }

  const getKDATrend = () => {
    if (!stats || !stats.kda) return { label: 'N/A', color: 'bg-gray-500' }
    const delta = stats.kda.delta || 0
    if (delta > 0.5) return { label: 'Migliora', color: 'bg-green-500' }
    if (delta < -0.5) return { label: 'Peggiora', color: 'bg-red-500' }
    return { label: 'Stabile', color: 'bg-gray-500' }
  }

  const getInsight = () => {
    if (!stats) return null
    const winrateDelta = stats.winrate.delta
    // Mostra insight solo se c'è un delta significativo (>= 10% o <= -10%)
    if (winrateDelta < -10) {
      return {
        title: 'Trend in calo',
        reason: `Winrate ultime 5 partite: ${stats.winrate.last5.toFixed(1)}% vs ultime 10: ${stats.winrate.last10.toFixed(1)}% (delta: ${winrateDelta.toFixed(1)}%)`,
        suggestion: 'Considera di fare una pausa o analizzare le partite perse per identificare pattern negativi.'
      }
    }
    if (winrateDelta > 10) {
      return {
        title: 'Trend positivo',
        reason: `Winrate ultime 5 partite: ${stats.winrate.last5.toFixed(1)}% vs ultime 10: ${stats.winrate.last10.toFixed(1)}% (delta: +${winrateDelta.toFixed(1)}%)`,
        suggestion: 'Continua così! Mantieni lo stesso approccio e stile di gioco.'
      }
    }
    return null // Non mostrare insight se il trend è stabile
  }

  // Calculate heatmap data (day of week x hour of day)
  const calculateHeatmap = () => {
    if (!stats?.matches || stats.matches.length === 0) return null

    // Initialize 7x24 grid (days x hours)
    const heatmapData: Record<number, Record<number, { total: number; wins: number }>> = {}
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

    // Initialize all cells
    for (let day = 0; day < 7; day++) {
      heatmapData[day] = {}
      for (let hour = 0; hour < 24; hour++) {
        heatmapData[day][hour] = { total: 0, wins: 0 }
      }
    }

    // Process each match
    stats.matches.forEach((match) => {
      const matchDate = new Date(match.start_time * 1000)
      const dayOfWeek = matchDate.getDay() // 0 = Sunday, 6 = Saturday
      const hourOfDay = matchDate.getHours()

      if (heatmapData[dayOfWeek] && heatmapData[dayOfWeek][hourOfDay]) {
        heatmapData[dayOfWeek][hourOfDay].total++
        if (match.win) {
          heatmapData[dayOfWeek][hourOfDay].wins++
        }
      }
    })

    // Calculate winrates and find best times
    const heatmapWinrates: Array<{ day: number; hour: number; winrate: number; total: number }> = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const cell = heatmapData[day][hour]
        if (cell.total > 0) {
          const winrate = (cell.wins / cell.total) * 100
          heatmapWinrates.push({ day, hour, winrate, total: cell.total })
        }
      }
    }

    // Find top 3 best times
    const bestTimes = heatmapWinrates
      .sort((a, b) => b.winrate - a.winrate)
      .slice(0, 3)
      .map((item) => ({
        day: days[item.day],
        hour: `${item.hour.toString().padStart(2, '0')}:00`,
        winrate: item.winrate,
        total: item.total,
      }))

    return { heatmapData, heatmapWinrates, bestTimes, days }
  }

  // Calculate values only when stats is available
  // Calculate top heroes from matches (filter out heroes with < 2 games)
  const getTopHeroes = () => {
    if (!stats?.matches) return []
    const heroMap = new Map<number, { wins: number; games: number }>()
    
    stats.matches.forEach(match => {
      if (match.hero_id) {
        const current = heroMap.get(match.hero_id) || { wins: 0, games: 0 }
        heroMap.set(match.hero_id, {
          wins: current.wins + (match.win ? 1 : 0),
          games: current.games + 1
        })
      }
    })
    
    return Array.from(heroMap.entries())
      .map(([hero_id, data]) => ({
        hero_id,
        games: data.games,
        wins: data.wins,
        winrate: data.games > 0 ? (data.wins / data.games) * 100 : 0
      }))
      .filter(hero => hero.games >= 2) // Remove heroes with < 2 games
      .sort((a, b) => b.winrate - a.winrate || b.games - a.games) // Sort by winrate first, then games
      .slice(0, 8) // Max 8 heroes
  }

  const topHeroes = stats ? getTopHeroes() : []

  const chartData = (stats?.matches && Array.isArray(stats.matches) && stats.matches.length > 0)
    ? stats.matches.map((m, idx) => ({
        match: `Match ${idx + 1}`,
        winrate: m.win ? 100 : 0,
        kda: m.kda || 0,
        gpm: m.gpm || 0,
      }))
    : []
  const heatmap = stats ? calculateHeatmap() : null
  const winrateTrend = stats ? getWinrateTrend() : { label: 'N/A', color: 'bg-gray-500' }
  const kdaTrend = stats ? getKDATrend() : { label: 'N/A', color: 'bg-gray-500' }

  // Format match duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format match date
  const formatMatchDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Oggi'
    if (diffDays === 1) return 'Ieri'
    if (diffDays < 7) return `${diffDays} giorni fa`
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      
      {/* Profile Header Card */}
      <div className="mb-6" data-tour="dashboard-overview">
        {playerProfile && (
          <ProfileHeaderCard
            playerId={playerId || undefined}
            avatarUrl={playerProfile.avatar}
            playerName={playerProfile.personaname}
            rankTier={playerProfile.rankTier}
            rankMedalUrl={playerProfile.rankMedalUrl}
            soloMMR={playerProfile.soloMMR}
            winrate={(() => {
              if (!stats?.matches || stats.matches.length === 0) return undefined
              const last20 = stats.matches.slice(0, 20)
              const wins = last20.filter(m => m.win).length
              return last20.length > 0 ? (wins / last20.length) * 100 : undefined
            })()}
            totalMatches={stats?.matches ? Math.min(stats.matches.length, 20) : undefined}
            lastMatchTime={stats?.matches?.[0]?.start_time}
            winLoss={(() => {
              if (!stats?.matches || stats.matches.length === 0) return null
              const last20 = stats.matches.slice(0, 20)
              const wins = last20.filter(m => m.win).length
              const losses = last20.length - wins
              return { win: wins, lose: losses }
            })()}
            showSettingsLink={true}
          />
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {/* Header Skeleton */}
          <div className="mb-4">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse" />
          </div>

          {/* Snapshot Cards Skeleton */}
          <div className="mb-4">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Chart Skeleton */}
          <ChartSkeleton />

          {/* Recent Matches Skeleton */}
          <div className="mb-4">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {stats && !loading && (
        <>
          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <KpiCard
              title="Win Rate"
              value={(() => {
                if (!stats.matches || stats.matches.length === 0) return '0%'
                const last20 = stats.matches.slice(0, 20)
                const wins = last20.filter(m => m.win).length
                const winrate20 = last20.length > 0 ? (wins / last20.length) * 100 : 0
                return `${winrate20.toFixed(0)}%`
              })()}
              subtitle="Ultime 20 partite"
              icon={<BarChart3 className="w-4 h-4" />}
              valueColor={(() => {
                if (!stats.matches || stats.matches.length === 0) return 'text-white'
                const last20 = stats.matches.slice(0, 20)
                const wins = last20.filter(m => m.win).length
                const winrate20 = last20.length > 0 ? (wins / last20.length) * 100 : 0
                return winrate20 >= 50 ? 'text-green-400' : 'text-red-400'
              })()}
            />
            <KpiCard
              title="KDA Medio"
              value={(() => {
                if (!stats.matches || stats.matches.length === 0) return '0.00'
                const last20 = stats.matches.slice(0, 20)
                const kdaSum = last20.reduce((sum, m) => sum + (m.kda || 0), 0)
                const avgKda = last20.length > 0 ? kdaSum / last20.length : 0
                return avgKda.toFixed(2)
              })()}
              subtitle="Ultime 20 partite"
              icon={<Trophy className="w-4 h-4" />}
              valueColor="text-white"
            />
            <KpiCard
              title="Farm Medio"
              value={(() => {
                if (!stats.matches || stats.matches.length === 0) return '0'
                const last20 = stats.matches.slice(0, 20)
                const gpmSum = last20.reduce((sum, m) => sum + (m.gpm || 0), 0)
                const avgGpm = last20.length > 0 ? gpmSum / last20.length : 0
                return Math.round(avgGpm).toLocaleString()
              })()}
              subtitle="GPM - Ultime 20 partite"
              icon={<TrendingUp className="w-4 h-4" />}
              valueColor="text-white"
            />
          </div>

          {/* Top Heroes / Key Matches - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4 mb-1 items-start">
            {/* Hero Pool Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-white mb-3">Hero Pool</h3>
              {topHeroes.length > 0 ? (
                <>
                  {/* Heroes Grid - Compact horizontal layout */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {topHeroes.slice(0, 8).map((hero) => (
                      <div
                        key={hero.hero_id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                      >
                        {heroes[hero.hero_id] ? (
                          <HeroIcon
                            heroId={hero.hero_id}
                            heroName={heroes[hero.hero_id].name}
                            size={40}
                            className="rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-400 font-bold">{hero.hero_id}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white truncate">
                            {heroes[hero.hero_id]?.localized_name || `Hero ${hero.hero_id}`}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className={`font-semibold ${
                              hero.winrate >= 60 ? 'text-green-400' : 
                              hero.winrate >= 50 ? 'text-yellow-400' : 
                              'text-red-400'
                            }`}>
                              {hero.winrate.toFixed(0)}%
                            </span>
                            <span className="text-gray-500">{hero.games}p</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Insight Bulb for Hero Pool */}
                  {(() => {
                    const avgWinrate = topHeroes.reduce((sum, h) => sum + h.winrate, 0) / topHeroes.length
                    const highWinrateHeroes = topHeroes.filter(h => h.winrate >= 60).length
                    const poolSize = topHeroes.length
                    
                    let insightTitle = 'Pool Eroe'
                    let insightReason = ''
                    
                    if (poolSize < 5) {
                      insightReason = `Hai giocato solo ${poolSize} eroi diversi. Considera di espandere il pool per maggiore adattabilità.`
                    } else if (highWinrateHeroes >= 3) {
                      insightReason = `${highWinrateHeroes} eroi con winrate >60%. Focus su questi per massimizzare le vittorie.`
                    } else if (avgWinrate >= 55) {
                      insightReason = `Winrate medio ${avgWinrate.toFixed(0)}% sul pool. Prestazioni solide, continua così.`
                    } else {
                      insightReason = `Winrate medio ${avgWinrate.toFixed(0)}%. Valuta di praticare di più gli eroi con winrate basso.`
                    }
                    
                    return (
                      <InsightBulb
                        title={insightTitle}
                        reason={insightReason}
                      />
                    )
                  })()}
                </>
              ) : (
                <div className="text-sm text-gray-500 py-4">Nessun dato hero disponibile</div>
              )}
            </div>

            {/* Key Matches Card */}
            <KeyMatchesCard
              matches={stats.matches || []}
              heroes={heroes}
              formatMatchDate={formatMatchDate}
              formatDuration={formatDuration}
            />
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-2">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview' as TabType, name: 'Overview', icon: BarChartIcon },
                { id: 'trends' as TabType, name: 'Trend & Statistiche', icon: Activity },
                { id: 'matches' as TabType, name: 'Partite', icon: Gamepad2 },
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
            <div className="p-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Snapshot Stato Forma */}
                  <div>
            <h3 className="text-xl font-semibold mb-3">Snapshot Stato Forma (ultime 20 partite)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Winrate Trend Card */}
              <AnimatedCard index={0} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-2">Winrate Trend</h4>
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${winrateTrend.color} text-white`}>
                    {winrateTrend.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Ultime 5 partite: </span>
                    <span className="font-bold">{(stats.winrate?.last5 ?? 0).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ultime 10 partite: </span>
                    <span className="font-bold">{(stats.winrate?.last10 ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Delta: </span>
                    {(stats.winrate?.delta ?? 0) > 5 ? (
                      <motion.span 
                        className={`font-bold ${(stats.winrate?.delta ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {(stats.winrate?.delta ?? 0) >= 0 ? '+' : ''}{(stats.winrate?.delta ?? 0).toFixed(1)}%
                      </motion.span>
                    ) : (
                      <span className={`font-bold ${(stats.winrate?.delta ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(stats.winrate?.delta ?? 0) >= 0 ? '+' : ''}{(stats.winrate?.delta ?? 0).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Trend basato su ultime 5/10 partite (di 20 totali)</p>
              </AnimatedCard>

              {/* KDA Trend Card */}
              <AnimatedCard index={1} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-2">KDA Trend</h4>
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${kdaTrend.color} text-white`}>
                    {kdaTrend.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Ultime 5 partite: </span>
                    <span className="font-bold">{(stats.kda?.last5 ?? 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ultime 10 partite: </span>
                    <span className="font-bold">{(stats.kda?.last10 ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Delta: </span>
                    {(stats.kda?.delta ?? 0) > 0.5 ? (
                      <motion.span 
                        className={`font-bold ${(stats.kda?.delta ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {(stats.kda?.delta ?? 0) >= 0 ? '+' : ''}{(stats.kda?.delta ?? 0).toFixed(2)}
                      </motion.span>
                    ) : (
                      <span className={`font-bold ${(stats.kda?.delta ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(stats.kda?.delta ?? 0) >= 0 ? '+' : ''}{(stats.kda?.delta ?? 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">KDA = (Kill + Assist) / Death</p>
              </AnimatedCard>

              {/* Farm Trend Card */}
              <AnimatedCard index={2} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-2">Farm Trend</h4>
                <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <div>
                      <span className="text-gray-400">Ultime 5 partite: </span>
                      <span className="font-bold text-yellow-400">{(stats.farm?.gpm?.last5 ?? 0).toFixed(0)}</span>
                      <span className="text-gray-500 text-xs ml-1">GPM</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ultime 10 partite: </span>
                      <span className="font-bold text-gray-300">{(stats.farm?.gpm?.last10 ?? 0).toFixed(0)}</span>
                      <span className="text-gray-500 text-xs ml-1">GPM</span>
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-gray-700">
                    <div>
                      <span className="text-gray-400">Ultime 5 partite: </span>
                      <span className="font-bold text-blue-400">{(stats.farm?.xpm?.last5 ?? 0).toFixed(0)}</span>
                      <span className="text-gray-500 text-xs ml-1">XPM</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ultime 10 partite: </span>
                      <span className="font-bold text-gray-300">{(stats.farm?.xpm?.last10 ?? 0).toFixed(0)}</span>
                      <span className="text-gray-500 text-xs ml-1">XPM</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Media calcolata su ultime 5/10 partite (su 20 totali analizzate)</p>
              </AnimatedCard>

                  </div>
                  </div>
                  
                  {/* Insight Bulb - Solo se c'è un trend significativo */}
                  {(() => {
                    const insight = getInsight()
                    return insight ? (
                      <div className="mt-4">
                        <InsightBulb
                          title={insight.title}
                          reason={insight.reason}
                          suggestion={insight.suggestion}
                        />
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {/* Trends & Stats Tab */}
              {activeTab === 'trends' && (
                <div className="space-y-4">
                  {/* Statistiche Globali */}
                  {winLoss && (winLoss.win > 0 || winLoss.lose > 0) && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Statistiche Globali (Storico Totale)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Winrate Globale Card */}
                        <AnimatedCard index={0} className="bg-gradient-to-br from-green-900/30 to-gray-800 border border-green-700/50 rounded-lg p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-green-300">Winrate Globale</h4>
                            <Trophy className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-white">
                              {((winLoss.win / (winLoss.win + winLoss.lose)) * 100).toFixed(1)}%
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Vittorie: </span>
                                <span className="font-semibold text-green-400">{winLoss.win.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Sconfitte: </span>
                                <span className="font-semibold text-red-400">{winLoss.lose.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="pt-2">
                              <span className="text-gray-400 text-xs">Totale partite: </span>
                              <span className="font-semibold text-white">{(winLoss.win + winLoss.lose).toLocaleString()}</span>
                            </div>
                          </div>
                        </AnimatedCard>

                        {/* Vittorie Card */}
                        <AnimatedCard index={1} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold">Vittorie Totali</h4>
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-green-400">
                              {winLoss.win.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">
                              {winLoss.win > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ width: `${(winLoss.win / (winLoss.win + winLoss.lose)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">
                                    {((winLoss.win / (winLoss.win + winLoss.lose)) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </AnimatedCard>

                        {/* Confronto Trend Card */}
                        <AnimatedCard index={2} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                          <h4 className="text-lg font-semibold mb-3">Confronto Trend</h4>
                          <div className="space-y-3 text-sm">
                            {stats?.winrate && (
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-400">Winrate Globale:</span>
                                  <span className="font-semibold text-white">
                                    {((winLoss.win / (winLoss.win + winLoss.lose)) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Winrate Recente (10):</span>
                                  <span className={`font-semibold ${stats.winrate.last10 >= (winLoss.win / (winLoss.win + winLoss.lose)) * 100 ? 'text-green-400' : 'text-red-400'}`}>
                                    {stats.winrate.last10.toFixed(1)}%
                                  </span>
                                </div>
                                {stats.winrate.last10 >= (winLoss.win / (winLoss.win + winLoss.lose)) * 100 ? (
                                  <p className="text-xs text-green-400 mt-2">✓ In miglioramento rispetto alla media</p>
                                ) : (
                                  <p className="text-xs text-red-400 mt-2">↓ In calo rispetto alla media</p>
                                )}
                              </div>
                            )}
                          </div>
                        </AnimatedCard>
                      </div>
                    </div>
                  )}

                  {/* Benchmarks Compatti */}
                  {benchmarks && (benchmarks.percentiles || benchmarks.calculatedPercentiles) && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-400" />
                        Benchmark & Percentili
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* GPM Percentile */}
                        {(benchmarks.percentiles?.gpm || benchmarks.calculatedPercentiles?.gpm) && (
                          <AnimatedCard index={0} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                            <div className="text-sm text-gray-400 mb-2">GPM (Gold per Minuto)</div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <div className="text-2xl font-bold text-yellow-400">
                                {benchmarks.percentiles?.gpm ? (stats?.farm?.gpm?.last10 ?? 0).toFixed(0) : benchmarks.calculatedPercentiles?.gpm.value.toFixed(0) ?? '0'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Percentile:</span>
                              <span className={`text-sm font-bold ${
                                (benchmarks.percentiles?.gpm?.percentile ?? benchmarks.calculatedPercentiles?.gpm.percentile ?? 0) >= 75 ? 'text-green-400' :
                                (benchmarks.percentiles?.gpm?.percentile ?? benchmarks.calculatedPercentiles?.gpm.percentile ?? 0) >= 50 ? 'text-blue-400' :
                                'text-gray-400'
                              }`}>
                                {benchmarks.percentiles?.gpm?.label ?? benchmarks.calculatedPercentiles?.gpm.label ?? 'N/A'}
                              </span>
                            </div>
                          </AnimatedCard>
                        )}

                        {/* XPM Percentile */}
                        {(benchmarks.percentiles?.xpm || benchmarks.calculatedPercentiles?.xpm) && (
                          <AnimatedCard index={1} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                            <div className="text-sm text-gray-400 mb-2">XPM (XP per Minuto)</div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <div className="text-2xl font-bold text-blue-400">
                                {benchmarks.percentiles?.xpm ? (stats?.farm?.xpm?.last10 ?? 0).toFixed(0) : benchmarks.calculatedPercentiles?.xpm.value.toFixed(0) ?? '0'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Percentile:</span>
                              <span className={`text-sm font-bold ${
                                (benchmarks.percentiles?.xpm?.percentile ?? benchmarks.calculatedPercentiles?.xpm.percentile ?? 0) >= 75 ? 'text-green-400' :
                                (benchmarks.percentiles?.xpm?.percentile ?? benchmarks.calculatedPercentiles?.xpm.percentile ?? 0) >= 50 ? 'text-blue-400' :
                                'text-gray-400'
                              }`}>
                                {benchmarks.percentiles?.xpm?.label ?? benchmarks.calculatedPercentiles?.xpm.label ?? 'N/A'}
                              </span>
                            </div>
                          </AnimatedCard>
                        )}

                        {/* KDA Percentile */}
                        {(benchmarks.percentiles?.kda || benchmarks.calculatedPercentiles?.kda) && (
                          <AnimatedCard index={2} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                            <div className="text-sm text-gray-400 mb-2">KDA Ratio</div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <div className="text-2xl font-bold text-red-400">
                                {benchmarks.percentiles?.kda ? (stats?.kda?.last10 ?? 0).toFixed(2) : benchmarks.calculatedPercentiles?.kda.value.toFixed(2) ?? '0.00'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Percentile:</span>
                              <span className={`text-sm font-bold ${
                                (benchmarks.percentiles?.kda?.percentile ?? benchmarks.calculatedPercentiles?.kda.percentile ?? 0) >= 75 ? 'text-green-400' :
                                (benchmarks.percentiles?.kda?.percentile ?? benchmarks.calculatedPercentiles?.kda.percentile ?? 0) >= 50 ? 'text-blue-400' :
                                'text-gray-400'
                              }`}>
                                {benchmarks.percentiles?.kda?.label ?? benchmarks.calculatedPercentiles?.kda.label ?? 'N/A'}
                              </span>
                            </div>
                          </AnimatedCard>
                        )}
                      </div>
                      {benchmarks.source === 'calculated' && (
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Percentili calcolati basati su standard Dota 2. Per percentili più accurati, assicurati che il tuo profilo OpenDota sia pubblico.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quick Recommendations */}
                  {fullProfile?.recommendations && fullProfile.recommendations.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-400" />
                          Raccomandazioni Rapide
                        </h3>
                        <Link
                          href="/dashboard/profiling"
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Vedi tutte →
                        </Link>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-900/20 to-gray-800 border border-yellow-700/50 rounded-lg p-5">
                        <ul className="space-y-3">
                          {fullProfile.recommendations.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mt-0.5">
                                <span className="text-yellow-400 text-xs font-bold">{idx + 1}</span>
                              </div>
                              <p className="text-gray-200 text-sm flex-1">{rec}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Phase Analysis */}
                  {fullProfile?.phaseAnalysis && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        Fase del Gioco Preferita
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Early Game */}
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-2">Early Game</div>
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-green-400">{Math.round(fullProfile.phaseAnalysis.early.score)}</div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">Score</div>
                              <div className="text-xs text-gray-300">{fullProfile.phaseAnalysis.early.strength}</div>
                            </div>
                          </div>
                        </div>

                        {/* Mid Game */}
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-2">Mid Game</div>
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-blue-400">{Math.round(fullProfile.phaseAnalysis.mid.score)}</div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">Score</div>
                              <div className="text-xs text-gray-300">{fullProfile.phaseAnalysis.mid.strength}</div>
                            </div>
                          </div>
                        </div>

                        {/* Late Game */}
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-2">Late Game</div>
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-purple-400">{Math.round(fullProfile.phaseAnalysis.late.score)}</div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">Score</div>
                              <div className="text-xs text-gray-300">{fullProfile.phaseAnalysis.late.strength}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Heatmap Partite */}
                  {heatmap && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Heatmap Partite - Quando Giochi Meglio</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Visualizza il tuo winrate per giorno della settimana e ora del giorno
                      </p>
                      
                      {/* Heatmap Grid */}
                      <div className="overflow-x-auto mb-6">
                        <div className="inline-block min-w-full">
                          {/* Header - Hours */}
                          <div className="flex mb-2">
                            <div className="w-16 flex-shrink-0"></div>
                            {Array.from({ length: 24 }, (_, i) => (
                              <div key={i} className="flex-1 text-xs text-gray-500 text-center min-w-[30px]">
                                {i % 4 === 0 ? i : ''}
                              </div>
                            ))}
                          </div>
                          
                          {/* Rows - Days */}
                          {heatmap.days.map((dayName, dayIdx) => (
                            <div key={dayIdx} className="flex mb-1">
                              <div className="w-16 flex-shrink-0 text-sm text-gray-400 font-medium py-2">
                                {dayName}
                              </div>
                              {Array.from({ length: 24 }, (_, hourIdx) => {
                                const cell = heatmap.heatmapData[dayIdx]?.[hourIdx]
                                const winrate = cell && cell.total > 0 ? (cell.wins / cell.total) * 100 : 0
                                const intensity = cell && cell.total > 0 ? Math.min(winrate / 100, 1) : 0
                                
                                // Color based on winrate: red (low) to green (high)
                                const red = Math.round(255 * (1 - intensity))
                                const green = Math.round(255 * intensity)
                                const bgColor = cell && cell.total > 0 
                                  ? `rgb(${red}, ${green}, 0)` 
                                  : '#1F2937'
                                
                                return (
                                  <div
                                    key={hourIdx}
                                    className="flex-1 min-w-[30px] h-8 border border-gray-700 rounded cursor-pointer hover:border-red-500 transition-colors relative group"
                                    style={{ backgroundColor: bgColor }}
                                    title={cell && cell.total > 0 
                                      ? `${dayName} ${hourIdx}:00 - Winrate: ${winrate.toFixed(1)}% (${cell.total} partite)`
                                      : `${dayName} ${hourIdx}:00 - Nessuna partita`
                                    }
                                  >
                                    {cell && cell.total > 0 && (
                                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {winrate.toFixed(0)}%
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm text-gray-400">Legenda:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-600 rounded"></div>
                          <span className="text-xs text-gray-400">Basso Winrate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span className="text-xs text-gray-400">Medio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-600 rounded"></div>
                          <span className="text-xs text-gray-400">Alto Winrate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-700 rounded"></div>
                          <span className="text-xs text-gray-400">Nessuna Partita</span>
                        </div>
                      </div>

                      {/* Best Times Cards */}
                      {heatmap.bestTimes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-green-900/30 to-gray-800 border border-green-700 rounded-lg p-4">
                            <h4 className="text-sm text-gray-400 mb-2">Orario Migliore #1</h4>
                            <p className="text-xl font-bold text-green-400">
                              {heatmap.bestTimes[0].day} {heatmap.bestTimes[0].hour}
                            </p>
                            <p className="text-sm text-gray-300 mt-1">
                              Winrate: {heatmap.bestTimes[0].winrate.toFixed(1)}% ({heatmap.bestTimes[0].total} partite)
                            </p>
                          </div>
                          {heatmap.bestTimes[1] && (
                            <div className="bg-gradient-to-br from-green-900/20 to-gray-800 border border-green-700/50 rounded-lg p-4">
                              <h4 className="text-sm text-gray-400 mb-2">Orario Migliore #2</h4>
                              <p className="text-xl font-bold text-green-400">
                                {heatmap.bestTimes[1].day} {heatmap.bestTimes[1].hour}
                              </p>
                              <p className="text-sm text-gray-300 mt-1">
                                Winrate: {heatmap.bestTimes[1].winrate.toFixed(1)}% ({heatmap.bestTimes[1].total} partite)
                              </p>
                            </div>
                          )}
                          {heatmap.bestTimes[2] && (
                            <div className="bg-gradient-to-br from-green-900/20 to-gray-800 border border-green-700/50 rounded-lg p-4">
                              <h4 className="text-sm text-gray-400 mb-2">Orario Migliore #3</h4>
                              <p className="text-xl font-bold text-green-400">
                                {heatmap.bestTimes[2].day} {heatmap.bestTimes[2].hour}
                              </p>
                              <p className="text-sm text-gray-300 mt-1">
                                Winrate: {heatmap.bestTimes[2].winrate.toFixed(1)}% ({heatmap.bestTimes[2].total} partite)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trend Ultime 10 Partite */}
                  {chartData.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                      {playerId && (
                        <InsightBadge
                          elementType="trend-chart"
                          elementId="dashboard-trend-chart"
                          contextData={{ trends: { winrate: stats.winrate ?? {}, kda: stats.kda ?? {}, farm: stats.farm ?? {} }, data: chartData }}
                          playerId={playerId}
                          position="top-right"
                        />
                      )}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold mb-3">Trend Ultime 20 Partite</h3>
                        <span className="text-sm text-gray-400">{chartData.length} partite analizzate</span>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="match" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="kda"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            name="KDA"
                            dot={{ fill: '#F59E0B' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="gpm"
                            stroke="#10B981"
                            strokeWidth={2}
                            name="GPM"
                            dot={{ fill: '#10B981' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="winrate"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            name="Winrate %"
                            dot={{ fill: '#3B82F6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Quick Stats Cards */}
                  {stats.advanced && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm text-gray-400 uppercase tracking-wider">Last Hits</h4>
                          <Sword className="w-6 h-6" />
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.advanced.lane.avgLastHits.toFixed(1)}</p>
                        <p className="text-xs text-gray-500 mt-1">Media per partita</p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm text-gray-400 uppercase tracking-wider">Hero Damage</h4>
                          <Sparkles className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-3xl font-bold text-red-400">{Math.round(stats.advanced.fights.avgHeroDamage).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Danno medio</p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm text-gray-400 uppercase tracking-wider">Kill Participation</h4>
                          <Zap className="w-8 h-8 text-yellow-400" />
                        </div>
                        <p className="text-3xl font-bold text-green-400">{stats.advanced.fights.killParticipation.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">Partecipazione fight</p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm text-gray-400 uppercase tracking-wider">Net Worth</h4>
                          <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-400">{Math.round(stats.advanced.farm.avgNetWorth).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Valore medio</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Matches Tab */}
              {activeTab === 'matches' && (
                <div className="space-y-4">
                  {/* Recent Matches Grid */}
                  {stats.matches && stats.matches.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold mb-3">Ultime Partite</h3>
                        <Link
                          href="/dashboard/matches"
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Vedi tutte →
                        </Link>
                      </div>
                      <div className="grid md:grid-cols-5 gap-4">
                        {(stats.matches || []).slice(0, 5).map((match, idx) => (
                          <Link
                            key={match.match_id}
                            href={`/analysis/match/${match.match_id}`}
                            className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400">Match {idx + 1}</span>
                              <span className={`text-xs px-2 py-1 rounded ${match.win ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                {match.win ? 'V' : 'S'}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">KDA:</span>
                                <span className="font-bold">{match.kda.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">GPM:</span>
                                <span className="font-bold">{match.gpm}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Links to Deep Analysis */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Analisi Approfondite
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <Link
                        href="/dashboard/performance"
                        className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-8 h-8 text-yellow-400" />
                          <h4 className="font-semibold">Performance</h4>
                        </div>
                        <p className="text-xs text-gray-400">Stile di gioco e profilo performance</p>
                      </Link>
                      <Link
                        href="/dashboard/profiling"
                        className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-8 h-8 text-purple-400" />
                          <h4 className="font-semibold">Profilazione AttilaLAB</h4>
                        </div>
                        <p className="text-xs text-gray-400">Profilo completo con IA</p>
                      </Link>
                      <Link
                        href="/dashboard/advanced"
                        className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FlaskConical className="w-8 h-8 text-blue-400" />
                          <h4 className="font-semibold">Analisi Avanzate</h4>
                        </div>
                        <p className="text-xs text-gray-400">Lane, Farm, Fight, Vision</p>
                      </Link>
                      <Link
                        href="/dashboard/coaching"
                        className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-8 h-8 text-indigo-400" />
                          <h4 className="font-semibold">Coaching</h4>
                        </div>
                        <p className="text-xs text-gray-400">Task e raccomandazioni</p>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}