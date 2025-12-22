/**
 * Utility functions for generating deterministic insights and AI suggestions
 */

export interface BulbInsight {
  text: string
  type: 'risk' | 'strength' | 'bottleneck'
  icon: string
}

export interface AISuggestion {
  problema: string
  azione: string
  impatto: string
  confidenza: 'alta' | 'media' | 'bassa'
}

interface PlayerStats {
  matches: Array<{
    win?: boolean
    radiant_win?: boolean
    player_slot?: number
    deaths: number
    kills?: number
    assists?: number
    gold_per_min?: number
    xp_per_min?: number
    gpm?: number
    xpm?: number
    kda?: number
    hero_id?: number
    role?: string
  }>
  winrate: {
    last10: number
    last5: number
  }
  kda: {
    last10: number
    last5: number
  }
  farm: {
    gpm: { last5: number; last10: number }
    xpm: { last5: number; last10: number }
  }
}

interface MetaComparison {
  playerMetrics: {
    avgGPM: number
    avgXPM: number
    avgKDA: number
    winrate: number
    avgDeaths: number
    avgLastHits: number
  }
  comparisons: Record<string, {
    player: number
    meta: { p50: number; p75: number; p90: number }
    gap: number
    gapPercent: number
    percentile: number
  }>
  improvementAreas: Array<{
    metric: string
    gap: number
    gapPercent: number
    percentile: number
  }>
  role: string
}

/**
 * Build deterministic bulb insights (max 3)
 * Format: [CONDIZIONE] → [IMPATTO]
 */
export function buildBulbInsights(
  stats: PlayerStats | null,
  metaData: MetaComparison | null
): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!stats || !stats.matches || stats.matches.length < 10) {
    return insights // Return empty if insufficient data
  }

  const matches = stats.matches
  const matchCount = matches.length

  // Calculate winrate by condition
  const calculateWinrateByCondition = (condition: (m: any) => boolean): number => {
    const filtered = matches.filter(condition)
    if (filtered.length < 3) return -1 // Not enough data
    const wins = filtered.filter(m => {
      // Handle both win boolean and radiant_win + player_slot
      if (m.win !== undefined) return m.win
      if (m.radiant_win !== undefined && m.player_slot !== undefined) {
        return (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
      }
      return false
    }).length
    return (wins / filtered.length) * 100
  }

  // Get overall winrate
  const overallWinrate = stats.winrate.last10

  // RISCHIO: Deaths alte → Winrate negativo
  const highDeathMatches = matches.filter(m => m.deaths >= 8)
  if (highDeathMatches.length >= 3) {
    const highDeathWinrate = calculateWinrateByCondition(m => m.deaths >= 8)
    if (highDeathWinrate >= 0) {
      const delta = highDeathWinrate - overallWinrate
      if (delta < -5) { // At least 5% difference
        insights.push({
          text: `Death ≥8 → Winrate ${delta.toFixed(0)}%`,
          type: 'risk',
          icon: '⚠️'
        })
      }
    }
  }

  // RISCHIO: Early game negativo (GPM early basso) - solo se non abbiamo già un rischio GPM
  if (metaData && metaData.comparisons.gpm && insights.filter(i => i.type === 'risk' && i.text.includes('GPM')).length === 0) {
    const gpmGap = metaData.comparisons.gpm.gapPercent
    if (gpmGap < -10) { // At least 10% below meta
      insights.push({
        text: `GPM ${gpmGap.toFixed(0)}% vs meta`,
        type: 'risk',
        icon: '⚠️'
      })
    }
  }

  // COLLO DI BOTTIGLIA: Last Hits sotto benchmark
  if (metaData && metaData.comparisons.lastHits) {
    const lhGap = metaData.comparisons.lastHits.gapPercent
    if (lhGap < -15) { // At least 15% below meta
      insights.push({
        text: `Last Hits ${lhGap.toFixed(0)}% vs meta`,
        type: 'bottleneck',
        icon: '📉'
      })
    }
  }

  // FORZA: Ruolo performante (se winrate ruolo > winrate generale)
  if (metaData && metaData.playerMetrics.winrate > 55) {
    const roleWinrate = metaData.playerMetrics.winrate
    const roleName = metaData.role.charAt(0).toUpperCase() + metaData.role.slice(1)
    if (roleWinrate > 55) {
      const delta = roleWinrate - 50 // vs baseline 50%
      insights.push({
        text: `${roleName} → Winrate +${delta.toFixed(0)}% vs media`,
        type: 'strength',
        icon: '✅'
      })
    }
  }

  // Return max 3 insights, prioritizing risk > bottleneck > strength
  const sorted = insights.sort((a, b) => {
    const priority = { risk: 3, bottleneck: 2, strength: 1 }
    return priority[b.type] - priority[a.type]
  })

  return sorted.slice(0, 3).map(insight => ({
    ...insight,
    text: insight.text.length > 60 ? insight.text.substring(0, 57) + '...' : insight.text
  }))
}

