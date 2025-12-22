import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/fetch-utils'

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
    const statsResponse = await fetchWithTimeout(
      `https://api.opendota.com/api/players/${id}/matches?limit=20`,
      {
        timeout: 10000,
        next: { revalidate: 3600 }
      }
    )

    if (!statsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch player stats' },
        { status: statsResponse.status }
      )
    }

    const matches: any[] = await statsResponse.json()

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        error: 'No matches found',
        steps: [],
        projectedOutcome: null
      })
    }

    // Fetch full match details for accurate stats
    const fullMatchesPromises = matches.slice(0, 20).map((m) =>
      fetchWithTimeout(`https://api.opendota.com/api/matches/${m.match_id}`, {
        timeout: 8000,
        next: { revalidate: 3600 }
      })
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    )

    const fullMatches = await Promise.allSettled(fullMatchesPromises)
    const validMatches = fullMatches
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<any>).value)

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

    // Step 1: GPM improvement
    if (avgGPM < meta.gpm * 0.9) {
      const gap = meta.gpm - avgGPM
      const gapPercent = (gap / meta.gpm) * 100
      const targetGPM = Math.min(meta.gpm, avgGPM + (gap * 0.5)) // 50% improvement target
      const winrateImpact = Math.min(8, gapPercent * 0.4) // Max 8% winrate improvement

      steps.push({
        id: 1,
        title: 'Migliora Farm Rate (GPM)',
        category: 'farming',
        currentValue: Math.round(avgGPM),
        targetValue: Math.round(targetGPM),
        gap: Math.round(gap),
        gapPercent: Math.round(gapPercent),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gapPercent > 15 ? 'high' : gapPercent > 8 ? 'medium' : 'low',
        actionable: 'Focus su last-hitting, stacka campi, ottimizza rotazioni farm',
        estimatedMatches: Math.ceil(gapPercent / 2), // ~2% improvement per match
        matchIds: playerMatches.slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 2: Deaths reduction
    if (avgDeaths > meta.deaths * 1.1) {
      const gap = avgDeaths - meta.deaths
      const gapPercent = (gap / meta.deaths) * 100
      const targetDeaths = Math.max(meta.deaths, avgDeaths - (gap * 0.4))
      const winrateImpact = Math.min(6, gapPercent * 0.3)

      steps.push({
        id: 2,
        title: 'Riduci Morti',
        category: 'positioning',
        currentValue: Math.round(avgDeaths * 10) / 10,
        targetValue: Math.round(targetDeaths * 10) / 10,
        gap: Math.round(gap * 10) / 10,
        gapPercent: Math.round(gapPercent),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gapPercent > 20 ? 'high' : gapPercent > 10 ? 'medium' : 'low',
        actionable: 'Migliora map awareness, posizionamento, evita overextending',
        estimatedMatches: Math.ceil(gapPercent / 3),
        matchIds: playerMatches.filter(m => m.deaths > meta.deaths).slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 3: KDA improvement
    const currentKDA = avgKDA
    if (currentKDA < meta.kda * 0.9) {
      const gap = meta.kda - currentKDA
      const gapPercent = (gap / meta.kda) * 100
      const targetKDA = Math.min(meta.kda, currentKDA + (gap * 0.5))
      const winrateImpact = Math.min(5, gapPercent * 0.25)

      steps.push({
        id: 3,
        title: 'Migliora KDA',
        category: 'teamfight',
        currentValue: Math.round(currentKDA * 100) / 100,
        targetValue: Math.round(targetKDA * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        gapPercent: Math.round(gapPercent),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gapPercent > 15 ? 'high' : gapPercent > 8 ? 'medium' : 'low',
        actionable: 'Partecipa più ai teamfight, migliora positioning, focus su survival',
        estimatedMatches: Math.ceil(gapPercent / 2.5),
        matchIds: playerMatches.filter(m => {
          const kda = (m.kills + m.assists) / Math.max(m.deaths, 1)
          return kda < meta.kda
        }).slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 4: Teamfight participation (if support or offlane)
    if ((role === 'Support' || role === 'Offlane') && avgTeamfightParticipation < 8) {
      const targetParticipation = 10
      const gap = targetParticipation - avgTeamfightParticipation
      const winrateImpact = Math.min(4, gap * 0.4)

      steps.push({
        id: 4,
        title: 'Aumenta Partecipazione Teamfight',
        category: 'teamplay',
        currentValue: Math.round(avgTeamfightParticipation * 10) / 10,
        targetValue: targetParticipation,
        gap: Math.round(gap * 10) / 10,
        gapPercent: Math.round((gap / targetParticipation) * 100),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gap > 3 ? 'high' : gap > 1.5 ? 'medium' : 'low',
        actionable: 'Sii presente nei teamfight critici, migliora timing di ingaggio',
        estimatedMatches: Math.ceil(gap / 0.5),
        matchIds: playerMatches.filter(m => m.teamfight_participations < 8).slice(0, 5).map(m => m.match_id)
      })
    }

    // Step 5: Warding (if support)
    if (role === 'Support' && avgWards < meta.wards * 0.8) {
      const gap = meta.wards - avgWards
      const winrateImpact = Math.min(3, gap * 0.3)

      steps.push({
        id: 5,
        title: 'Aumenta Warding',
        category: 'vision',
        currentValue: Math.round(avgWards * 10) / 10,
        targetValue: meta.wards,
        gap: Math.round(gap * 10) / 10,
        gapPercent: Math.round((gap / meta.wards) * 100),
        impact: `+${winrateImpact.toFixed(1)}% winrate previsto`,
        priority: gap > 3 ? 'high' : gap > 1.5 ? 'medium' : 'low',
        actionable: 'Posiziona più ward, focus su vision control, dewarding',
        estimatedMatches: Math.ceil(gap / 0.8),
        matchIds: playerMatches.filter(m => (m.observer_uses + m.sentry_uses) < meta.wards).slice(0, 5).map(m => m.match_id)
      })
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

