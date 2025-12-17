import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per analisi item timing di una partita
 * Estrae quando ogni item è stato acquistato e confronta con timing ottimali
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch match data
    const matchResponse = await fetch(`https://api.opendota.com/api/matches/${id}`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const match = await matchResponse.json()
    const duration = match.duration || 0
    const players = match.players || []

    // Fetch match log for item purchases
    let matchLog: any[] = []
    try {
      const logResponse = await fetch(`https://api.opendota.com/api/matches/${id}/log`, {
        next: { revalidate: 3600 }
      })
      if (logResponse.ok) {
        const logData = await logResponse.json()
        if (Array.isArray(logData)) {
          matchLog = logData
        }
      }
    } catch (err) {
      console.log('Match log not available')
    }

    // Fetch item constants
    let itemsMap: Record<number, any> = {}
    try {
      const itemsResponse = await fetch('https://api.opendota.com/api/constants/items', {
        next: { revalidate: 86400 }
      })
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        itemsMap = itemsData
      }
    } catch (err) {
      console.log('Failed to fetch items constants')
    }

    // Helper to get item name
    const getItemName = (itemId: number) => {
      if (!itemId || itemId === 0) return null
      const item = itemsMap[itemId]
      if (!item) return `Item ${itemId}`
      return item.dname || item.localized_name || item.name || `Item ${itemId}`
    }

    // Helper to get item cost
    const getItemCost = (itemId: number) => {
      if (!itemId || itemId === 0) return 0
      const item = itemsMap[itemId]
      return item?.cost || 0
    }

    // Analyze item purchases per player
    const playerItemTimings = players.map((player: any) => {
      const playerSlot = player.player_slot
      const accountId = player.account_id

      // Get items from player data
      const items = [
        { id: player.item_0, slot: 0 },
        { id: player.item_1, slot: 1 },
        { id: player.item_2, slot: 2 },
        { id: player.item_3, slot: 3 },
        { id: player.item_4, slot: 4 },
        { id: player.item_5, slot: 5 },
        { id: player.backpack_0, slot: 6 },
        { id: player.backpack_1, slot: 7 },
        { id: player.backpack_2, slot: 8 },
      ].filter(item => item.id && item.id > 0)

      // OpenDota log doesn't reliably contain item purchase events
      // Instead, estimate purchase times based on item cost and player's gold progression
      // This is an approximation - real data would come from replay parsing
      const gpm = player.gold_per_min || 400
      const goldPerSecond = gpm / 60
      const startingGold = 600
      
      // Map items to purchase times
      const itemTimings = items.map((item) => {
        const itemName = getItemName(item.id)
        const itemCost = getItemCost(item.id)
        
        // Try to find purchase event in log (OpenDota may not have this)
        let purchaseTime = 0
        const itemPurchaseEvents = matchLog.filter((entry: any) => {
          const entryPlayerSlot = entry.player_slot !== undefined 
            ? entry.player_slot 
            : (entry.key ? parseInt(entry.key) : null)
          return entryPlayerSlot === playerSlot && 
                 entry.time > 0 &&
                 (entry.type?.includes('ITEM') || 
                  entry.key?.toString().includes('item') ||
                  entry.key?.toString().includes(item.id.toString()))
        })
        
        const purchaseEvent = itemPurchaseEvents.find((e: any) => {
          const key = e.key?.toString() || ''
          return key.includes(item.id.toString()) || e.item_id === item.id
        })

        if (purchaseEvent && purchaseEvent.time) {
          purchaseTime = purchaseEvent.time
        } else {
          // Estimate: calculate when player would have enough gold
          // Starting gold + (time * goldPerSecond) >= itemCost
          // time >= (itemCost - startingGold) / goldPerSecond
          purchaseTime = Math.max(0, Math.min(duration, (itemCost - startingGold) / Math.max(1, goldPerSecond)))
        }

        // Define optimal timings for common items (in seconds)
        const optimalTimings: Record<string, number> = {
          'Boots of Speed': 2 * 60, // 2 min
          'Power Treads': 8 * 60,   // 8 min
          'Phase Boots': 8 * 60,    // 8 min
          'Arcane Boots': 6 * 60,    // 6 min
          'Tranquil Boots': 4 * 60,   // 4 min
          'Magic Wand': 3 * 60,      // 3 min
          'Bracer': 4 * 60,          // 4 min
          'Wraith Band': 4 * 60,     // 4 min
          'Null Talisman': 4 * 60,   // 4 min
          'Blink Dagger': 12 * 60,   // 12 min
          'Force Staff': 15 * 60,    // 15 min
          'Glimmer Cape': 18 * 60,   // 18 min
          'Black King Bar': 20 * 60, // 20 min
          'Aghanim\'s Scepter': 25 * 60, // 25 min
        }

        const optimalTime = optimalTimings[itemName || ''] || null
        const isOnTime = optimalTime ? Math.abs(purchaseTime - optimalTime) <= (optimalTime * 0.3) : null // Within 30% of optimal
        const isEarly = optimalTime ? purchaseTime < optimalTime * 0.7 : null
        const isLate = optimalTime ? purchaseTime > optimalTime * 1.3 : null

        return {
          itemId: item.id,
          itemName,
          itemCost,
          slot: item.slot,
          purchaseTime,
          purchaseMinute: Math.floor(purchaseTime / 60),
          purchaseSecond: Math.floor(purchaseTime % 60),
          optimalTime,
          optimalMinute: optimalTime ? Math.floor(optimalTime / 60) : null,
          isOnTime,
          isEarly,
          isLate,
          timingRating: optimalTime 
            ? (isOnTime ? 'on_time' : isEarly ? 'early' : isLate ? 'late' : 'unknown')
            : 'unknown'
        }
      })

      // Sort by purchase time
      itemTimings.sort((a, b) => a.purchaseTime - b.purchaseTime)

      return {
        account_id: accountId,
        player_slot: playerSlot,
        hero_id: player.hero_id,
        items: itemTimings,
        totalItems: itemTimings.length,
        avgItemTiming: itemTimings.length > 0 
          ? itemTimings.reduce((acc, item) => acc + item.purchaseTime, 0) / itemTimings.length 
          : 0
      }
    })

    return NextResponse.json({
      match_id: parseInt(id),
      duration,
      playerItemTimings
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
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

