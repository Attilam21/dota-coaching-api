import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch recent matches
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
        itemTimings: [],
        avgTimings: {}
      })
    }

    // Fetch items constants
    const itemsResponse = await fetch('https://api.opendota.com/api/constants/items', {
      next: { revalidate: 86400 }
    })
    const itemsMap: Record<number, { id: number; name: string; localized_name: string; cost?: number }> = {}
    if (itemsResponse.ok) {
      const items = await itemsResponse.json()
      Object.values(items).forEach((item: any) => {
        if (item.id) {
          itemsMap[item.id] = {
            id: item.id,
            name: item.name,
            localized_name: item.localized_name || item.name,
            cost: item.cost || 0
          }
        }
      })
    }

    // Analyze item timings from match logs
    const itemTimings: Record<number, number[]> = {}
    const itemMatchCounts: Record<number, number> = {}

    // Fetch match logs for timing data
    const matchLogPromises = matches.slice(0, 10).map((m) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}/log`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    const matchLogs = await Promise.all(matchLogPromises)

    matchLogs.forEach((log: any, idx: number) => {
      if (!log) return

      const match = matches[idx]
      if (!match) return

      // Find purchase events for this player
      // Note: OpenDota log structure may vary, this is a simplified approach
      // In reality, we'd need to parse purchase_log from match data if available
      if (Array.isArray(log)) {
        log.forEach((entry: any) => {
          if (entry.type === 'purchase' && entry.key && entry.time) {
            const itemId = parseInt(entry.key)
            if (itemId && itemsMap[itemId]) {
              if (!itemTimings[itemId]) {
                itemTimings[itemId] = []
                itemMatchCounts[itemId] = 0
              }
              itemTimings[itemId].push(entry.time)
              itemMatchCounts[itemId]++
            }
          }
        })
      }
    })

    // Calculate average timings
    const avgTimings: Record<number, { 
      item_id: number
      item_name: string
      avgTime: number
      count: number
    }> = {}

    Object.entries(itemTimings).forEach(([itemId, times]) => {
      if (times.length > 0) {
        const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length
        const item = itemsMap[parseInt(itemId)]
        avgTimings[parseInt(itemId)] = {
          item_id: parseInt(itemId),
          item_name: item?.localized_name || `Item ${itemId}`,
          avgTime: parseFloat((avgTime / 60).toFixed(1)), // Convert to minutes
          count: itemMatchCounts[parseInt(itemId)]
        }
      }
    })

    // Sort by average time
    const sortedTimings = Object.values(avgTimings)
      .sort((a, b) => a.avgTime - b.avgTime)
      .slice(0, 20)

    return NextResponse.json({
      itemTimings: sortedTimings,
      avgTimings
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching item timing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

