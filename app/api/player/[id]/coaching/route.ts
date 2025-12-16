import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch both basic and advanced stats
    // Use request.nextUrl.origin for internal API calls (works on Vercel)
    const [statsResponse, advancedStatsResponse] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/player/${id}/stats`),
      fetch(`${request.nextUrl.origin}/api/player/${id}/advanced-stats`)
    ])
    
    // Parse responses safely
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
    
    if (!statsData?.stats || !advancedData?.stats) {
      return NextResponse.json(
        { error: 'Failed to fetch or parse player data' },
        { status: 500 }
      )
    }

    const stats = statsData.stats
    const advanced = advancedData.stats
    const matches = stats.matches || []

    // Calculate key metrics
    const avgGPM = matches.reduce((acc: number, m: { gpm: number }) => acc + m.gpm, 0) / matches.length || 0
    const avgKDA = matches.reduce((acc: number, m: { kda: number }) => acc + m.kda, 0) / matches.length || 0
    const avgDeaths = advanced.fights.avgDeaths || 0
    const winrate = stats.winrate.last10 || 0
    const avgLastHits = advanced.lane.avgLastHits || 0
    const avgDenies = advanced.lane.avgDenies || 0
    const denyRate = advanced.lane.denyRate || 0
    const killParticipation = advanced.fights.killParticipation || 0
    const avgHeroDamage = advanced.fights.avgHeroDamage || 0
    const avgTowerDamage = advanced.fights.avgTowerDamage || 0
    const avgObserverPlaced = advanced.vision.avgObserverPlaced || 0
    const goldUtilization = advanced.farm.goldUtilization || 0

    // Generate tasks based on weaknesses
    const tasks: Array<{
      id: string
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
      category: string
      target: string
      current: string
    }> = []

    // Farm & Economy Tasks
    if (avgGPM < 450) {
      tasks.push({
        id: 'farm-gpm',
        title: 'Migliora il Farm Rate',
        description: `Il tuo GPM medio è ${avgGPM.toFixed(0)}. Obiettivo: raggiungere almeno 500 GPM nelle prossime 5 partite.`,
        priority: 'high',
        category: 'Farm & Economy',
        target: '500',
        current: avgGPM.toFixed(0)
      })
    }

    if (avgLastHits < 50) {
      tasks.push({
        id: 'farm-lh',
        title: 'Aumenta Last Hits',
        description: `Media di ${avgLastHits.toFixed(1)} last hits per partita. Obiettivo: almeno 60 last hits nelle prossime 3 partite.`,
        priority: 'high',
        category: 'Lane & Early Game',
        target: '60',
        current: avgLastHits.toFixed(1)
      })
    }

    if (denyRate < 10 && avgGPM > 400) {
      tasks.push({
        id: 'farm-denies',
        title: 'Migliora Deny Rate',
        description: `Deny rate attuale: ${denyRate.toFixed(1)}%. Obiettivo: almeno 15% nelle prossime 5 partite.`,
        priority: 'medium',
        category: 'Lane & Early Game',
        target: '15%',
        current: `${denyRate.toFixed(1)}%`
      })
    }

    // Fights & Damage Tasks
    if (avgDeaths > 7) {
      tasks.push({
        id: 'fights-deaths',
        title: 'Riduci le Morte',
        description: `Media di ${avgDeaths.toFixed(1)} morti per partita. Obiettivo: massimo 5 morti nelle prossime 3 partite.`,
        priority: 'high',
        category: 'Fights & Damage',
        target: '5',
        current: avgDeaths.toFixed(1)
      })
    }

    if (killParticipation < 60) {
      tasks.push({
        id: 'fights-kp',
        title: 'Aumenta Kill Participation',
        description: `Kill participation: ${killParticipation.toFixed(1)}%. Obiettivo: almeno 70% nelle prossime 5 partite.`,
        priority: 'high',
        category: 'Fights & Damage',
        target: '70%',
        current: `${killParticipation.toFixed(1)}%`
      })
    }

    if (avgTowerDamage < 500) {
      tasks.push({
        id: 'fights-tower',
        title: 'Aumenta Tower Damage',
        description: `Tower damage medio: ${Math.round(avgTowerDamage)}. Obiettivo: almeno 1000 nelle prossime 3 partite.`,
        priority: 'medium',
        category: 'Fights & Damage',
        target: '1000',
        current: Math.round(avgTowerDamage).toString()
      })
    }

    // Vision & Map Control Tasks
    if (avgObserverPlaced < 5 && avgGPM < 450) {
      tasks.push({
        id: 'vision-wards',
        title: 'Aumenta Warding',
        description: `Media di ${avgObserverPlaced.toFixed(1)} observer wards per partita. Obiettivo: almeno 8 wards nelle prossime 3 partite.`,
        priority: 'medium',
        category: 'Vision & Map Control',
        target: '8',
        current: avgObserverPlaced.toFixed(1)
      })
    }

    // Economy Tasks
    if (goldUtilization < 85) {
      tasks.push({
        id: 'economy-utilization',
        title: 'Migliora Gold Utilization',
        description: `Utilizzo gold: ${goldUtilization.toFixed(1)}%. Obiettivo: almeno 90% nelle prossime 5 partite.`,
        priority: 'medium',
        category: 'Farm & Economy',
        target: '90%',
        current: `${goldUtilization.toFixed(1)}%`
      })
    }

    // Winrate Tasks
    if (winrate < 50) {
      tasks.push({
        id: 'winrate',
        title: 'Migliora Winrate',
        description: `Winrate ultime 10 partite: ${winrate.toFixed(1)}%. Obiettivo: almeno 55% nelle prossime 10 partite.`,
        priority: 'high',
        category: 'Overall Performance',
        target: '55%',
        current: `${winrate.toFixed(1)}%`
      })
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (avgKDA < 2) {
      recommendations.push('Il tuo KDA è sotto la media. Concentrati sul ridurre le morti e aumentare la partecipazione ai kill.')
    }

    if (avgHeroDamage < 10000 && avgGPM > 450) {
      recommendations.push('Come core, il tuo hero damage è basso rispetto al farm. Partecipa di più ai teamfight.')
    }

    if (advanced.lane.firstBloodInvolvement < 20) {
      recommendations.push('Partecipa di più alle early game skirmishes per aumentare la tua presenza in early game.')
    }

    if (advanced.farm.avgBuybacks > 1.5) {
      recommendations.push('Stai usando troppi buyback. Valuta meglio quando è strategico comprare.')
    }

    if (advanced.vision.wardEfficiency < 30 && avgObserverPlaced > 3) {
      recommendations.push('Migliora la tua capacità di trovare e distruggere le wards nemiche.')
    }

    return NextResponse.json({
      tasks: tasks.slice(0, 8), // Max 8 tasks
      recommendations,
      summary: {
        totalTasks: tasks.length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        mediumPriority: tasks.filter(t => t.priority === 'medium').length,
        lowPriority: tasks.filter(t => t.priority === 'low').length,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error generating coaching data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

