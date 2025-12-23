import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint per verificare la struttura reale dei dati di una partita
 * e identificare perché teamfights e item timing non si popolano
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('id') || '8608995757'
    
    console.log(`[Test] Analyzing match ${matchId} data structure...`)
    
    // Fetch match data
    const matchResponse = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
      next: { revalidate: 0 }
    })
    
    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: 'Match not found', status: matchResponse.status },
        { status: matchResponse.status }
      )
    }

    const match = await matchResponse.json()
    
    // Analyze teamfights
    const teamfightsAnalysis = {
      exists: 'teamfights' in match,
      isArray: Array.isArray(match.teamfights),
      length: Array.isArray(match.teamfights) ? match.teamfights.length : 0,
      firstTeamfight: match.teamfights && Array.isArray(match.teamfights) && match.teamfights.length > 0
        ? {
            keys: Object.keys(match.teamfights[0]),
            hasStart: 'start' in match.teamfights[0],
            hasEnd: 'end' in match.teamfights[0],
            hasDeaths: 'deaths' in match.teamfights[0],
            hasPlayers: 'players' in match.teamfights[0],
            deathsCount: match.teamfights[0].deaths ? (Array.isArray(match.teamfights[0].deaths) ? match.teamfights[0].deaths.length : 'not_array') : 'missing',
            deathsSample: match.teamfights[0].deaths && Array.isArray(match.teamfights[0].deaths) && match.teamfights[0].deaths.length > 0
              ? match.teamfights[0].deaths[0]
              : null,
            fullStructure: match.teamfights[0]
          }
        : null
    }
    
    // Analyze purchase_log
    const purchaseLogAnalysis = {
      playersWithLog: 0,
      totalEntries: 0,
      samplePlayer: null as any,
      sampleEntry: null as any
    }
    
    if (match.players && Array.isArray(match.players)) {
      const playersWithLog = match.players.filter((p: any) => p.purchase_log && Array.isArray(p.purchase_log) && p.purchase_log.length > 0)
      purchaseLogAnalysis.playersWithLog = playersWithLog.length
      
      if (playersWithLog.length > 0) {
        purchaseLogAnalysis.samplePlayer = {
          player_slot: playersWithLog[0].player_slot,
          account_id: playersWithLog[0].account_id,
          hero_id: playersWithLog[0].hero_id,
          purchase_log_length: playersWithLog[0].purchase_log.length,
          purchase_log_keys: playersWithLog[0].purchase_log.length > 0 ? Object.keys(playersWithLog[0].purchase_log[0]) : []
        }
        purchaseLogAnalysis.sampleEntry = playersWithLog[0].purchase_log[0]
        purchaseLogAnalysis.totalEntries = playersWithLog.reduce((sum: number, p: any) => sum + p.purchase_log.length, 0)
      }
    }
    
    // Analyze items constants
    let itemsMapAnalysis = {
      fetched: false,
      size: 0,
      sampleItem: null as any
    }
    
    try {
      const itemsResponse = await fetch('https://api.opendota.com/api/constants/items', {
        next: { revalidate: 0 }
      })
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        itemsMapAnalysis.fetched = true
        itemsMapAnalysis.size = Object.keys(itemsData).length
        
        // Get a sample item (try to find one that's commonly used)
        const sampleItemId = Object.keys(itemsData).find(id => {
          const item = itemsData[id]
          return item && (item.dname || item.localized_name || item.name)
        })
        
        if (sampleItemId) {
          itemsMapAnalysis.sampleItem = {
            id: sampleItemId,
            ...itemsData[sampleItemId]
          }
        }
      }
    } catch (err) {
      console.log('Failed to fetch items constants:', err)
    }
    
    return NextResponse.json({
      match_id: matchId,
      analysis: {
        teamfights: teamfightsAnalysis,
        purchaseLog: purchaseLogAnalysis,
        itemsMap: itemsMapAnalysis,
        matchKeys: Object.keys(match).slice(0, 20), // First 20 keys
        playersCount: match.players ? (Array.isArray(match.players) ? match.players.length : 'not_array') : 'missing',
        firstPlayerKeys: match.players && Array.isArray(match.players) && match.players.length > 0
          ? Object.keys(match.players[0]).slice(0, 30)
          : []
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('Error analyzing match data structure:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

