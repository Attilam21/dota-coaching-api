'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { Sword, Zap, DollarSign, Search, Target, FlaskConical, BookOpen, Sparkles, BarChart as BarChartIcon, Activity, Gamepad2, Trophy, TrendingUp, Award, Clock, Lightbulb, Info } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import { PlayerStatsSkeleton, StatsCardSkeleton, ChartSkeleton, MatchCardSkeleton } from '@/components/SkeletonLoader'
import InsightBadge from '@/components/InsightBadge'
import InsightBulb from '@/components/InsightBulb'
import PlayerAvatar from '@/components/PlayerAvatar'
import ProfileHeaderCard from '@/components/ProfileHeaderCard'
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
          {/* Top Heroes / Key Matches - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4 mb-1 items-stretch">
            {/* Hero Pool Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex flex-col h-full">
              <h3 className="text-sm font-semibold text-white mb-2 flex-shrink-0">Hero Pool</h3>
              {topHeroes.length > 0 ? (
                <div className="flex-1 flex flex-col justify-between min-h-0">
                  {topHeroes.slice(0, 5).map((hero) => {
                    const heroName = heroes[hero.hero_id]?.localized_name || `Hero ${hero.hero_id}`
                    const winrateColor = hero.winrate >= 60 ? 'text-green-400' : hero.winrate >= 50 ? 'text-yellow-400' : 'text-red-400'
                    const bgColor = hero.winrate >= 60 ? 'bg-green-900/20' : hero.winrate >= 50 ? 'bg-yellow-900/20' : 'bg-red-900/20'
                    const borderColor = hero.winrate >= 60 ? 'border-green-700/50' : hero.winrate >= 50 ? 'border-yellow-700/50' : 'border-red-700/50'
                    
                    // Insight per ogni hero
                    let insightTitle = hero.winrate >= 60 ? 'Eroe Forte' : hero.winrate >= 50 ? 'Eroe Solido' : 'Eroe da Migliorare'
                    let insightReason = ''
                    if (hero.winrate >= 60) {
                      insightReason = `Winrate ${hero.winrate.toFixed(0)}% su ${hero.games} partite. Continua a giocarlo.`
                    } else if (hero.winrate >= 50) {
                      insightReason = `Winrate ${hero.winrate.toFixed(0)}% su ${hero.games} partite. Potenziale di crescita.`
                    } else {
                      insightReason = `Winrate ${hero.winrate.toFixed(0)}% su ${hero.games} partite. Analizza le partite per migliorare.`
                    }
                    
                    return (
                      <div
                        key={hero.hero_id}
                        className={`border rounded-lg p-2 ${borderColor} ${bgColor} flex-1 flex flex-col`}
                      >
                        {/* Header: Hero Name + Winrate Badge */}
                        <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold ${winrateColor}`}>{heroName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              hero.winrate >= 60 ? 'bg-green-600 text-white' : 
                              hero.winrate >= 50 ? 'bg-yellow-600 text-white' : 
                              'bg-red-600 text-white'
                            }`}>
                              {hero.winrate.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Hero Icon + Stats */}
                        <div className="flex items-center gap-1.5 mb-1.5 flex-shrink-0">
                          {heroes[hero.hero_id] ? (
                            <HeroIcon
                              heroId={hero.hero_id}
                              heroName={heroes[hero.hero_id].name}
                              size={28}
                              className="rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-gray-400 font-bold">{hero.hero_id}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-[10px] text-gray-300 mb-0.5 leading-tight">{heroName}</div>
                            <div className="text-xs font-bold text-white leading-tight">
                              {hero.games}p • {hero.wins}W / {hero.games - hero.wins}L
                            </div>
                          </div>
                        </div>

                        {/* Insight Bulb */}
                        <div className="mb-1.5 flex-shrink-0">
                          <InsightBulb
                            title={insightTitle}
                            reason={insightReason}
                            className="p-2"
                          />
                        </div>

                        {/* CTA Button */}
                        <Link
                          href={`/dashboard/heroes`}
                          className="block w-full text-center text-[10px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg py-1 transition-colors flex-shrink-0 mt-auto"
                        >
                          Vedi analisi
                        </Link>
                      </div>
                    )
                  })}
                </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* KDA Trend Card */}
              <AnimatedCard index={0} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
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
              <AnimatedCard index={1} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
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
                  {/* Statistiche Globali + Winrate Trend - Combinati in una riga */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Statistiche Globali - Compatte */}
                    {winLoss && (winLoss.win > 0 || winLoss.lose > 0) && (
                      <>
                        <AnimatedCard index={0} className="bg-gradient-to-br from-green-900/30 to-gray-800 border border-green-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-green-300">Winrate Globale</h4>
                            <Trophy className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {((winLoss.win / (winLoss.win + winLoss.lose)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-400">
                            {winLoss.win.toLocaleString()}W / {winLoss.lose.toLocaleString()}L
                          </div>
                        </AnimatedCard>

                        <AnimatedCard index={1} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold">Vittorie Totali</h4>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {winLoss.win.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Totale: {(winLoss.win + winLoss.lose).toLocaleString()} partite
                          </div>
                        </AnimatedCard>
                      </>
                    )}

                    {/* Winrate Trend - Compatto */}
                    <AnimatedCard index={2} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Winrate Trend</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${winrateTrend.color} text-white`}>
                          {winrateTrend.label}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ultime 5:</span>
                          <span className="font-bold">{(stats.winrate?.last5 ?? 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ultime 10:</span>
                          <span className="font-bold">{(stats.winrate?.last10 ?? 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-700">
                          <span className="text-gray-400">Delta:</span>
                          <span className={`font-bold ${(stats.winrate?.delta ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(stats.winrate?.delta ?? 0) >= 0 ? '+' : ''}{(stats.winrate?.delta ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </AnimatedCard>
                  </div>

                  {/* Trend Grafico - Ridotto */}
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
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">Trend Ultime 20 Partite</h3>
                        <span className="text-xs text-gray-400">{chartData.length} partite</span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="match" stroke="#9CA3AF" fontSize={10} />
                          <YAxis stroke="#9CA3AF" fontSize={10} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line
                            type="monotone"
                            dataKey="kda"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            name="KDA"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="gpm"
                            stroke="#10B981"
                            strokeWidth={2}
                            name="GPM"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="winrate"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            name="Winrate %"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Benchmarks + Phase Analysis - In una riga */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Benchmarks Compatti */}
                    {(() => {
                      const hasGpm = benchmarks?.percentiles?.gpm || benchmarks?.calculatedPercentiles?.gpm
                      const hasXpm = benchmarks?.percentiles?.xpm || benchmarks?.calculatedPercentiles?.xpm
                      const hasKda = benchmarks?.percentiles?.kda || benchmarks?.calculatedPercentiles?.kda
                      const hasAnyPercentile = hasGpm || hasXpm || hasKda
                      
                      return (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-blue-400" />
                            Benchmark & Percentili
                          </h3>
                          {hasAnyPercentile ? (
                            <>
                              <div className="grid grid-cols-3 gap-3">
                                {/* GPM Percentile */}
                                {hasGpm ? (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-400 mb-1">
                                      {benchmarks.percentiles?.gpm ? (stats?.farm?.gpm?.last10 ?? 0).toFixed(0) : benchmarks.calculatedPercentiles?.gpm.value.toFixed(0) ?? '0'}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-1">GPM</div>
                                    <div className={`text-xs font-semibold ${
                                      (benchmarks.percentiles?.gpm?.percentile ?? benchmarks.calculatedPercentiles?.gpm.percentile ?? 0) >= 75 ? 'text-green-400' :
                                      (benchmarks.percentiles?.gpm?.percentile ?? benchmarks.calculatedPercentiles?.gpm.percentile ?? 0) >= 50 ? 'text-blue-400' :
                                      'text-gray-400'
                                    }`}>
                                      {benchmarks.percentiles?.gpm?.label ?? benchmarks.calculatedPercentiles?.gpm.label ?? 'N/A'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-gray-500">-</div>
                                )}

                                {/* XPM Percentile */}
                                {hasXpm ? (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-400 mb-1">
                                      {benchmarks.percentiles?.xpm ? (stats?.farm?.xpm?.last10 ?? 0).toFixed(0) : benchmarks.calculatedPercentiles?.xpm.value.toFixed(0) ?? '0'}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-1">XPM</div>
                                    <div className={`text-xs font-semibold ${
                                      (benchmarks.percentiles?.xpm?.percentile ?? benchmarks.calculatedPercentiles?.xpm.percentile ?? 0) >= 75 ? 'text-green-400' :
                                      (benchmarks.percentiles?.xpm?.percentile ?? benchmarks.calculatedPercentiles?.xpm.percentile ?? 0) >= 50 ? 'text-blue-400' :
                                      'text-gray-400'
                                    }`}>
                                      {benchmarks.percentiles?.xpm?.label ?? benchmarks.calculatedPercentiles?.xpm.label ?? 'N/A'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-gray-500">-</div>
                                )}

                                {/* KDA Percentile */}
                                {hasKda ? (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-400 mb-1">
                                      {benchmarks.percentiles?.kda ? (stats?.kda?.last10 ?? 0).toFixed(2) : benchmarks.calculatedPercentiles?.kda.value.toFixed(2) ?? '0.00'}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-1">KDA</div>
                                    <div className={`text-xs font-semibold ${
                                      (benchmarks.percentiles?.kda?.percentile ?? benchmarks.calculatedPercentiles?.kda.percentile ?? 0) >= 75 ? 'text-green-400' :
                                      (benchmarks.percentiles?.kda?.percentile ?? benchmarks.calculatedPercentiles?.kda.percentile ?? 0) >= 50 ? 'text-blue-400' :
                                      'text-gray-400'
                                    }`}>
                                      {benchmarks.percentiles?.kda?.label ?? benchmarks.calculatedPercentiles?.kda.label ?? 'N/A'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-gray-500">-</div>
                                )}
                              </div>
                              {benchmarks?.source === 'calculated' && (
                                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  Percentili calcolati su standard Dota 2
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-400 mb-2">Dati percentili non disponibili</p>
                              <p className="text-xs text-gray-500">
                                Assicurati che il tuo profilo OpenDota sia pubblico per visualizzare i percentili
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Phase Analysis - Compatto */}
                    {fullProfile?.phaseAnalysis && (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          Fase del Gioco Preferita
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-400 mb-1">{Math.round(fullProfile.phaseAnalysis.early.score)}</div>
                            <div className="text-xs text-gray-400 mb-1">Early</div>
                            <div className="text-xs text-gray-300">{fullProfile.phaseAnalysis.early.strength}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-blue-400 mb-1">{Math.round(fullProfile.phaseAnalysis.mid.score)}</div>
                            <div className="text-xs text-gray-400 mb-1">Mid</div>
                            <div className="text-xs text-gray-300">{fullProfile.phaseAnalysis.mid.strength}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-purple-400 mb-1">{Math.round(fullProfile.phaseAnalysis.late.score)}</div>
                            <div className="text-xs text-gray-400 mb-1">Late</div>
                            <div className="text-xs text-gray-300">{fullProfile.phaseAnalysis.late.strength}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Recommendations - Compatto */}
                  {fullProfile?.recommendations && fullProfile.recommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-900/20 to-gray-800 border border-yellow-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          Raccomandazioni Rapide
                        </h3>
                        <Link
                          href="/dashboard/profiling"
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Vedi tutte →
                        </Link>
                      </div>
                      <ul className="space-y-2">
                        {fullProfile.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-yellow-400 font-bold">{idx + 1}.</span>
                            <span className="text-gray-200 flex-1">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Matches Tab */}
              {activeTab === 'matches' && (
                <div className="space-y-4">
                  {/* Link to Full Matches Page */}
                  {stats.matches && stats.matches.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                      <h3 className="text-xl font-semibold mb-3">Partite</h3>
                      <p className="text-gray-400 mb-4">Visualizza tutte le tue partite con analisi dettagliate</p>
                      <Link
                        href="/dashboard/matches"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Vedi tutte le partite →
                      </Link>
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