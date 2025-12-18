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
    const itemsMap: Record<number, { id: number; name: string; localized_name: string; internal_name: string; cost?: number }> = {}
    const itemNameToIdMap: Record<string, number> = {} // Map from internal name to ID
    if (itemsResponse.ok) {
      const items = await itemsResponse.json()
      // OpenDota returns items as an object where keys are item names (e.g., "item_blink") and values are item data
      // Each item has: id, name, dname (display name), qual, cost, etc.
      Object.entries(items).forEach(([key, item]: [string, any]) => {
        if (item.id !== undefined && item.id !== null && item.id !== 0) {
          // Debug: log structure of first few items
          if (Object.keys(itemsMap).length < 3) {
            console.log(`Item ${item.id} structure:`, {
              key,
              id: item.id,
              dname: item.dname,
              localized_name: item.localized_name,
              name: item.name,
              qual: item.qual,
              cost: item.cost
            })
          }
          
          // OpenDota uses 'dname' for display name, but also check 'localized_name' and 'name'
          // Some items might not have dname, so we need to check all fields
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
          
          // Internal name is the key (e.g., "item_blink") or fallback to item.name
          const internalName = key || item.name || ''
          
          itemsMap[item.id] = {
            id: item.id,
            name: item.name || item.dname || item.localized_name || displayName,
            localized_name: displayName,
            internal_name: internalName,
            cost: item.cost || 0
          }
          
          if (internalName) {
            itemNameToIdMap[internalName] = item.id
          }
        }
      })
      
      // Log sample items for debugging
      const sampleItems = Object.values(itemsMap).slice(0, 10)
      console.log('Sample items mapped:', sampleItems.map(i => ({ 
        id: i.id, 
        name: i.localized_name, 
        internal: i.internal_name,
        hasName: !!i.localized_name && i.localized_name !== `Item ${i.id}`
      })))
      console.log(`Items map populated: ${Object.keys(itemsMap).length} items`)
      
      // Check for specific problematic items (73, 1, 50, etc.)
      const problematicIds = [73, 1, 50, 127, 36, 108]
      problematicIds.forEach(id => {
        const item = itemsMap[id]
        if (item) {
          console.log(`Item ${id}:`, { name: item.localized_name, internal: item.internal_name })
        } else {
          console.warn(`Item ${id} NOT FOUND in itemsMap!`)
        }
      })
    } else {
      console.error('Failed to fetch items constants:', itemsResponse.status, itemsResponse.statusText)
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

      // Find player in match - try by account_id first, then by player_slot (like advanced-stats)
      const player = match.players.find((p: MatchPlayer) => 
        p.account_id?.toString() === id
      ) || match.players.find((p: MatchPlayer) => 
        p.player_slot === matchData.player_slot
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
      // Create a copy before sorting to preserve original order in buildPatterns
      const sortedItems = [...items].sort((a, b) => a - b)
      const buildKey = sortedItems.join(',')
      if (!buildPatterns[buildKey]) {
        buildPatterns[buildKey] = { count: 0, wins: 0, items: items } // Keep original order
      }
      buildPatterns[buildKey].count++
      if (won) buildPatterns[buildKey].wins++
    })

    // Process top items
    const missingItems: number[] = []
    const topItems = Object.entries(itemFrequency)
      .map(([itemId, stats]) => {
        const itemIdNum = parseInt(itemId)
        const item = itemsMap[itemIdNum]
        if (!item) {
          missingItems.push(itemIdNum)
          console.warn(`Item ${itemIdNum} not found in itemsMap. Total items in map: ${Object.keys(itemsMap).length}`)
        } else {
          // Debug: log if item name is still "Item X"
          if (item.localized_name === `Item ${itemIdNum}`) {
            console.warn(`Item ${itemIdNum} has fallback name. Item data:`, {
              id: item.id,
              name: item.name,
              localized_name: item.localized_name,
              internal_name: item.internal_name
            })
          }
        }
        const winrate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0
        const result = {
          item_id: itemIdNum,
          item_name: item?.localized_name || `Item ${itemIdNum}`,
          item_internal_name: item?.internal_name || '',
          frequency: stats.count,
          winrate: parseFloat(winrate.toFixed(1)),
          avgGold: stats.count > 0 ? stats.totalGold / stats.count : 0,
          usageRate: totalMatches > 0 ? (stats.count / totalMatches) * 100 : 0
        }
        // Log if internal_name is missing
        if (!result.item_internal_name && item) {
          console.warn(`Item ${itemIdNum} (${result.item_name}) missing internal_name`)
        }
        // Log if name is still fallback
        if (result.item_name === `Item ${itemIdNum}` && item) {
          console.warn(`Item ${itemIdNum} using fallback name. Available fields:`, Object.keys(item))
        }
        return result
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)
    
    if (missingItems.length > 0) {
      console.warn(`Missing items in map (${missingItems.length} total): ${missingItems.slice(0, 10).join(', ')}${missingItems.length > 10 ? '...' : ''}`)
    }

    // Process build patterns (top 10 most common)
    const topBuildPatterns = Object.entries(buildPatterns)
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
          usageRate: totalMatches > 0 ? (pattern.count / totalMatches) * 100 : 0
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
