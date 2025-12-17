import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per analisi teamfight di una partita
 * Prima prova l'endpoint dedicato OpenDota, poi fallback a estrazione dal log
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

    // Try OpenDota dedicated teamfights endpoint first
    let teamfightsData: any[] = []
    let useDedicatedEndpoint = false
    
    try {
      const teamfightsResponse = await fetch(`https://api.opendota.com/api/matches/${id}/teamfights`, {
        next: { revalidate: 3600 }
      })
      if (teamfightsResponse.ok) {
        const data = await teamfightsResponse.json()
        if (Array.isArray(data) && data.length > 0) {
          teamfightsData = data
          useDedicatedEndpoint = true
          console.log(`[Teamfights] Loaded ${teamfightsData.length} teamfights from OpenDota endpoint`)
        }
      } else {
        console.log(`[Teamfights] Teamfights endpoint not available (${teamfightsResponse.status}), falling back to log extraction`)
      }
    } catch (err) {
      console.log('[Teamfights] Error fetching teamfights endpoint:', err)
    }

    let teamfights: Array<{
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
      startMinute: number
      startSecond: number
      endMinute: number
      endSecond: number
    }> = []

    if (useDedicatedEndpoint) {
      // Map OpenDota teamfights format to our format
      teamfights = teamfightsData.map((tf: any) => {
        const startTime = tf.start || 0
        const endTime = tf.end || startTime
        const tfDuration = endTime - startTime
        
        // Count kills per team from deaths array
        let radiantKills = 0
        let direKills = 0
        
        if (tf.deaths && Array.isArray(tf.deaths)) {
          tf.deaths.forEach((death: any) => {
            const playerSlot = death.player_slot !== undefined ? death.player_slot : death.slot
            if (playerSlot !== undefined) {
              if (playerSlot < 128) {
                direKills++ // Death of radiant player = dire kill
              } else {
                radiantKills++ // Death of dire player = radiant kill
              }
            }
          })
        }

        // Determine winner
        let winner: 'radiant' | 'dire' | 'draw' = 'draw'
        if (radiantKills > direKills) {
          winner = 'radiant'
        } else if (direKills > radiantKills) {
          winner = 'dire'
        }

        // Extract participants from players array
        const participants = players.map((p: { player_slot: number }) => {
          const playerSlot = p.player_slot
          const participated = tf.players && tf.players.some((tfPlayer: any) => {
            const tfSlot = tfPlayer.player_slot !== undefined ? tfPlayer.player_slot : tfPlayer.slot
            return tfSlot === playerSlot
          })
          
          return {
            playerSlot,
            team: playerSlot < 128 ? 'radiant' : 'dire' as 'radiant' | 'dire',
            participated: participated || false
          }
        })

        return {
          startTime,
          endTime,
          duration: tfDuration,
          radiantKills,
          direKills,
          participants,
          winner,
          startMinute: Math.floor(startTime / 60),
          startSecond: Math.floor(startTime % 60),
          endMinute: Math.floor(endTime / 60),
          endSecond: Math.floor(endTime % 60),
        }
      })
    } else {
      // Fallback: Extract teamfights from match log
      let matchLog: any[] = []
      try {
        const logResponse = await fetch(`https://api.opendota.com/api/matches/${id}/log`, {
          next: { revalidate: 3600 }
        })
        if (logResponse.ok) {
          const logData = await logResponse.json()
          if (Array.isArray(logData)) {
            matchLog = logData
            console.log(`[Teamfights] Fallback: Loaded ${matchLog.length} log entries`)
          }
        }
      } catch (err) {
        console.log('[Teamfights] Match log not available')
      }

      // Identify teamfights (clusters of kills within short time windows)
      // A teamfight is defined as 3+ kills within 30 seconds
      const killEvents: KillEvent[] = matchLog
        .filter((entry: any) => {
          const isKillEvent = entry.type === 'CHAT_MESSAGE_KILL' || 
                             entry.type === 'CHAT_MESSAGE_KILLSTREAK' ||
                             entry.type?.includes('KILL')
          if (!isKillEvent) return false
          
          // Extract player_slot (same logic as timeline route)
          const playerSlot = entry.player_slot !== undefined 
            ? entry.player_slot 
            : (entry.key ? parseInt(entry.key) : null)
          
          return playerSlot !== null && 
                 typeof playerSlot === 'number' &&
                 entry.time > 0 && 
                 entry.time <= duration
        })
        .map((entry: any): KillEvent => {
          // Extract player_slot (same logic as timeline route)
          const playerSlot = entry.player_slot !== undefined 
            ? entry.player_slot 
            : (entry.key ? parseInt(entry.key) : null)
          
          return {
            time: entry.time || 0,
            playerSlot: playerSlot as number,
            team: (playerSlot < 128 ? 'radiant' : 'dire') as 'radiant' | 'dire'
          }
        })

      console.log(`[Teamfights] Fallback: Found ${killEvents.length} kill events`)

      const TEAMFIGHT_WINDOW = 30 // seconds

      let currentTeamfight: {
        startTime: number
        kills: KillEvent[]
      } | null = null

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
                winner: radiantKills > direKills ? 'radiant' : direKills > radiantKills ? 'dire' : 'draw',
                startMinute: Math.floor(currentTeamfight.startTime / 60),
                startSecond: Math.floor(currentTeamfight.startTime % 60),
                endMinute: Math.floor(currentTeamfight.kills[currentTeamfight.kills.length - 1].time / 60),
                endSecond: Math.floor(currentTeamfight.kills[currentTeamfight.kills.length - 1].time % 60),
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
          winner: radiantKills > direKills ? 'radiant' : direKills > radiantKills ? 'dire' : 'draw',
          startMinute: Math.floor(currentTeamfight.startTime / 60),
          startSecond: Math.floor(currentTeamfight.startTime % 60),
          endMinute: Math.floor(currentTeamfight.kills[currentTeamfight.kills.length - 1].time / 60),
          endSecond: Math.floor(currentTeamfight.kills[currentTeamfight.kills.length - 1].time % 60),
        })
      }
    }

    // Calculate player teamfight participation stats
    const playerTeamfightStats = players.map((player: any) => {
      const playerSlot = player.player_slot
      const team = playerSlot < 128 ? 'radiant' : 'dire'
      
      // Count teamfights where this player participated
      const participatedFights = teamfights.filter(tf => 
        tf.participants.find((p: { playerSlot: number; participated: boolean }) => p.playerSlot === playerSlot && p.participated)
      )
      
      // Count wins/losses
      const wonFights = participatedFights.filter(tf => tf.winner === team)
      const lostFights = participatedFights.filter(tf => tf.winner !== team && tf.winner !== 'draw')
      
      // Get damage/healing from teamfight data if available
      let avgDamagePerFight = 0
      let avgHealingPerFight = 0
      
      if (useDedicatedEndpoint && participatedFights.length > 0 && teamfightsData.length > 0) {
        // Try to extract damage/healing from OpenDota teamfight data
        const totalDamage = participatedFights.reduce((acc, tf) => {
          const tfData = teamfightsData.find((tfd: any) => 
            (tfd.start || 0) === tf.startTime
          )
          if (tfData && tfData.players) {
            const tfPlayer = tfData.players.find((p: any) => {
              const tfSlot = p.player_slot !== undefined ? p.player_slot : p.slot
              return tfSlot === playerSlot
            })
            return acc + (tfPlayer?.damage || 0)
          }
          return acc
        }, 0)
        
        const totalHealing = participatedFights.reduce((acc, tf) => {
          const tfData = teamfightsData.find((tfd: any) => 
            (tfd.start || 0) === tf.startTime
          )
          if (tfData && tfData.players) {
            const tfPlayer = tfData.players.find((p: any) => {
              const tfSlot = p.player_slot !== undefined ? p.player_slot : p.slot
              return tfSlot === playerSlot
            })
            return acc + (tfPlayer?.healing || 0)
          }
          return acc
        }, 0)
        
        avgDamagePerFight = participatedFights.length > 0 ? totalDamage / participatedFights.length : 0
        avgHealingPerFight = participatedFights.length > 0 ? totalHealing / participatedFights.length : 0
      } else {
        // Fallback: estimate from player's total stats
        avgDamagePerFight = participatedFights.length > 0
          ? (player.hero_damage || 0) / participatedFights.length
          : 0
        avgHealingPerFight = participatedFights.length > 0
          ? (player.hero_healing || 0) / participatedFights.length
          : 0
      }

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
      teamfights,
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
