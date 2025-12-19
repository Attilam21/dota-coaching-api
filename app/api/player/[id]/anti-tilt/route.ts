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
  hero_id?: number
  duration?: number
}

interface AntiTiltData {
  isTilted: boolean
  lossStreak: number
  winStreak: number
  recentWinrate: {
    last3: number
    last5: number
    today: number
  }
  recoveryStats: {
    avgRecoveryTime: number // in hours
    bestWinStreak: number
    recoveryWinrate: number // winrate after a loss
  }
  negativePatterns: {
    worstHours: Array<{ hour: number; winrate: number; total: number }>
    worstDays: Array<{ day: string; winrate: number; total: number }>
    worstHeroes: Array<{ hero_id: number; hero_name: string; winrate: number; games: number }>
  }
  suggestions: string[]
  tiltLevel: 'low' | 'medium' | 'high' | 'critical'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch recent matches (50 per avere abbastanza dati)
    const matchesResponse = await fetch(`https://api.opendota.com/api/players/${id}/matches?limit=50`, {
      next: { revalidate: 1800 } // 30 minuti
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
        isTilted: false,
        lossStreak: 0,
        winStreak: 0,
        recentWinrate: { last3: 0, last5: 0, today: 0 },
        recoveryStats: { avgRecoveryTime: 0, bestWinStreak: 0, recoveryWinrate: 0 },
        negativePatterns: { worstHours: [], worstDays: [], worstHeroes: [] },
        suggestions: ['Non ci sono abbastanza partite per analizzare il tilt'],
        tiltLevel: 'low'
      })
    }

    // Fetch heroes data for names
    const heroesResponse = await fetch('https://api.opendota.com/api/heroes', {
      next: { revalidate: 86400 }
    })
    const heroes = heroesResponse.ok ? await heroesResponse.json() : []
    const heroesMap: Record<number, { localized_name: string }> = {}
    heroes.forEach((hero: any) => {
      heroesMap[hero.id] = { localized_name: hero.localized_name }
    })

    // Enrich matches with hero_id if missing (fetch full match details for first 20)
    const matchesToEnrich = matches.slice(0, 20)
    const fullMatchesPromises = matchesToEnrich.map((m) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    const fullMatches = await Promise.all(fullMatchesPromises)
    
    matches.forEach((match, idx) => {
      if (idx < fullMatches.length && fullMatches[idx]) {
        const fullMatch = fullMatches[idx]
        if (fullMatch?.players) {
          const playerInMatch = fullMatch.players.find((p: any) => 
            p.player_slot === match.player_slot
          )
          if (playerInMatch?.hero_id && !match.hero_id) {
            match.hero_id = playerInMatch.hero_id
          }
        }
      }
    })

    // Calculate win/loss for each match
    const matchesWithResult = matches.map(m => ({
      ...m,
      win: (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
    }))

    // Calculate loss streak (consecutive losses from most recent)
    let lossStreak = 0
    let winStreak = 0
    for (const match of matchesWithResult) {
      if (!match.win) {
        lossStreak++
      } else {
        break
      }
    }
    for (const match of matchesWithResult) {
      if (match.win) {
        winStreak++
      } else {
        break
      }
    }

    // Calculate recent winrate
    const last3 = matchesWithResult.slice(0, 3)
    const last5 = matchesWithResult.slice(0, 5)
    const wins3 = last3.filter(m => m.win).length
    const wins5 = last5.filter(m => m.win).length
    const winrate3 = last3.length > 0 ? (wins3 / last3.length) * 100 : 0
    const winrate5 = last5.length > 0 ? (wins5 / last5.length) * 100 : 0

    // Calculate today's winrate
    const now = Date.now() / 1000
    const todayStart = now - (24 * 60 * 60) // 24 hours ago
    const todayMatches = matchesWithResult.filter(m => m.start_time >= todayStart)
    const winsToday = todayMatches.filter(m => m.win).length
    const winrateToday = todayMatches.length > 0 ? (winsToday / todayMatches.length) * 100 : 0

    // Calculate recovery stats
    let recoveryTimes: number[] = []
    let recoveryWins = 0
    let recoveryTotal = 0
    let currentStreak = 0
    let bestWinStreak = 0

    for (let i = matchesWithResult.length - 1; i >= 0; i--) {
      const match = matchesWithResult[i]
      if (match.win) {
        currentStreak++
        bestWinStreak = Math.max(bestWinStreak, currentStreak)
        if (i < matchesWithResult.length - 1 && !matchesWithResult[i + 1].win) {
          // This is a win after a loss
          recoveryTotal++
          if (match.win) recoveryWins++
          // Calculate time between loss and win
          if (i + 1 < matchesWithResult.length) {
            const lossTime = matchesWithResult[i + 1].start_time
            const winTime = match.start_time
            const hoursDiff = (winTime - lossTime) / 3600
            if (hoursDiff > 0 && hoursDiff < 48) { // Reasonable recovery time
              recoveryTimes.push(hoursDiff)
            }
          }
        }
      } else {
        currentStreak = 0
      }
    }

    const avgRecoveryTime = recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0
    const recoveryWinrate = recoveryTotal > 0 ? (recoveryWins / recoveryTotal) * 100 : 0

    // Calculate negative patterns - worst hours
    const hourStats: Record<number, { wins: number; total: number }> = {}
    matchesWithResult.forEach(match => {
      const date = new Date(match.start_time * 1000)
      const hour = date.getHours()
      if (!hourStats[hour]) {
        hourStats[hour] = { wins: 0, total: 0 }
      }
      hourStats[hour].total++
      if (match.win) hourStats[hour].wins++
    })

    const worstHours = Object.entries(hourStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        winrate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        total: stats.total
      }))
      .filter(h => h.total >= 3) // At least 3 games
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 5)

    // Calculate negative patterns - worst days
    const dayStats: Record<number, { wins: number; total: number }> = {}
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    matchesWithResult.forEach(match => {
      const date = new Date(match.start_time * 1000)
      const day = date.getDay()
      if (!dayStats[day]) {
        dayStats[day] = { wins: 0, total: 0 }
      }
      dayStats[day].total++
      if (match.win) dayStats[day].wins++
    })

    const worstDays = Object.entries(dayStats)
      .map(([day, stats]) => ({
        day: dayNames[parseInt(day)],
        winrate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        total: stats.total
      }))
      .filter(d => d.total >= 3) // At least 3 games
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 3)

    // Calculate negative patterns - worst heroes (last 20 matches)
    const heroStats: Record<number, { wins: number; total: number }> = {}
    matchesWithResult.slice(0, 20).forEach(match => {
      if (match.hero_id) {
        if (!heroStats[match.hero_id]) {
          heroStats[match.hero_id] = { wins: 0, total: 0 }
        }
        heroStats[match.hero_id].total++
        if (match.win) heroStats[match.hero_id].wins++
      }
    })

    const worstHeroes = Object.entries(heroStats)
      .map(([heroId, stats]) => ({
        hero_id: parseInt(heroId),
        hero_name: heroesMap[parseInt(heroId)]?.localized_name || `Hero ${heroId}`,
        winrate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        games: stats.total
      }))
      .filter(h => h.games >= 2) // At least 2 games
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 5)

    // Determine tilt level and generate suggestions
    let tiltLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    const suggestions: string[] = []

    if (lossStreak >= 5 || winrateToday < 20) {
      tiltLevel = 'critical'
      suggestions.push('🚨 CRITICO: Hai perso 5+ partite di fila o winrate oggi < 20%. FERMATI SUBITO e fai una pausa di almeno 1 ora.')
    } else if (lossStreak >= 3 || winrate5 < 30) {
      tiltLevel = 'high'
      suggestions.push('⚠️ ALTO: Hai perso 3+ partite di fila o winrate ultime 5 < 30%. Fai una pausa di 30-60 minuti.')
    } else if (lossStreak >= 2 || winrate3 < 40) {
      tiltLevel = 'medium'
      suggestions.push('⚡ MEDIO: Hai perso 2 partite di fila. Considera una pausa breve di 15-30 minuti.')
    }

    if (worstHours.length > 0 && worstHours[0].winrate < 40) {
      suggestions.push(`⏰ Evita di giocare tra le ${worstHours[0].hour}:00 e le ${worstHours[0].hour + 1}:00 (winrate ${worstHours[0].winrate.toFixed(1)}%)`)
    }

    if (worstDays.length > 0 && worstDays[0].winrate < 40) {
      suggestions.push(`📅 Evita di giocare il ${worstDays[0].day} (winrate ${worstDays[0].winrate.toFixed(1)}%)`)
    }

    if (worstHeroes.length > 0 && worstHeroes[0].winrate < 30) {
      suggestions.push(`🎮 Evita ${worstHeroes[0].hero_name} (winrate ${worstHeroes[0].winrate.toFixed(1)}% nelle ultime partite)`)
    }

    if (recoveryWinrate > 0 && recoveryWinrate < 40) {
      suggestions.push(`📉 Il tuo winrate dopo una sconfitta è ${recoveryWinrate.toFixed(1)}%. Quando perdi, fai sempre una pausa prima di rigiocare.`)
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ Tutto ok! Le tue statistiche non mostrano segni di tilt. Continua così!')
    }

    const isTilted = tiltLevel === 'high' || tiltLevel === 'critical'

    const data: AntiTiltData = {
      isTilted,
      lossStreak,
      winStreak,
      recentWinrate: {
        last3: winrate3,
        last5: winrate5,
        today: winrateToday
      },
      recoveryStats: {
        avgRecoveryTime: Math.round(avgRecoveryTime * 10) / 10,
        bestWinStreak,
        recoveryWinrate: Math.round(recoveryWinrate * 10) / 10
      },
      negativePatterns: {
        worstHours,
        worstDays,
        worstHeroes
      },
      suggestions,
      tiltLevel
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching anti-tilt data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

