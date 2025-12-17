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

    // Fetch ward data - try multiple sources
    const wardmapPromises = matches.map(async (match) => {
      try {
        // Priority 0: Check if match object has ward data (fetch full match)
        let matchData: any = null
        try {
          const matchResponse = await fetch(
            `https://api.opendota.com/api/matches/${match.match_id}`,
            { next: { revalidate: 3600 } }
          )
          if (matchResponse.ok) {
            matchData = await matchResponse.json()
            // Check if match has players with ward data
            const hasWardData = matchData.players?.some((p: any) => 
              (p.observer_placed !== undefined && p.observer_placed > 0) ||
              (p.sentry_placed !== undefined && p.sentry_placed > 0) ||
              (p.observer_uses !== undefined && p.observer_uses > 0) ||
              (p.sentry_uses !== undefined && p.sentry_uses > 0)
            )
            if (hasWardData) {
              console.log(`[Wardmap] Match ${match.match_id} has ward data in match object (but no coordinates)`)
            }
          }
        } catch (err) {
          console.log(`[Wardmap] Match ${match.match_id} error fetching match object:`, err)
        }
        
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
            console.log(`[Wardmap] Match ${match.match_id} log has ${logData.length} entries`)
            
            // Log sample entries to understand structure
            const sampleEntries = logData.slice(0, 10)
            console.log(`[Wardmap] Match ${match.match_id} sample log entries:`, JSON.stringify(sampleEntries).substring(0, 500))
            
            // Extract ward events from log - try multiple patterns
            const wardEvents = logData.filter((entry: any) => {
              const type = entry.type?.toString() || ''
              const key = entry.key?.toString() || ''
              const slot = entry.slot
              
              // Check for ward-related entries with coordinates
              const hasCoordinates = entry.x !== undefined && entry.y !== undefined && 
                                    typeof entry.x === 'number' && typeof entry.y === 'number'
              
              if (!hasCoordinates) return false
              
              // Pattern 1: Direct ward type/key matches
              const isWardType = (
                type.includes('WARD') || 
                type.includes('OBSERVER') || 
                type.includes('SENTRY') ||
                key.includes('ward') ||
                key.includes('observer') ||
                key.includes('sentry') ||
                key === 'item_ward_observer' ||
                key === 'item_ward_sentry' ||
                key === 'item_ward_dispenser'
              )
              
              // Pattern 2: Check for item purchases that are wards
              const isWardItem = (
                (type === 'purchase' || type === 'buy') &&
                (key === 'item_ward_observer' || key === 'item_ward_sentry' || 
                 key === 'item_ward_dispenser' || key.includes('ward'))
              )
              
              // Pattern 3: Check for ability/item uses that place wards
              const isWardPlacement = (
                (type === 'use' || type === 'ability') &&
                (key.includes('ward') || key.includes('observer') || key.includes('sentry'))
              )
              
              return isWardType || isWardItem || isWardPlacement
            })
            
            console.log(`[Wardmap] Match ${match.match_id} found ${wardEvents.length} potential ward events`)
            
            if (wardEvents.length > 0) {
              // Log first ward event structure
              console.log(`[Wardmap] Match ${match.match_id} first ward event:`, JSON.stringify(wardEvents[0]).substring(0, 300))
              
              return {
                match_id: match.match_id,
                data: { logEvents: wardEvents },
                source: 'match_log'
              }
            } else {
              // Log why no wards found - check what types of events exist
              const eventTypes = new Set(logData.map((e: any) => e.type).filter(Boolean))
              const eventKeys = new Set(logData.map((e: any) => e.key).filter(Boolean))
              console.log(`[Wardmap] Match ${match.match_id} no ward events found. Event types:`, Array.from(eventTypes).slice(0, 20))
              console.log(`[Wardmap] Match ${match.match_id} sample event keys:`, Array.from(eventKeys).slice(0, 20))
            }
          }
        } else {
          console.log(`[Wardmap] Match ${match.match_id} log endpoint returned ${logResponse.status}`)
        }
        
        return null
      } catch (err) {
        console.error(`[Wardmap] Error fetching ward data for match ${match.match_id}:`, err)
        return null
      }
    })

    const wardmapResults = await Promise.all(wardmapPromises)
    const validWardmaps = wardmapResults.filter((w): w is { match_id: number; data: any; source: string } => w !== null)

    console.log(`[Wardmap] Total matches fetched: ${matches.length}`)
    console.log(`[Wardmap] Valid wardmaps found: ${validWardmaps.length}`)
    if (validWardmaps.length > 0) {
      console.log(`[Wardmap] Sample wardmap structure:`, JSON.stringify(validWardmaps[0]).substring(0, 300))
    } else {
      console.log(`[Wardmap] No valid wardmaps found. This could mean:`)
      console.log(`[Wardmap] - Matches don't have wardmap data available`)
      console.log(`[Wardmap] - Matches are too old (no replay parsed)`)
      console.log(`[Wardmap] - Wardmap endpoint returned 404 for all matches`)
    }

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

