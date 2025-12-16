import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch match data from OpenDota
    const response = await fetch(`https://api.opendota.com/api/matches/${id}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const match = await response.json()
    
    // Basic analysis (AI analysis coming soon)
    const analysis = {
      matchId: id,
      duration: match.duration,
      radiantWin: match.radiant_win,
      overview: `Match lasted ${Math.floor(match.duration / 60)} minutes. ${match.radiant_win ? 'Radiant' : 'Dire'} victory.`,
      keyMoments: [
        {
          time: 0,
          event: 'Match started',
          description: 'Game begins',
        },
      ],
      recommendations: [
        'Focus on last hitting in the laning phase',
        'Improve map awareness and vision control',
        'Work on positioning in teamfights',
      ],
      playerPerformance: match.players.map((player: any) => ({
        heroId: player.hero_id,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        gpm: player.gold_per_min,
        xpm: player.xp_per_min,
        rating: player.kills + player.assists > player.deaths * 2 ? 'good' : 'needs improvement',
      })),
    }
    
    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error analyzing match:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}