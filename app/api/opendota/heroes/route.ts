import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://api.opendota.com/api/heroes', {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch heroes' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
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