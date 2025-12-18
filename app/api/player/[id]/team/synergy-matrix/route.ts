import { NextRequest, NextResponse } from 'next/server'

interface Peer {
  account_id: number
  games: number
  win: number
  personaname?: string
}

interface SynergyPair {
  player1_id: number
  player1_name: string
  player2_id: number
  player2_name: string
  games: number
  wins: number
  winrate: number
  synergy: 'excellent' | 'good' | 'average' | 'poor'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const minGames = 3 // Minimum games together to show in matrix
    
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
        matrix: [],
        topSynergies: [],
        insights: ['Nessun compagno trovato']
      })
    }

    // Filter valid peers (min games)
    const validPeers = peers.filter(p => p.games >= minGames).slice(0, 20) // Limit to top 20 for performance
    
    if (validPeers.length < 2) {
      return NextResponse.json({
        matrix: [],
        topSynergies: [],
        insights: ['Servono almeno 2 compagni con 3+ partite per la Synergy Matrix']
      })
    }

    // Fetch matches to find games where specific pairs played together
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
    
    // Fetch full match details for first 50 matches (for performance)
    const matchesToAnalyze = matches.slice(0, 50)
    const fullMatchesPromises = matchesToAnalyze.map((m: any) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    const fullMatches = await Promise.all(fullMatchesPromises)

    // Build synergy pairs
    const synergyMap = new Map<string, { games: number; wins: number }>()
    
    fullMatches.forEach((match: any) => {
      if (!match?.players) return
      
      // Find player in match
      const playerInMatch = match.players.find((p: any) => 
        p.account_id?.toString() === id
      )
      if (!playerInMatch) return
      
      const playerTeam = playerInMatch.player_slot < 128 ? 'radiant' : 'dire'
      const teamWon = (playerTeam === 'radiant' && match.radiant_win) || 
                     (playerTeam === 'dire' && !match.radiant_win)
      
      // Find teammates in same team
      const teammates = match.players.filter((p: any) => {
        const pTeam = p.player_slot < 128 ? 'radiant' : 'dire'
        return pTeam === playerTeam && 
               p.account_id && 
               p.account_id.toString() !== id &&
               validPeers.some(peer => peer.account_id === p.account_id)
      })
      
      // Create pairs
      for (let i = 0; i < teammates.length; i++) {
        for (let j = i + 1; j < teammates.length; j++) {
          const id1 = teammates[i].account_id
          const id2 = teammates[j].account_id
          const pairKey = [id1, id2].sort().join('-')
          
          const current = synergyMap.get(pairKey) || { games: 0, wins: 0 }
          current.games++
          if (teamWon) current.wins++
          synergyMap.set(pairKey, current)
        }
      }
    })

    // Convert to array and calculate winrates
    const synergyPairs: SynergyPair[] = []
    
    synergyMap.forEach((stats, pairKey) => {
      if (stats.games < minGames) return
      
      const [id1, id2] = pairKey.split('-').map(Number)
      const player1 = validPeers.find(p => p.account_id === id1)
      const player2 = validPeers.find(p => p.account_id === id2)
      
      if (!player1 || !player2) return
      
      const winrate = (stats.wins / stats.games) * 100
      let synergy: 'excellent' | 'good' | 'average' | 'poor' = 'average'
      if (winrate >= 65) synergy = 'excellent'
      else if (winrate >= 55) synergy = 'good'
      else if (winrate >= 45) synergy = 'average'
      else synergy = 'poor'
      
      synergyPairs.push({
        player1_id: id1,
        player1_name: player1.personaname || `Player ${id1}`,
        player2_id: id2,
        player2_name: player2.personaname || `Player ${id2}`,
        games: stats.games,
        wins: stats.wins,
        winrate,
        synergy
      })
    })

    // Sort by winrate
    synergyPairs.sort((a, b) => b.winrate - a.winrate)
    
    // Get top synergies
    const topSynergies = synergyPairs.slice(0, 5)
    
    // Generate insights
    const insights: string[] = []
    if (topSynergies.length > 0) {
      const best = topSynergies[0]
      insights.push(`Miglior sinergia: ${best.player1_name} + ${best.player2_name} (${best.winrate.toFixed(1)}% in ${best.games} partite)`)
    }
    
    const excellentSynergies = synergyPairs.filter(p => p.synergy === 'excellent')
    if (excellentSynergies.length > 0) {
      insights.push(`Hai ${excellentSynergies.length} coppie con sinergia eccellente (≥65% winrate)`)
    }

    return NextResponse.json({
      matrix: synergyPairs,
      topSynergies,
      totalPairs: synergyPairs.length,
      insights
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error calculating synergy matrix:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

