import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Validate player ID format
    if (!id || id.trim() === '' || isNaN(Number(id.trim()))) {
      return NextResponse.json(
        { error: 'Invalid player ID format. Please provide a valid numeric player ID.' },
        { status: 400 }
      )
    }
    
    const playerId = id.trim()
    
    // Fetch both basic and advanced stats
    // Come nella versione backup: usa fetch normale con request.nextUrl.origin
    const [statsResponse, advancedStatsResponse] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/player/${playerId}/stats`),
      fetch(`${request.nextUrl.origin}/api/player/${playerId}/advanced-stats`)
    ])
    
    // Fetch OpenDota separatamente (non blocca se fallisce)
    let opendotaData: any = null
    try {
      const { fetchOpenDota } = await import('@/lib/opendota')
      opendotaData = await fetchOpenDota<any>(`/players/${playerId}`)
    } catch (err) {
      // Non bloccare se OpenDota fallisce
      opendotaData = null
    }
    
    // Parse responses safely - come nella versione backup
    let statsData: any = null
    let advancedData: any = null
    
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
    
    // opendotaData già parsato sopra
    
    // Validate statsData structure - use default stats if missing (resilient fallback)
    const defaultStats = {
      winrate: { last5: 0, last10: 0, delta: 0 },
      kda: { last5: 0, last10: 0, delta: 0 },
      farm: { gpm: { last5: 0, last10: 0 }, xpm: { last5: 0, last10: 0 } },
      matches: [],
    }
    
    const stats = statsData?.stats || defaultStats
    const warnings: string[] = []
    
    if (!statsData?.stats) {
      warnings.push('Basic player stats not available, using default values')
    }

    // Advanced stats are optional but preferred
    if (!advancedData?.stats) {
      console.warn('Advanced stats not available, using basic stats only')
      warnings.push('Advanced stats not available, using basic stats only')
    }
    const advanced = advancedData?.stats || {
      lane: { avgLastHits: 0, avgDenies: 0, firstBloodInvolvement: 0, denyRate: 0 },
      farm: { avgGPM: 0, avgXPM: 0, goldUtilization: 0, avgNetWorth: 0, avgBuybacks: 0 },
      fights: { killParticipation: 0, avgHeroDamage: 0, avgTowerDamage: 0, avgDeaths: 0, avgAssists: 0 },
      vision: { avgObserverPlaced: 0, avgObserverKilled: 0, avgSentryPlaced: 0, wardEfficiency: 0 }
    }
    // Come nella versione backup: usa solo stats.matches
    const matches = stats.matches || []

    // Calculate comprehensive metrics - prioritize stats.farm (already calculated averages)
    // Then fallback to matches calculation, then advanced stats
    let avgGPM = 0
    let avgXPM = 0
    
    // Priority 1: Use pre-calculated stats from stats endpoint
    if (stats?.farm?.gpm?.last10 && stats.farm.gpm.last10 > 0) {
      avgGPM = stats.farm.gpm.last10
    }
    if (stats?.farm?.xpm?.last10 && stats.farm.xpm.last10 > 0) {
      avgXPM = stats.farm.xpm.last10
    }
    
    // Priority 2: Calculate from matches if stats not available
    if (avgGPM === 0 && matches.length > 0) {
      const validGPM = matches.filter((m: any) => {
        const gpm = m.gpm || m.gold_per_min || 0
        return gpm > 0
      })
      if (validGPM.length > 0) {
        avgGPM = validGPM.reduce((acc: number, m: any) => {
          const gpm = m.gpm || m.gold_per_min || 0
          return acc + gpm
        }, 0) / validGPM.length
      }
    }
    
    if (avgXPM === 0 && matches.length > 0) {
      const validXPM = matches.filter((m: any) => {
        const xpm = m.xpm || m.xp_per_min || 0
        return xpm > 0
      })
      if (validXPM.length > 0) {
        avgXPM = validXPM.reduce((acc: number, m: any) => {
          const xpm = m.xpm || m.xp_per_min || 0
          return acc + xpm
        }, 0) / validXPM.length
      }
    }
    
    // Priority 3: Final fallback to advanced stats
    if (avgGPM === 0 && advanced?.farm?.avgGPM && advanced.farm.avgGPM > 0) {
      avgGPM = advanced.farm.avgGPM
    }
    if (avgXPM === 0 && advanced?.farm?.avgXPM && advanced.farm.avgXPM > 0) {
      avgXPM = advanced.farm.avgXPM
    }
    // Prevent division by zero
    const avgKDA = matches.length > 0 
      ? matches.reduce((acc: number, m: { kda: number }) => acc + (m.kda || 0), 0) / matches.length 
      : 0
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

    // Calculate AttilaLAB Score (0-100 comprehensive score)
    const farmScore = Math.min((avgGPM / 600) * 100, 100) * 0.20
    const teamfightScore = Math.min(advanced.fights.killParticipation, 100) * 0.20
    const survivalScore = Math.max(100 - (avgDeaths * 10), 0) * 0.15
    const impactScore = Math.min((avgKDA / 4) * 100, 100) * 0.20
    const visionScore = Math.min((advanced.vision.avgObserverPlaced / 8) * 100, 100) * 0.10
    const winrateScore = winrate * 0.15
    const fzthScore = Math.round(farmScore + teamfightScore + survivalScore + impactScore + visionScore + winrateScore)

    // Calculate trend (compare last 5 vs last 10)
    const recent5 = matches.slice(0, 5)
    const recent10 = matches.slice(5, 10)
    const avgGPM5 = recent5.length > 0 ? recent5.reduce((acc: number, m: any) => acc + (m.gpm || m.gold_per_min || 0), 0) / recent5.length : 0
    const avgGPM10 = recent10.length > 0 ? recent10.reduce((acc: number, m: any) => acc + (m.gpm || m.gold_per_min || 0), 0) / recent10.length : 0
    const avgXPM5 = recent5.length > 0 ? recent5.reduce((acc: number, m: any) => acc + (m.xpm || m.xp_per_min || 0), 0) / recent5.length : 0
    const avgXPM10 = recent10.length > 0 ? recent10.reduce((acc: number, m: any) => acc + (m.xpm || m.xp_per_min || 0), 0) / recent10.length : 0
    const avgKDA5 = recent5.length > 0 ? recent5.reduce((acc: number, m: { kda: number }) => acc + (m.kda || 0), 0) / recent5.length : 0
    const avgKDA10 = recent10.length > 0 ? recent10.reduce((acc: number, m: { kda: number }) => acc + (m.kda || 0), 0) / recent10.length : 0
    const winrate5 = recent5.length > 0 ? (recent5.filter((m: { win: boolean }) => m.win).length / recent5.length) * 100 : 0
    const winrate10 = recent10.length > 0 ? (recent10.filter((m: { win: boolean }) => m.win).length / recent10.length) * 100 : 0

    const trends = {
      gpm: { 
        value: avgGPM5 - avgGPM10, 
        direction: avgGPM5 > avgGPM10 ? 'up' : avgGPM5 < avgGPM10 ? 'down' : 'stable',
        label: avgGPM5 > avgGPM10 ? 'Miglioramento' : avgGPM5 < avgGPM10 ? 'Peggioramento' : 'Stabile'
      },
      xpm: {
        value: avgXPM5 - avgXPM10,
        direction: avgXPM5 > avgXPM10 ? 'up' : avgXPM5 < avgXPM10 ? 'down' : 'stable',
        label: avgXPM5 > avgXPM10 ? 'Miglioramento' : avgXPM5 < avgXPM10 ? 'Peggioramento' : 'Stabile'
      },
      kda: { 
        value: avgKDA5 - avgKDA10, 
        direction: avgKDA5 > avgKDA10 ? 'up' : avgKDA5 < avgKDA10 ? 'down' : 'stable',
        label: avgKDA5 > avgKDA10 ? 'Miglioramento' : avgKDA5 < avgKDA10 ? 'Peggioramento' : 'Stabile'
      },
      winrate: { 
        value: winrate5 - winrate10, 
        direction: winrate5 > winrate10 ? 'up' : winrate5 < winrate10 ? 'down' : 'stable',
        label: winrate5 > winrate10 ? 'Miglioramento' : winrate5 < winrate10 ? 'Peggioramento' : 'Stabile'
      }
    }

    // Identify patterns
    const patterns: string[] = []
    if (avgGPM > 550 && advanced.fights.killParticipation < 50) {
      patterns.push('Farm Focus - Bassa partecipazione teamfight')
    }
    if (advanced.fights.killParticipation > 70 && avgDeaths > 7) {
      patterns.push('Alta aggressività - Alta mortalità')
    }
    if (advanced.lane.firstBloodInvolvement > 30 && winrate > 55) {
      patterns.push('Early Game Dominator')
    }
    if (advanced.farm.goldUtilization > 90 && avgGPM > 500) {
      patterns.push('Efficiente gestione risorse')
    }
    if (avgDeaths < 5 && advanced.fights.avgHeroDamage > 12000) {
      patterns.push('Alto impatto con buona sopravvivenza')
    }

    // Phase analysis (simplified - based on overall stats)
    const phaseAnalysis = {
      early: {
        score: (advanced.lane.avgLastHits / 80) * 100 + (advanced.lane.firstBloodInvolvement / 50) * 100,
        strength: advanced.lane.avgLastHits > 50 ? 'Forti' : 'Da migliorare'
      },
      mid: {
        score: (advanced.fights.killParticipation / 100) * 100 + (avgGPM / 600) * 100,
        strength: advanced.fights.killParticipation > 60 ? 'Forti' : 'Da migliorare'
      },
      late: {
        score: (winrate / 100) * 100 + (advanced.farm.goldUtilization / 100) * 100,
        strength: advanced.farm.goldUtilization > 85 ? 'Forti' : 'Da migliorare'
      }
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

    // Trend data for chart (last 20 matches)
    const trendData = matches.slice(0, 20).reverse().map((m: any, idx: number) => ({
      match: `M${20 - idx}`,
      gpm: m.gpm || m.gold_per_min || 0,
      xpm: m.xpm || m.xp_per_min || 0,
      kda: m.kda || 0,
      winrate: m.win ? 100 : 0,
    }))

    // Extract avatar and rank from OpenDota data
    const avatar = opendotaData?.profile?.avatarfull || null
    const personaname = opendotaData?.profile?.personaname || null
    const rankTier = opendotaData?.rank_tier || 0
    const soloMMR = opendotaData?.solo_competitive_rank || null
    const rankMedalUrl = rankTier > 0 
      ? `https://steamcdn-a.akamaihd.net/apps/dota2/images/rank_icons/rank_icon_${rankTier}.png`
      : null

    const response: any = {
      role,
      roleConfidence,
      playstyle,
      strengths: strengths.slice(0, 8), // Increased to 8
      weaknesses: weaknesses.slice(0, 8), // Increased to 8
      recommendations: recommendations.slice(0, 8), // Increased to 8
      radarData,
      metrics: {
        avgGPM: avgGPM > 0 ? avgGPM.toFixed(0) : '0',
        avgXPM: avgXPM > 0 ? avgXPM.toFixed(0) : '0',
        avgKDA: avgKDA.toFixed(2),
        winrate: winrate.toFixed(1),
        avgDeaths: avgDeaths.toFixed(1),
        killParticipation: advanced.fights.killParticipation.toFixed(1),
        avgHeroDamage: Math.round(advanced.fights.avgHeroDamage || 0).toLocaleString(),
        avgTowerDamage: Math.round(advanced.fights.avgTowerDamage || 0).toLocaleString(),
        avgLastHits: Math.round(advanced.lane.avgLastHits || 0),
        avgDenies: Math.round(advanced.lane.avgDenies || 0),
        avgNetWorth: Math.round(advanced.farm.avgNetWorth || 0).toLocaleString(),
        visionScore: Math.round((advanced.vision.avgObserverPlaced * 2) + (advanced.vision.avgObserverKilled * 1) + (advanced.vision.avgSentryPlaced * 1)),
        goldUtilization: advanced.farm.goldUtilization.toFixed(1),
        denyRate: advanced.lane.denyRate.toFixed(1),
        avgAssists: advanced.fights.avgAssists.toFixed(1),
        avgKills: matches.length > 0 ? (matches.reduce((acc: number, m: any) => acc + (m.kills || 0), 0) / matches.length).toFixed(1) : '0',
      },
      fzthScore,
      trends,
      patterns: patterns.slice(0, 5),
      phaseAnalysis,
      trendData,
      // Avatar and rank data
      avatar,
      personaname,
      rankTier,
      soloMMR,
      rankMedalUrl,
    }
    
    // Add warnings and partial flag if data is incomplete (backward compatible)
    if (warnings.length > 0) {
      response.warnings = warnings
      response.partial = true
    }
    
    return NextResponse.json(response, {
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

