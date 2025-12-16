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
    
    // Fetch full match details for all 20 matches (to get advanced stats)
    const matchesToFetch = validSummaryMatches.slice(0, 20)
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
      
      // Calculate GPM/XPM from full match if not available in summary
      let gpm = summaryMatch.gold_per_min || playerInMatch?.gold_per_min || 0
      let xpm = summaryMatch.xp_per_min || playerInMatch?.xp_per_min || 0
      
      // If still 0, calculate from total gold/XP and duration
      const matchDuration = fullMatch?.duration || summaryMatch.duration || 0
      if ((gpm === 0 || xpm === 0) && matchDuration > 0) {
        const totalGold = playerInMatch?.total_gold || playerInMatch?.gold || 0
        const totalXP = playerInMatch?.total_xp || playerInMatch?.xp || 0
        if (gpm === 0 && totalGold > 0) {
          gpm = (totalGold / matchDuration) * 60
        }
        if (xpm === 0 && totalXP > 0) {
          xpm = (totalXP / matchDuration) * 60
        }
      }
      
      return {
        match_id: summaryMatch.match_id,
        player_slot: summaryMatch.player_slot,
        radiant_win: summaryMatch.radiant_win,
        kills: summaryMatch.kills || 0,
        deaths: summaryMatch.deaths || 0,
        assists: summaryMatch.assists || 0,
        gold_per_min: gpm,
        xp_per_min: xpm,
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
        gold: playerInMatch?.total_gold || playerInMatch?.gold || 0,
        gold_spent: playerInMatch?.gold_spent || 0,
        net_worth: playerInMatch?.net_worth || 0,
        buyback_count: playerInMatch?.buyback_count || 0,
        runes: playerInMatch?.rune_pickups || 0,
        camps_stacked: playerInMatch?.camps_stacked || 0,
        courier_kills: playerInMatch?.courier_kills || 0,
        roshans_killed: playerInMatch?.roshans_killed || 0,
        stuns: playerInMatch?.stuns || 0,
        teamfight_participations: playerInMatch?.teamfight_participations || 0,
        start_time: summaryMatch.start_time,
        duration: matchDuration,
        lane_role: summaryMatch.lane_role,
        win: (summaryMatch.player_slot < 128 && summaryMatch.radiant_win) || (summaryMatch.player_slot >= 128 && !summaryMatch.radiant_win),
      }
    })
    
    const validMatches = enrichedMatches.filter((m: any) => m.duration > 0)

    // Guard against empty validMatches to prevent division by zero
    if (validMatches.length === 0) {
      return NextResponse.json({
        matches: [],
        stats: null
      })
    }

    // ============================================
    // 1. LANE & EARLY GAME STATS
    // ============================================
    const avgLastHits = validMatches.reduce((acc, m) => acc + (m.last_hits || 0), 0) / validMatches.length
    const avgDenies = validMatches.reduce((acc, m) => acc + (m.denies || 0), 0) / validMatches.length
    const avgCS = validMatches.reduce((acc, m) => acc + (m.last_hits || 0) + (m.denies || 0), 0) / validMatches.length
    const avgDuration = validMatches.reduce((acc, m) => acc + (m.duration || 0), 0) / validMatches.length
    
    // CS per minute (real calculation based on actual match duration)
    const csPerMinute = avgDuration > 0 ? (avgCS / (avgDuration / 60)) : 0
    
    // Estimated CS at 10 minutes (based on average CS rate, assuming linear growth)
    // This is an estimate since we don't have exact 10-min data, but useful for comparison
    const estimatedCSAt10Min = csPerMinute * 10
    
    const laneStats = {
      avgLastHits,
      avgDenies,
      avgCS,
      csPerMinute: csPerMinute.toFixed(2),
      estimatedCSAt10Min: estimatedCSAt10Min.toFixed(1),
      denyRate: avgCS > 0 ? (avgDenies / avgCS) * 100 : 0,
      firstBloodInvolvement: validMatches.filter(m => (m.firstblood_claimed || 0) > 0 || (m.firstblood_killed || 0) > 0).length / validMatches.length * 100,
    }

    // ============================================
    // 2. FARM & ECONOMY STATS
    // ============================================
    const totalGoldEarned = validMatches.reduce((acc, m) => acc + (m.gold || 0), 0)
    const totalGoldSpent = validMatches.reduce((acc, m) => acc + (m.gold_spent || 0), 0)
    const avgGPM = validMatches.reduce((acc, m) => acc + (m.gold_per_min || 0), 0) / validMatches.length
    const avgXPM = validMatches.reduce((acc, m) => acc + (m.xp_per_min || 0), 0) / validMatches.length
    const avgNetWorth = validMatches.reduce((acc, m) => acc + (m.net_worth || 0), 0) / validMatches.length
    const avgBuybacks = validMatches.reduce((acc, m) => acc + (m.buyback_count || 0), 0) / validMatches.length

    // Buyback efficiency: calculate win rate when buyback is used
    const matchesWithBuyback = validMatches.filter(m => (m.buyback_count || 0) > 0)
    const buybackWins = matchesWithBuyback.filter(m => m.win).length
    const buybackEfficiency = matchesWithBuyback.length > 0 ? (buybackWins / matchesWithBuyback.length) * 100 : 0
    
    // Phase analysis: estimate performance by game phase
    // Early: 0-15min, Mid: 15-30min, Late: 30+min
    const earlyMatches = validMatches.filter(m => (m.duration || 0) <= 900) // 15 min
    const midMatches = validMatches.filter(m => (m.duration || 0) > 900 && (m.duration || 0) <= 1800) // 15-30 min
    const lateMatches = validMatches.filter(m => (m.duration || 0) > 1800) // 30+ min
    
    const earlyWinrate = earlyMatches.length > 0 ? (earlyMatches.filter(m => m.win).length / earlyMatches.length) * 100 : 0
    const midWinrate = midMatches.length > 0 ? (midMatches.filter(m => m.win).length / midMatches.length) * 100 : 0
    const lateWinrate = lateMatches.length > 0 ? (lateMatches.filter(m => m.win).length / lateMatches.length) * 100 : 0
    
    const farmStats = {
      avgGPM,
      avgXPM,
      avgNetWorth,
      goldUtilization: totalGoldEarned > 0 ? (totalGoldSpent / totalGoldEarned) * 100 : 0,
      avgBuybacks,
      buybackEfficiency: buybackEfficiency.toFixed(1),
      buybackUsageRate: (matchesWithBuyback.length / validMatches.length) * 100,
      // Farm Efficiency: (avg last hits + denies) per minute of average match duration
      farmEfficiency: avgDuration > 0 ? ((avgLastHits + avgDenies) / (avgDuration / 60)) : 0,
      // Phase analysis
      phaseAnalysis: {
        early: {
          matches: earlyMatches.length,
          winrate: earlyWinrate.toFixed(1),
          avgDuration: earlyMatches.length > 0 ? earlyMatches.reduce((acc, m) => acc + (m.duration || 0), 0) / earlyMatches.length : 0
        },
        mid: {
          matches: midMatches.length,
          winrate: midWinrate.toFixed(1),
          avgDuration: midMatches.length > 0 ? midMatches.reduce((acc, m) => acc + (m.duration || 0), 0) / midMatches.length : 0
        },
        late: {
          matches: lateMatches.length,
          winrate: lateWinrate.toFixed(1),
          avgDuration: lateMatches.length > 0 ? lateMatches.reduce((acc, m) => acc + (m.duration || 0), 0) / lateMatches.length : 0
        }
      }
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

    // Death efficiency: deaths per minute
    const avgDurationMinutes = avgDuration / 60
    const deathsPerMinute = avgDurationMinutes > 0 ? avgDeaths / avgDurationMinutes : 0
    
    // Teamfight participation (more accurate using teamfight_participations if available)
    const totalTeamfightParticipations = validMatches.reduce((acc, m) => acc + (m.teamfight_participations || 0), 0)
    const avgTeamfightParticipations = totalTeamfightParticipations / validMatches.length
    
    // Damage per minute
    const damagePerMinute = avgDurationMinutes > 0 ? avgHeroDamage / avgDurationMinutes : 0
    
    const fightStats = {
      avgKills: totalKills / validMatches.length,
      avgAssists: totalAssists / validMatches.length,
      avgDeaths,
      deathsPerMinute: deathsPerMinute.toFixed(2),
      killParticipation,
      teamfightParticipation: avgTeamfightParticipations.toFixed(1),
      avgHeroDamage,
      avgTowerDamage,
      avgHealing,
      damageEfficiency: avgDeaths > 0 ? avgHeroDamage / avgDeaths : avgHeroDamage,
      damagePerMinute: damagePerMinute.toFixed(0),
    }

    // ============================================
    // 4. VISION & MAP CONTROL STATS
    // ============================================
    const totalObserverPlaced = validMatches.reduce((acc, m) => acc + (m.observer_uses || 0), 0)
    const totalObserverKilled = validMatches.reduce((acc, m) => acc + (m.observer_killed || 0), 0)
    const totalSentryPlaced = validMatches.reduce((acc, m) => acc + (m.sentry_uses || 0), 0)
    const totalSentryKilled = validMatches.reduce((acc, m) => acc + (m.sentry_killed || 0), 0)
    const avgRunes = validMatches.reduce((acc, m) => acc + (m.runes || 0), 0) / validMatches.length

    // Rune control: runes per minute
    const runesPerMinute = avgDurationMinutes > 0 ? avgRunes / avgDurationMinutes : 0
    
    // Stacking efficiency: camps stacked per match
    const totalCampsStacked = validMatches.reduce((acc, m) => acc + (m.camps_stacked || 0), 0)
    const avgCampsStacked = totalCampsStacked / validMatches.length
    
    // Courier control
    const totalCourierKills = validMatches.reduce((acc, m) => acc + (m.courier_kills || 0), 0)
    const avgCourierKills = totalCourierKills / validMatches.length
    
    // Roshan control
    const totalRoshanKills = validMatches.reduce((acc, m) => acc + (m.roshans_killed || 0), 0)
    const avgRoshanKills = totalRoshanKills / validMatches.length
    const roshanControlRate = (validMatches.filter(m => (m.roshans_killed || 0) > 0).length / validMatches.length) * 100
    
    // Deward efficiency: sentry killed / sentry placed (higher is better)
    const dewardEfficiency = totalSentryPlaced > 0 ? (totalSentryKilled / totalSentryPlaced) * 100 : 0
    
    const visionStats = {
      avgObserverPlaced: totalObserverPlaced / validMatches.length,
      avgObserverKilled: totalObserverKilled / validMatches.length,
      avgSentryPlaced: totalSentryPlaced / validMatches.length,
      avgSentryKilled: totalSentryKilled / validMatches.length,
      wardEfficiency: totalObserverPlaced > 0 ? (totalObserverKilled / totalObserverPlaced) * 100 : 0,
      dewardEfficiency: dewardEfficiency.toFixed(1),
      avgRunes,
      runesPerMinute: runesPerMinute.toFixed(2),
      avgCampsStacked: avgCampsStacked.toFixed(1),
      avgCourierKills: avgCourierKills.toFixed(1),
      avgRoshanKills: avgRoshanKills.toFixed(1),
      roshanControlRate: roshanControlRate.toFixed(1),
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

