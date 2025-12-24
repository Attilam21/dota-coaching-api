import { NextRequest, NextResponse } from 'next/server'
import { fetchOpenDota, mapWithConcurrency, getCached, setCached } from '@/lib/opendota'

/**
 * Crea un percorso di miglioramento step-by-step basato su recommendations aggregate
 * e statistiche del giocatore
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch player stats
    const matchesCacheKey = `player:${id}:matches`
    let matches: any[] | null = getCached<any[]>(matchesCacheKey)
    
    if (!matches) {
      matches = await fetchOpenDota<any[]>(`/players/${id}/matches?limit=20`)
      if (matches) {
        setCached(matchesCacheKey, matches, 60)
      }
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        error: 'No matches found',
        steps: [],
        projectedOutcome: null
      })
    }

    // Fetch full match details for accurate stats
    const matchIds = matches.slice(0, 20).map((m) => m.match_id)
    const fullMatchesPromises = await mapWithConcurrency(
      matchIds,
      async (matchId) => {
        const matchCacheKey = `match:${matchId}`
        const cached = getCached<any>(matchCacheKey)
        if (cached) return cached
        
        const matchData = await fetchOpenDota<any>(`/matches/${matchId}`)
        if (matchData) {
          setCached(matchCacheKey, matchData, 21600)
        }
        return matchData
      },
      6
    )

    const validMatches = fullMatchesPromises.filter((m) => m !== null)

    // Find player in each match and calculate averages
    const playerMatches = validMatches
      .map((match) => {
        const player = match.players?.find((p: any) =>
          p.account_id?.toString() === id || p.account_id === parseInt(id)
        )
        if (!player) return null

        const isWin = (player.player_slot < 128 && match.radiant_win) ||
                     (player.player_slot >= 128 && !match.radiant_win)

        return {
          match_id: match.match_id,
          win: isWin,
          gpm: player.gold_per_min || 0,
          xpm: player.xp_per_min || 0,
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          last_hits: player.last_hits || 0,
          denies: player.denies || 0,
          hero_damage: player.hero_damage || 0,
          tower_damage: player.tower_damage || 0,
          observer_uses: player.observer_uses || 0,
          sentry_uses: player.sentry_uses || 0,
          teamfight_participations: player.teamfight_participations || 0,
          duration: match.duration || 0
        }
      })
      .filter((m) => m !== null)

    if (playerMatches.length === 0) {
      return NextResponse.json({
        error: 'No valid player matches found',
        steps: [],
        projectedOutcome: null
      })
    }

    // Calculate current averages
    const wins = playerMatches.filter(m => m.win)
    const losses = playerMatches.filter(m => !m.win)
    const currentWinrate = (wins.length / playerMatches.length) * 100

    const avgGPM = playerMatches.reduce((sum, m) => sum + m.gpm, 0) / playerMatches.length
    const avgXPM = playerMatches.reduce((sum, m) => sum + m.xpm, 0) / playerMatches.length
    const avgKDA = playerMatches.reduce((sum, m) => sum + ((m.kills + m.assists) / Math.max(m.deaths, 1)), 0) / playerMatches.length
    const avgDeaths = playerMatches.reduce((sum, m) => sum + m.deaths, 0) / playerMatches.length
    const avgLastHits = playerMatches.reduce((sum, m) => sum + m.last_hits, 0) / playerMatches.length
    const avgTeamfightParticipation = playerMatches.reduce((sum, m) => sum + m.teamfight_participations, 0) / playerMatches.length
    const avgWards = playerMatches.reduce((sum, m) => sum + (m.observer_uses + m.sentry_uses), 0) / playerMatches.length

    // Determine role based on GPM
    let role = 'Core'
    if (avgGPM > 500) role = 'Carry'
    else if (avgGPM < 350) role = 'Support'
    else if (avgGPM > 450 && avgGPM <= 550) role = 'Mid'
    else if (avgGPM > 350 && avgGPM <= 500) role = 'Offlane'

    // Meta standards
    const META_STANDARDS: Record<string, any> = {
      carry: { gpm: 550, xpm: 600, deaths: 5, kda: 2.5, csPerMin: 7, killParticipation: 60 },
      mid: { gpm: 550, xpm: 650, deaths: 5, kda: 2.8, csPerMin: 6.5, killParticipation: 70 },
      offlane: { gpm: 450, xpm: 500, deaths: 6, kda: 2.2, csPerMin: 5, killParticipation: 75 },
      support: { gpm: 300, xpm: 350, deaths: 6, kda: 1.8, csPerMin: 3, killParticipation: 80, wards: 10 }
    }

    const meta = META_STANDARDS[role.toLowerCase()] || META_STANDARDS.carry

    // Calculate gaps and create improvement steps
    const steps: Array<{
      id: number
      title: string
      category: string
      currentValue: number
      targetValue: number
      gap: number
      gapPercent: number
      impact: string
      priority: 'high' | 'medium' | 'low'
      actionable: string
      estimatedMatches: number
      matchIds: number[]
    }> = []

    // Step 1: GPM improvement (less restrictive - create step if below meta or can optimize)
    if (avgGPM < meta.gpm) {
      const gap = meta.gpm - avgGPM
      const gapPercent = (gap / meta.gpm) * 100
      const targetGPM = avgGPM < meta.gpm * 0.9 
        ? Math.min(meta.gpm, avgGPM + (gap * 0.5)) // 50% improvement if significantly below
        : Math.min(meta.gpm * 1.1, avgGPM + (gap * 0.3)) // 30% improvement if close to meta
      const winrateImpact = Math.min(8, gapPercent * 0.4) // Max 8% winrate improvement

      steps.push({
        id: 1,
        title: avgGPM < meta.gpm * 0.9 ? 'Migliora Farm Rate (GPM)' : 'Ottimizza Farm Rate (GPM)',
        category: 'farming',
        currentValue: Math.round(avgGPM),
        targetValue: Math.round(targetGPM),
        gap: Math.round(gap),
        gapPercent: Math.round(gapPercent),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gapPercent > 15 ? 'high' : gapPercent > 8 ? 'medium' : 'low',
        actionable: avgGPM < meta.gpm * 0.9 
          ? 'Focus su last-hitting, stacka campi, ottimizza rotazioni farm'
          : 'Mantieni farm costante, migliora efficienza nelle rotazioni',
        estimatedMatches: Math.max(1, Math.ceil(gapPercent / 2)), // At least 1 match
        matchIds: playerMatches.slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 2: Deaths reduction (less restrictive)
    if (avgDeaths > meta.deaths) {
      const gap = avgDeaths - meta.deaths
      const gapPercent = (gap / meta.deaths) * 100
      const targetDeaths = avgDeaths > meta.deaths * 1.1
        ? Math.max(meta.deaths, avgDeaths - (gap * 0.4))
        : Math.max(meta.deaths * 0.9, avgDeaths - (gap * 0.3))
      const winrateImpact = Math.min(6, gapPercent * 0.3)

      steps.push({
        id: 2,
        title: avgDeaths > meta.deaths * 1.1 ? 'Riduci Morti' : 'Ottimizza Morti',
        category: 'positioning',
        currentValue: Math.round(avgDeaths * 10) / 10,
        targetValue: Math.round(targetDeaths * 10) / 10,
        gap: Math.round(gap * 10) / 10,
        gapPercent: Math.round(gapPercent),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gapPercent > 20 ? 'high' : gapPercent > 10 ? 'medium' : 'low',
        actionable: avgDeaths > meta.deaths * 1.1
          ? 'Migliora map awareness, posizionamento, evita overextending'
          : 'Mantieni morti basse, migliora decision making in situazioni rischiose',
        estimatedMatches: Math.max(1, Math.ceil(gapPercent / 3)),
        matchIds: playerMatches.filter(m => m.deaths > meta.deaths).slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 3: KDA improvement (less restrictive)
    const currentKDA = avgKDA
    if (currentKDA < meta.kda) {
      const gap = meta.kda - currentKDA
      const gapPercent = (gap / meta.kda) * 100
      const targetKDA = currentKDA < meta.kda * 0.9
        ? Math.min(meta.kda, currentKDA + (gap * 0.5))
        : Math.min(meta.kda * 1.1, currentKDA + (gap * 0.3))
      const winrateImpact = Math.min(5, gapPercent * 0.25)

      steps.push({
        id: 3,
        title: currentKDA < meta.kda * 0.9 ? 'Migliora KDA' : 'Ottimizza KDA',
        category: 'teamfight',
        currentValue: Math.round(currentKDA * 100) / 100,
        targetValue: Math.round(targetKDA * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        gapPercent: Math.round(gapPercent),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gapPercent > 15 ? 'high' : gapPercent > 8 ? 'medium' : 'low',
        actionable: currentKDA < meta.kda * 0.9
          ? 'Partecipa più ai teamfight, migliora positioning, focus su survival'
          : 'Mantieni KDA elevato, migliora timing di ingaggio nei teamfight',
        estimatedMatches: Math.max(1, Math.ceil(gapPercent / 2.5)),
        matchIds: playerMatches.filter(m => {
          const kda = (m.kills + m.assists) / Math.max(m.deaths, 1)
          return kda < meta.kda
        }).slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 4: Teamfight participation (if support or offlane, less restrictive)
    if ((role === 'Support' || role === 'Offlane') && avgTeamfightParticipation < 10) {
      const targetParticipation = 10
      const gap = targetParticipation - avgTeamfightParticipation
      const winrateImpact = Math.min(4, gap * 0.4)

      steps.push({
        id: 4,
        title: avgTeamfightParticipation < 8 ? 'Aumenta Partecipazione Teamfight' : 'Ottimizza Partecipazione Teamfight',
        category: 'teamplay',
        currentValue: Math.round(avgTeamfightParticipation * 10) / 10,
        targetValue: targetParticipation,
        gap: Math.round(gap * 10) / 10,
        gapPercent: Math.round((gap / targetParticipation) * 100),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gap > 3 ? 'high' : gap > 1.5 ? 'medium' : 'low',
        actionable: avgTeamfightParticipation < 8
          ? 'Sii presente nei teamfight critici, migliora timing di ingaggio'
          : 'Mantieni alta partecipazione, migliora qualità degli ingaggi',
        estimatedMatches: Math.max(1, Math.ceil(gap / 0.5)),
        matchIds: playerMatches.filter(m => m.teamfight_participations < 10).slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 5: Warding (if support, less restrictive)
    if (role === 'Support' && avgWards < meta.wards) {
      const gap = meta.wards - avgWards
      const winrateImpact = Math.min(3, gap * 0.3)

      steps.push({
        id: 5,
        title: avgWards < meta.wards * 0.8 ? 'Aumenta Warding' : 'Ottimizza Warding',
        category: 'vision',
        currentValue: Math.round(avgWards * 10) / 10,
        targetValue: meta.wards,
        gap: Math.round(gap * 10) / 10,
        gapPercent: Math.round((gap / meta.wards) * 100),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gap > 3 ? 'high' : gap > 1.5 ? 'medium' : 'low',
        actionable: avgWards < meta.wards * 0.8
          ? 'Posiziona più ward, focus su vision control, dewarding'
          : 'Mantieni warding costante, migliora posizionamento ward strategiche',
        estimatedMatches: Math.max(1, Math.ceil(gap / 0.8)),
        matchIds: playerMatches.filter(m => (m.observer_uses + m.sentry_uses) < meta.wards).slice(0, 5).map(m => m.match_id)
      })
    }

    // If no steps created but player has good stats, create a maintenance/optimization step
    if (steps.length === 0) {
      // Check if player is performing well
      const isPerformingWell = avgGPM >= meta.gpm * 0.95 && 
                               avgDeaths <= meta.deaths * 1.05 && 
                               currentKDA >= meta.kda * 0.95

      if (isPerformingWell) {
        // Add a maintenance step
        steps.push({
          id: 1,
          title: 'Mantieni Performance Attuali',
          category: 'teamplay',
          currentValue: Math.round(currentWinrate * 10) / 10,
          targetValue: Math.round(Math.min(70, currentWinrate + 2) * 10) / 10,
          gap: 2,
          gapPercent: 2,
          impact: '+2.0% winrate previsto',
          priority: 'low',
          actionable: 'Mantieni le tue performance attuali, focus su consistenza e minimizzazione errori',
          estimatedMatches: 5,
          matchIds: playerMatches.slice(0, 5).map(m => m.match_id)
        })
      } else {
        // Add a general improvement step
        const avgGap = ((meta.gpm - avgGPM) / meta.gpm + (avgDeaths - meta.deaths) / meta.deaths + (meta.kda - currentKDA) / meta.kda) / 3 * 100
        
        steps.push({
          id: 1,
          title: 'Miglioramento Generale',
          category: 'teamplay',
          currentValue: Math.round(currentWinrate * 10) / 10,
          targetValue: Math.round(Math.min(70, currentWinrate + Math.max(2, avgGap * 0.1)) * 10) / 10,
          gap: Math.max(2, avgGap * 0.1),
          gapPercent: Math.round(avgGap),
          impact: `+${Math.max(2, avgGap * 0.1).toFixed(1)}% winrate previsto`,
          priority: avgGap > 10 ? 'medium' : 'low',
          actionable: 'Focus su miglioramento generale: farm, positioning, e decision making',
          estimatedMatches: Math.max(3, Math.ceil(avgGap / 3)),
          matchIds: playerMatches.slice(0, 5).map(m => m.match_id)
        })
      }
    }

    // Sort by priority and impact
    steps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return parseFloat(b.impact) - parseFloat(a.impact)
    })

    // Calculate projected outcome
    const totalWinrateImpact = steps.reduce((sum, step) => {
      const impact = parseFloat(step.impact.replace('+', '').replace('% winrate previsto', ''))
      return sum + impact
    }, 0)

    const projectedWinrate = Math.min(70, currentWinrate + totalWinrateImpact)
    const projectedMMR = Math.round(totalWinrateImpact * 20) // ~20 MMR per % winrate
    const estimatedTotalMatches = Math.max(...steps.map(s => s.estimatedMatches), 10)

    return NextResponse.json({
      currentStats: {
        winrate: currentWinrate.toFixed(1),
        gpm: Math.round(avgGPM),
        xpm: Math.round(avgXPM),
        kda: avgKDA.toFixed(2),
        deaths: avgDeaths.toFixed(1),
        role
      },
      steps: steps.slice(0, 5), // Top 5 steps
      projectedOutcome: {
        winrate: projectedWinrate.toFixed(1),
        winrateImprovement: totalWinrateImpact.toFixed(1),
        mmrGain: projectedMMR,
        estimatedMatches: estimatedTotalMatches,
        timeframe: estimatedTotalMatches <= 10 ? 'Breve termine (1-2 settimane)' :
                   estimatedTotalMatches <= 20 ? 'Medio termine (2-4 settimane)' :
                   'Lungo termine (1+ mese)'
      },
      metaComparison: {
        role,
        gaps: {
          gpm: Math.round(meta.gpm - avgGPM),
          xpm: Math.round(meta.xpm - avgXPM),
          kda: (meta.kda - avgKDA).toFixed(2),
          deaths: (avgDeaths - meta.deaths).toFixed(1)
        }
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800',
      },
    })
  } catch (error) {
    console.error('Error creating improvement path:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

