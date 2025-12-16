import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch heroes stats from OpenDota
    const [heroesResponse, playerHeroesResponse] = await Promise.all([
      fetch('https://api.opendota.com/api/heroes', {
        next: { revalidate: 86400 }
      }),
      fetch(`https://api.opendota.com/api/players/${id}/heroes`, {
        next: { revalidate: 3600 }
      })
    ])
    
    if (!heroesResponse.ok || !playerHeroesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch hero data' },
        { status: 500 }
      )
    }

    const allHeroes = await heroesResponse.json()
    const playerHeroes = await playerHeroesResponse.json()

    // Create heroes map
    const heroesMap: Record<number, { name: string; localized_name: string; primary_attr: string; roles: string[] }> = {}
    allHeroes.forEach((hero: any) => {
      heroesMap[hero.id] = {
        name: hero.name,
        localized_name: hero.localized_name,
        primary_attr: hero.primary_attr,
        roles: hero.roles || []
      }
    })

    // Filter and process player heroes (only with games > 0)
    const heroStats = playerHeroes
      .filter((h: any) => h.games && h.games > 0)
      .map((h: any) => {
        const hero = heroesMap[h.hero_id]
        const winrate = (h.win / h.games) * 100
        const kda = h.games > 0 ? (h.avg_kills + h.avg_assists) / Math.max(h.avg_deaths, 1) : 0
        
        // Determine rating
        let rating = 'Migliorabile'
        if (winrate >= 55 && h.games >= 10) rating = 'Eccellente'
        else if (winrate >= 50 && h.games >= 5) rating = 'Buona'
        else if (winrate >= 45) rating = 'Media'
        
        return {
          hero_id: h.hero_id,
          hero_name: hero?.localized_name || `Hero ${h.hero_id}`,
          games: h.games,
          wins: h.win,
          losses: h.games - h.win,
          winrate,
          kda: kda.toFixed(2),
          avg_kills: h.avg_kills?.toFixed(1) || '0',
          avg_deaths: h.avg_deaths?.toFixed(1) || '0',
          avg_assists: h.avg_assists?.toFixed(1) || '0',
          avg_gpm: h.avg_gold_per_min?.toFixed(0) || '0',
          avg_xpm: h.avg_xp_per_min?.toFixed(0) || '0',
          rating,
          primary_attr: hero?.primary_attr || 'unknown',
          roles: hero?.roles || [],
        }
      })
      .sort((a: any, b: any) => b.games - a.games) // Sort by games played

    // Identify best and worst heroes
    const bestHeroes = heroStats
      .filter((h: any) => h.games >= 5 && parseFloat(h.winrate) >= 55)
      .sort((a: any, b: any) => parseFloat(b.winrate) - parseFloat(a.winrate))
      .slice(0, 5)

    const worstHeroes = heroStats
      .filter((h: any) => h.games >= 5 && parseFloat(h.winrate) < 45)
      .sort((a: any, b: any) => parseFloat(a.winrate) - parseFloat(b.winrate))
      .slice(0, 5)

    // Calculate overall stats
    const totalGames = heroStats.reduce((acc: number, h: any) => acc + h.games, 0)
    const totalWins = heroStats.reduce((acc: number, h: any) => acc + h.wins, 0)
    const overallWinrate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0

    // Hero pool diversity (number of heroes with >= 5 games)
    const diverseHeroes = heroStats.filter((h: any) => h.games >= 5).length

    // Most played hero
    const mostPlayed = heroStats.length > 0 ? heroStats[0] : null

    // Generate insights
    const insights: string[] = []
    
    if (bestHeroes.length > 0) {
      insights.push(`I tuoi heroes migliori sono: ${bestHeroes.map((h: any) => h.hero_name).join(', ')}. Considera di giocarli più spesso.`)
    }
    
    if (worstHeroes.length > 0) {
      insights.push(`Hai difficoltà con: ${worstHeroes.map((h: any) => h.hero_name).join(', ')}. Considera di praticarli o evitarli.`)
    }
    
    if (diverseHeroes < 5) {
      insights.push(`Hai un hero pool limitato (${diverseHeroes} heroes con 5+ partite). Espandere il pool può migliorare l'adattabilità.`)
    }
    
    if (mostPlayed && mostPlayed.games > totalGames * 0.3) {
      insights.push(`Stai giocando ${mostPlayed.hero_name} troppo spesso (${((mostPlayed.games / totalGames) * 100).toFixed(0)}% delle partite). Diversifica di più.`)
    }

    // Role distribution
    const roleStats: Record<string, { games: number; wins: number; winrate: number }> = {}
    heroStats.forEach((h: any) => {
      const roles = h.roles || []
      if (roles.length > 0) {
        roles.forEach((role: string) => {
          if (!roleStats[role]) {
            roleStats[role] = { games: 0, wins: 0, winrate: 0 }
          }
          roleStats[role].games += h.games
          roleStats[role].wins += h.wins
        })
      }
    })
    
    // Calculate winrate for each role
    Object.keys(roleStats).forEach(role => {
      const stats = roleStats[role]
      stats.winrate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0
    })

    return NextResponse.json({
      heroStats: heroStats.slice(0, 20), // Top 20 most played
      bestHeroes,
      worstHeroes,
      overall: {
        totalGames,
        totalWins,
        overallWinrate: overallWinrate.toFixed(1),
        diverseHeroes,
        totalHeroesPlayed: heroStats.length,
      },
      mostPlayed,
      roleStats,
      insights,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching hero analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

