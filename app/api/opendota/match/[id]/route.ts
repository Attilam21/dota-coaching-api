import { NextRequest, NextResponse } from 'next/server'
import { fetchOpenDota, getCached, setCached } from '@/lib/opendota'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check cache first (match details don't change)
    const cacheKey = `match:${id}`
    const cached = getCached<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    }

    const data = await fetchOpenDota<any>(`/matches/${id}`)
    
    // Cache for 6 hours (match details are static)
    setCached(cacheKey, data, 21600)
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}