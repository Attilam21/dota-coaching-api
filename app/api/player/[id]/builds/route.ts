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

    const matches: Array<{ match_id: number; player_slot: number; radiant_win: boolean }> = await matchesResponse.json()
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        overall: {
          totalMatches: 0,
          totalItems: 0,
          avgItemsPerMatch: 0
        },
        topItems: [],
        itemCategories: {},
        buildPatterns: []
      })
    }

    // Fetch full match details for all matches
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

    // Analyze builds from matches
    const itemFrequency: Record<number, { count: number; wins: number; totalGold: number }> = {}
    const buildPatterns: Record<string, { count: number; wins: number; items: number[] }> = {}
    const itemCategories: Record<string, number> = {
      'Starting Items': 0,
      'Early Game': 0,
      'Mid Game': 0,
      'Late Game': 0,
      'Consumables': 0,
      'Neutral Items': 0
    }

    let totalMatches = 0
    let totalItems = 0

    fullMatches.forEach((match: any, idx: number) => {
      if (!match || !match.players) return
      
      const matchData = matches[idx]
      if (!matchData) return

      // Find player in match
      const player = match.players.find((p: MatchPlayer) => 
        p.account_id?.toString() === id || 
        (p.player_slot === matchData.player_slot && p.hero_id)
      )

      if (!player) return

      totalMatches++
      const won = (player.player_slot < 128 && match.radiant_win) || 
                  (player.player_slot >= 128 && !match.radiant_win)

      // Extract items
      const items = [
        player.item_0, player.item_1, player.item_2,
        player.item_3, player.item_4, player.item_5
      ].filter((item: number) => item && item > 0)

      totalItems += items.length

      // Track item frequency
      items.forEach((itemId: number) => {
        if (!itemFrequency[itemId]) {
          itemFrequency[itemId] = { count: 0, wins: 0, totalGold: 0 }
        }
        itemFrequency[itemId].count++
        if (won) itemFrequency[itemId].wins++
        const item = itemsMap[itemId]
        if (item?.cost) {
          itemFrequency[itemId].totalGold += item.cost
        }
      })

      // Track build patterns (sorted item IDs as key)
      const buildKey = items.sort((a, b) => a - b).join(',')
      if (!buildPatterns[buildKey]) {
        buildPatterns[buildKey] = { count: 0, wins: 0, items: items }
      }
      buildPatterns[buildKey].count++
      if (won) buildPatterns[buildKey].wins++
    })

    // Process top items
    const topItems = Object.entries(itemFrequency)
      .map(([itemId, stats]) => {
        const item = itemsMap[parseInt(itemId)]
        const winrate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0
        return {
          item_id: parseInt(itemId),
          item_name: item?.localized_name || `Item ${itemId}`,
          frequency: stats.count,
          winrate: parseFloat(winrate.toFixed(1)),
          avgGold: stats.totalGold / stats.count,
          usageRate: (stats.count / totalMatches) * 100
        }
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)

    // Process build patterns (top 10 most common)
    const topBuildPatterns = Object.entries(buildPatterns)
      .map(([key, pattern]) => {
        const winrate = pattern.count > 0 ? (pattern.wins / pattern.count) * 100 : 0
        const itemNames = pattern.items.map(id => itemsMap[id]?.localized_name || `Item ${id}`)
        return {
          items: pattern.items,
          itemNames,
          frequency: pattern.count,
          winrate: parseFloat(winrate.toFixed(1)),
          usageRate: (pattern.count / totalMatches) * 100
        }
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)

    return NextResponse.json({
      overall: {
        totalMatches,
        totalItems,
        avgItemsPerMatch: totalMatches > 0 ? (totalItems / totalMatches).toFixed(1) : '0'
      },
      topItems,
      itemCategories,
      buildPatterns: topBuildPatterns
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching builds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

