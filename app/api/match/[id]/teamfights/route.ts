import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per analisi teamfight di una partita
 * Identifica teamfight e analizza partecipazione, damage, outcome
 */
type KillEvent = {
  time: number
  playerSlot: number
  team: 'radiant' | 'dire'
}

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

    // Fetch match log for teamfight events
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

    // Identify teamfights (clusters of kills within short time windows)
    // A teamfight is defined as 3+ kills within 30 seconds
    // Bug fix: Filter out kills without valid player_slot and add proper type annotations
    const killEvents: KillEvent[] = matchLog
      .filter((entry: any) => {
        return (entry.type?.includes('KILL') || entry.type === 'CHAT_MESSAGE_KILL') && 
               entry.player_slot !== undefined && 
               typeof entry.player_slot === 'number' &&
               entry.time > 0 && 
               entry.time <= duration
      })
      .map((entry: any): KillEvent => ({
        time: entry.time || 0,
        playerSlot: entry.player_slot as number,
        team: (entry.player_slot < 128 ? 'radiant' : 'dire') as 'radiant' | 'dire'
      }))

    // Group kills into teamfights (within 30 seconds of each other)
    const teamfights: Array<{
      startTime: number
      endTime: number
      duration: number
      radiantKills: number
      direKills: number
      participants: Array<{
        playerSlot: number
        team: 'radiant' | 'dire'
        participated: boolean
      }>
      winner: 'radiant' | 'dire' | 'draw'
    }> = []

    let currentTeamfight: {
      startTime: number
      kills: KillEvent[]
    } | null = null

    const TEAMFIGHT_WINDOW = 30 // seconds

    // Use traditional for loop instead of forEach to allow proper type narrowing
    for (let i = 0; i < killEvents.length; i++) {
      const kill = killEvents[i]
      
      if (!currentTeamfight) {
        currentTeamfight = {
          startTime: kill.time,
          kills: [kill]
        }
      } else {
        const timeSinceStart = kill.time - currentTeamfight.startTime
        if (timeSinceStart <= TEAMFIGHT_WINDOW) {
          // Same teamfight
          currentTeamfight.kills.push(kill)
        } else {
          // New teamfight - finalize previous one
          if (currentTeamfight.kills.length >= 3) {
            const radiantKills = currentTeamfight.kills.filter(k => k.team === 'radiant').length
            const direKills = currentTeamfight.kills.filter(k => k.team === 'dire').length
            
            const participantSlots = new Set(currentTeamfight.kills.map(k => k.playerSlot))
            const participants = players.map((p: any) => ({
              playerSlot: p.player_slot,
              team: p.player_slot < 128 ? 'radiant' : 'dire' as 'radiant' | 'dire',
              participated: participantSlots.has(p.player_slot)
            }))

            teamfights.push({
              startTime: currentTeamfight.startTime,
              endTime: currentTeamfight.kills[currentTeamfight.kills.length - 1].time,
              duration: currentTeamfight.kills[currentTeamfight.kills.length - 1].time - currentTeamfight.startTime,
              radiantKills,
              direKills,
              participants,
              winner: radiantKills > direKills ? 'radiant' : direKills > radiantKills ? 'dire' : 'draw'
            })
          }
          
          // Start new teamfight
          currentTeamfight = {
            startTime: kill.time,
            kills: [kill]
          }
        }
      }
    }

    // Finalize last teamfight
    if (currentTeamfight !== null && currentTeamfight.kills.length >= 3) {
      const radiantKills = currentTeamfight.kills.filter(k => k.team === 'radiant').length
      const direKills = currentTeamfight.kills.filter(k => k.team === 'dire').length
      
      const participantSlots = new Set(currentTeamfight.kills.map(k => k.playerSlot))
      const participants = players.map((p: any) => ({
        playerSlot: p.player_slot,
        team: p.player_slot < 128 ? 'radiant' : 'dire' as 'radiant' | 'dire',
        participated: participantSlots.has(p.player_slot)
      }))

      teamfights.push({
        startTime: currentTeamfight.startTime,
        endTime: currentTeamfight.kills[currentTeamfight.kills.length - 1].time,
        duration: currentTeamfight.kills[currentTeamfight.kills.length - 1].time - currentTeamfight.startTime,
        radiantKills,
        direKills,
        participants,
        winner: radiantKills > direKills ? 'radiant' : direKills > radiantKills ? 'dire' : 'draw'
      })
    }

    // Calculate player teamfight participation
    const playerTeamfightStats = players.map((player: any) => {
      const playerSlot = player.player_slot
      const team = playerSlot < 128 ? 'radiant' : 'dire'
      
      const participatedFights = teamfights.filter(tf => 
        tf.participants.find(p => p.playerSlot === playerSlot && p.participated)
      )
      
      const wonFights = participatedFights.filter(tf => tf.winner === team)
      const lostFights = participatedFights.filter(tf => tf.winner !== team && tf.winner !== 'draw')

      // Estimate damage/healing per teamfight (from player's total stats)
      // This is an approximation - real data would come from replay parsing
      const avgDamagePerFight = participatedFights.length > 0
        ? (player.hero_damage || 0) / participatedFights.length
        : 0
      
      const avgHealingPerFight = participatedFights.length > 0
        ? (player.hero_healing || 0) / participatedFights.length
        : 0

      return {
        account_id: player.account_id,
        player_slot: playerSlot,
        hero_id: player.hero_id,
        team,
        totalTeamfights: teamfights.length,
        participated: participatedFights.length,
        participationRate: teamfights.length > 0 
          ? (participatedFights.length / teamfights.length) * 100 
          : 0,
        won: wonFights.length,
        lost: lostFights.length,
        winRate: participatedFights.length > 0
          ? (wonFights.length / participatedFights.length) * 100
          : 0,
        avgDamagePerFight: Math.round(avgDamagePerFight),
        avgHealingPerFight: Math.round(avgHealingPerFight),
        totalDamage: player.hero_damage || 0,
        totalHealing: player.hero_healing || 0
      }
    })

    return NextResponse.json({
      match_id: parseInt(id),
      duration,
      totalTeamfights: teamfights.length,
      teamfights: teamfights.map(tf => ({
        ...tf,
        startMinute: Math.floor(tf.startTime / 60),
        startSecond: Math.floor(tf.startTime % 60),
        endMinute: Math.floor(tf.endTime / 60),
        endSecond: Math.floor(tf.endTime % 60),
      })),
      playerStats: playerTeamfightStats
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error fetching teamfights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}