import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch player data
    // Use request.nextUrl.origin for internal API calls (works on Vercel)
    const [statsResponse, advancedStatsResponse, heroesResponse] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/player/${id}/stats`),
      fetch(`${request.nextUrl.origin}/api/player/${id}/advanced-stats`),
      fetch(`https://api.opendota.com/api/players/${id}/heroes`, {
        next: { revalidate: 3600 }
      })
    ])
    
    // Parse responses safely
    let statsData: any = null
    let advancedData: any = null
    let playerHeroes: any = null
    
    if (statsResponse.ok) {
      try {
        statsData = await statsResponse.json()
      } catch (err) {
        console.error('Failed to parse stats response:', err)
      }
    } else {
      const errorText = await statsResponse.text().catch(() => 'Unknown error')
      console.error('Stats fetch failed:', statsResponse.status, errorText)
    }
    
    if (advancedStatsResponse.ok) {
      try {
        advancedData = await advancedStatsResponse.json()
      } catch (err) {
        console.error('Failed to parse advanced stats response:', err)
      }
    } else {
      const errorText = await advancedStatsResponse.text().catch(() => 'Unknown error')
      console.error('Advanced stats fetch failed:', advancedStatsResponse.status, errorText)
    }
    
    if (heroesResponse.ok) {
      try {
        playerHeroes = await heroesResponse.json()
      } catch (err) {
        console.error('Failed to parse heroes response:', err)
      }
    } else {
      console.error('Heroes fetch failed:', heroesResponse.status)
    }
    
    if (!statsData?.stats || !advancedData?.stats) {
      return NextResponse.json(
        { error: 'Failed to fetch or parse player data' },
        { status: 500 }
      )
    }

    // Fetch heroes data to get role info
    const heroesDataResponse = await fetch('https://api.opendota.com/api/heroes', {
      next: { revalidate: 86400 }
    })
    const allHeroes = await heroesDataResponse.json()
    const heroesMap: Record<number, { roles: string[]; localized_name: string }> = {}
    allHeroes.forEach((hero: any) => {
      heroesMap[hero.id] = {
        roles: hero.roles || [],
        localized_name: hero.localized_name
      }
    })

    // Calculate role performance
    const rolePerformance: Record<string, {
      games: number
      wins: number
      winrate: number
      avgGPM: number
      avgKDA: number
      avgDeaths: number
      avgObserverPlaced: number
      heroes: Array<{ hero_id: number; hero_name: string; games: number; winrate: number }>
    }> = {
      Carry: { games: 0, wins: 0, winrate: 0, avgGPM: 0, avgKDA: 0, avgDeaths: 0, avgObserverPlaced: 0, heroes: [] },
      Mid: { games: 0, wins: 0, winrate: 0, avgGPM: 0, avgKDA: 0, avgDeaths: 0, avgObserverPlaced: 0, heroes: [] },
      Offlane: { games: 0, wins: 0, winrate: 0, avgGPM: 0, avgKDA: 0, avgDeaths: 0, avgObserverPlaced: 0, heroes: [] },
      Support: { games: 0, wins: 0, winrate: 0, avgGPM: 0, avgKDA: 0, avgDeaths: 0, avgObserverPlaced: 0, heroes: [] },
    }

    // Process player heroes and assign to roles
    playerHeroes
      .filter((h: any) => h.games && h.games > 0)
      .forEach((h: any) => {
        const hero = heroesMap[h.hero_id]
        if (!hero) return

        const heroWinrate = (h.win / h.games) * 100
        const heroData = {
          hero_id: h.hero_id,
          hero_name: hero.localized_name,
          games: h.games,
          winrate: heroWinrate
        }

        // Assign to roles based on hero roles
        const roles = hero.roles || []
        if (roles.includes('Carry')) {
          rolePerformance.Carry.games += h.games
          rolePerformance.Carry.wins += h.win
          rolePerformance.Carry.heroes.push(heroData)
        }
        if (roles.includes('Mid')) {
          rolePerformance.Mid.games += h.games
          rolePerformance.Mid.wins += h.win
          rolePerformance.Mid.heroes.push(heroData)
        }
        if (roles.includes('Offlane')) {
          rolePerformance.Offlane.games += h.games
          rolePerformance.Offlane.wins += h.win
          rolePerformance.Offlane.heroes.push(heroData)
        }
        if (roles.includes('Support')) {
          rolePerformance.Support.games += h.games
          rolePerformance.Support.wins += h.win
          rolePerformance.Support.heroes.push(heroData)
        }
      })

    // Calculate winrates and REAL metrics per role
    const stats = statsData.stats
    const advanced = advancedData.stats
    const matches = stats.matches || []

    // Calculate REAL metrics per role based on actual match data
    // We need to fetch full match details to get role-specific stats
    // For now, use overall stats but don't multiply by fake factors
    // Prevent division by zero
    const overallGPM = matches.length > 0
      ? matches.reduce((acc: number, m: { gpm: number }) => acc + (m.gpm || 0), 0) / matches.length
      : 0
    const overallKDA = matches.length > 0
      ? matches.reduce((acc: number, m: { kda: number }) => acc + (m.kda || 0), 0) / matches.length
      : 0
    const overallDeaths = advanced.fights?.avgDeaths || 0

    Object.keys(rolePerformance).forEach(role => {
      const perf = rolePerformance[role]
      perf.winrate = perf.games > 0 ? (perf.wins / perf.games) * 100 : 0
      
      // Use REAL overall stats (not multiplied by fake factors)
      // Note: These are overall stats, not role-specific, because we don't have
      // match-level role data from OpenDota. But they're REAL, not estimated.
      perf.avgGPM = overallGPM
      perf.avgKDA = overallKDA
      perf.avgDeaths = overallDeaths
      
      // Support-specific real data
      if (role === 'Support') {
        perf.avgObserverPlaced = advanced.vision?.avgObserverPlaced || 0
      }
      
      // Sort heroes by games
      perf.heroes.sort((a, b) => b.games - a.games)
      perf.heroes = perf.heroes.slice(0, 5) // Top 5 heroes per role
    })

    // Find preferred role (most games with good winrate)
    const rolesArray = Object.entries(rolePerformance)
      .filter(([_, perf]) => perf.games >= 5)
      .sort((a, b) => {
        // Sort by games first, then winrate
        if (b[1].games !== a[1].games) return b[1].games - a[1].games
        return b[1].winrate - a[1].winrate
      })

    const preferredRole = rolesArray.length > 0 ? {
      role: rolesArray[0][0],
      games: rolesArray[0][1].games,
      winrate: rolesArray[0][1].winrate,
      confidence: rolesArray[0][1].games >= 20 ? 'high' : rolesArray[0][1].games >= 10 ? 'medium' : 'low'
    } : null

    // Generate recommendations
    const recommendations: string[] = []

    if (preferredRole && preferredRole.winrate < 50) {
      recommendations.push(`Il tuo ruolo preferito (${preferredRole.role}) ha un winrate negativo. Considera di praticare di più o esplorare altri ruoli.`)
    }

    const weakRoles = rolesArray.filter(([_, perf]) => perf.games >= 5 && perf.winrate < 45)
    if (weakRoles.length > 0) {
      recommendations.push(`Hai difficoltà nei ruoli: ${weakRoles.map(([role]) => role).join(', ')}. Pratica questi ruoli o evitali.`)
    }

    const strongRoles = rolesArray.filter(([_, perf]) => perf.games >= 5 && perf.winrate >= 55)
    if (strongRoles.length > 0) {
      recommendations.push(`Eccelli nei ruoli: ${strongRoles.map(([role]) => role).join(', ')}. Continua a giocarli per massimizzare le vittorie.`)
    }

    if (rolesArray.length < 2) {
      recommendations.push('Hai giocato principalmente un solo ruolo. Diversificare può migliorare l\'adattabilità e la comprensione del gioco.')
    }

    return NextResponse.json({
      roles: rolePerformance,
      preferredRole,
      recommendations,
      summary: {
        totalRolesPlayed: rolesArray.length,
        mostPlayedRole: preferredRole?.role || 'N/A',
        bestRole: rolesArray.length > 0 ? rolesArray.reduce((best, curr) => 
          curr[1].winrate > best[1].winrate ? curr : best
        )[0] : 'N/A',
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching role analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

