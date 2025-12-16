import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch both basic and advanced stats
    const [statsResponse, advancedStatsResponse] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/player/${id}/stats`),
      fetch(`${request.nextUrl.origin}/api/player/${id}/advanced-stats`)
    ])
    
    if (!statsResponse.ok || !advancedStatsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      )
    }

    const statsData = await statsResponse.json()
    const advancedData = await advancedStatsResponse.json()

    if (!statsData.stats || !advancedData.stats) {
      return NextResponse.json({
        role: 'Unknown',
        playstyle: 'Unknown',
        strengths: [],
        weaknesses: [],
        recommendations: [],
        radarData: []
      })
    }

    const stats = statsData.stats
    const advanced = advancedData.stats
    const matches = stats.matches || []

    // Calculate comprehensive metrics
    const avgGPM = matches.reduce((acc: number, m: { gpm: number }) => acc + m.gpm, 0) / matches.length || 0
    const avgXPM = matches.reduce((acc: number, m: { xpm: number }) => acc + m.xpm, 0) / matches.length || 0
    const avgKDA = matches.reduce((acc: number, m: { kda: number }) => acc + m.kda, 0) / matches.length || 0
    const winrate = stats.winrate.last10 || 0
    const avgDeaths = advanced.fights?.avgDeaths || 0
    
    // Determine role based on multiple factors
    let role = 'Core'
    let roleConfidence = 'medium'
    
    if (avgGPM > 550 && avgKDA > 2.5) {
      role = 'Carry'
      roleConfidence = 'high'
    } else if (avgGPM > 500 && avgKDA > 2) {
      role = 'Mid'
      roleConfidence = 'high'
    } else if (avgGPM < 400 && advanced.fights.avgAssists > 10) {
      role = 'Support'
      roleConfidence = 'high'
    } else if (avgGPM < 450 && advanced.vision.avgObserverPlaced > 5) {
      role = 'Support'
      roleConfidence = 'medium'
    } else if (avgGPM > 450 && avgGPM < 550) {
      role = 'Offlane'
      roleConfidence = 'medium'
    }

    // Determine playstyle
    let playstyle = 'Bilanciato'
    if (avgKDA > 3 && advanced.fights.avgHeroDamage > 15000) {
      playstyle = 'Aggressivo - Teamfight Focus'
    } else if (avgGPM > 600 && advanced.farm.goldUtilization > 90) {
      playstyle = 'Farm Focus - Late Game'
    } else if (advanced.fights.killParticipation > 70 && avgKDA > 2.5) {
      playstyle = 'Team Player - High Impact'
    } else if (avgKDA < 1.5 && avgDeaths > 8) {
      playstyle = 'Rischioso - High Risk/High Reward'
    } else if (avgGPM < 400 && advanced.vision.avgObserverPlaced > 6) {
      playstyle = 'Support - Utility Focus'
    }

    // Generate strengths
    const strengths: string[] = []
    if (avgGPM > 500) strengths.push(`Eccellente farm rate (${avgGPM.toFixed(0)} GPM)`)
    if (avgKDA > 2.5) strengths.push(`Buona performance KDA (${avgKDA.toFixed(2)})`)
    if (winrate > 55) strengths.push(`Winrate positivo (${winrate.toFixed(1)}%)`)
    if (advanced.fights.killParticipation > 70) strengths.push(`Alta partecipazione ai fight (${advanced.fights.killParticipation.toFixed(1)}%)`)
    if (advanced.lane.denyRate > 15) strengths.push(`Ottimo deny rate (${advanced.lane.denyRate.toFixed(1)}%)`)
    if (advanced.farm.goldUtilization > 90) strengths.push(`Efficiente utilizzo del gold (${advanced.farm.goldUtilization.toFixed(1)}%)`)
    if (advanced.vision.avgObserverPlaced > 6 && avgGPM < 450) strengths.push(`Buon warding (${advanced.vision.avgObserverPlaced.toFixed(1)} wards/game)`)
    if (advanced.fights.avgTowerDamage > 1000) strengths.push(`Buon push damage (${Math.round(advanced.fights.avgTowerDamage)})`)
    if (advanced.lane.firstBloodInvolvement > 30) strengths.push(`Alta presenza in early game (${advanced.lane.firstBloodInvolvement.toFixed(1)}% FB)`)
    if (avgDeaths < 5) strengths.push(`Buona sopravvivenza (${avgDeaths.toFixed(1)} morti/game)`)

    // Generate weaknesses
    const weaknesses: string[] = []
    if (avgGPM < 450 && role !== 'Support') weaknesses.push(`Farm rate basso (${avgGPM.toFixed(0)} GPM)`)
    if (avgKDA < 2 && role !== 'Support') weaknesses.push(`KDA migliorabile (${avgKDA.toFixed(2)})`)
    if (winrate < 45) weaknesses.push(`Winrate negativo (${winrate.toFixed(1)}%)`)
    if (avgDeaths > 7) weaknesses.push(`Troppe morti (${avgDeaths.toFixed(1)}/game)`)
    if (advanced.fights.killParticipation < 50) weaknesses.push(`Bassa partecipazione ai fight (${advanced.fights.killParticipation.toFixed(1)}%)`)
    if (advanced.lane.denyRate < 5 && avgGPM > 400) weaknesses.push(`Deny rate basso (${advanced.lane.denyRate.toFixed(1)}%)`)
    if (advanced.farm.goldUtilization < 80) weaknesses.push(`Utilizzo gold inefficiente (${advanced.farm.goldUtilization.toFixed(1)}%)`)
    if (advanced.vision.avgObserverPlaced < 3 && avgGPM < 450) weaknesses.push(`Warding insufficiente (${advanced.vision.avgObserverPlaced.toFixed(1)} wards/game)`)
    if (advanced.fights.avgTowerDamage < 300 && role !== 'Support') weaknesses.push(`Tower damage basso (${Math.round(advanced.fights.avgTowerDamage)})`)
    if (advanced.lane.avgLastHits < 40 && role !== 'Support') weaknesses.push(`Last hits bassi (${advanced.lane.avgLastHits.toFixed(1)}/game)`)

    // Generate recommendations
    const recommendations: string[] = []
    
    if (avgGPM < 450 && role !== 'Support') {
      recommendations.push('Concentrati sul migliorare il farm rate. Pratica il last hitting e la gestione delle lane.')
    }
    
    if (avgDeaths > 7) {
      recommendations.push('Riduci le morti migliorando il positioning e la mappa awareness. Evita posizioni pericolose senza visione.')
    }
    
    if (advanced.fights.killParticipation < 60) {
      recommendations.push('Aumenta la partecipazione ai teamfight. Sii più presente quando il team si raggruppa per obiettivi.')
    }
    
    if (advanced.lane.denyRate < 10 && avgGPM > 400) {
      recommendations.push('Migliora il deny rate per limitare l\'XP dell\'avversario in lane. Pratica il timing dei deny.')
    }
    
    if (advanced.farm.goldUtilization < 85) {
      recommendations.push('Spendi il gold più efficacemente. Compra item utili invece di accumulare gold inutilizzato.')
    }
    
    if (advanced.vision.avgObserverPlaced < 4 && avgGPM < 450) {
      recommendations.push('Aumenta il warding. Le wards sono cruciali per la mappa awareness e la sicurezza del team.')
    }
    
    if (advanced.fights.avgTowerDamage < 500 && role !== 'Support') {
      recommendations.push('Concentrati di più sul push delle torri. Il tower damage è cruciale per chiudere le partite.')
    }
    
    if (winrate < 50) {
      recommendations.push('Analizza le tue partite perse per identificare pattern comuni. Focus su decision making e team coordination.')
    }

    // Generate radar chart data
    const radarData = [
      { 
        subject: 'Farm', 
        value: Math.min((avgGPM / 600) * 100, 100),
        fullMark: 100 
      },
      { 
        subject: 'Teamfight', 
        value: Math.min(advanced.fights.killParticipation, 100),
        fullMark: 100 
      },
      { 
        subject: 'Survival', 
        value: Math.max(100 - (avgDeaths * 10), 0),
        fullMark: 100 
      },
      { 
        subject: 'Impact', 
        value: Math.min((avgKDA / 4) * 100, 100),
        fullMark: 100 
      },
      { 
        subject: 'Vision', 
        value: Math.min((advanced.vision.avgObserverPlaced / 8) * 100, 100),
        fullMark: 100 
      },
      { 
        subject: 'Winrate', 
        value: winrate,
        fullMark: 100 
      },
    ]

    return NextResponse.json({
      role,
      roleConfidence,
      playstyle,
      strengths: strengths.slice(0, 5), // Max 5 strengths
      weaknesses: weaknesses.slice(0, 5), // Max 5 weaknesses
      recommendations: recommendations.slice(0, 6), // Max 6 recommendations
      radarData,
      metrics: {
        avgGPM: avgGPM.toFixed(0),
        avgKDA: avgKDA.toFixed(2),
        winrate: winrate.toFixed(1),
        avgDeaths: avgDeaths.toFixed(1),
        killParticipation: advanced.fights.killParticipation.toFixed(1),
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error generating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

