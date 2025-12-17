import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint per verificare la struttura del match log
 * e la disponibilità di dati ward placement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('match_id') || '8608973113' // Match ID dall'immagine
    
    // Fetch match log
    const logResponse = await fetch(`https://api.opendota.com/api/matches/${matchId}/log`, {
      next: { revalidate: 0 } // No cache per test
    })
    
    if (!logResponse.ok) {
      return NextResponse.json({
        error: 'Failed to fetch log',
        status: logResponse.status,
        matchId
      })
    }
    
    const logData = await logResponse.json()
    
    // Analizza la struttura del log
    const analysis: {
      matchId: string
      totalEntries: number
      entryTypes: Record<string, number>
      wardEvents: any[]
      sampleEntries: any[]
      hasCoordinates: boolean
      coordinateFields: string[]
      matchWardData?: any[]
    } = {
      matchId,
      totalEntries: Array.isArray(logData) ? logData.length : 0,
      entryTypes: {},
      wardEvents: [],
      sampleEntries: [],
      hasCoordinates: false,
      coordinateFields: []
    }
    
    if (Array.isArray(logData)) {
      // Analizza i primi 100 entry per performance
      const sampleSize = Math.min(100, logData.length)
      const sample = logData.slice(0, sampleSize)
      
      sample.forEach((entry: any) => {
        // Conta i tipi di entry
        const type = entry.type || 'unknown'
        analysis.entryTypes[type] = (analysis.entryTypes[type] || 0) + 1
        
        // Cerca eventi ward
        if (type.includes('WARD') || type.includes('OBSERVER') || type.includes('SENTRY') || 
            entry.key?.toString().includes('ward') || entry.key?.toString().includes('observer') || 
            entry.key?.toString().includes('sentry')) {
          analysis.wardEvents.push({
            type: entry.type,
            time: entry.time,
            key: entry.key,
            player_slot: entry.player_slot,
            x: entry.x,
            y: entry.y,
            z: entry.z,
            ...entry
          })
        }
        
        // Cerca coordinate
        if (entry.x !== undefined || entry.y !== undefined || entry.z !== undefined) {
          analysis.hasCoordinates = true
          if (entry.x !== undefined && !analysis.coordinateFields.includes('x')) analysis.coordinateFields.push('x')
          if (entry.y !== undefined && !analysis.coordinateFields.includes('y')) analysis.coordinateFields.push('y')
          if (entry.z !== undefined && !analysis.coordinateFields.includes('z')) analysis.coordinateFields.push('z')
        }
      })
      
      // Sample entries per vedere la struttura
      analysis.sampleEntries = sample.slice(0, 10).map((entry: any) => ({
        type: entry.type,
        time: entry.time,
        key: entry.key,
        player_slot: entry.player_slot,
        x: entry.x,
        y: entry.y,
        z: entry.z,
        // Mostra solo i primi 5 campi per non sovraccaricare
        otherFields: Object.keys(entry).filter(k => !['type', 'time', 'key', 'player_slot', 'x', 'y', 'z'].includes(k)).slice(0, 5)
      }))
    }
    
    // Fetch anche il match completo per vedere se ci sono dati ward lì
    const matchResponse = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
      next: { revalidate: 0 }
    })
    
    let matchData = null
    if (matchResponse.ok) {
      matchData = await matchResponse.json()
      
      // Cerca dati ward nei players
      if (matchData.players) {
        const wardDataInPlayers = matchData.players.map((p: any) => ({
          player_slot: p.player_slot,
          hero_id: p.hero_id,
          observer_placed: p.observer_placed,
          observer_killed: p.observer_killed,
          sentry_placed: p.sentry_placed,
          sentry_killed: p.sentry_killed,
        }))
        
        analysis.matchWardData = wardDataInPlayers
      }
    }
    
    return NextResponse.json({
      success: true,
      analysis,
      rawLogSample: Array.isArray(logData) ? logData.slice(0, 5) : logData,
      matchDataSample: matchData ? {
        match_id: matchData.match_id,
        duration: matchData.duration,
        players_count: matchData.players?.length || 0,
        has_ward_data: matchData.players?.some((p: any) => p.observer_placed !== undefined)
      } : null
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

