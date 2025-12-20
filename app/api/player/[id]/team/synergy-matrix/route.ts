import { NextRequest, NextResponse } from 'next/server'

interface Peer {
  account_id: number
  games: number
  win: number
  personaname?: string
  avatarfull?: string
}

interface SynergyPair {
  player1_id: number
  player1_name: string
  player1_avatar?: string
  player2_id: number
  player2_name: string
  player2_avatar?: string
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
    const minGamesTogether = 2 // Minimum games together to show a pair (lowered from 3)
    const minPeerGames = 2 // Minimum total games with peer to consider them
    
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
        totalPairs: 0,
        insights: ['Nessun compagno trovato. Gioca più partite con altri giocatori per vedere le sinergie.'],
        analyzedMatches: 0,
        validPeers: 0
      })
    }

    // Filter valid peers (lower threshold to include more)
    const validPeers = peers
      .filter(p => p.games >= minPeerGames)
      .sort((a, b) => b.games - a.games) // Sort by games played
      .slice(0, 25) // Increased from 20 to 25 for more combinations
    
    if (validPeers.length < 2) {
      return NextResponse.json({
        matrix: [],
        topSynergies: [],
        totalPairs: 0,
        insights: [`Servono almeno 2 compagni con ${minPeerGames}+ partite per la Synergy Matrix. Attualmente: ${peers.length} compagni trovati.`],
        analyzedMatches: 0,
        validPeers: validPeers.length
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
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        matrix: [],
        topSynergies: [],
        totalPairs: 0,
        insights: ['Nessuna partita trovata. Gioca più partite per vedere le sinergie.'],
        analyzedMatches: 0,
        validPeers: validPeers.length
      })
    }
    
    // Fetch full match details for more matches (increased from 50 to 100 for better coverage)
    const matchesToAnalyze = matches.slice(0, 100)
    const fullMatchesPromises = matchesToAnalyze.map((m: any) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )
    const fullMatches = await Promise.all(fullMatchesPromises)

    // Build synergy pairs - DON'T filter by validPeers first, find all pairs then filter
    const synergyMap = new Map<string, { games: number; wins: number }>()
    const allPeerIdsInMatches = new Set<number>() // Track all peer IDs we find in matches
    
    fullMatches.forEach((match: any) => {
      if (!match?.players) return
      
      // Find player in match - try both string and number comparison
      const playerInMatch = match.players.find((p: any) => 
        p.account_id && (p.account_id.toString() === id || p.account_id === parseInt(id))
      )
      if (!playerInMatch) return
      
      const playerTeam = playerInMatch.player_slot < 128 ? 'radiant' : 'dire'
      const teamWon = (playerTeam === 'radiant' && match.radiant_win) || 
                     (playerTeam === 'dire' && !match.radiant_win)
      
      // Find ALL teammates in same team (not just validPeers)
      // We'll filter later based on whether they're in validPeers
      const teammates = match.players.filter((p: any) => {
        if (!p.account_id) return false // Skip anonymous players
        const pTeam = p.player_slot < 128 ? 'radiant' : 'dire'
        const isSameTeam = pTeam === playerTeam
        const isNotPlayer = p.account_id.toString() !== id && p.account_id !== parseInt(id)
        return isSameTeam && isNotPlayer
      })
      
      // Track peer IDs found in matches
      teammates.forEach((t: any) => {
        if (t.account_id) allPeerIdsInMatches.add(t.account_id)
      })
      
      // Create pairs from ALL teammates (we'll filter by validPeers later)
      for (let i = 0; i < teammates.length; i++) {
        for (let j = i + 1; j < teammates.length; j++) {
          const id1 = teammates[i].account_id
          const id2 = teammates[j].account_id
          if (!id1 || !id2) continue
          
          const pairKey = [id1, id2].sort((a, b) => a - b).join('-')
          
          const current = synergyMap.get(pairKey) || { games: 0, wins: 0 }
          current.games++
          if (teamWon) current.wins++
          synergyMap.set(pairKey, current)
        }
      }
    })
    
    // Now filter to only include pairs where BOTH players are in validPeers
    const validPeerIds = new Set(validPeers.map(p => p.account_id))
    const filteredSynergyMap = new Map<string, { games: number; wins: number }>()
    
    synergyMap.forEach((stats, pairKey) => {
      const [id1, id2] = pairKey.split('-').map(Number)
      // Only include if both players are in validPeers
      if (validPeerIds.has(id1) && validPeerIds.has(id2)) {
        filteredSynergyMap.set(pairKey, stats)
      }
    })

    // Convert to array and calculate winrates
    const synergyPairs: SynergyPair[] = []
    
    filteredSynergyMap.forEach((stats, pairKey) => {
      if (stats.games < minGamesTogether) return
      
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
        player1_avatar: player1.avatarfull || undefined,
        player2_id: id2,
        player2_name: player2.personaname || `Player ${id2}`,
        player2_avatar: player2.avatarfull || undefined,
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
    if (synergyPairs.length === 0) {
      const totalPairsFound = synergyMap.size
      const validPairsFound = filteredSynergyMap.size
      insights.push(`Nessuna coppia trovata con almeno ${minGamesTogether} partite insieme nelle ultime ${matchesToAnalyze.length} partite analizzate.`)
      if (totalPairsFound > 0) {
        insights.push(`Trovate ${totalPairsFound} coppie totali, ${validPairsFound} con compagni validi.`)
      }
      if (allPeerIdsInMatches.size > 0) {
        insights.push(`Trovati ${allPeerIdsInMatches.size} compagni diversi nelle partite analizzate.`)
      }
      insights.push(`Suggerimento: Gioca più partite con gli stessi compagni per vedere le sinergie.`)
    } else {
      if (topSynergies.length > 0) {
        const best = topSynergies[0]
        insights.push(`Miglior sinergia: ${best.player1_name} + ${best.player2_name} (${best.winrate.toFixed(1)}% in ${best.games} partite)`)
      }
      
      const excellentSynergies = synergyPairs.filter(p => p.synergy === 'excellent')
      if (excellentSynergies.length > 0) {
        insights.push(`Hai ${excellentSynergies.length} coppie con sinergia eccellente (≥65% winrate)`)
      }
      
      insights.push(`Analizzate ${matchesToAnalyze.length} partite, trovate ${synergyPairs.length} coppie valide.`)
    }

    return NextResponse.json({
      matrix: synergyPairs,
      topSynergies,
      totalPairs: synergyPairs.length,
      insights,
      analyzedMatches: matchesToAnalyze.length,
      validPeers: validPeers.length
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
