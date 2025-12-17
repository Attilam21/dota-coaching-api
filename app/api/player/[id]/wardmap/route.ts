import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per recuperare i dati delle wardmap aggregate per un player
 * Aggrega i dati da tutte le partite recenti del player
 * 
 * Strategia multi-priority (come teamfights e item-timing):
 * Priority 1: Endpoint dedicato /players/{id}/wardmap (se disponibile)
 * Priority 2: obs_log/sen_log dal match object (se hanno coordinate)
 * Priority 3: obs/sen dal match object (convertire formato outer/inner)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Priority 1: Try dedicated player wardmap endpoint first
    try {
      const wardmapResponse = await fetch(
        `https://api.opendota.com/api/players/${id}/wardmap?limit=20`,
        { next: { revalidate: 3600 } }
      )
      
      if (wardmapResponse.ok) {
        const wardmapData = await wardmapResponse.json()
        
        // Check if data is valid
        if (wardmapData && (wardmapData.obs || wardmapData.sentry)) {
          console.log(`[Wardmap] Using dedicated player wardmap endpoint`)
          
          // Convert to our format
          const observerWards: Array<{ x: number; y: number; match_id: number }> = []
          const sentryWards: Array<{ x: number; y: number; match_id: number }> = []
          
          // Process obs data (structure can vary)
          if (wardmapData.obs) {
            if (Array.isArray(wardmapData.obs)) {
              wardmapData.obs.forEach((ward: any) => {
                if (ward.x !== undefined && ward.y !== undefined) {
                  observerWards.push({
                    x: ward.x,
                    y: ward.y,
                    match_id: ward.match_id || 0
                  })
                }
              })
            } else if (typeof wardmapData.obs === 'object') {
              // obs might be an object with keys as coordinates
              Object.entries(wardmapData.obs).forEach(([key, value]: [string, any]) => {
                if (value && typeof value === 'object') {
                  // Could be nested structure
                  if (value.x !== undefined && value.y !== undefined) {
                    observerWards.push({
                      x: value.x,
                      y: value.y,
                      match_id: value.match_id || 0
                    })
                  } else if (Array.isArray(value)) {
                    value.forEach((ward: any) => {
                      if (ward.x !== undefined && ward.y !== undefined) {
                        observerWards.push({
                          x: ward.x,
                          y: ward.y,
                          match_id: ward.match_id || 0
                        })
                      }
                    })
                  }
                }
              })
            }
          }
          
          // Process sentry data (same structure as obs)
          if (wardmapData.sentry || wardmapData.sen) {
            const sentryData = wardmapData.sentry || wardmapData.sen
            if (Array.isArray(sentryData)) {
              sentryData.forEach((ward: any) => {
                if (ward.x !== undefined && ward.y !== undefined) {
                  sentryWards.push({
                    x: ward.x,
                    y: ward.y,
                    match_id: ward.match_id || 0
                  })
                }
              })
            } else if (typeof sentryData === 'object') {
              Object.entries(sentryData).forEach(([key, value]: [string, any]) => {
                if (value && typeof value === 'object') {
                  if (value.x !== undefined && value.y !== undefined) {
                    sentryWards.push({
                      x: value.x,
                      y: value.y,
                      match_id: value.match_id || 0
                    })
                  } else if (Array.isArray(value)) {
                    value.forEach((ward: any) => {
                      if (ward.x !== undefined && ward.y !== undefined) {
                        sentryWards.push({
                          x: ward.x,
                          y: ward.y,
                          match_id: ward.match_id || 0
                        })
                      }
                    })
                  }
                }
              })
            }
          }
          
          if (observerWards.length > 0 || sentryWards.length > 0) {
            console.log(`[Wardmap] Found ${observerWards.length} observer, ${sentryWards.length} sentry from dedicated endpoint`)
            return NextResponse.json({
              observerWards,
              sentryWards,
              totalMatches: 1, // Dedicated endpoint aggregates all matches
              source: 'dedicated_endpoint'
            }, {
              headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
              },
            })
          }
        }
      } else {
        console.log(`[Wardmap] Dedicated endpoint returned ${wardmapResponse.status}, falling back to match extraction`)
      }
    } catch (err) {
      console.log('[Wardmap] Error fetching dedicated endpoint:', err)
    }
    
    // Priority 2: Extract from recent matches
    console.log(`[Wardmap] Extracting ward data from recent matches`)
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
        totalMatches: 0,
        source: 'no_matches'
      })
    }

    // Fetch ward data from each match
    const wardmapPromises = matches.map(async (match) => {
      try {
        // Fetch full match data
        const matchResponse = await fetch(
          `https://api.opendota.com/api/matches/${match.match_id}`,
          { next: { revalidate: 3600 } }
        )
        
        if (!matchResponse.ok) {
          return null
        }
        
        const matchData = await matchResponse.json()
        const players = matchData.players || []
        
        const matchObserverWards: Array<{ x: number; y: number; match_id: number }> = []
        const matchSentryWards: Array<{ x: number; y: number; match_id: number }> = []
        
        // Extract wards from each player in the match
        players.forEach((player: any) => {
          // Priority 2a: Check obs_log and sen_log (if they have coordinates)
          if (player.obs_log && Array.isArray(player.obs_log)) {
            player.obs_log.forEach((logEntry: any) => {
              // Check if log entry has coordinates
              if (logEntry.x !== undefined && logEntry.y !== undefined) {
                matchObserverWards.push({
                  x: logEntry.x,
                  y: logEntry.y,
                  match_id: match.match_id
                })
              } else if (logEntry.pos_x !== undefined && logEntry.pos_y !== undefined) {
                matchObserverWards.push({
                  x: logEntry.pos_x,
                  y: logEntry.pos_y,
                  match_id: match.match_id
                })
              }
            })
          }
          
          if (player.sen_log && Array.isArray(player.sen_log)) {
            player.sen_log.forEach((logEntry: any) => {
              if (logEntry.x !== undefined && logEntry.y !== undefined) {
                matchSentryWards.push({
                  x: logEntry.x,
                  y: logEntry.y,
                  match_id: match.match_id
                })
              } else if (logEntry.pos_x !== undefined && logEntry.pos_y !== undefined) {
                matchSentryWards.push({
                  x: logEntry.pos_x,
                  y: logEntry.pos_y,
                  match_id: match.match_id
                })
              }
            })
          }
          
          // Priority 2b: Check obs and sen objects (convert outer/inner format to x/y)
          // Format: obs = { "64,64": count, "65,64": count, ... } where keys are "outer,inner"
          // Range: ~64-192 for both outer and inner
          // IMPORTANTE: I calcoli devono essere precisi per evitare errori di aggregazione
          if (player.obs && typeof player.obs === 'object' && !Array.isArray(player.obs)) {
            Object.entries(player.obs).forEach(([key, count]: [string, any]) => {
              const parts = key.split(',')
              if (parts.length === 2) {
                const outer = Number(parts[0])
                const inner = Number(parts[1])
                const wardCount = Number(count) || 1
                
                // Validazione: outer e inner devono essere numeri validi nel range 64-192
                if (!isNaN(outer) && !isNaN(inner) && outer >= 64 && outer <= 192 && inner >= 64 && inner <= 192 && wardCount > 0) {
                  // Convert outer/inner to approximate x/y coordinates
                  // Dota 2 map: -8000 to 8000 in world coordinates (range: 16000)
                  // Outer/inner: 64-192 range (range: 128)
                  // Formula: coordinate = ((value - min) / range) * mapRange + mapMin
                  const outerRange = 192 - 64 // 128
                  const innerRange = 192 - 64 // 128
                  const mapRange = 8000 - (-8000) // 16000
                  const mapMin = -8000
                  
                  const x = ((outer - 64) / outerRange) * mapRange + mapMin
                  const y = ((inner - 64) / innerRange) * mapRange + mapMin
                  
                  // Validazione coordinate finali
                  if (x >= -8000 && x <= 8000 && y >= -8000 && y <= 8000) {
                    // Add entries based on count (limit to reasonable number per position)
                    const entriesToAdd = Math.min(Math.max(1, Math.floor(wardCount)), 10)
                    for (let i = 0; i < entriesToAdd; i++) {
                      // Small random offset per visualizzazione (max 100 unità)
                      const offsetX = (Math.random() - 0.5) * 100
                      const offsetY = (Math.random() - 0.5) * 100
                      matchObserverWards.push({
                        x: Math.max(-8000, Math.min(8000, x + offsetX)), // Clamp to valid range
                        y: Math.max(-8000, Math.min(8000, y + offsetY)),
                        match_id: match.match_id
                      })
                    }
                  }
                }
              }
            })
          }
          
          if (player.sen && typeof player.sen === 'object' && !Array.isArray(player.sen)) {
            Object.entries(player.sen).forEach(([key, count]: [string, any]) => {
              const parts = key.split(',')
              if (parts.length === 2) {
                const outer = Number(parts[0])
                const inner = Number(parts[1])
                const wardCount = Number(count) || 1
                
                if (!isNaN(outer) && !isNaN(inner) && outer >= 64 && outer <= 192 && inner >= 64 && inner <= 192 && wardCount > 0) {
                  const outerRange = 192 - 64
                  const innerRange = 192 - 64
                  const mapRange = 8000 - (-8000)
                  const mapMin = -8000
                  
                  const x = ((outer - 64) / outerRange) * mapRange + mapMin
                  const y = ((inner - 64) / innerRange) * mapRange + mapMin
                  
                  if (x >= -8000 && x <= 8000 && y >= -8000 && y <= 8000) {
                    const entriesToAdd = Math.min(Math.max(1, Math.floor(wardCount)), 10)
                    for (let i = 0; i < entriesToAdd; i++) {
                      const offsetX = (Math.random() - 0.5) * 100
                      const offsetY = (Math.random() - 0.5) * 100
                      matchSentryWards.push({
                        x: Math.max(-8000, Math.min(8000, x + offsetX)),
                        y: Math.max(-8000, Math.min(8000, y + offsetY)),
                        match_id: match.match_id
                      })
                    }
                  }
                }
              }
            })
          }
        })
        
        if (matchObserverWards.length > 0 || matchSentryWards.length > 0) {
          return {
            match_id: match.match_id,
            observerWards: matchObserverWards,
            sentryWards: matchSentryWards
          }
        }
        
        return null
      } catch (err) {
        console.error(`[Wardmap] Error processing match ${match.match_id}:`, err)
        return null
      }
    })

    const wardmapResults = await Promise.all(wardmapPromises)
    const validWardmaps = wardmapResults.filter((w): w is { 
      match_id: number
      observerWards: Array<{ x: number; y: number; match_id: number }>
      sentryWards: Array<{ x: number; y: number; match_id: number }>
    } => w !== null)

    // Aggregate all wards from all matches
    // IMPORTANTE: Validare coordinate e match_id durante l'aggregazione
    const observerWards: Array<{ x: number; y: number; match_id: number }> = []
    const sentryWards: Array<{ x: number; y: number; match_id: number }> = []
    
    validWardmaps.forEach(({ match_id, observerWards: obs, sentryWards: sen }) => {
      // Validare e aggiungere observer wards
      if (Array.isArray(obs) && obs.length > 0) {
        obs.forEach((ward: { x: number; y: number; match_id?: number }) => {
          // Validazione coordinate: devono essere numeri validi nel range Dota 2
          if (typeof ward.x === 'number' && typeof ward.y === 'number' && 
              !isNaN(ward.x) && !isNaN(ward.y) &&
              ward.x >= -8000 && ward.x <= 8000 &&
              ward.y >= -8000 && ward.y <= 8000) {
            observerWards.push({
              x: ward.x,
              y: ward.y,
              match_id: ward.match_id || match_id
            })
          }
        })
      }
      
      // Validare e aggiungere sentry wards
      if (Array.isArray(sen) && sen.length > 0) {
        sen.forEach((ward: { x: number; y: number; match_id?: number }) => {
          if (typeof ward.x === 'number' && typeof ward.y === 'number' && 
              !isNaN(ward.x) && !isNaN(ward.y) &&
              ward.x >= -8000 && ward.x <= 8000 &&
              ward.y >= -8000 && ward.y <= 8000) {
            sentryWards.push({
              x: ward.x,
              y: ward.y,
              match_id: ward.match_id || match_id
            })
          }
        })
      }
    })

    // Calcolo corretto di totalMatches: solo partite con dati validi
    const totalMatches = validWardmaps.length
    
    console.log(`[Wardmap] Aggregated from ${totalMatches} matches: ${observerWards.length} observer, ${sentryWards.length} sentry wards`)
    
    // Validazione finale: assicurarsi che totalMatches sia coerente
    if (totalMatches === 0 && (observerWards.length > 0 || sentryWards.length > 0)) {
      console.warn(`[Wardmap] Warning: Found wards but totalMatches is 0. This should not happen.`)
    }

    return NextResponse.json({
      observerWards,
      sentryWards,
      totalMatches: validWardmaps.length,
      source: 'match_extraction',
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

