import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint per recuperare i dati delle wardmap aggregate per un player
 * Aggrega i dati da tutte le partite recenti del player
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch recent matches (ultime 20 partite per avere abbastanza dati)
    const matchesResponse = await fetch(`https://api.opendota.com/api/players/${id}/matches?limit=20`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matches: Array<{ match_id: number }> = await matchesResponse.json()
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        observerWards: [],
        sentryWards: [],
        totalMatches: 0
      })
    }

    // Fetch wardmap data for each match
    const wardmapPromises = matches.map(async (match) => {
      try {
        const wardmapResponse = await fetch(
          `https://api.opendota.com/api/matches/${match.match_id}/wardmap`,
          { next: { revalidate: 3600 } }
        )
        
        if (wardmapResponse.ok) {
          const wardmapData = await wardmapResponse.json()
          return {
            match_id: match.match_id,
            data: wardmapData
          }
        }
        return null
      } catch (err) {
        console.error(`Error fetching wardmap for match ${match.match_id}:`, err)
        return null
      }
    })

    const wardmapResults = await Promise.all(wardmapPromises)
    const validWardmaps = wardmapResults.filter((w): w is { match_id: number; data: any } => w !== null)

    // Aggregate ward positions
    // OpenDota wardmap structure: { observer: [{ x, y, ... }], sentry: [{ x, y, ... }] }
    const observerWards: Array<{ x: number; y: number; match_id: number }> = []
    const sentryWards: Array<{ x: number; y: number; match_id: number }> = []

    validWardmaps.forEach(({ match_id, data }) => {
      // Handle different possible structures
      if (data.observer && Array.isArray(data.observer)) {
        data.observer.forEach((ward: any) => {
          if (ward.x !== undefined && ward.y !== undefined) {
            observerWards.push({
              x: ward.x,
              y: ward.y,
              match_id
            })
          }
        })
      }
      
      if (data.sentry && Array.isArray(data.sentry)) {
        data.sentry.forEach((ward: any) => {
          if (ward.x !== undefined && ward.y !== undefined) {
            sentryWards.push({
              x: ward.x,
              y: ward.y,
              match_id
            })
          }
        })
      }
    })

    return NextResponse.json({
      observerWards,
      sentryWards,
      totalMatches: validWardmaps.length,
      matchesAnalyzed: validWardmaps.map(w => w.match_id)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Error generating wardmap:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

