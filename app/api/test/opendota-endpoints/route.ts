import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint per verificare quali endpoint OpenDota sono disponibili
 * per una partita specifica
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('id') || '8608995757' // Match ID di test
    
    const endpoints = [
      { name: 'Match Base', url: `/api/matches/${matchId}` },
      { name: 'Teamfights', url: `/api/matches/${matchId}/teamfights` },
      { name: 'Log', url: `/api/matches/${matchId}/log` },
      { name: 'Gold/XP Graph', url: `/api/matches/${matchId}/goldXpGraph` },
      { name: 'Purchases', url: `/api/matches/${matchId}/purchases` },
      { name: 'Benchmarks', url: `/api/matches/${matchId}/benchmarks` },
      { name: 'Draft Timings', url: `/api/matches/${matchId}/draftTimings` },
      { name: 'Wardmap', url: `/api/matches/${matchId}/wardmap` },
      { name: 'Laning', url: `/api/matches/${matchId}/laning` },
    ]
    
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await fetch(`https://api.opendota.com${endpoint.url}`, {
            next: { revalidate: 0 }
          })
          
          const status = response.status
          const ok = response.ok
          let data = null
          let dataType = null
          let dataKeys: string[] = []
          let sampleSize = null
          
          if (ok) {
            try {
              data = await response.json()
              dataType = Array.isArray(data) ? 'array' : typeof data
              
              if (Array.isArray(data)) {
                sampleSize = data.length
                if (data.length > 0) {
                  dataKeys = Object.keys(data[0])
                }
              } else if (typeof data === 'object' && data !== null) {
                dataKeys = Object.keys(data)
              }
            } catch (e) {
              // Response is not JSON
              const text = await response.text()
              dataType = 'text'
              sampleSize = text.length
            }
          }
          
          return {
            name: endpoint.name,
            url: endpoint.url,
            status,
            ok,
            available: ok,
            dataType,
            dataKeys: dataKeys.slice(0, 10), // First 10 keys
            sampleSize,
            // Sample first item/object for inspection
            sample: Array.isArray(data) && data.length > 0
              ? data[0]
              : (typeof data === 'object' && data !== null && !Array.isArray(data))
              ? Object.fromEntries(Object.entries(data).slice(0, 5)) // First 5 entries
              : null
          }
        } catch (error: any) {
          return {
            name: endpoint.name,
            url: endpoint.url,
            status: 'error',
            ok: false,
            available: false,
            error: error.message
          }
        }
      })
    )
    
    return NextResponse.json({
      match_id: matchId,
      endpoints: results,
      summary: {
        available: results.filter(r => r.available).length,
        total: results.length,
        availableEndpoints: results.filter(r => r.available).map(r => r.name)
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('Error testing endpoints:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

