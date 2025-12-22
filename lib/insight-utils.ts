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

