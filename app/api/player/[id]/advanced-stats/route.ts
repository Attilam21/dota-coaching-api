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
  last_hits?: number
  denies?: number
  hero_damage?: number
  tower_damage?: number
  hero_healing?: number
  observer_uses?: number
  sentry_uses?: number
  observer_killed?: number
  sentry_killed?: number
  firstblood_claimed?: number
  firstblood_killed?: number
  gold?: number
  gold_spent?: number
  net_worth?: number
  buyback_count?: number
  runes?: number
  start_time: number
  duration: number
  lane_role?: number // 1=safe, 2=mid, 3=offlane, 4=soft support, 5=hard support
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch recent matches summary (20 per analisi avanzate)
    // Note: Summary endpoint has limited fields, we'll fetch full details for first 10 matches
    const matchesResponse = await fetch(`https://api.opendota.com/api/players/${id}/matches?limit=20`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matchesSummary: any[] = await matchesResponse.json()

    if (!matchesSummary || matchesSummary.length === 0) {
      return NextResponse.json({
        matches: [],
        stats: null
      })
    }

    // Filter valid matches
    const validSummaryMatches = matchesSummary.filter((m: any) => m.duration > 0)
    
    // Fetch full match details for first 10 matches (to get advanced stats)
    // We limit to 10 to avoid too many API calls
    const matchesToFetch = validSummaryMatches.slice(0, 10)
    const fullMatchesPromises = matchesToFetch.map((m: any) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    
    const fullMatchesData = await Promise.all(fullMatchesPromises)
    
    // Map full match data to player data
    const enrichedMatches = validSummaryMatches.map((summaryMatch: any, idx: number) => {
      const fullMatch = idx < fullMatchesData.length ? fullMatchesData[idx] : null
      // Find player in match - try by account_id first, then by player_slot
      let playerInMatch = null
      if (fullMatch?.players) {
        playerInMatch = fullMatch.players.find((p: any) => 
          p.account_id?.toString() === id
        ) || fullMatch.players.find((p: any) => 
          p.player_slot === summaryMatch.player_slot
        )
      }
      
      return {
        match_id: summaryMatch.match_id,
        player_slot: summaryMatch.player_slot,
        radiant_win: summaryMatch.radiant_win,
        kills: summaryMatch.kills || 0,
        deaths: summaryMatch.deaths || 0,
        assists: summaryMatch.assists || 0,
        gold_per_min: summaryMatch.gold_per_min || 0,
        xp_per_min: summaryMatch.xp_per_min || 0,
        // Advanced fields from full match data (if available)
        last_hits: playerInMatch?.last_hits || 0,
        denies: playerInMatch?.denies || 0,
        hero_damage: playerInMatch?.hero_damage || 0,
        tower_damage: playerInMatch?.tower_damage || 0,
        hero_healing: playerInMatch?.hero_healing || 0,
        observer_uses: playerInMatch?.observer_uses || 0,
        sentry_uses: playerInMatch?.sentry_uses || 0,
        observer_killed: playerInMatch?.observer_kills || playerInMatch?.obs_killed || 0,
        sentry_killed: playerInMatch?.sentry_kills || playerInMatch?.sen_killed || 0,
        firstblood_claimed: playerInMatch?.firstblood_claimed ? 1 : 0,
        firstblood_killed: playerInMatch?.firstblood_killed ? 1 : 0,
        gold: playerInMatch?.total_gold || 0,
        gold_spent: playerInMatch?.gold_spent || 0,
        net_worth: playerInMatch?.net_worth || 0,
        buyback_count: playerInMatch?.buyback_count || 0,
        runes: playerInMatch?.rune_pickups || 0,
        start_time: summaryMatch.start_time,
        duration: summaryMatch.duration || 0,
        lane_role: summaryMatch.lane_role,
      }
    })
    
    const validMatches = enrichedMatches

    // ============================================
    // 1. LANE & EARLY GAME STATS
    // ============================================
    const laneStats = {
      avgLastHits: validMatches.reduce((acc, m) => acc + (m.last_hits || 0), 0) / validMatches.length,
      avgDenies: validMatches.reduce((acc, m) => acc + (m.denies || 0), 0) / validMatches.length,
      avgCS: validMatches.reduce((acc, m) => acc + (m.last_hits || 0) + (m.denies || 0), 0) / validMatches.length,
      denyRate: 0, // Calcolato dopo
      firstBloodInvolvement: validMatches.filter(m => (m.firstblood_claimed || 0) > 0 || (m.firstblood_killed || 0) > 0).length / validMatches.length * 100,
    }
    laneStats.denyRate = laneStats.avgCS > 0 
      ? (laneStats.avgDenies / laneStats.avgCS) * 100 
      : 0

    // ============================================
    // 2. FARM & ECONOMY STATS
    // ============================================
    const totalGoldEarned = validMatches.reduce((acc, m) => acc + (m.gold || 0), 0)
    const totalGoldSpent = validMatches.reduce((acc, m) => acc + (m.gold_spent || 0), 0)
    const avgGPM = validMatches.reduce((acc, m) => acc + (m.gold_per_min || 0), 0) / validMatches.length
    const avgXPM = validMatches.reduce((acc, m) => acc + (m.xp_per_min || 0), 0) / validMatches.length
    const avgNetWorth = validMatches.reduce((acc, m) => acc + (m.net_worth || 0), 0) / validMatches.length
    const avgBuybacks = validMatches.reduce((acc, m) => acc + (m.buyback_count || 0), 0) / validMatches.length

    const farmStats = {
      avgGPM,
      avgXPM,
      avgNetWorth,
      goldUtilization: totalGoldEarned > 0 ? (totalGoldSpent / totalGoldEarned) * 100 : 0,
      avgBuybacks,
      farmEfficiency: 0, // Calcolato basato su ruolo (placeholder)
    }

    // ============================================
    // 3. FIGHTS & DAMAGE STATS
    // ============================================
    const totalKills = validMatches.reduce((acc, m) => acc + m.kills, 0)
    const totalAssists = validMatches.reduce((acc, m) => acc + m.assists, 0)
    const avgHeroDamage = validMatches.reduce((acc, m) => acc + (m.hero_damage || 0), 0) / validMatches.length
    const avgTowerDamage = validMatches.reduce((acc, m) => acc + (m.tower_damage || 0), 0) / validMatches.length
    const avgHealing = validMatches.reduce((acc, m) => acc + (m.hero_healing || 0), 0) / validMatches.length
    const avgDeaths = validMatches.reduce((acc, m) => acc + m.deaths, 0) / validMatches.length

    // Kill participation (semplicificato: (kills + assists) / (kills + assists + deaths) * 100)
    const totalKA = totalKills + totalAssists
    const totalKAD = totalKA + validMatches.reduce((acc, m) => acc + m.deaths, 0)
    const killParticipation = totalKAD > 0 ? (totalKA / totalKAD) * 100 : 0

    const fightStats = {
      avgKills: totalKills / validMatches.length,
      avgAssists: totalAssists / validMatches.length,
      avgDeaths,
      killParticipation,
      avgHeroDamage,
      avgTowerDamage,
      avgHealing,
      damageEfficiency: avgDeaths > 0 ? avgHeroDamage / avgDeaths : avgHeroDamage,
    }

    // ============================================
    // 4. VISION & MAP CONTROL STATS
    // ============================================
    const totalObserverPlaced = validMatches.reduce((acc, m) => acc + (m.observer_uses || 0), 0)
    const totalObserverKilled = validMatches.reduce((acc, m) => acc + (m.observer_killed || 0), 0)
    const totalSentryPlaced = validMatches.reduce((acc, m) => acc + (m.sentry_uses || 0), 0)
    const totalSentryKilled = validMatches.reduce((acc, m) => acc + (m.sentry_killed || 0), 0)
    const avgRunes = validMatches.reduce((acc, m) => acc + (m.runes || 0), 0) / validMatches.length

    const visionStats = {
      avgObserverPlaced: totalObserverPlaced / validMatches.length,
      avgObserverKilled: totalObserverKilled / validMatches.length,
      avgSentryPlaced: totalSentryPlaced / validMatches.length,
      avgSentryKilled: totalSentryKilled / validMatches.length,
      wardEfficiency: totalObserverPlaced > 0 ? (totalObserverKilled / totalObserverPlaced) * 100 : 0,
      avgRunes,
      visionScore: (totalObserverPlaced * 2) + (totalObserverKilled * 1) + (totalSentryPlaced * 1),
    }

    // ============================================
    // MATCHES BREAKDOWN (per grafici)
    // ============================================
    const matchesBreakdown = validMatches.map((m) => ({
      match_id: m.match_id,
      win: (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win),
      gpm: m.gold_per_min || 0,
      xpm: m.xp_per_min || 0,
      last_hits: m.last_hits || 0,
      denies: m.denies || 0,
      hero_damage: m.hero_damage || 0,
      tower_damage: m.tower_damage || 0,
      healing: m.hero_healing || 0,
      kda: (m.kills + m.assists) / Math.max(m.deaths, 1),
      observer_placed: m.observer_uses || 0,
      observer_killed: m.observer_killed || 0,
      net_worth: m.net_worth || 0,
      start_time: m.start_time,
    }))

    return NextResponse.json({
      matches: matchesBreakdown,
      stats: {
        lane: laneStats,
        farm: farmStats,
        fights: fightStats,
        vision: visionStats,
      },
      sampleSize: validMatches.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error fetching advanced stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

