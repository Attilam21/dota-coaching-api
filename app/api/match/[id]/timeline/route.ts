import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch match data from OpenDota
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

    // Fetch match timeline (gold/XP deltas over time)
    const timelineResponse = await fetch(`https://api.opendota.com/api/matches/${id}/goldXpGraph`, {
      next: { revalidate: 3600 }
    })

    let timelineData = null
    if (timelineResponse.ok) {
      timelineData = await timelineResponse.json()
    }

    // Extract players data
    const players = match.players || []
    
    // Calculate item timings for each player
    const playersWithTimings = players.map((player: any) => {
      const items = [
        player.item_0, player.item_1, player.item_2,
        player.item_3, player.item_4, player.item_5,
        player.backpack_0, player.backpack_1, player.backpack_2,
        player.backpack_3
      ].filter((item: number) => item && item > 0)

      return {
        account_id: player.account_id,
        player_slot: player.player_slot,
        hero_id: player.hero_id,
        items: items,
        item_usage: {
          item_0: player.item_0 || null,
          item_1: player.item_1 || null,
          item_2: player.item_2 || null,
          item_3: player.item_3 || null,
          item_4: player.item_4 || null,
          item_5: player.item_5 || null,
        }
      }
    })

    // Prepare timeline data points
    const timelinePoints = []
    if (timelineData) {
      // OpenDota provides gold/XP deltas as arrays
      const goldDeltas = timelineData.gold_t?.[0] || []
      const xpDeltas = timelineData.xp_t?.[0] || []
      const duration = match.duration || 0

      // Create data points every minute
      for (let minute = 0; minute <= Math.floor(duration / 60); minute++) {
        const second = minute * 60
        const goldIdx = Math.floor(second / 10) // Data points every 10 seconds
        const xpIdx = Math.floor(second / 10)

        timelinePoints.push({
          minute,
          radiant_gold_adv: goldDeltas[goldIdx] || 0,
          radiant_xp_adv: xpDeltas[xpIdx] || 0,
        })
      }
    }

    // Key events timeline (kills, tower kills, roshan, etc.)
    // Note: OpenDota doesn't provide detailed events, so we simulate based on match data
    const keyEvents: Array<{ minute: number; event: string; description: string }> = []

    // Add match start
    keyEvents.push({
      minute: 0,
      event: 'Match Started',
      description: 'La partita è iniziata'
    })

    // Add duration milestones
    if (match.duration > 600) {
      keyEvents.push({
        minute: 10,
        event: 'Early Game',
        description: 'Fine fase laning - Transizione mid game'
      })
    }
    if (match.duration > 1800) {
      keyEvents.push({
        minute: 30,
        event: 'Mid Game',
        description: 'Fase mid game - Teamfight intensi'
      })
    }
    if (match.duration > 2400) {
      keyEvents.push({
        minute: 40,
        event: 'Late Game',
        description: 'Fase late game - Decisioni cruciali'
      })
    }

    // Calculate net worth over time (simplified - using final net worth)
    const netWorthData = players.map((player: any) => ({
      account_id: player.account_id,
      player_slot: player.player_slot,
      hero_id: player.hero_id,
      final_net_worth: player.net_worth || 0,
      final_gold: player.total_gold || 0,
    }))

    return NextResponse.json({
      match_id: parseInt(id),
      duration: match.duration,
      timeline: timelinePoints,
      keyEvents,
      players: playersWithTimings,
      netWorth: netWorthData,
      radiant_win: match.radiant_win,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error fetching match timeline:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