/**
 * Build AI suggestion with structured template
 * Format: PROBLEMA / AZIONE / IMPATTO
 */
export function buildAISuggestion(
  stats: PlayerStats | null,
  metaData: MetaComparison | null
): AISuggestion | null {
  if (!stats || !stats.matches || stats.matches.length < 10) {
    return null
  }

  if (!metaData || !metaData.improvementAreas || metaData.improvementAreas.length === 0) {
    return null
  }

  // Get top improvement area
  const topArea = metaData.improvementAreas[0]
  const metricLabels: Record<string, string> = {
    gpm: 'GPM (Gold Per Minute)',
    xpm: 'XPM (Experience Per Minute)',
    kda: 'KDA',
    winrate: 'Winrate',
    heroDamage: 'Hero Damage',
    towerDamage: 'Tower Damage',
    lastHits: 'Last Hits'
  }

  const metricLabel = metricLabels[topArea.metric] || topArea.metric
  const gapAbs = Math.abs(topArea.gapPercent)
  const role = metaData.role.charAt(0).toUpperCase() + metaData.role.slice(1)

  // Determine confidence based on data quality
  let confidenza: 'alta' | 'media' | 'bassa' = 'media'
  if (stats.matches.length >= 20 && gapAbs > 15) {
    confidenza = 'alta'
  } else if (stats.matches.length < 15 || gapAbs < 10) {
    confidenza = 'bassa'
  }

  // Build structured suggestion
  let problema = ''
  let azione = ''
  let impatto = ''

  if (topArea.metric === 'gpm') {
    problema = `${metricLabel} ${gapAbs.toFixed(0)}% sotto meta (${metaData.playerMetrics.avgGPM.toFixed(0)} vs ${metaData.comparisons.gpm.meta.p50.toFixed(0)})`
    azione = `Focus su farm efficiency: priorità CS, stack timing, item progression ottimale per ${role}`
    impatto = `Impatto: +${Math.min(gapAbs * 0.3, 15).toFixed(0)}% winrate stimato migliorando GPM`
  } else if (topArea.metric === 'lastHits') {
    problema = `${metricLabel} ${gapAbs.toFixed(0)}% sotto meta (${metaData.playerMetrics.avgLastHits.toFixed(0)} vs ${metaData.comparisons.lastHits.meta.p50.toFixed(0)})`
    azione = `Migliora last hit timing: pratica CS in lane, anticipa creeps, gestisci wave equilibrium`
    impatto = `Impatto: +${Math.min(gapAbs * 0.25, 12).toFixed(0)}% winrate stimato migliorando CS`
  } else if (topArea.metric === 'kda') {
    problema = `${metricLabel} ${gapAbs.toFixed(0)}% sotto meta (${metaData.playerMetrics.avgKDA.toFixed(2)} vs ${metaData.comparisons.kda.meta.p50.toFixed(2)})`
    azione = `Riduci morti: posizionamento più sicuro, mappa awareness, disengage timing per ${role}`
    impatto = `Impatto: +${Math.min(gapAbs * 0.4, 18).toFixed(0)}% winrate stimato migliorando KDA`
  } else if (topArea.metric === 'xpm') {
    problema = `${metricLabel} ${gapAbs.toFixed(0)}% sotto meta (${metaData.playerMetrics.avgXPM.toFixed(0)} vs ${metaData.comparisons.xpm.meta.p50.toFixed(0)})`
    azione = `Ottimizza XP gain: partecipazione fight, stack farming, timing level-up per ${role}`
    impatto = `Impatto: +${Math.min(gapAbs * 0.3, 15).toFixed(0)}% winrate stimato migliorando XPM`
  } else {
    // Generic fallback
    problema = `${metricLabel} ${gapAbs.toFixed(0)}% sotto meta`
    azione = `Focus su miglioramento ${metricLabel.toLowerCase()} specifico per ruolo ${role}`
    impatto = `Impatto: miglioramento atteso nelle prossime partite`
  }

  return {
    problema,
    azione,
    impatto,
    confidenza
  }
}

