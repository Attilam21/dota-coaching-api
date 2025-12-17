import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint per verificare la struttura completa del match object
 * e identificare tutti i campi disponibili, inclusi teamfights, purchases, ecc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('id') || '8608995757' // Match ID di test
    
    console.log(`[Test] Fetching match ${matchId} structure...`)
    
    // Fetch match data
    const matchResponse = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
      next: { revalidate: 0 } // No cache for testing
    })
    
    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: 'Match not found', status: matchResponse.status },
        { status: matchResponse.status }
      )
    }

    const match = await matchResponse.json()
    
    // Analizza la struttura del match object
    const structure = {
      topLevelKeys: Object.keys(match),
      hasTeamfights: 'teamfights' in match,
      teamfightsType: match.teamfights ? typeof match.teamfights : null,
      teamfightsIsArray: Array.isArray(match.teamfights),
      teamfightsLength: Array.isArray(match.teamfights) ? match.teamfights.length : null,
      hasPurchases: 'purchases' in match,
      hasPurchaseLog: 'purchase_log' in match,
      hasPlayers: 'players' in match,
      playersCount: Array.isArray(match.players) ? match.players.length : null,
      playerKeys: Array.isArray(match.players) && match.players.length > 0 
        ? Object.keys(match.players[0]) 
        : [],
      // Sample first player structure
      firstPlayerSample: Array.isArray(match.players) && match.players.length > 0
        ? {
            account_id: match.players[0].account_id,
            player_slot: match.players[0].player_slot,
            hasPurchaseLog: 'purchase_log' in match.players[0],
            hasItemUsage: 'item_usage' in match.players[0],
            hasItems: 'items' in match.players[0],
            purchaseLogType: match.players[0].purchase_log ? typeof match.players[0].purchase_log : null,
            purchaseLogIsArray: Array.isArray(match.players[0].purchase_log),
            purchaseLogLength: Array.isArray(match.players[0].purchase_log) 
              ? match.players[0].purchase_log.length 
              : null,
            purchaseLogSample: Array.isArray(match.players[0].purchase_log) && match.players[0].purchase_log.length > 0
              ? match.players[0].purchase_log[0]
              : null
          }
        : null,
      // Sample teamfights structure if exists
      teamfightsSample: match.teamfights && Array.isArray(match.teamfights) && match.teamfights.length > 0
        ? {
            length: match.teamfights.length,
            firstTeamfight: match.teamfights[0],
            firstTeamfightKeys: Object.keys(match.teamfights[0])
          }
        : null
    }
    
    return NextResponse.json({
      match_id: matchId,
      structure,
      // Include full match object for deep inspection (commented out in production)
      // match: match
    }, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('Error analyzing match structure:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

