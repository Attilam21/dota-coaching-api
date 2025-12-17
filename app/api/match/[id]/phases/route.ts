import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per analisi fase per fase di una partita
 * Divide la partita in Early (0-10min), Mid (10-25min), Late (25+min)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch match data
    const matchResponse = await fetch(`https://api.opendota.com/api/matches/${id}`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const match = await matchResponse.json()
    const duration = match.duration || 0
    const players = match.players || []

    // Fetch match log for detailed events
    let matchLog: any[] = []
    try {
      const logResponse = await fetch(`https://api.opendota.com/api/matches/${id}/log`, {
        next: { revalidate: 3600 }
      })
      if (logResponse.ok) {
        const logData = await logResponse.json()
        if (Array.isArray(logData)) {
          matchLog = logData
        }
      }
    } catch (err) {
      console.log('Match log not available')
    }

    // Define phase boundaries (in seconds)
    const EARLY_END = 10 * 60 // 10 minutes
    const MID_END = 25 * 60   // 25 minutes

    // Helper to determine phase
    const getPhase = (time: number) => {
      if (time <= EARLY_END) return 'early'
      if (time <= MID_END) return 'mid'
      return 'late'
    }

    // Analyze each player's performance by phase
    const playerPhases = players.map((player: any) => {
      const accountId = player.account_id
      const playerSlot = player.player_slot
      
      // Filter events for this player
      const playerEvents = matchLog.filter((entry: any) => {
        if (entry.player_slot !== undefined) {
          return entry.player_slot === playerSlot
        }
        if (entry.account_id !== undefined) {
          return entry.account_id === accountId
        }
        return false
      })

      // Calculate stats per phase
      const phases = {
        early: {
          kills: 0,
          deaths: 0,
          assists: 0,
          lastHits: 0,
          denies: 0,
          goldEarned: 0,
          xpEarned: 0,
          heroDamage: 0,
          towerDamage: 0,
          wardsPlaced: 0,
          wardsKilled: 0,
          runes: 0,
          campsStacked: 0,
          events: [] as any[]
        },
        mid: {
          kills: 0,
          deaths: 0,
          assists: 0,
          lastHits: 0,
          denies: 0,
          goldEarned: 0,
          xpEarned: 0,
          heroDamage: 0,
          towerDamage: 0,
          wardsPlaced: 0,
          wardsKilled: 0,
          runes: 0,
          campsStacked: 0,
          events: [] as any[]
        },
        late: {
          kills: 0,
          deaths: 0,
          assists: 0,
          lastHits: 0,
          denies: 0,
          goldEarned: 0,
          xpEarned: 0,
          heroDamage: 0,
          towerDamage: 0,
          wardsPlaced: 0,
          wardsKilled: 0,
          runes: 0,
          campsStacked: 0,
          events: [] as any[]
        }
      }

      // Process events
      playerEvents.forEach((entry: any) => {
        const time = entry.time || 0
        if (time <= 0 || time > duration) return
        
        const phase = getPhase(time)
        const phaseData = phases[phase as keyof typeof phases]

        // Count different event types
        if (entry.type?.includes('KILL') || entry.type === 'CHAT_MESSAGE_KILL') {
          phaseData.kills++
        }
        if (entry.type?.includes('DEATH') || entry.type === 'CHAT_MESSAGE_DEATH') {
          phaseData.deaths++
        }
        if (entry.type?.includes('ASSIST')) {
          phaseData.assists++
        }
        if (entry.type?.includes('WARD') || entry.key?.toString().includes('ward')) {
          if (entry.type?.includes('KILL') || entry.key?.toString().includes('kill')) {
            phaseData.wardsKilled++
          } else {
            phaseData.wardsPlaced++
          }
        }
        if (entry.type?.includes('RUNE') || entry.key?.toString().includes('rune')) {
          phaseData.runes++
        }
        if (entry.type?.includes('STACK') || entry.key?.toString().includes('stack')) {
          phaseData.campsStacked++
        }
      })

      // Estimate phase stats from match data
      // Since we don't have exact phase breakdowns, we'll estimate based on duration
      // Bug fix: midRatio must use duration as denominator to ensure ratios sum correctly
      const earlyRatio = Math.min(1, EARLY_END / Math.max(1, duration))
      const midRatio = Math.min(1, (MID_END - EARLY_END) / Math.max(1, duration))
      const lateRatio = Math.max(0, 1 - earlyRatio - midRatio)

      // Distribute stats proportionally (this is an estimation)
      phases.early.kills = Math.round(player.kills * earlyRatio)
      phases.mid.kills = Math.round(player.kills * midRatio)
      phases.late.kills = player.kills - phases.early.kills - phases.mid.kills

      phases.early.deaths = Math.round(player.deaths * earlyRatio)
      phases.mid.deaths = Math.round(player.deaths * midRatio)
      phases.late.deaths = player.deaths - phases.early.deaths - phases.mid.deaths

      phases.early.assists = Math.round(player.assists * earlyRatio)
      phases.mid.assists = Math.round(player.assists * midRatio)
      phases.late.assists = player.assists - phases.early.assists - phases.mid.assists

      phases.early.lastHits = Math.round(player.last_hits * earlyRatio)
      phases.mid.lastHits = Math.round(player.last_hits * midRatio)
      phases.late.lastHits = player.last_hits - phases.early.lastHits - phases.mid.lastHits

      phases.early.denies = Math.round((player.denies || 0) * earlyRatio)
      phases.mid.denies = Math.round((player.denies || 0) * midRatio)
      phases.late.denies = (player.denies || 0) - phases.early.denies - phases.mid.denies

      // Gold and XP are more complex - estimate based on GPM/XPM
      const earlyDuration = Math.min(EARLY_END, duration)
      phases.early.goldEarned = Math.round((player.gold_per_min || 0) * (earlyDuration / 60))
      phases.early.xpEarned = Math.round((player.xp_per_min || 0) * (earlyDuration / 60))

      const midDuration = Math.min(MID_END - EARLY_END, Math.max(0, duration - EARLY_END))
      phases.mid.goldEarned = Math.round((player.gold_per_min || 0) * (midDuration / 60))
      phases.mid.xpEarned = Math.round((player.xp_per_min || 0) * (midDuration / 60))

      const lateDuration = Math.max(0, duration - MID_END)
      phases.late.goldEarned = Math.round((player.gold_per_min || 0) * (lateDuration / 60))
      phases.late.xpEarned = Math.round((player.xp_per_min || 0) * (lateDuration / 60))

      // Damage distribution (estimate)
      phases.early.heroDamage = Math.round((player.hero_damage || 0) * earlyRatio)
      phases.mid.heroDamage = Math.round((player.hero_damage || 0) * midRatio)
      phases.late.heroDamage = (player.hero_damage || 0) - phases.early.heroDamage - phases.mid.heroDamage

      phases.early.towerDamage = Math.round((player.tower_damage || 0) * earlyRatio)
      phases.mid.towerDamage = Math.round((player.tower_damage || 0) * midRatio)
      phases.late.towerDamage = (player.tower_damage || 0) - phases.early.towerDamage - phases.mid.towerDamage

      return {
        account_id: accountId,
        player_slot: playerSlot,
        hero_id: player.hero_id,
        phases
      }
    })

    // Calculate team phase performance
    const radiantPhases = {
      early: { wins: 0, avgGpm: 0, avgXpm: 0, totalKills: 0, totalDeaths: 0 },
      mid: { wins: 0, avgGpm: 0, avgXpm: 0, totalKills: 0, totalDeaths: 0 },
      late: { wins: 0, avgGpm: 0, avgXpm: 0, totalKills: 0, totalDeaths: 0 }
    }

    const direPhases = {
      early: { wins: 0, avgGpm: 0, avgXpm: 0, totalKills: 0, totalDeaths: 0 },
      mid: { wins: 0, avgGpm: 0, avgXpm: 0, totalKills: 0, totalDeaths: 0 },
      late: { wins: 0, avgGpm: 0, avgXpm: 0, totalKills: 0, totalDeaths: 0 }
    }

    // This is a simplified calculation - in reality we'd need more detailed match data
    // For now, we'll return the player phases and let the frontend calculate team stats

    return NextResponse.json({
      match_id: parseInt(id),
      duration,
      phases: {
        early: { start: 0, end: EARLY_END, duration: Math.min(EARLY_END, duration) },
        mid: { start: EARLY_END, end: MID_END, duration: Math.min(MID_END - EARLY_END, Math.max(0, duration - EARLY_END)) },
        late: { start: MID_END, end: duration, duration: Math.max(0, duration - MID_END) }
      },
      playerPhases,
      radiantWin: match.radiant_win
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error fetching match phases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}