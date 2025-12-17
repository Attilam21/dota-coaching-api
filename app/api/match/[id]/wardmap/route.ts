import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per recuperare i dati delle wardmap per una singola partita
 * Strategia multi-priority simile a /api/player/[id]/wardmap ma per un solo match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const observerWards: Array<{ x: number; y: number }> = []
    const sentryWards: Array<{ x: number; y: number }> = []
    
    // Priority 1: Try dedicated match wardmap endpoint
    try {
      const wardmapResponse = await fetch(
        `https://api.opendota.com/api/matches/${id}/wardmap`,
        { next: { revalidate: 3600 } }
      )
      
      if (wardmapResponse.ok) {
        const wardmapData = await wardmapResponse.json()
        
        // Handle different response formats
        if (wardmapData) {
          // Format 1: { obs: [{x, y}], sen: [{x, y}] }
          if (Array.isArray(wardmapData.obs) && wardmapData.obs.length > 0) {
            wardmapData.obs.forEach((ward: any) => {
              if (ward.x !== undefined && ward.y !== undefined) {
                observerWards.push({ x: ward.x, y: ward.y })
              }
            })
          }
          
          if (Array.isArray(wardmapData.sentry) && wardmapData.sentry.length > 0) {
            wardmapData.sentry.forEach((ward: any) => {
              if (ward.x !== undefined && ward.y !== undefined) {
                sentryWards.push({ x: ward.x, y: ward.y })
              }
            })
          }
          
          // Format 2: { observer: [{x, y}], sentry: [{x, y}] }
          if (Array.isArray(wardmapData.observer) && wardmapData.observer.length > 0) {
            wardmapData.observer.forEach((ward: any) => {
              if (ward.x !== undefined && ward.y !== undefined) {
                observerWards.push({ x: ward.x, y: ward.y })
              }
            })
          }
          
          if (observerWards.length > 0 || sentryWards.length > 0) {
            console.log(`[Match Wardmap] Found ${observerWards.length} observer, ${sentryWards.length} sentry from dedicated endpoint`)
            
            return NextResponse.json({
              observerWards,
              sentryWards,
              totalMatches: 1,
              source: 'dedicated_endpoint',
              matchId: parseInt(id)
            }, {
              headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
              },
            })
          }
        }
      }
    } catch (err) {
      console.log('[Match Wardmap] Error fetching dedicated endpoint:', err)
    }
    
    // Priority 2: Extract from match object (players.obs_log, players.sen_log, players.obs, players.sen)
    try {
      const matchResponse = await fetch(
        `https://api.opendota.com/api/matches/${id}`,
        { next: { revalidate: 3600 } }
      )
      
      if (!matchResponse.ok) {
        return NextResponse.json(
          { error: 'Match not found' },
          { status: matchResponse.status }
        )
      }
      
      const matchData = await matchResponse.json()
      const players = matchData.players || []
      
      // Extract wards from each player in the match
      players.forEach((player: any) => {
        // Priority 2a: Check obs_log and sen_log (if they have coordinates)
        if (player.obs_log && Array.isArray(player.obs_log)) {
          player.obs_log.forEach((logEntry: any) => {
            if (logEntry.x !== undefined && logEntry.y !== undefined) {
              observerWards.push({
                x: logEntry.x,
                y: logEntry.y
              })
            } else if (logEntry.pos_x !== undefined && logEntry.pos_y !== undefined) {
              observerWards.push({
                x: logEntry.pos_x,
                y: logEntry.pos_y
              })
            }
          })
        }
        
        if (player.sen_log && Array.isArray(player.sen_log)) {
          player.sen_log.forEach((logEntry: any) => {
            if (logEntry.x !== undefined && logEntry.y !== undefined) {
              sentryWards.push({
                x: logEntry.x,
                y: logEntry.y
              })
            } else if (logEntry.pos_x !== undefined && logEntry.pos_y !== undefined) {
              sentryWards.push({
                x: logEntry.pos_x,
                y: logEntry.pos_y
              })
            }
          })
        }
        
        // Priority 2b: Check obs and sen objects (convert outer/inner format to x/y)
        if (player.obs && typeof player.obs === 'object' && !Array.isArray(player.obs)) {
          Object.entries(player.obs).forEach(([key, count]: [string, any]) => {
            const parts = key.split(',')
            if (parts.length === 2) {
              const outer = Number(parts[0])
              const inner = Number(parts[1])
              const wardCount = Number(count) || 1
              
              // Validate: outer and inner must be in range 64-192
              if (!isNaN(outer) && !isNaN(inner) && outer >= 64 && outer <= 192 && inner >= 64 && inner <= 192 && wardCount > 0) {
                // Convert outer/inner to approximate x/y coordinates
                const outerRange = 192 - 64 // 128
                const innerRange = 192 - 64 // 128
                const mapRange = 8000 - (-8000) // 16000
                const mapMin = -8000
                
                const x = Math.max(-8000, Math.min(8000, ((outer - 64) / outerRange) * mapRange + mapMin))
                const y = Math.max(-8000, Math.min(8000, ((inner - 64) / innerRange) * mapRange + mapMin))
                
                // Add entries based on count (limit to reasonable number per position)
                const entriesToAdd = Math.min(Math.max(1, Math.floor(wardCount)), 10)
                for (let i = 0; i < entriesToAdd; i++) {
                  // Small random offset per visualizzazione (max 100 unità)
                  const offsetX = (Math.random() - 0.5) * 100
                  const offsetY = (Math.random() - 0.5) * 100
                  observerWards.push({
                    x: Math.max(-8000, Math.min(8000, x + offsetX)),
                    y: Math.max(-8000, Math.min(8000, y + offsetY))
                  })
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
                
                const x = Math.max(-8000, Math.min(8000, ((outer - 64) / outerRange) * mapRange + mapMin))
                const y = Math.max(-8000, Math.min(8000, ((inner - 64) / innerRange) * mapRange + mapMin))
                
                const entriesToAdd = Math.min(Math.max(1, Math.floor(wardCount)), 10)
                for (let i = 0; i < entriesToAdd; i++) {
                  const offsetX = (Math.random() - 0.5) * 100
                  const offsetY = (Math.random() - 0.5) * 100
                  sentryWards.push({
                    x: Math.max(-8000, Math.min(8000, x + offsetX)),
                    y: Math.max(-8000, Math.min(8000, y + offsetY))
                  })
                }
              }
            }
          })
        }
      })
      
      // Priority 3: Fallback to match log parsing
      if (observerWards.length === 0 && sentryWards.length === 0) {
        try {
          const logResponse = await fetch(
            `https://api.opendota.com/api/matches/${id}/log`,
            { next: { revalidate: 3600 } }
          )
          
          if (logResponse.ok) {
            const logData = await logResponse.json()
            if (Array.isArray(logData)) {
              logData.forEach((entry: any) => {
                // Look for ward placement events
                if (entry.type === 'obs_placed' || entry.key === 'ward_observer') {
                  if (entry.x !== undefined && entry.y !== undefined) {
                    observerWards.push({ x: entry.x, y: entry.y })
                  }
                } else if (entry.type === 'sen_placed' || entry.key === 'ward_sentry') {
                  if (entry.x !== undefined && entry.y !== undefined) {
                    sentryWards.push({ x: entry.x, y: entry.y })
                  }
                }
              })
              
              console.log(`[Match Wardmap] Extracted ${observerWards.length} observer, ${sentryWards.length} sentry from match log`)
            }
          }
        } catch (err) {
          console.log('[Match Wardmap] Error fetching match log:', err)
        }
      }
      
      console.log(`[Match Wardmap] Final: ${observerWards.length} observer, ${sentryWards.length} sentry wards from match object`)
      
      return NextResponse.json({
        observerWards,
        sentryWards,
        totalMatches: 1,
        source: observerWards.length > 0 || sentryWards.length > 0 ? 'match_object' : 'no_data',
        matchId: parseInt(id)
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      })
      
    } catch (err) {
      console.error('[Match Wardmap] Error processing match:', err)
      throw err
    }
    
  } catch (error) {
    console.error('Error generating match wardmap:', error)
    return NextResponse.json(
      { error: 'Failed to generate wardmap' },
      { status: 500 }
    )
  }
}
