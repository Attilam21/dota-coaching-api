import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/fetch-utils'

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
  hero_id?: number
  duration?: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch recent matches (20 per allineare con analisi avanzate)
    const matchesResponse = await fetchWithTimeout(`https://api.opendota.com/api/players/${id}/matches?limit=20`, {
      timeout: 10000, // 10 seconds timeout
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
        stats: {
          winrate: {
            last5: 0,
            last10: 0,
            delta: 0,
          },
          kda: {
            last5: 0,
            last10: 0,
            delta: 0,
          },
          farm: {
            gpm: { last5: 0, last10: 0 },
            xpm: { last5: 0, last10: 0 },
          },
          matches: [],
        }
      })
    }
    
    // Always fetch full match details for ALL matches to ensure accurate GPM/XPM
    // OpenDota's match list endpoint may not always include or have accurate GPM/XPM
    // Use fetchWithTimeout utility with 8 seconds per match
    const fullMatchesPromises = matches.slice(0, 20).map((m) =>
      fetchWithTimeout(`https://api.opendota.com/api/matches/${m.match_id}`, {
        timeout: 8000, // 8 seconds per match
        next: { revalidate: 3600 }
      })
        .then(res => res.ok ? res.json() : null)
        .catch((err) => {
          console.warn(`Failed to fetch match ${m.match_id} details:`, err.message)
          return null
        })
    )
    
    // Use Promise.allSettled instead of Promise.all to continue even if some fail
    const fullMatchesResults = await Promise.allSettled(fullMatchesPromises)
    const fullMatches = fullMatchesResults.map(result => 
      result.status === 'fulfilled' ? result.value : null
    )
    
    // Enrich matches with accurate GPM/XPM, hero_id, and duration from full match details
    matches.forEach((match, idx) => {
      if (idx < fullMatches.length) {
        const fullMatch = fullMatches[idx]
        if (fullMatch?.players && fullMatch.duration > 0) {
          // Add duration to match
          match.duration = fullMatch.duration
          
          // Find the player in the full match data by player_slot (most reliable)
          const playerInMatch = fullMatch.players.find((p: any) => 
            p.player_slot === match.player_slot
          )
          
          if (playerInMatch) {
            // Add hero_id if available
            if (playerInMatch.hero_id) {
              match.hero_id = playerInMatch.hero_id
            }
            
            // Prioritize gold_per_min/xp_per_min from full match data
            if (playerInMatch.gold_per_min && playerInMatch.gold_per_min > 0) {
              match.gold_per_min = playerInMatch.gold_per_min
            } else {
              // Calculate from total_gold if gold_per_min not available
              const totalGold = playerInMatch.total_gold || 0
              if (totalGold > 0) {
                match.gold_per_min = Math.round((totalGold / fullMatch.duration) * 60)
              } else {
                match.gold_per_min = match.gold_per_min || 0
              }
            }
            
            if (playerInMatch.xp_per_min && playerInMatch.xp_per_min > 0) {
              match.xp_per_min = playerInMatch.xp_per_min
            } else {
              // Calculate from total_xp if xp_per_min not available
              const totalXP = playerInMatch.total_xp || 0
              if (totalXP > 0) {
                match.xp_per_min = Math.round((totalXP / fullMatch.duration) * 60)
              } else {
                match.xp_per_min = match.xp_per_min || 0
              }
            }
          }
        }
      }
    })

    // Calculate statistics
    const recent5 = matches.slice(0, 5)
    const recent10 = matches.slice(0, 10)

    // Winrate calculations - prevent division by zero
    const wins5 = recent5.filter((m) => 
      (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
    ).length
    const wins10 = recent10.filter((m) => 
      (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
    ).length
    
    const winrate5 = recent5.length > 0 ? (wins5 / recent5.length) * 100 : 0
    const winrate10 = recent10.length > 0 ? (wins10 / recent10.length) * 100 : 0

    // KDA calculations - prevent division by zero
    const kda5 = recent5.length > 0 
      ? recent5.reduce((acc, m) => {
          const kda = (m.kills + m.assists) / Math.max(m.deaths, 1)
          return acc + kda
        }, 0) / recent5.length
      : 0

    const kda10 = recent10.length > 0
      ? recent10.reduce((acc, m) => {
          const kda = (m.kills + m.assists) / Math.max(m.deaths, 1)
          return acc + kda
        }, 0) / recent10.length
      : 0

    // GPM/XPM calculations - prevent division by zero
    const gpm5 = recent5.length > 0 
      ? recent5.reduce((acc, m) => acc + (m.gold_per_min || 0), 0) / recent5.length
      : 0
    const gpm10 = recent10.length > 0
      ? recent10.reduce((acc, m) => acc + (m.gold_per_min || 0), 0) / recent10.length
      : 0
    
    const xpm5 = recent5.length > 0
      ? recent5.reduce((acc, m) => acc + (m.xp_per_min || 0), 0) / recent5.length
      : 0
    const xpm10 = recent10.length > 0
      ? recent10.reduce((acc, m) => acc + (m.xp_per_min || 0), 0) / recent10.length
      : 0

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
      matches: matches.slice(0, 20).map((m) => ({
        match_id: m.match_id,
        win: (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win),
        kda: (m.kills + m.assists) / Math.max(m.deaths, 1),
        gpm: m.gold_per_min || 0,
        xpm: m.xp_per_min || 0,
        start_time: m.start_time,
        hero_id: m.hero_id,
        duration: m.duration,
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
      })),
    }

    return NextResponse.json({
      matches: matches.slice(0, 20),
      stats,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching player stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

