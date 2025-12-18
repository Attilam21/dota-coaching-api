import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per analizzare i matchup del giocatore (hero vs hero winrate)
 * Analizza le partite del giocatore per determinare winrate contro eroi specifici
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch player's recent matches (need full match data to see enemy heroes)
    const matchesResponse = await fetch(
      `https://api.opendota.com/api/players/${id}/matches?limit=100`,
      { next: { revalidate: 3600 } } // Cache 1 hour
    )
    
    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matches = await matchesResponse.json()
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        matchups: [],
        summary: {
          totalMatches: 0,
          totalHeroes: 0,
        },
      })
    }

    // Fetch heroes list for names
    const heroesResponse = await fetch('https://api.opendota.com/api/heroes', {
      next: { revalidate: 86400 } // Cache 24 hours
    })
    
    const allHeroes = heroesResponse.ok ? await heroesResponse.json() : []
    const heroesMap: Record<number, { name: string; localized_name: string }> = {}
    allHeroes.forEach((hero: any) => {
      heroesMap[hero.id] = {
        name: hero.name || '', // e.g., "npc_dota_hero_antimage"
        localized_name: hero.localized_name || `Hero ${hero.id}`,
      }
    })

    // Fetch full match details (need to see all players' heroes)
    const fullMatchesPromises = matches.slice(0, 100).map((m: any) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    
    const fullMatches = await Promise.all(fullMatchesPromises)
    
    // Build matchup data structure: { [playerHeroId]: { [enemyHeroId]: { games: number, wins: number } } }
    const matchupData: Record<number, Record<number, { games: number; wins: number }>> = {}
    
    fullMatches.forEach((match: any, matchIndex: number) => {
      if (!match?.players) return
      
      // Get the corresponding match from the list to find player_slot
      const listMatch = matches[matchIndex]
      if (!listMatch || listMatch.player_slot === undefined) return
      
      // Find the player in the match using player_slot (more reliable than account_id)
      const player = match.players.find((p: any) => 
        p.player_slot === listMatch.player_slot
      )
      
      if (!player || !player.hero_id) return
      
      const playerHeroId = player.hero_id
      const playerTeam = listMatch.player_slot < 128 ? 'radiant' : 'dire'
      const playerWon = listMatch.radiant_win !== undefined 
        ? ((playerTeam === 'radiant' && listMatch.radiant_win) || (playerTeam === 'dire' && !listMatch.radiant_win))
        : ((playerTeam === 'radiant' && match.radiant_win) || (playerTeam === 'dire' && !match.radiant_win))
      
      // Initialize player hero if not exists
      if (!matchupData[playerHeroId]) {
        matchupData[playerHeroId] = {}
      }
      
      // Get enemy team heroes
      const enemyPlayers = match.players.filter((p: any) => {
        const pTeam = p.player_slot < 128 ? 'radiant' : 'dire'
        return pTeam !== playerTeam && p.hero_id
      })
      
      // Count matchup against each enemy hero
      enemyPlayers.forEach((enemy: any) => {
        const enemyHeroId = enemy.hero_id
        
        if (!matchupData[playerHeroId][enemyHeroId]) {
          matchupData[playerHeroId][enemyHeroId] = { games: 0, wins: 0 }
        }
        
        matchupData[playerHeroId][enemyHeroId].games += 1
        if (playerWon) {
          matchupData[playerHeroId][enemyHeroId].wins += 1
        }
      })
    })
    
    // Transform to response format
    const matchups: Array<{
      playerHeroId: number
      playerHeroName: string
      playerHeroInternalName: string
      matchups: Array<{
        enemyHeroId: number
        enemyHeroName: string
        enemyHeroInternalName: string
        games: number
        wins: number
        winrate: number
      }>
      totalMatchups: number
    }> = []
    
    Object.keys(matchupData).forEach(playerHeroIdStr => {
      const playerHeroId = parseInt(playerHeroIdStr)
      const playerHero = heroesMap[playerHeroId]
      const enemyMatchups = matchupData[playerHeroId]
      
      const matchupList = Object.keys(enemyMatchups)
        .map(enemyHeroIdStr => {
          const enemyHeroId = parseInt(enemyHeroIdStr)
          const enemyHero = heroesMap[enemyHeroId]
          const stats = enemyMatchups[enemyHeroId]
          const winrate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0
          
          return {
            enemyHeroId,
            enemyHeroName: enemyHero?.localized_name || `Hero ${enemyHeroId}`,
            enemyHeroInternalName: enemyHero?.name || `npc_dota_hero_${enemyHeroId}`,
            games: stats.games,
            wins: stats.wins,
            winrate: parseFloat(winrate.toFixed(2)),
          }
        })
        .filter(m => m.games >= 2) // Only show matchups with 2+ games for relevance
        .sort((a, b) => b.games - a.games) // Sort by games played
      
      if (matchupList.length > 0 && playerHero) {
        matchups.push({
          playerHeroId,
          playerHeroName: playerHero.localized_name,
          playerHeroInternalName: playerHero.name,
          matchups: matchupList,
          totalMatchups: matchupList.length,
        })
      }
    })
    
    // Sort by most played hero first
    matchups.sort((a, b) => {
      const aTotalGames = a.matchups.reduce((sum, m) => sum + m.games, 0)
      const bTotalGames = b.matchups.reduce((sum, m) => sum + m.games, 0)
      return bTotalGames - aTotalGames
    })
    
    // Calculate summary
    const totalHeroes = matchups.length
    const totalMatchups = matchups.reduce((sum, m) => sum + m.totalMatchups, 0)
    const totalMatches = fullMatches.filter(m => m !== null).length
    
    // Generate insights
    const insights: string[] = []
    
    // Find best and worst matchups overall
    const allMatchupsFlat: Array<{ playerHero: string; enemyHero: string; winrate: number; games: number }> = []
    matchups.forEach(m => {
      m.matchups.forEach(enemy => {
        allMatchupsFlat.push({
          playerHero: m.playerHeroName,
          enemyHero: enemy.enemyHeroName,
          winrate: enemy.winrate,
          games: enemy.games,
        })
      })
    })
    
    const bestMatchups = allMatchupsFlat
      .filter(m => m.games >= 3 && m.winrate >= 70)
      .sort((a, b) => b.winrate - a.winrate)
      .slice(0, 3)
    
    const worstMatchups = allMatchupsFlat
      .filter(m => m.games >= 3 && m.winrate <= 30)
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 3)
    
    if (bestMatchups.length > 0) {
      insights.push(`Matchup forti: ${bestMatchups.map(m => `${m.playerHero} vs ${m.enemyHero} (${m.winrate.toFixed(1)}%)`).join(', ')}`)
    }
    
    if (worstMatchups.length > 0) {
      insights.push(`Matchup difficili: ${worstMatchups.map(m => `${m.playerHero} vs ${m.enemyHero} (${m.winrate.toFixed(1)}%)`).join(', ')}`)
    }
    
    return NextResponse.json({
      matchups: matchups.slice(0, 20), // Top 20 heroes with most matchup data
      summary: {
        totalMatches,
        totalHeroes,
        totalMatchups,
      },
      insights,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching matchups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

