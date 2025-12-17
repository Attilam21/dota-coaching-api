import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch peers from OpenDota
    const response = await fetch(`https://api.opendota.com/api/players/${id}/peers`, {
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch peers' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching peers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

