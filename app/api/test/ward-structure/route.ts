import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint di test per verificare la struttura reale di obs_log e sen_log
 * Usa questo per capire cosa contengono esattamente questi array
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('match_id') || '3703866531' // Match ID di esempio
    
    // Fetch match data
    const matchResponse = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const match = await matchResponse.json()
    const players = match.players || []
    
    // Analizza la struttura di obs_log e sen_log per ogni player
    const wardStructureAnalysis = players.map((player: any, index: number) => {
      const obsLog = player.obs_log || []
      const senLog = player.sen_log || []
      const obsLeftLog = player.obs_left_log || []
      const senLeftLog = player.sen_left_log || []
      
      return {
        player_slot: player.player_slot,
        hero_id: player.hero_id,
        obs_placed: player.obs_placed || 0,
        sen_placed: player.sen_placed || 0,
        observer_uses: player.observer_uses || 0,
        sentry_uses: player.sentry_uses || 0,
        obs_log: {
          count: obsLog.length,
          sample: obsLog.length > 0 ? obsLog[0] : null,
          all_samples: obsLog.slice(0, 5), // Primi 5 per vedere pattern
          structure: obsLog.length > 0 ? Object.keys(obsLog[0] || {}) : []
        },
        sen_log: {
          count: senLog.length,
          sample: senLog.length > 0 ? senLog[0] : null,
          all_samples: senLog.slice(0, 5),
          structure: senLog.length > 0 ? Object.keys(senLog[0] || {}) : []
        },
        obs_left_log: {
          count: obsLeftLog.length,
          sample: obsLeftLog.length > 0 ? obsLeftLog[0] : null,
          structure: obsLeftLog.length > 0 ? Object.keys(obsLeftLog[0] || {}) : []
        },
        sen_left_log: {
          count: senLeftLog.length,
          sample: senLeftLog.length > 0 ? senLeftLog[0] : null,
          structure: senLeftLog.length > 0 ? Object.keys(senLeftLog[0] || {}) : []
        }
      }
    })
    
    // Verifica anche l'endpoint wardmap
    let wardmapEndpointData = null
    try {
      const wardmapResponse = await fetch(`https://api.opendota.com/api/matches/${matchId}/wardmap`, {
        next: { revalidate: 3600 }
      })
      if (wardmapResponse.ok) {
        wardmapEndpointData = await wardmapResponse.json()
      } else {
        wardmapEndpointData = { error: `Status ${wardmapResponse.status}`, available: false }
      }
    } catch (err) {
      wardmapEndpointData = { error: String(err), available: false }
    }
    
    return NextResponse.json({
      match_id: matchId,
      analysis: {
        players_with_wards: wardStructureAnalysis.filter((p: any) => p.obs_placed > 0 || p.sen_placed > 0),
        all_players: wardStructureAnalysis,
        summary: {
          total_obs_placed: wardStructureAnalysis.reduce((sum: number, p: any) => sum + p.obs_placed, 0),
          total_sen_placed: wardStructureAnalysis.reduce((sum: number, p: any) => sum + p.sen_placed, 0),
          players_with_obs_log: wardStructureAnalysis.filter((p: any) => p.obs_log.count > 0).length,
          players_with_sen_log: wardStructureAnalysis.filter((p: any) => p.sen_log.count > 0).length,
        }
      },
      wardmap_endpoint: wardmapEndpointData,
      recommendations: {
        has_coordinates_in_logs: wardStructureAnalysis.some((p: any) => {
          const obsSample = p.obs_log.sample
          const senSample = p.sen_log.sample
          return (obsSample && (obsSample.x !== undefined || obsSample.pos_x !== undefined)) ||
                 (senSample && (senSample.x !== undefined || senSample.pos_x !== undefined))
        }),
        can_use_wardmap_endpoint: wardmapEndpointData && !wardmapEndpointData.error && wardmapEndpointData.available !== false,
        best_approach: wardmapEndpointData && !wardmapEndpointData.error 
          ? 'Use wardmap endpoint if available, fallback to obs_log/sen_log if they have coordinates'
          : 'Extract from obs_log/sen_log if they contain coordinates, otherwise use aggregated stats only'
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error analyzing ward structure:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

