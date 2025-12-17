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

    // Priority 1: Check if purchase_log is available in match object (most accurate)
    // Priority 2: Fallback to match log extraction if needed
    let matchLog: any[] = []
    let hasPurchaseLog = false
    
    // Check if any player has purchase_log
    if (players.length > 0 && players.some((p: any) => p.purchase_log && Array.isArray(p.purchase_log))) {
      hasPurchaseLog = true
      const playerWithLog = players.find((p: any) => p.purchase_log && Array.isArray(p.purchase_log) && p.purchase_log.length > 0)
      if (playerWithLog) {
        console.log(`[Item Timing] Using purchase_log from match object. Sample entry:`, JSON.stringify(playerWithLog.purchase_log[0]))
      } else {
        console.log('[Item Timing] purchase_log exists but is empty')
      }
    } else {
      // Fallback: Fetch match log for item purchases
      try {
        const logResponse = await fetch(`https://api.opendota.com/api/matches/${id}/log`, {
          next: { revalidate: 3600 }
        })
        if (logResponse.ok) {
          const logData = await logResponse.json()
          if (Array.isArray(logData)) {
            matchLog = logData
            console.log('[Item Timing] Using match log as fallback')
          }
        }
      } catch (err) {
        console.log('[Item Timing] Match log not available')
      }
    }

    // Fetch item constants
    // IMPORTANT: OpenDota returns items as object where KEYS are internal names (e.g., "item_blink", "branches")
    // and VALUES are objects with id, dname, localized_name, name, cost, etc.
    let itemsMap: Record<number, any> = {} // Map by item.id
    let itemsByNameMap: Record<string, number> = {} // Map from internal name (key) to item ID
    try {
      const itemsResponse = await fetch('https://api.opendota.com/api/constants/items', {
        next: { revalidate: 86400 }
      })
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        
        // OpenDota structure: { "item_blink": { id: 1, dname: "Blink Dagger", ... }, "branches": { id: 16, ... }, ... }
        Object.entries(itemsData).forEach(([key, item]: [string, any]) => {
          if (item && item.id !== undefined && item.id !== null && item.id !== 0) {
            // Map by item ID
            itemsMap[item.id] = item
            
            // Map by internal name (the key itself)
            const internalName = key.toLowerCase().trim()
            itemsByNameMap[internalName] = item.id
            
            // Also map without "item_" prefix if present (e.g., "item_blink" -> "blink")
            if (internalName.startsWith('item_')) {
              itemsByNameMap[internalName.substring(5)] = item.id // Remove "item_" prefix
            }
            
            // Map by any name fields as fallback
            if (item.name) {
              itemsByNameMap[item.name.toLowerCase()] = item.id
            }
          }
        })
        
        console.log(`[Item Timing] Loaded ${Object.keys(itemsMap).length} items, ${Object.keys(itemsByNameMap).length} name mappings`)
        console.log(`[Item Timing] Sample mappings: branches -> ${itemsByNameMap['branches']}, item_blink -> ${itemsByNameMap['item_blink']}`)
      }
    } catch (err) {
      console.log('Failed to fetch items constants:', err)
    }

    // Helper to get item name
    const getItemName = (itemId: number) => {
      if (!itemId || itemId === 0) return null
      const item = itemsMap[itemId]
      if (!item) {
        console.log(`[Item Timing] Item ${itemId} not found in itemsMap. Map size: ${Object.keys(itemsMap).length}`)
        return `Item ${itemId}`
      }
      const name = item.dname || item.localized_name || item.name || `Item ${itemId}`
      if (name === `Item ${itemId}`) {
        console.log(`[Item Timing] Item ${itemId} has no name. Item data:`, JSON.stringify(item).substring(0, 200))
      }
      return name
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
      // Estimate purchase times based on item cost, order, and player's gold progression
      // This is an approximation - real data would come from replay parsing
      const gpm = player.gold_per_min || 400
      const goldPerSecond = gpm / 60
      const startingGold = 600
      
      // Sort items by cost (cheaper items first, as they're typically bought earlier)
      const sortedItems = [...items].sort((a, b) => {
        const costA = getItemCost(a.id)
        const costB = getItemCost(b.id)
        return costA - costB
      })
      
      // Track cumulative gold spent to estimate purchase order
      let cumulativeGold = startingGold
      const purchaseTimes = new Map<number, number>()
      
      // Estimate purchase times progressively
      sortedItems.forEach((item) => {
        const itemCost = getItemCost(item.id)
        let purchaseTime = 0
        
        // Priority 1: Use purchase_log from match object (most accurate)
        if (hasPurchaseLog && player.purchase_log && Array.isArray(player.purchase_log)) {
          // purchase_log structure: [{ time: number, key: string }]
          // key is the INTERNAL NAME (e.g., "branches", "item_tango") not the ID
          const purchaseEntry = player.purchase_log.find((entry: any) => {
            if (!entry || !entry.key) return false
            
            const entryKey = entry.key.toString().toLowerCase().trim()
            
            // Strategy 1: Map internal name to item ID using itemsByNameMap
            // This is the most reliable since purchase_log uses internal names
            const mappedItemId = itemsByNameMap[entryKey] || itemsByNameMap[`item_${entryKey}`]
            if (mappedItemId === item.id) {
              return true
            }
            
            // Strategy 2: Direct item ID match (if key is numeric)
            const itemIdStr = item.id.toString()
            if (entryKey === itemIdStr || entryKey.includes(itemIdStr)) {
              return true
            }
            
            // Strategy 3: Match by item name (if we have item name)
            const itemName = getItemName(item.id)
            if (itemName) {
              // Try matching by internal name format (e.g., "item_tango")
              const itemInternalName = itemName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
              if (entryKey === itemInternalName || entryKey === `item_${itemInternalName}` || entryKey.includes(itemInternalName)) {
                return true
              }
              
              // Try matching by localized name
              const itemLocalizedName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '')
              if (entryKey.includes(itemLocalizedName)) {
                return true
              }
            }
            
            return false
          })
          
          if (purchaseEntry && purchaseEntry.time !== undefined && purchaseEntry.time > 0) {
            purchaseTime = Math.max(0, purchaseEntry.time) // Ensure non-negative (handle negative times)
            console.log(`[Item Timing] Found purchase_log entry for item ${item.id} (key: ${purchaseEntry.key}) at ${purchaseTime}s`)
          }
        }
        
        // Priority 2: Try to find purchase event in log (if purchase_log not available)
        if (purchaseTime === 0 && matchLog.length > 0) {
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
          }
        }
        
        // Priority 3: Estimate if no real data available
        if (purchaseTime === 0) {
          // Estimate: calculate when player would have enough gold
          // More realistic: consider cumulative spending and item cost
          if (cumulativeGold >= itemCost) {
            // Can afford immediately (early game items)
            purchaseTime = Math.max(0, (itemCost - startingGold) / Math.max(1, goldPerSecond))
          } else {
            // Need to farm more gold
            const goldNeeded = itemCost - cumulativeGold
            const timeToFarm = goldNeeded / Math.max(1, goldPerSecond)
            // Base time on previous item + time to farm
            const previousTime = purchaseTimes.size > 0 
              ? Math.max(...Array.from(purchaseTimes.values()))
              : 0
            purchaseTime = previousTime + timeToFarm
          }
          
          // Cap at match duration
          purchaseTime = Math.min(duration, Math.max(0, purchaseTime))
          
          // Update cumulative gold (assume player spends gold as they earn it)
          cumulativeGold = Math.max(cumulativeGold, itemCost)
        }
        
        purchaseTimes.set(item.id, purchaseTime)
      })
      
      // Map items to purchase times (preserve original order)
      const itemTimings = items.map((item) => {
        const itemName = getItemName(item.id)
        const itemCost = getItemCost(item.id)
        const purchaseTime = purchaseTimes.get(item.id) || 0

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

