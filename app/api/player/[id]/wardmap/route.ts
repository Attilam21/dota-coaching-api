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

    // Fetch ward data from match log (more reliable than wardmap endpoint)
    const wardmapPromises = matches.map(async (match) => {
      try {
        // Priority 1: Try wardmap endpoint first
        const wardmapResponse = await fetch(
          `https://api.opendota.com/api/matches/${match.match_id}/wardmap`,
          { next: { revalidate: 3600 } }
        )
        
        if (wardmapResponse.ok) {
          const wardmapData = await wardmapResponse.json()
          console.log(`[Wardmap] Match ${match.match_id} wardmap endpoint OK`)
          return {
            match_id: match.match_id,
            data: wardmapData,
            source: 'wardmap_endpoint'
          }
        }
        
        // Priority 2: Extract from match log
        console.log(`[Wardmap] Match ${match.match_id} wardmap endpoint not available, trying match log`)
        const logResponse = await fetch(
          `https://api.opendota.com/api/matches/${match.match_id}/log`,
          { next: { revalidate: 3600 } }
        )
        
        if (logResponse.ok) {
          const logData = await logResponse.json()
          if (Array.isArray(logData)) {
            // Extract ward events from log
            const wardEvents = logData.filter((entry: any) => {
              const type = entry.type?.toString() || ''
              const key = entry.key?.toString() || ''
              return (
                type.includes('WARD') || 
                type.includes('OBSERVER') || 
                type.includes('SENTRY') ||
                key.includes('ward') ||
                key.includes('observer') ||
                key.includes('sentry')
              ) && entry.x !== undefined && entry.y !== undefined
            })
            
            if (wardEvents.length > 0) {
              console.log(`[Wardmap] Match ${match.match_id} found ${wardEvents.length} ward events in log`)
              return {
                match_id: match.match_id,
                data: { logEvents: wardEvents },
                source: 'match_log'
              }
            }
          }
        }
        
        return null
      } catch (err) {
        console.error(`[Wardmap] Error fetching ward data for match ${match.match_id}:`, err)
        return null
      }
    })

    const wardmapResults = await Promise.all(wardmapPromises)
    const validWardmaps = wardmapResults.filter((w): w is { match_id: number; data: any; source: string } => w !== null)

    console.log(`[Wardmap] Total matches: ${matches.length}, Valid wardmaps: ${validWardmaps.length}`)

    // Aggregate ward positions
    // OpenDota wardmap structure can vary - check multiple formats
    const observerWards: Array<{ x: number; y: number; match_id: number }> = []
    const sentryWards: Array<{ x: number; y: number; match_id: number }> = []

    validWardmaps.forEach(({ match_id, data, source }) => {
      // Handle data from wardmap endpoint
      if (source === 'wardmap_endpoint') {
        // Format 1: { observer: [{ x, y, ... }], sentry: [{ x, y, ... }] }
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
        
        // Format 2: Array of objects with type field
        if (Array.isArray(data)) {
          data.forEach((ward: any) => {
            if (ward.type === 'observer' || ward.type === 'obs') {
              if (ward.x !== undefined && ward.y !== undefined) {
                observerWards.push({
                  x: ward.x,
                  y: ward.y,
                  match_id
                })
              }
            } else if (ward.type === 'sentry' || ward.type === 'sen') {
              if (ward.x !== undefined && ward.y !== undefined) {
                sentryWards.push({
                  x: ward.x,
                  y: ward.y,
                  match_id
                })
              }
            }
          })
        }
      }
      
      // Handle data from match log
      if (source === 'match_log' && data.logEvents && Array.isArray(data.logEvents)) {
        data.logEvents.forEach((entry: any) => {
          const type = entry.type?.toString() || ''
          const key = entry.key?.toString() || ''
          
          // Determine if observer or sentry based on type/key
          const isObserver = type.includes('OBSERVER') || key.includes('observer') || 
                            (type.includes('WARD') && !type.includes('SENTRY') && !key.includes('sentry'))
          const isSentry = type.includes('SENTRY') || key.includes('sentry')
          
          if (entry.x !== undefined && entry.y !== undefined) {
            if (isObserver) {
              observerWards.push({
                x: entry.x,
                y: entry.y,
                match_id
              })
            } else if (isSentry) {
              sentryWards.push({
                x: entry.x,
                y: entry.y,
                match_id
              })
            }
          }
        })
      }
    })

    console.log(`[Wardmap] Aggregated: ${observerWards.length} observer, ${sentryWards.length} sentry wards`)

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

