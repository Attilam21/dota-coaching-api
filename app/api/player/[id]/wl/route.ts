import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch win/loss from OpenDota
    const response = await fetch(`https://api.opendota.com/api/players/${id}/wl`, {
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch win/loss' },
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
    console.error('Error fetching win/loss:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

