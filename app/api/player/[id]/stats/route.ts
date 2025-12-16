import { NextRequest, NextResponse } from 'next/server'

interface OpenDotaMatch {
  match_id: number
  player_slot: number
  radiant_win: boolean
  kills: number
  deaths: number
  assists: number
  gold_per_min?: number
  xp_per_min?: number
  start_time: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch recent matches
    const matchesResponse = await fetch(`https://api.opendota.com/api/players/${id}/matches?limit=10`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matches: OpenDotaMatch[] = await matchesResponse.json()
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        matches: [],
        stats: null
      })
    }

    // Calculate statistics
    const recent5 = matches.slice(0, 5)
    const recent10 = matches.slice(0, 10)

    // Winrate calculations
    const wins5 = recent5.filter((m) => 
      (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
    ).length
    const wins10 = recent10.filter((m) => 
      (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
    ).length
    
    const winrate5 = (wins5 / recent5.length) * 100
    const winrate10 = (wins10 / recent10.length) * 100

    // KDA calculations
    const kda5 = recent5.reduce((acc, m) => {
      const kda = (m.kills + m.assists) / Math.max(m.deaths, 1)
      return acc + kda
    }, 0) / recent5.length

    const kda10 = recent10.reduce((acc, m) => {
      const kda = (m.kills + m.assists) / Math.max(m.deaths, 1)
      return acc + kda
    }, 0) / recent10.length

    // GPM/XPM calculations
    const gpm5 = recent5.reduce((acc, m) => acc + (m.gold_per_min || 0), 0) / recent5.length
    const gpm10 = recent10.reduce((acc, m) => acc + (m.gold_per_min || 0), 0) / recent10.length
    
    const xpm5 = recent5.reduce((acc, m) => acc + (m.xp_per_min || 0), 0) / recent5.length
    const xpm10 = recent10.reduce((acc, m) => acc + (m.xp_per_min || 0), 0) / recent10.length

    const stats = {
      winrate: {
        last5: winrate5,
        last10: winrate10,
        delta: winrate5 - winrate10,
      },
      kda: {
        last5: kda5,
        last10: kda10,
        delta: kda5 - kda10,
      },
      farm: {
        gpm: { last5: gpm5, last10: gpm10 },
        xpm: { last5: xpm5, last10: xpm10 },
      },
      matches: recent10.map((m) => ({
        match_id: m.match_id,
        win: (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win),
        kda: (m.kills + m.assists) / Math.max(m.deaths, 1),
        gpm: m.gold_per_min || 0,
        xpm: m.xp_per_min || 0,
        start_time: m.start_time,
      })),
    }

    return NextResponse.json({
      matches: recent10,
      stats,
    })
  } catch (error) {
    console.error('Error fetching player stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

