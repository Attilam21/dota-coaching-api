import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per analisi teamfight di una partita
 * Usa l'endpoint dedicato di OpenDota /matches/{id}/teamfights
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

    // Fetch teamfights data from OpenDota dedicated endpoint
    let teamfightsData: any[] = []
    try {
      const teamfightsResponse = await fetch(`https://api.opendota.com/api/matches/${id}/teamfights`, {
        next: { revalidate: 3600 }
      })
      if (teamfightsResponse.ok) {
        const data = await teamfightsResponse.json()
        if (Array.isArray(data)) {
          teamfightsData = data
          console.log(`[Teamfights] Loaded ${teamfightsData.length} teamfights from OpenDota`)
        }
      } else {
        console.log(`[Teamfights] Teamfights endpoint not available: ${teamfightsResponse.status}`)
      }
    } catch (err) {
      console.log('[Teamfights] Error fetching teamfights:', err)
    }

    // Map OpenDota teamfights format to our format
    const teamfights = teamfightsData.map((tf: any) => {
      const startTime = tf.start || 0
      const endTime = tf.end || startTime
      const duration = endTime - startTime
      
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
        duration,
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
      
      if (participatedFights.length > 0 && teamfightsData.length > 0) {
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
