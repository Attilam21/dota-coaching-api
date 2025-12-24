import { NextResponse } from 'next/server'
import { fetchOpenDota, getCached, setCached } from '@/lib/opendota'

export async function GET() {
  try {
    // Check cache first (heroes list changes rarely)
    const cacheKey = 'heroes:all'
    const cached = getCached<any[]>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      })
    }

    const data = await fetchOpenDota<any[]>('/heroes')
    
    // Cache for 24 hours (heroes list is very stable)
    setCached(cacheKey, data, 86400)
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Error fetching heroes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}