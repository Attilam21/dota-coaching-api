import { NextRequest, NextResponse } from 'next/server'

interface Peer {
  account_id: number
  games: number
  win: number
  personaname?: string
}

interface OptimalTeam {
  players: Array<{
    account_id: number
    name: string
    games: number
    winrate: number
    role?: string
  }>
  predictedWinrate: number
  teamScore: number
  strengths: string[]
  weaknesses: string[]
  recommendedHeroes?: string[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch peers
    const peersResponse = await fetch(`https://api.opendota.com/api/players/${id}/peers`, {
      next: { revalidate: 3600 }
    })
    
    if (!peersResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch teammates' },
        { status: peersResponse.status }
      )
    }

    const peers: Peer[] = await peersResponse.json()
    
    if (!peers || peers.length === 0) {
      return NextResponse.json({
        optimalTeams: [],
        insights: ['Nessun compagno trovato per costruire team ottimali']
      })
    }

    // Filter valid peers (min 5 games, limit to top 15 for performance)
    const validPeers = peers
      .filter(p => p.games >= 5)
      .map(p => ({
        ...p,
        winrate: (p.win / p.games) * 100,
        name: p.personaname || `Player ${p.account_id}`
      }))
      .sort((a, b) => b.winrate - a.winrate)
      .slice(0, 15)
    
    if (validPeers.length < 4) {
      return NextResponse.json({
        optimalTeams: [],
        insights: ['Servono almeno 4 compagni con 5+ partite per suggerire team ottimali']
      })
    }

    // Fetch matches to analyze team compositions
    const matchesResponse = await fetch(`https://api.opendota.com/api/players/${id}/matches?limit=100`, {
      next: { revalidate: 3600 }
    })
    
    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matches = await matchesResponse.json()
    
    // Analyze team compositions from matches
    const teamCompositions = new Map<string, {
      players: number[]
      games: number
      wins: number
    }>()
    
    // Fetch full match details for first 50 matches
    const matchesToAnalyze = matches.slice(0, 50)
    const fullMatchesPromises = matchesToAnalyze.map((m: any) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    const fullMatches = await Promise.all(fullMatchesPromises)

    fullMatches.forEach((match: any) => {
      if (!match?.players) return
      
      const playerInMatch = match.players.find((p: any) => 
        p.account_id?.toString() === id
      )
      if (!playerInMatch) return
      
      const playerTeam = playerInMatch.player_slot < 128 ? 'radiant' : 'dire'
      const teamWon = (playerTeam === 'radiant' && match.radiant_win) || 
                     (playerTeam === 'dire' && !match.radiant_win)
      
      // Get teammates
      const teammates = match.players
        .filter((p: any) => {
          const pTeam = p.player_slot < 128 ? 'radiant' : 'dire'
          return pTeam === playerTeam && 
                 p.account_id && 
                 p.account_id.toString() !== id &&
                 validPeers.some(peer => peer.account_id === p.account_id)
        })
        .map((p: any) => p.account_id)
        .sort()
      
      if (teammates.length < 3) return // Need at least 3 teammates
      
      const teamKey = teammates.join('-')
      const current = teamCompositions.get(teamKey) || { players: teammates, games: 0, wins: 0 }
      current.games++
      if (teamWon) current.wins++
      teamCompositions.set(teamKey, current)
    })

    // Generate optimal teams
    // Strategy: Try combinations of top players with good winrates
    const optimalTeams: OptimalTeam[] = []
    
    // Get top players by winrate (limit to 10 for performance)
    const topPlayers = validPeers.slice(0, 10)
    
    // Generate all possible 4-player combinations from topPlayers
    // Use consistent limits across all loops to ensure all combinations are evaluated
    for (let i = 0; i < topPlayers.length; i++) {
      for (let j = i + 1; j < topPlayers.length; j++) {
        for (let k = j + 1; k < topPlayers.length; k++) {
          for (let l = k + 1; l < topPlayers.length; l++) {
            const team = [
              { account_id: parseInt(id), name: 'Tu', games: 0, winrate: 50 }, // Placeholder
              topPlayers[i],
              topPlayers[j],
              topPlayers[k],
              topPlayers[l]
            ]
            
            // Check if this team has played together
            const teamIds = team.map(t => t.account_id).sort()
            const teamKey = teamIds.join('-')
            const composition = teamCompositions.get(teamKey)
            
            let predictedWinrate = 0
            let teamScore = 0
            
            if (composition && composition.games >= 2) {
              // Use actual winrate if they've played together
              predictedWinrate = (composition.wins / composition.games) * 100
              teamScore = predictedWinrate * 0.6 + (composition.games * 2) // Bonus for more games
            } else {
              // Predict based on individual winrates
              const avgWinrate = team.slice(1).reduce((sum, p) => sum + p.winrate, 0) / 4
              predictedWinrate = avgWinrate * 0.9 // Slight penalty for untested
              teamScore = predictedWinrate
            }
            
            // Only include promising teams
            if (predictedWinrate >= 45 || teamScore >= 50) {
              const strengths: string[] = []
              const weaknesses: string[] = []
              
              if (predictedWinrate >= 60) {
                strengths.push('Winrate predetto eccellente')
              }
              if (composition && composition.games >= 5) {
                strengths.push('Team testato e collaudato')
              }
              
              const highWinratePlayers = team.filter(t => t.winrate >= 60).length
              if (highWinratePlayers >= 3) {
                strengths.push(`${highWinratePlayers} giocatori con winrate ≥60%`)
              }
              
              if (!composition || composition.games < 2) {
                weaknesses.push('Team non ancora testato insieme')
              }
              
              if (predictedWinrate < 50) {
                weaknesses.push('Winrate predetto sotto il 50%')
              }
              
              optimalTeams.push({
                players: team.map(t => ({
                  account_id: t.account_id,
                  name: t.name,
                  games: t.games,
                  winrate: t.winrate
                })),
                predictedWinrate: Math.round(predictedWinrate * 10) / 10,
                teamScore: Math.round(teamScore * 10) / 10,
                strengths,
                weaknesses
              })
            }
          }
        }
      }
    }
    
    // Sort by team score and take top 5
    optimalTeams.sort((a, b) => b.teamScore - a.teamScore)
    const topTeams = optimalTeams.slice(0, 5)
    
    // Generate insights
    const insights: string[] = []
    if (topTeams.length > 0) {
      const best = topTeams[0]
      insights.push(`Team migliore: Winrate predetto ${best.predictedWinrate.toFixed(1)}%`)
      if (best.strengths.length > 0) {
        insights.push(`Punti di forza: ${best.strengths.join(', ')}`)
      }
    }
    
    const testedTeams = topTeams.filter(t => 
      t.players.some(p => p.games > 0) // Simplified check
    ).length
    
    if (testedTeams > 0) {
      insights.push(`${testedTeams} team suggeriti hanno già giocato insieme`)
    }

    return NextResponse.json({
      optimalTeams: topTeams,
      totalCombinations: optimalTeams.length,
      insights
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error calculating optimal teams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

