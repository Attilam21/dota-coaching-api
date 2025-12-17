import { NextRequest, NextResponse } from 'next/server'

interface MatchPlayer {
  account_id: number
  hero_id: number
  item_0: number
  item_1: number
  item_2: number
  item_3: number
  item_4: number
  item_5: number
  backpack_0?: number
  backpack_1?: number
  backpack_2?: number
  player_slot: number
  radiant_win: boolean
  win?: boolean
  gold_spent?: number
  net_worth?: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; heroId: string }> }
) {
  try {
    const { id, heroId } = await params
    
    // Fetch matches for this hero
    const matchesResponse = await fetch(`https://api.opendota.com/api/players/${id}/matches?hero_id=${heroId}&limit=20`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matches: Array<{ match_id: number; player_slot: number; radiant_win: boolean }> = await matchesResponse.json()
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        hero_id: parseInt(heroId),
        totalMatches: 0,
        topBuilds: [],
        topItems: [],
        buildWinrates: []
      })
    }

    // Fetch full match details
    const fullMatchesPromises = matches.map((m) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    const fullMatches = await Promise.all(fullMatchesPromises)

    // Fetch items constants
    const itemsResponse = await fetch('https://api.opendota.com/api/constants/items', {
      next: { revalidate: 86400 }
    })
    const itemsMap: Record<number, { id: number; name: string; localized_name: string; internal_name: string; cost?: number }> = {}
    if (itemsResponse.ok) {
      const items = await itemsResponse.json()
      // OpenDota returns items as an object where keys are item names (e.g., "item_blink") and values are item data
      // Each item has: id, name, dname (display name), qual, cost, etc.
      Object.entries(items).forEach(([key, item]: [string, any]) => {
        if (item.id !== undefined && item.id !== null && item.id !== 0) {
          // OpenDota uses 'dname' for display name, but also check 'localized_name' and 'name'
          const displayName = item.dname || item.localized_name || item.name || `Item ${item.id}`
          const internalName = key || item.name || ''
          itemsMap[item.id] = {
            id: item.id,
            name: item.name || item.dname || item.localized_name || '',
            localized_name: displayName,
            internal_name: internalName,
            cost: item.cost || 0
          }
        }
      })
      console.log(`Items map populated: ${Object.keys(itemsMap).length} items`)
    } else {
      console.error('Failed to fetch items constants:', itemsResponse.status, itemsResponse.statusText)
    }

    // Fetch hero info
    const heroesResponse = await fetch('https://api.opendota.com/api/heroes', {
      next: { revalidate: 86400 }
    })
    let heroName = `Hero ${heroId}`
    if (heroesResponse.ok) {
      const heroes = await heroesResponse.json()
      const hero = heroes.find((h: any) => h.id === parseInt(heroId))
      if (hero) {
        heroName = hero.localized_name || hero.name
      }
    }

    // Analyze builds for this hero
    const itemFrequency: Record<number, { count: number; wins: number }> = {}
    const buildPatterns: Record<string, { count: number; wins: number; items: number[] }> = {}

    fullMatches.forEach((match: any, idx: number) => {
      if (!match || !match.players) return
      
      const matchData = matches[idx]
      if (!matchData) return

      // Find player in match
      const player = match.players.find((p: MatchPlayer) => 
        (p.account_id?.toString() === id || p.player_slot === matchData.player_slot) && 
        p.hero_id === parseInt(heroId)
      )

      if (!player) return

      const won = (player.player_slot < 128 && match.radiant_win) || 
                  (player.player_slot >= 128 && !match.radiant_win)

      // Extract items
      const items = [
        player.item_0, player.item_1, player.item_2,
        player.item_3, player.item_4, player.item_5
      ].filter((item: number) => item && item > 0)

      // Track item frequency
      items.forEach((itemId: number) => {
        if (!itemFrequency[itemId]) {
          itemFrequency[itemId] = { count: 0, wins: 0 }
        }
        itemFrequency[itemId].count++
        if (won) itemFrequency[itemId].wins++
      })

      // Track build patterns
      // Create a copy before sorting to preserve original order in buildPatterns
      const sortedItems = [...items].sort((a, b) => a - b)
      const buildKey = sortedItems.join(',')
      if (!buildPatterns[buildKey]) {
        buildPatterns[buildKey] = { count: 0, wins: 0, items: items } // Keep original order
      }
      buildPatterns[buildKey].count++
      if (won) buildPatterns[buildKey].wins++
    })

    // Process top items for this hero
    const topItems = Object.entries(itemFrequency)
      .map(([itemId, stats]) => {
        const item = itemsMap[parseInt(itemId)]
        const winrate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0
        return {
          item_id: parseInt(itemId),
          item_name: item?.localized_name || `Item ${itemId}`,
          item_internal_name: item?.internal_name || '',
          frequency: stats.count,
          winrate: parseFloat(winrate.toFixed(1)),
          usageRate: (stats.count / fullMatches.filter(m => m).length) * 100
        }
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15)

    // Process build patterns (all builds, sorted by winrate)
    const allBuilds = Object.entries(buildPatterns)
      .map(([key, pattern]) => {
        const winrate = pattern.count > 0 ? (pattern.wins / pattern.count) * 100 : 0
        const itemDetails = pattern.items.map(id => {
          const item = itemsMap[id]
          return {
            id,
            name: item?.localized_name || `Item ${id}`,
            internal_name: item?.internal_name || ''
          }
        })
        return {
          items: pattern.items,
          itemNames: itemDetails.map(i => i.name),
          itemDetails, // Include full details for frontend
          frequency: pattern.count,
          winrate: parseFloat(winrate.toFixed(1)),
          usageRate: (pattern.count / fullMatches.filter(m => m).length) * 100
        }
      })
      .sort((a, b) => {
        // Sort by winrate first (if frequency >= 2), then by frequency
        if (a.frequency >= 2 && b.frequency >= 2) {
          return b.winrate - a.winrate
        }
        return b.frequency - a.frequency
      })

    // Top builds by frequency
    const topBuilds = allBuilds.slice(0, 10)

    // Build winrates (only builds with frequency >= 2)
    const buildWinrates = allBuilds
      .filter(b => b.frequency >= 2)
      .slice(0, 10)

    return NextResponse.json({
      hero_id: parseInt(heroId),
      hero_name: heroName,
      totalMatches: fullMatches.filter(m => m).length,
      topBuilds,
      topItems,
      buildWinrates
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching hero builds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

