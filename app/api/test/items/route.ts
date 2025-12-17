import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://api.opendota.com/api/constants/items', {
      next: { revalidate: 0 } // No cache for testing
    })
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: response.status })
    }
    
    const items = await response.json()
    
    // Get sample items (first 10)
    const sampleItems = Object.entries(items).slice(0, 10).map(([key, item]: [string, any]) => ({
      key,
      id: item.id,
      dname: item.dname,
      localized_name: item.localized_name,
      name: item.name,
      qual: item.qual,
      cost: item.cost,
      fullItem: item
    }))
    
    // Check specific problematic items
    const problematicIds = [73, 1, 50, 127, 36, 108]
    const problematicItems = problematicIds.map(id => {
      const found = Object.entries(items).find(([_, item]: [string, any]) => item.id === id)
      if (found) {
        return {
          id,
          key: found[0],
          item: found[1]
        }
      }
      return { id, found: false }
    })
    
    return NextResponse.json({
      totalItems: Object.keys(items).length,
      sampleItems,
      problematicItems,
      item73: Object.entries(items).find(([_, item]: [string, any]) => item.id === 73),
      item1: Object.entries(items).find(([_, item]: [string, any]) => item.id === 1),
      item50: Object.entries(items).find(([_, item]: [string, any]) => item.id === 50),
    })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

