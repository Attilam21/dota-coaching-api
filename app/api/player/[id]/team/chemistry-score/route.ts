import { NextRequest, NextResponse } from 'next/server'

interface Teammate {
  account_id: number
  games: number
  win: number
  personaname?: string
}

interface ChemistryScore {
  score: number // 0-100
  breakdown: {
    winrate: { value: number; weight: number; contribution: number }
    communication: { value: number; weight: number; contribution: number }
    roleCompatibility: { value: number; weight: number; contribution: number }
    timeTogether: { value: number; weight: number; contribution: number }
    recentForm: { value: number; weight: number; contribution: number }
  }
  label: string
  color: string
  insights: string[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch peers (teammates)
    const peersResponse = await fetch(`https://api.opendota.com/api/players/${id}/peers`, {
      next: { revalidate: 3600 }
    })
    
    if (!peersResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch teammates' },
        { status: peersResponse.status }
      )
    }

    const peers: Teammate[] = await peersResponse.json()
    
    if (!peers || peers.length === 0) {
      return NextResponse.json({
        score: 0,
        breakdown: {
          winrate: { value: 0, weight: 40, contribution: 0 },
          communication: { value: 0, weight: 20, contribution: 0 },
          roleCompatibility: { value: 0, weight: 20, contribution: 0 },
          timeTogether: { value: 0, weight: 10, contribution: 0 },
          recentForm: { value: 0, weight: 10, contribution: 0 },
        },
        label: 'Nessun Dato',
        color: 'gray',
        insights: ['Non ci sono abbastanza dati per calcolare il Team Chemistry Score']
      })
    }

    // Filter valid teammates (min 5 games)
    const validTeammates = peers.filter(p => p.games >= 5)
    
    if (validTeammates.length === 0) {
      return NextResponse.json({
        score: 0,
        breakdown: {
          winrate: { value: 0, weight: 40, contribution: 0 },
          communication: { value: 0, weight: 20, contribution: 0 },
          roleCompatibility: { value: 0, weight: 20, contribution: 0 },
          timeTogether: { value: 0, weight: 10, contribution: 0 },
          recentForm: { value: 0, weight: 10, contribution: 0 },
        },
        label: 'Dati Insufficienti',
        color: 'gray',
        insights: ['Gioca almeno 5 partite con i tuoi compagni per calcolare il Team Chemistry Score']
      })
    }

    // 1. Winrate Component (40% weight)
    const totalGames = validTeammates.reduce((sum, t) => sum + t.games, 0)
    const totalWins = validTeammates.reduce((sum, t) => sum + t.win, 0)
    const avgWinrate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0
    const winrateScore = Math.min(avgWinrate * 1.2, 100) // Scale to 100 (83% winrate = 100 score)

    // 2. Communication Component (20% weight) - Based on games played together
    // More games = better communication (assumed)
    const maxGames = Math.max(...validTeammates.map(t => t.games), 0)
    const avgGames = totalGames / validTeammates.length
    const communicationScore = Math.min((avgGames / Math.max(maxGames, 1)) * 100, 100)

    // 3. Role Compatibility (20% weight) - Fetch matches to analyze roles
    // For now, we'll use a simplified metric based on winrate consistency
    const winrates = validTeammates.map(t => (t.win / t.games) * 100)
    const winrateVariance = winrates.length > 1
      ? winrates.reduce((sum, wr) => sum + Math.pow(wr - avgWinrate, 2), 0) / winrates.length
      : 0
    // Lower variance = better compatibility (more consistent)
    const roleCompatibilityScore = Math.max(100 - (winrateVariance / 10), 0)

    // 4. Time Together (10% weight) - Based on number of teammates and total games
    const teammateDiversity = validTeammates.length
    const timeTogetherScore = Math.min((teammateDiversity / 20) * 100, 100) // Max at 20 teammates

    // 5. Recent Form (10% weight) - Would need recent matches, simplified for now
    // Use winrate as proxy for recent form
    const recentFormScore = avgWinrate

    // Calculate weighted score
    const score = Math.round(
      (winrateScore * 0.40) +
      (communicationScore * 0.20) +
      (roleCompatibilityScore * 0.20) +
      (timeTogetherScore * 0.10) +
      (recentFormScore * 0.10)
    )

    // Determine label and color
    let label = 'Eccellente'
    let color = 'green'
    if (score < 30) {
      label = 'Povera'
      color = 'red'
    } else if (score < 50) {
      label = 'Migliorabile'
      color = 'orange'
    } else if (score < 70) {
      label = 'Buona'
      color = 'yellow'
    } else if (score < 85) {
      label = 'Ottima'
      color = 'blue'
    }

    // Generate insights
    const insights: string[] = []
    if (avgWinrate >= 60) {
      insights.push(`Winrate eccezionale con i tuoi compagni: ${avgWinrate.toFixed(1)}%`)
    } else if (avgWinrate < 45) {
      insights.push(`Winrate bassa con i tuoi compagni: ${avgWinrate.toFixed(1)}% - Considera di cambiare team`)
    }
    
    if (validTeammates.length >= 10) {
      insights.push(`Hai un team stabile con ${validTeammates.length} compagni frequenti`)
    } else if (validTeammates.length < 5) {
      insights.push(`Team piccolo (${validTeammates.length} compagni) - Considera di espandere il pool`)
    }

    if (winrateVariance < 100) {
      insights.push('Sinergia consistente tra i compagni')
    }

    const breakdown: ChemistryScore['breakdown'] = {
      winrate: {
        value: avgWinrate,
        weight: 40,
        contribution: Math.round(winrateScore * 0.40)
      },
      communication: {
        value: avgGames,
        weight: 20,
        contribution: Math.round(communicationScore * 0.20)
      },
      roleCompatibility: {
        value: 100 - Math.min(winrateVariance / 10, 100),
        weight: 20,
        contribution: Math.round(roleCompatibilityScore * 0.20)
      },
      timeTogether: {
        value: teammateDiversity,
        weight: 10,
        contribution: Math.round(timeTogetherScore * 0.10)
      },
      recentForm: {
        value: avgWinrate,
        weight: 10,
        contribution: Math.round(recentFormScore * 0.10)
      }
    }

    return NextResponse.json({
      score,
      breakdown,
      label,
      color,
      insights,
      totalTeammates: validTeammates.length,
      totalGames,
      avgWinrate: avgWinrate.toFixed(1)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error calculating team chemistry score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