/**
 * Build deterministic insights for Dashboard Overview
 * Based on winrate trends, KDA trends, farm trends
 */
export function buildDashboardInsights(stats: {
  winrate?: { delta?: number }
  kda?: { delta?: number }
} | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!stats) return insights

  // RISCHIO: Winrate in calo
  if (stats.winrate?.delta && stats.winrate.delta < -10) {
    insights.push({
      text: `Winrate −${Math.abs(stats.winrate.delta).toFixed(0)}% ultime 5 vs 10`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // FORZA: Winrate in aumento
  if (stats.winrate?.delta && stats.winrate.delta > 10 && insights.length < 3) {
    insights.push({
      text: `Winrate +${stats.winrate.delta.toFixed(0)}% ultime 5 vs 10`,
      type: 'strength',
      icon: '✅'
    })
  }

  // COLLO DI BOTTIGLIA: KDA in calo
  if (stats.kda?.delta && stats.kda.delta < -0.5 && insights.length < 3) {
    insights.push({
      text: `KDA ${stats.kda.delta.toFixed(1)} ultime 5 vs 10`,
      type: 'bottleneck',
      icon: '📉'
    })
  }

  return insights.slice(0, 3)
}

/**
 * Build deterministic insights for Performance page
 * Based on performance stats and benchmarks
 */
export function buildPerformanceInsights(stats: {
  avgKDA?: number
  avgGPM?: number
  avgXPM?: number
  avgDeaths?: number
  farmEfficiency?: number
  teamfightParticipation?: number
} | null, benchmarks: {
  percentiles?: { gpm?: { percentile: number }; xpm?: { percentile: number }; kda?: { percentile: number } }
  calculatedPercentiles?: { gpm?: { percentile: number }; xpm?: { percentile: number }; kda?: { percentile: number } }
} | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!stats) return insights

  // Get percentile from benchmarks
  const getPercentile = (metric: 'gpm' | 'xpm' | 'kda'): number | null => {
    if (benchmarks?.percentiles?.[metric]?.percentile) {
      return benchmarks.percentiles[metric].percentile
    }
    if (benchmarks?.calculatedPercentiles?.[metric]?.percentile) {
      return benchmarks.calculatedPercentiles[metric].percentile
    }
    return null
  }

  // RISCHIO: Percentile basso (< 30)
  const kdaPercentile = getPercentile('kda')
  if (kdaPercentile !== null && kdaPercentile < 30) {
    insights.push({
      text: `KDA percentile ${kdaPercentile.toFixed(0)} (< 30)`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // COLLO DI BOTTIGLIA: GPM percentile basso
  const gpmPercentile = getPercentile('gpm')
  if (gpmPercentile !== null && gpmPercentile < 40 && insights.length < 3) {
    insights.push({
      text: `GPM percentile ${gpmPercentile.toFixed(0)} (< 40)`,
      type: 'bottleneck',
      icon: '📉'
    })
  }

  // FORZA: Percentile alto (> 70)
  if (kdaPercentile !== null && kdaPercentile > 70 && insights.length < 3) {
    insights.push({
      text: `KDA percentile ${kdaPercentile.toFixed(0)} (> 70)`,
      type: 'strength',
      icon: '✅'
    })
  }

  return insights.slice(0, 3)
}

/**
 * Build deterministic insights for Heroes page
 * Based on hero winrate and pool diversity
 */
export function buildHeroesInsights(heroStats: Array<{
  games: number
  wins: number
  winrate: number
}> | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!heroStats || heroStats.length === 0) return insights

  const totalGames = heroStats.reduce((sum, h) => sum + h.games, 0)
  const topHero = heroStats[0]

  // FORZA: Hero top con winrate alto
  if (topHero && topHero.games >= 5 && topHero.winrate > 60) {
    const gamesPercent = (topHero.games / totalGames) * 100
    insights.push({
      text: `Top hero ${topHero.winrate.toFixed(0)}% WR (${gamesPercent.toFixed(0)}% giochi)`,
      type: 'strength',
      icon: '✅'
    })
  }

  // RISCHIO: Pool troppo concentrato
  if (topHero && topHero.games / totalGames > 0.4 && insights.length < 3) {
    insights.push({
      text: `Pool concentrato: top hero ${((topHero.games / totalGames) * 100).toFixed(0)}%`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // COLLO DI BOTTIGLIA: Winrate generale basso
  const avgWinrate = heroStats.reduce((sum, h) => sum + (h.winrate * h.games), 0) / totalGames
  if (avgWinrate < 45 && insights.length < 3) {
    insights.push({
      text: `Winrate medio ${avgWinrate.toFixed(0)}% (< 45%)`,
      type: 'bottleneck',
      icon: '📉'
    })
  }

  return insights.slice(0, 3)
}

/**
 * Build deterministic insights for Role Analysis page
 * Based on role performance and versatility
 */
export function buildRoleAnalysisInsights(analysis: {
  preferredRole?: { role: string; winrate: number; games: number; confidence: string }
  summary?: { totalRolesPlayed: number; totalGames: number }
  roles?: Array<{ role: string; games: number; winrate: number }>
} | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!analysis) return insights

  // FORZA: Ruolo preferito con winrate alto
  if (analysis.preferredRole && analysis.preferredRole.winrate > 55 && analysis.preferredRole.games >= 5) {
    insights.push({
      text: `${analysis.preferredRole.role} → ${analysis.preferredRole.winrate.toFixed(0)}% WR`,
      type: 'strength',
      icon: '✅'
    })
  }

  // RISCHIO: Pool troppo limitato
  if (analysis.summary && analysis.summary.totalRolesPlayed < 2 && insights.length < 3) {
    insights.push({
      text: `Pool limitato: ${analysis.summary.totalRolesPlayed} ruolo/i`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // COLLO DI BOTTIGLIA: Winrate basso nel ruolo preferito
  if (analysis.preferredRole && analysis.preferredRole.winrate < 45 && analysis.preferredRole.games >= 5 && insights.length < 3) {
    insights.push({
      text: `${analysis.preferredRole.role} → ${analysis.preferredRole.winrate.toFixed(0)}% WR (< 45%)`,
      type: 'bottleneck',
      icon: '📉'
    })
  }

  return insights.slice(0, 3)
}

/**
 * Build deterministic insights for Teammates page
 * Based on teammate winrates and chemistry
 */
export function buildTeammatesInsights(teammates: Array<{
  games: number
  wins: number
  winrate: number
}> | null, insights?: { bestTeammate?: { winrate: number } | null; worstTeammate?: { winrate: number } | null } | null): BulbInsight[] {
  const bulbInsights: BulbInsight[] = []

  if (!teammates || teammates.length === 0) return bulbInsights

  // FORZA: Compagno top con winrate alto
  if (insights?.bestTeammate && insights.bestTeammate && insights.bestTeammate.winrate > 60) {
    bulbInsights.push({
      text: `Top compagno → ${insights.bestTeammate.winrate.toFixed(0)}% WR`,
      type: 'strength',
      icon: '✅'
    })
  }

  // RISCHIO: Compagno con winrate molto basso
  if (insights?.worstTeammate && insights.worstTeammate && insights.worstTeammate.winrate < 40 && bulbInsights.length < 3) {
    bulbInsights.push({
      text: `Compagno problematico → ${insights.worstTeammate.winrate.toFixed(0)}% WR`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // COLLO DI BOTTIGLIA: Winrate medio basso con compagni
  const totalGames = teammates.reduce((sum, t) => sum + t.games, 0)
  if (totalGames > 0) {
    const avgWinrate = teammates.reduce((sum, t) => sum + (t.winrate * t.games), 0) / totalGames
    if (avgWinrate < 48 && bulbInsights.length < 3) {
      bulbInsights.push({
        text: `Winrate medio ${avgWinrate.toFixed(0)}% con compagni`,
        type: 'bottleneck',
        icon: '📉'
      })
    }
  }

  return bulbInsights.slice(0, 3)
}

/**
 * Build deterministic insights for Builds page
 * Based on item usage and build winrates
 */
export function buildBuildsInsights(buildData: {
  topItems?: Array<{ winrate: number; usageRate: number }>
  buildPatterns?: Array<{ winrate: number; frequency: number }>
} | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!buildData) return insights

  // FORZA: Item top con winrate alto
  if (buildData.topItems && buildData.topItems.length > 0) {
    const topItem = buildData.topItems[0]
    if (topItem.winrate > 60 && topItem.usageRate > 20) {
      insights.push({
        text: `Item top → ${topItem.winrate.toFixed(0)}% WR`,
        type: 'strength',
        icon: '✅'
      })
    }
  }

  // RISCHIO: Build frequente con winrate basso
  if (buildData.buildPatterns && buildData.buildPatterns.length > 0) {
    const frequentBuild = buildData.buildPatterns.find(b => b.frequency >= 3)
    if (frequentBuild && frequentBuild.winrate < 45) {
      insights.push({
        text: `Build frequente → ${frequentBuild.winrate.toFixed(0)}% WR`,
        type: 'risk',
        icon: '⚠️'
      })
    }
  }

  return insights.slice(0, 3)
}

/**
 * Build deterministic insights for Matches page
 * Based on trends, win/loss comparison, streaks
 */
export function buildMatchesInsights(matches: Array<{
  win?: boolean
  radiant_win?: boolean
  player_slot?: number
  gold_per_min?: number
  kda?: number
  kills?: number
  deaths?: number
  assists?: number
  duration?: number
}> | null, trendData?: Array<{ winrate?: number; cumulativeWinrate?: string }> | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!matches || matches.length < 5) return insights

  // Helper to check if match is win
  const isWin = (m: any) => {
    if (m.win !== undefined) return m.win
    if (m.radiant_win !== undefined && m.player_slot !== undefined) {
      return (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
    }
    return false
  }

  // RISCHIO: Loss streak
  let lossStreak = 0
  for (const match of matches.slice(0, 10)) {
    if (!isWin(match)) {
      lossStreak++
    } else {
      break
    }
  }
  if (lossStreak >= 4) {
    const recentMatches = matches.slice(0, 10)
    if (recentMatches.length > 0) {
      const winrate = recentMatches.filter(m => isWin(m)).length / recentMatches.length * 100
      const delta = winrate - 50
      if (!isNaN(delta) && delta < -10) {
        insights.push({
          text: `Loss streak ${lossStreak}+ → Winrate ${delta.toFixed(0)}%`,
          type: 'risk',
          icon: '⚠️'
        })
      }
    }
  }

  // RISCHIO: Trend negativo ultime 5
  if (trendData && trendData.length >= 5) {
    const last5 = trendData.slice(-5)
    const first5 = trendData.slice(0, 5)
    if (last5.length > 0 && first5.length > 0) {
      const last5Winrate = last5.filter(m => m.winrate === 100).length / last5.length * 100
      const first5Winrate = first5.filter(m => m.winrate === 100).length / first5.length * 100
      const delta = last5Winrate - first5Winrate
      if (!isNaN(delta) && delta < -15 && insights.length < 3) {
        insights.push({
          text: `Trend ultime 5: ${delta.toFixed(0)}% winrate`,
          type: 'risk',
          icon: '⚠️'
        })
      }
    }
  }

  // FORZA: Win streak
  let winStreak = 0
  for (const match of matches.slice(0, 10)) {
    if (isWin(match)) {
      winStreak++
    } else {
      break
    }
  }
  if (winStreak >= 4 && insights.length < 3) {
    const recentMatches = matches.slice(0, 10)
    if (recentMatches.length > 0) {
      const winrate = recentMatches.filter(m => isWin(m)).length / recentMatches.length * 100
      const delta = winrate - 50
      if (!isNaN(delta) && delta > 10) {
        insights.push({
          text: `Win streak ${winStreak}+ → Winrate +${delta.toFixed(0)}%`,
          type: 'strength',
          icon: '✅'
        })
      }
    }
  }

  // COLLO DI BOTTIGLIA: GPM gap tra vittorie e sconfitte
  const wins = matches.filter(m => isWin(m))
  const losses = matches.filter(m => !isWin(m))
  if (wins.length >= 3 && losses.length >= 3) {
    const avgGpmWin = wins.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / wins.length
    const avgGpmLoss = losses.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / losses.length
    const gap = avgGpmWin - avgGpmLoss
    if (!isNaN(gap) && isFinite(gap) && gap > 150 && insights.length < 3) {
      insights.push({
        text: `GPM gap win/loss: +${gap.toFixed(0)}`,
        type: 'bottleneck',
        icon: '📉'
      })
    }
  }

  return insights.slice(0, 3)
}

/**
 * Build deterministic insights for Profiling page
 * Based on radar chart, trends, strengths/weaknesses
 */
export function buildProfilingInsights(profile: {
  trends?: {
    gpm?: { value: number; direction: string }
    xpm?: { value: number; direction: string }
    kda?: { value: number; direction: string }
    winrate?: { value: number; direction: string }
  }
  radarData?: Array<{ subject: string; value: number; fullMark: number }>
  strengths?: string[]
  weaknesses?: string[]
} | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!profile) return insights

  // RISCHIO: Trend negativo
  if (profile.trends?.winrate && 
      typeof profile.trends.winrate.value === 'number' && 
      !isNaN(profile.trends.winrate.value) &&
      profile.trends.winrate.direction === 'down' && 
      profile.trends.winrate.value < -5) {
    insights.push({
      text: `Trend Winrate: ${profile.trends.winrate.value.toFixed(0)}%`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // RISCHIO: Trend GPM negativo
  if (profile.trends?.gpm && 
      typeof profile.trends.gpm.value === 'number' && 
      !isNaN(profile.trends.gpm.value) &&
      profile.trends.gpm.direction === 'down' && 
      profile.trends.gpm.value < -50 && 
      insights.length < 3) {
    insights.push({
      text: `Trend GPM: ${profile.trends.gpm.value.toFixed(0)}`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // FORZA: Trend positivo
  if (profile.trends?.winrate && 
      typeof profile.trends.winrate.value === 'number' && 
      !isNaN(profile.trends.winrate.value) &&
      profile.trends.winrate.direction === 'up' && 
      profile.trends.winrate.value > 5 && 
      insights.length < 3) {
    insights.push({
      text: `Trend Winrate: +${profile.trends.winrate.value.toFixed(0)}%`,
      type: 'strength',
      icon: '✅'
    })
  }

  // COLLO DI BOTTIGLIA: Radar chart - valore basso
  if (profile.radarData && profile.radarData.length > 0) {
    const avgValue = profile.radarData.reduce((sum, d) => sum + (d.value || 0), 0) / profile.radarData.length
    if (!isNaN(avgValue) && isFinite(avgValue) && avgValue < 50 && insights.length < 3) {
      insights.push({
        text: `Radar medio: ${avgValue.toFixed(0)}/100`,
        type: 'bottleneck',
        icon: '📉'
      })
    }
  }

  return insights.slice(0, 3)
}

/**
 * Build deterministic insights for Anti-Tilt page
 * Based on tilt level, streaks, recovery stats, negative patterns
 */
export function buildAntiTiltInsights(data: {
  isTilted?: boolean
  lossStreak?: number
  winStreak?: number
  recentWinrate?: {
    last3?: number
    last5?: number
    today?: number
  }
  tiltLevel?: 'low' | 'medium' | 'high' | 'critical'
  recoveryStats?: {
    avgRecoveryTime?: number
    recoveryWinrate?: number
  }
  negativePatterns?: {
    worstHours?: Array<{ hour: number; winrate: number }>
    worstDays?: Array<{ day: string; winrate: number }>
  }
} | null): BulbInsight[] {
  const insights: BulbInsight[] = []

  if (!data) return insights

  // RISCHIO: Tilt level alto
  if (data.tiltLevel === 'high' || data.tiltLevel === 'critical') {
    insights.push({
      text: `Tilt level: ${data.tiltLevel.toUpperCase()}`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // RISCHIO: Loss streak alto
  if (data.lossStreak && data.lossStreak >= 4 && insights.length < 3) {
    insights.push({
      text: `Loss streak ${data.lossStreak}+ → Pausa consigliata`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // RISCHIO: Winrate oggi basso
  if (data.recentWinrate?.today && 
      typeof data.recentWinrate.today === 'number' && 
      !isNaN(data.recentWinrate.today) &&
      data.recentWinrate.today < 40 && 
      insights.length < 3) {
    insights.push({
      text: `Winrate oggi: ${data.recentWinrate.today.toFixed(0)}% (< 40%)`,
      type: 'risk',
      icon: '⚠️'
    })
  }

  // FORZA: Recovery winrate alto
  if (data.recoveryStats?.recoveryWinrate && 
      typeof data.recoveryStats.recoveryWinrate === 'number' && 
      !isNaN(data.recoveryStats.recoveryWinrate) &&
      data.recoveryStats.recoveryWinrate > 60 && 
      insights.length < 3) {
    insights.push({
      text: `Recovery WR: ${data.recoveryStats.recoveryWinrate.toFixed(0)}%`,
      type: 'strength',
      icon: '✅'
    })
  }

  // COLLO DI BOTTIGLIA: Worst hours identificati
  if (data.negativePatterns?.worstHours && data.negativePatterns.worstHours.length > 0) {
    const worstHour = data.negativePatterns.worstHours[0]
    if (worstHour && 
        typeof worstHour.winrate === 'number' && 
        !isNaN(worstHour.winrate) &&
        worstHour.winrate < 40 && 
        insights.length < 3) {
      insights.push({
        text: `Ore ${worstHour.hour}:00 → ${worstHour.winrate.toFixed(0)}% WR`,
        type: 'bottleneck',
        icon: '📉'
      })
    }
  }

  return insights.slice(0, 3)
}

