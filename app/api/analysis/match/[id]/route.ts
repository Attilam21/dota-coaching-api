import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch match data from OpenDota
    const response = await fetch(`https://api.opendota.com/api/matches/${id}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const match = await response.json()
    
    interface Player {
      kills: number
      deaths: number
      assists: number
      gold_per_min?: number
      xp_per_min?: number
      hero_id?: number
      [key: string]: unknown
    }
    
    // Calculate team statistics
    const radiantPlayers = (match.players as Player[]).slice(0, 5)
    const direPlayers = (match.players as Player[]).slice(5, 10)
    
    const radiantAvgGpm = radiantPlayers.reduce((sum: number, p: Player) => sum + (p.gold_per_min || 0), 0) / 5
    const direAvgGpm = direPlayers.reduce((sum: number, p: Player) => sum + (p.gold_per_min || 0), 0) / 5
    
    const radiantAvgKda = radiantPlayers.reduce((sum: number, p: Player) => sum + (p.kills + p.assists) / Math.max(p.deaths, 1), 0) / 5
    const direAvgKda = direPlayers.reduce((sum: number, p: Player) => sum + (p.kills + p.assists) / Math.max(p.deaths, 1), 0) / 5

    // Generate recommendations based on match data
    const recommendations: string[] = []
    
    if (match.duration < 1800) { // Less than 30 minutes
      recommendations.push('Partita conclusa rapidamente. Valuta se il team ha sfruttato correttamente i vantaggi iniziali.')
    } else if (match.duration > 3600) { // More than 60 minutes
      recommendations.push('Partita molto lunga. Analizza le decisioni in late game e la gestione delle risorse.')
    }
    
    const winningTeam = match.radiant_win ? radiantPlayers : direPlayers
    const losingTeam = match.radiant_win ? direPlayers : radiantPlayers
    
    const winningAvgGpm = match.radiant_win ? radiantAvgGpm : direAvgGpm
    const losingAvgGpm = match.radiant_win ? direAvgGpm : radiantAvgGpm
    
    if (winningAvgGpm > losingAvgGpm * 1.2) {
      recommendations.push('Il team vincente ha dominato la fase di farm. Migliora la gestione del gold e la priorità degli obiettivi.')
    }
    
    // Analyze individual player performance
    const playerPerformance = (match.players as Player[]).map((player: Player) => {
      const kda = (player.kills + player.assists) / Math.max(player.deaths, 1)
      const goldPerMin = player.gold_per_min || 0
      const isCarry = goldPerMin > 500
      const isSupport = goldPerMin < 300 && player.assists > player.kills
      
      let rating = 'needs improvement'
      if (kda > 2 && player.deaths < 5) {
        rating = 'good'
      } else if (kda > 1.5 && player.deaths < 7) {
        rating = 'average'
      }
      
      // Role-specific recommendations
      const roleRecommendations: string[] = []
      if (isCarry && goldPerMin < 400) {
        roleRecommendations.push('Come carry, concentrati sul migliorare il farm rate.')
      }
      if (isSupport && player.assists < 10) {
        roleRecommendations.push('Come support, aumenta la partecipazione ai teamfight.')
      }
      if (player.deaths > 10) {
        roleRecommendations.push('Troppe morti. Migliora il positioning e la mappa awareness.')
      }
      
      return {
        heroId: player.hero_id,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        gpm: goldPerMin,
        xpm: player.xp_per_min || 0,
        kda: kda.toFixed(2),
        rating,
        roleRecommendations,
      }
    })

    // Key moments (simulated based on match duration)
    const keyMoments = [
      {
        time: 0,
        event: 'Match Started',
        description: 'La partita è iniziata',
      },
    ]
    
    if (match.duration > 600) {
      keyMoments.push({
        time: 600,
        event: 'Early Game',
        description: 'Fine della fase di laning. Valuta le decisioni prese in questa fase.',
      })
    }
    
    if (match.duration > 1800) {
      keyMoments.push({
        time: 1800,
        event: 'Mid Game',
        description: 'Fase centrale della partita. Controllo mappa e obiettivi cruciali.',
      })
    }

    // Generate overview
    const overview = `Partita durata ${Math.floor(match.duration / 60)} minuti e ${match.duration % 60} secondi. ` +
      `Vittoria ${match.radiant_win ? 'Radiant' : 'Dire'}. ` +
      `Il team vincente ha mantenuto una media GPM di ${Math.round(match.radiant_win ? radiantAvgGpm : direAvgGpm)} ` +
      `rispetto ai ${Math.round(match.radiant_win ? direAvgGpm : radiantAvgGpm)} del team sconfitto.`

    const analysis = {
      matchId: id,
      duration: match.duration,
      radiantWin: match.radiant_win,
      overview,
      keyMoments,
      recommendations,
      playerPerformance,
      teamStats: {
        radiant: {
          avgGpm: Math.round(radiantAvgGpm),
          avgKda: radiantAvgKda.toFixed(2),
        },
        dire: {
          avgGpm: Math.round(direAvgGpm),
          avgKda: direAvgKda.toFixed(2),
        },
      },
    }
    
    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error analyzing match:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}