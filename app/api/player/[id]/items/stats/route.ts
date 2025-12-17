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
  player_slot: number
  radiant_win: boolean
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
        topItems: [],
        underutilizedItems: [],
        overpurchasedItems: [],
        itemEfficiency: []
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
          // Also try to generate name from key if all else fails
          let displayName = item.dname || item.localized_name || item.name
          
          // If no display name, try to generate from key (e.g., "item_blink_dagger" -> "Blink Dagger")
          if (!displayName && key) {
            displayName = key
              .replace(/^item_/, '')
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          }
          
          // Final fallback
          if (!displayName) {
            displayName = `Item ${item.id}`
          }
          
          const internalName = key || item.name || ''
          itemsMap[item.id] = {
            id: item.id,
            name: item.name || item.dname || item.localized_name || displayName,
            localized_name: displayName,
            internal_name: internalName,
            cost: item.cost || 0
          }
        }
      })
    } else {
      console.error('Failed to fetch items constants:', itemsResponse.status, itemsResponse.statusText)
    }

    // Analyze item statistics
    const itemStats: Record<number, { 
      count: number
      wins: number
      totalGold: number
      avgGoldSpent: number
      avgNetWorth: number
    }> = {}

    let totalMatches = 0

    fullMatches.forEach((match: any, idx: number) => {
      if (!match || !match.players) return
      
      const matchData = matches[idx]
      if (!matchData) return

      const player = match.players.find((p: MatchPlayer) => 
        p.account_id?.toString() === id || 
        (p.player_slot === matchData.player_slot && p.hero_id)
      )

      if (!player) return

      totalMatches++
      const won = (player.player_slot < 128 && match.radiant_win) || 
                  (player.player_slot >= 128 && !match.radiant_win)

      const items = [
        player.item_0, player.item_1, player.item_2,
        player.item_3, player.item_4, player.item_5
      ].filter((item: number) => item && item > 0)

      items.forEach((itemId: number) => {
        if (!itemStats[itemId]) {
          itemStats[itemId] = {
            count: 0,
            wins: 0,
            totalGold: 0,
            avgGoldSpent: 0,
            avgNetWorth: 0
          }
        }
        itemStats[itemId].count++
        if (won) itemStats[itemId].wins++
        
        const item = itemsMap[itemId]
        if (item?.cost) {
          itemStats[itemId].totalGold += item.cost
        }
        
        if (player.gold_spent) {
          itemStats[itemId].avgGoldSpent += player.gold_spent
        }
        if (player.net_worth) {
          itemStats[itemId].avgNetWorth += player.net_worth
        }
      })
    })

    // Calculate averages
    Object.keys(itemStats).forEach(itemId => {
      const stats = itemStats[parseInt(itemId)]
      if (stats.count > 0) {
        stats.avgGoldSpent = stats.avgGoldSpent / stats.count
        stats.avgNetWorth = stats.avgNetWorth / stats.count
      }
    })

    // Process top items
    const topItems = Object.entries(itemStats)
      .map(([itemId, stats]) => {
        const item = itemsMap[parseInt(itemId)]
        const winrate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0
        const usageRate = totalMatches > 0 ? (stats.count / totalMatches) * 100 : 0
        return {
          item_id: parseInt(itemId),
          item_name: item?.localized_name || `Item ${itemId}`,
          item_internal_name: item?.internal_name || '',
          frequency: stats.count,
          winrate: parseFloat(winrate.toFixed(1)),
          usageRate: parseFloat(usageRate.toFixed(1)),
          avgGold: stats.totalGold / stats.count,
          avgGoldSpent: parseFloat(stats.avgGoldSpent.toFixed(0)),
          avgNetWorth: parseFloat(stats.avgNetWorth.toFixed(0))
        }
      })
      .sort((a, b) => b.frequency - a.frequency)

    // Identify underutilized items (high winrate but low frequency)
    const underutilizedItems = topItems
      .filter(item => item.frequency >= 2 && item.winrate >= 60 && item.usageRate < 30)
      .sort((a, b) => b.winrate - a.winrate)
      .slice(0, 10)

    // Identify overpurchased items (high frequency but low winrate)
    const overpurchasedItems = topItems
      .filter(item => item.frequency >= 3 && item.winrate < 45 && item.usageRate > 20)
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 10)

    // Item efficiency (winrate vs cost)
    const itemEfficiency = topItems
      .filter(item => item.frequency >= 2)
      .map(item => ({
        ...item,
        efficiency: item.avgGold > 0 ? (item.winrate / (item.avgGold / 1000)) : 0
      }))
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 15)

    return NextResponse.json({
      topItems: topItems.slice(0, 20),
      underutilizedItems,
      overpurchasedItems,
      itemEfficiency
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching item stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

