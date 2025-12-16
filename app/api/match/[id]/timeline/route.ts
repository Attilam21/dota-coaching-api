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

    // Fetch REAL match events from OpenDota log endpoint
    let matchLog = null
    try {
      const logResponse = await fetch(`https://api.opendota.com/api/matches/${id}/log`, {
        next: { revalidate: 3600 }
      })
      if (logResponse.ok) {
        matchLog = await logResponse.json()
      }
    } catch (err) {
      console.log('Match log not available, using match data for events')
    }

    // Extract REAL key events from match data and log
    const keyEvents: Array<{ 
      minute: number
      second: number
      event: string
      description: string
      type: 'kill' | 'tower' | 'roshan' | 'first_blood' | 'match_start' | 'match_end'
      team?: 'radiant' | 'dire'
    }> = []

    // Match start (always real)
    keyEvents.push({
      minute: 0,
      second: 0,
      event: 'Match Started',
      description: 'La partita è iniziata',
      type: 'match_start'
    })

    // Extract REAL events from match log if available
    // OpenDota log contains detailed events with precise timestamps
    if (matchLog && Array.isArray(matchLog)) {
      matchLog.forEach((logEntry: any) => {
        const time = logEntry.time || 0
        if (time <= 0 || time > match.duration) return // Skip invalid times
        
        const minute = Math.floor(time / 60)
        const second = time % 60

        // Parse different event types from log
        if (logEntry.type === 'CHAT_MESSAGE_KILLSTREAK' || logEntry.type === 'CHAT_MESSAGE_KILL') {
          // Kill events - REAL timing
          const playerSlot = logEntry.player_slot !== undefined ? logEntry.player_slot : (logEntry.key ? parseInt(logEntry.key) : null)
          const team = playerSlot !== null && playerSlot < 128 ? 'radiant' : 'dire'
          
          keyEvents.push({
            minute,
            second,
            event: 'Kill',
            description: `Kill registrato`,
            type: 'kill',
            team
          })
        } else if (logEntry.type === 'CHAT_MESSAGE_TOWER_KILL' || logEntry.type === 'building_kill') {
          // Tower kill - REAL timing
          const playerSlot = logEntry.player_slot !== undefined ? logEntry.player_slot : (logEntry.key ? parseInt(logEntry.key) : null)
          const team = playerSlot !== null && playerSlot < 128 ? 'radiant' : 'dire'
          
          keyEvents.push({
            minute,
            second,
            event: 'Tower Destroyed',
            description: `Torre distrutta`,
            type: 'tower',
            team
          })
        } else if (logEntry.type === 'CHAT_MESSAGE_ROSHAN_KILL' || logEntry.type === 'roshan_kill') {
          // Roshan kill - REAL timing
          const playerSlot = logEntry.player_slot !== undefined ? logEntry.player_slot : (logEntry.key ? parseInt(logEntry.key) : null)
          const team = playerSlot !== null && playerSlot < 128 ? 'radiant' : 'dire'
          
          keyEvents.push({
            minute,
            second,
            event: 'Roshan Killed',
            description: `Roshan ucciso`,
            type: 'roshan',
            team
          })
        } else if (logEntry.type === 'CHAT_MESSAGE_FIRSTBLOOD' || logEntry.type === 'first_blood') {
          // First blood - REAL timing
          const playerSlot = logEntry.player_slot !== undefined ? logEntry.player_slot : (logEntry.key ? parseInt(logEntry.key) : null)
          const team = playerSlot !== null && playerSlot < 128 ? 'radiant' : 'dire'
          
          keyEvents.push({
            minute,
            second,
            event: 'First Blood',
            description: `First Blood ottenuto`,
            type: 'first_blood',
            team
          })
        } else if (logEntry.type === 'CHAT_MESSAGE_AEGIS' || logEntry.type === 'aegis_pickup') {
          // Aegis pickup - REAL timing
          const playerSlot = logEntry.player_slot !== undefined ? logEntry.player_slot : (logEntry.key ? parseInt(logEntry.key) : null)
          const team = playerSlot !== null && playerSlot < 128 ? 'radiant' : 'dire'
          
          keyEvents.push({
            minute,
            second,
            event: 'Aegis Picked Up',
            description: `Aegis raccolto`,
            type: 'roshan',
            team
          })
        } else if (logEntry.type === 'CHAT_MESSAGE_COURIER_LOST' || logEntry.type === 'courier_kill') {
          // Courier kill - REAL timing
          keyEvents.push({
            minute,
            second,
            event: 'Courier Killed',
            description: `Courier ucciso`,
            type: 'kill',
            team: logEntry.player_slot < 128 ? 'radiant' : 'dire'
          })
        }
      })
    }

    // Extract REAL events from match object (backup if log not available)
    // First Blood - REMOVED: Estimated timing was fake data
    // Real First Blood events come from match log if available with precise timing
    // If log not available, we don't add estimated First Blood (it would be fake)
    // Only add First Blood if we have real timing from log

    // Roshan kills - REMOVED: Estimated timings were fake data
    // Real Roshan kill events come from match log if available
    // If log not available, we don't add estimated Roshan kills (they would be fake)
    // Only add Roshan kills if we have real timing from log

    // Tower kills - REMOVED: Estimated timings were fake data
    // Real tower kill events come from match log if available
    // If log not available, we don't add estimated tower kills (they would be fake)
    // Only add tower kills if we have real timing from log

    // Match end (always real)
    const matchEndMinute = Math.floor(match.duration / 60)
    const matchEndSecond = match.duration % 60
    keyEvents.push({
      minute: matchEndMinute,
      second: matchEndSecond,
      event: match.radiant_win ? 'Radiant Victory' : 'Dire Victory',
      description: `Partita conclusa - ${match.radiant_win ? 'Radiant' : 'Dire'} vince`,
      type: 'match_end',
      team: match.radiant_win ? 'radiant' : 'dire'
    })

    // Sort events by time
    keyEvents.sort((a, b) => {
      const timeA = a.minute * 60 + a.second
      const timeB = b.minute * 60 + b.second
      return timeA - timeB
    })

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

