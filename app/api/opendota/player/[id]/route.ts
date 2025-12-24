import { NextRequest, NextResponse } from 'next/server'
import { fetchOpenDota, getCached, setCached } from '@/lib/opendota'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check cache first
    const cacheKey = `player:${id}`
    const cached = getCached<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    }

    const data = await fetchOpenDota<any>(`/players/${id}`)
    
    // Cache for 60 seconds (match list changes frequently)
    setCached(cacheKey, data, 60)
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}