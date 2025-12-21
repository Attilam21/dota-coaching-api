import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/fetch-utils'

/**
 * API endpoint per consigli specifici per partita
 * Analizza azioni fatte bene/male, team composition, macro/micro advice, teamplay
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId parameter is required' },
        { status: 400 }
      )
    }
    
    // Fetch match data
    const matchResponse = await fetchWithTimeout(`https://api.opendota.com/api/matches/${id}`, {
      timeout: 10000,
      next: { revalidate: 3600 }
    })
    
    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const match = await matchResponse.json()
    const players = match.players || []
    const duration = match.duration || 0
    
    // Find player in match
    const player = players.find((p: any) => 
      p.account_id && (p.account_id.toString() === playerId || p.account_id === parseInt(playerId))
    )
    
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found in match' },
        { status: 404 }
      )
    }
    
    const playerSlot = player.player_slot
    const playerTeam = playerSlot < 128 ? 'radiant' : 'dire'
    const teamWon = (playerTeam === 'radiant' && match.radiant_win) || 
                   (playerTeam === 'dire' && !match.radiant_win)
    
    // Get team players
    const teamPlayers = players.filter((p: any) => {
      const pTeam = p.player_slot < 128 ? 'radiant' : 'dire'
      return pTeam === playerTeam
    })
    
    const enemyPlayers = players.filter((p: any) => {
      const pTeam = p.player_slot < 128 ? 'radiant' : 'dire'
      return pTeam !== playerTeam
    })
    
    // Determine player role
    const gpm = player.gold_per_min || 0
    const xpm = player.xp_per_min || 0
    const kills = player.kills || 0
    const deaths = player.deaths || 0
    const assists = player.assists || 0
    const lastHits = player.last_hits || 0
    const denies = player.denies || 0
    const heroDamage = player.hero_damage || 0
    const towerDamage = player.tower_damage || 0
    const observerWards = player.observer_uses || 0
    const sentryWards = player.sentry_uses || 0
    const campsStacked = player.camps_stacked || 0
    const roshKills = player.roshans_killed || 0
    const buybackCount = player.buyback_count || 0
    
    let role = 'Core'
    if (gpm > 500) {
      role = 'Carry'
    } else if (gpm < 350 && assists > kills) {
      role = 'Support'
    } else if (gpm > 450 && gpm <= 550 && kills > assists) {
      role = 'Mid'
    } else if (gpm > 350 && gpm <= 500 && deaths < 8) {
      role = 'Offlane'
    }
    
    // Meta standards
    const META_STANDARDS: Record<string, any> = {
      carry: {
        gpm: 550,
        xpm: 600,
        csPerMin: 7,
        killParticipation: 60,
        towerDamage: 1500,
        deaths: 5,
        kda: 2.5
      },
      mid: {
        gpm: 550,
        xpm: 650,
        csPerMin: 6.5,
        killParticipation: 70,
        towerDamage: 1000,
        deaths: 5,
        kda: 2.8
      },
      offlane: {
        gpm: 450,
        xpm: 500,
        csPerMin: 5,
        killParticipation: 75,
        towerDamage: 800,
        deaths: 6,
        kda: 2.2
      },
      support: {
        gpm: 300,
        xpm: 350,
        wards: 10,
        assists: 12,
        killParticipation: 80,
        deaths: 6,
        kda: 1.8,
        campsStacked: 4
      }
    }
    
    const meta = META_STANDARDS[role.toLowerCase()] || META_STANDARDS.carry
    
    // Calculate metrics
    const kda = (kills + assists) / Math.max(deaths, 1)
    const csPerMin = duration > 0 ? ((lastHits + denies) / (duration / 60)) : 0
    const teamTotalKills = teamPlayers.reduce((sum: number, p: any) => sum + (p.kills || 0), 0)
    const killParticipation = teamTotalKills > 0 ? (((kills + assists) / teamTotalKills) * 100) : 0
    
    // Analyze item timing from purchase_log if available
    const playerItems = player.purchase_log || []
    const itemTimings = playerItems.map((entry: any) => ({
      itemName: entry.key || 'Unknown',
      purchaseTime: entry.time || 0
    }))
    
    // 1. AZIONI FATTE BENE/MALE
    const goodActions: Array<{
      category: string
      action: string
      metric: string
      impact: 'high' | 'medium' | 'low'
      phase: 'early' | 'mid' | 'late'
    }> = []
    
    const badActions: Array<{
      category: string
      action: string
      metric: string
      impact: 'high' | 'medium' | 'low'
      phase: 'early' | 'mid' | 'late'
      recommendation: string
    }> = []
    
    // Analyze farming
    if (gpm >= meta.gpm * 1.1) {
      goodActions.push({
        category: 'farming',
        action: 'Eccellente farm rate',
        metric: `GPM: ${gpm} vs meta: ${meta.gpm}`,
        impact: 'high',
        phase: 'mid'
      })
    } else if (gpm < meta.gpm * 0.85) {
      badActions.push({
        category: 'farming',
        action: 'Farm rate insufficiente',
        metric: `GPM: ${gpm} vs meta: ${meta.gpm}`,
        impact: 'high',
        phase: 'mid',
        recommendation: 'Migliora il farm continuo durante tutta la partita, non solo in laning phase'
      })
    }
    
    if (csPerMin >= meta.csPerMin * 1.1) {
      goodActions.push({
        category: 'farming',
        action: 'Ottimo CS per minuto',
        metric: `CS/min: ${csPerMin.toFixed(1)} vs meta: ${meta.csPerMin}`,
        impact: 'medium',
        phase: 'early'
      })
    } else if (csPerMin < meta.csPerMin * 0.85) {
      badActions.push({
        category: 'farming',
        action: 'CS per minuto basso',
        metric: `CS/min: ${csPerMin.toFixed(1)} vs meta: ${meta.csPerMin}`,
        impact: 'high',
        phase: 'early',
        recommendation: 'Pratica il last hitting, migliora la gestione delle lane'
      })
    }
    
    // Analyze teamfight participation
    if (killParticipation >= meta.killParticipation * 1.1) {
      goodActions.push({
        category: 'teamfight',
        action: 'Ottima partecipazione ai teamfight',
        metric: `Kill Participation: ${killParticipation.toFixed(1)}% vs meta: ${meta.killParticipation}%`,
        impact: 'high',
        phase: 'mid'
      })
    } else if (killParticipation < meta.killParticipation * 0.85) {
      badActions.push({
        category: 'teamfight',
        action: 'Partecipazione ai teamfight insufficiente',
        metric: `Kill Participation: ${killParticipation.toFixed(1)}% vs meta: ${meta.killParticipation}%`,
        impact: 'high',
        phase: 'mid',
        recommendation: 'Partecipa di più ai teamfight critici per avere maggiore impatto'
      })
    }
    
    // Analyze deaths
    if (deaths <= meta.deaths * 0.7) {
      goodActions.push({
        category: 'positioning',
        action: 'Eccellente sopravvivenza',
        metric: `Morti: ${deaths} vs meta: ${meta.deaths}`,
        impact: 'high',
        phase: 'mid'
      })
    } else if (deaths > meta.deaths) {
      badActions.push({
        category: 'positioning',
        action: 'Troppe morti',
        metric: `Morti: ${deaths} vs meta: ${meta.deaths}`,
        impact: 'high',
        phase: 'mid',
        recommendation: 'Migliora il positioning e valuta meglio quando ingaggiare'
      })
    }
    
    // Analyze KDA
    if (kda >= meta.kda * 1.2) {
      goodActions.push({
        category: 'teamfight',
        action: 'Eccellente KDA',
        metric: `KDA: ${kda.toFixed(2)} vs meta: ${meta.kda}`,
        impact: 'high',
        phase: 'mid'
      })
    } else if (kda < meta.kda * 0.85) {
      badActions.push({
        category: 'teamfight',
        action: 'KDA basso',
        metric: `KDA: ${kda.toFixed(2)} vs meta: ${meta.kda}`,
        impact: 'medium',
        phase: 'mid',
        recommendation: 'Migliora il rapporto kill/death per avere maggiore impatto'
      })
    }
    
    // Analyze support-specific metrics
    if (role === 'Support') {
      if (observerWards + sentryWards >= meta.wards * 1.2) {
        goodActions.push({
          category: 'warding',
          action: 'Ottimo warding',
          metric: `Wards: ${observerWards + sentryWards} vs meta: ${meta.wards}`,
          impact: 'high',
          phase: 'mid'
        })
      } else if (observerWards + sentryWards < meta.wards * 0.8) {
        badActions.push({
          category: 'warding',
          action: 'Warding insufficiente',
          metric: `Wards: ${observerWards + sentryWards} vs meta: ${meta.wards}`,
          impact: 'high',
          phase: 'mid',
          recommendation: 'Posiziona più ward per migliorare la visione del team'
        })
      }
      
      if (campsStacked >= meta.campsStacked * 1.2) {
        goodActions.push({
          category: 'farming',
          action: 'Ottimo stacking',
          metric: `Camps stacked: ${campsStacked} vs meta: ${meta.campsStacked}`,
          impact: 'medium',
          phase: 'early'
        })
      } else if (campsStacked < meta.campsStacked * 0.8) {
        badActions.push({
          category: 'farming',
          action: 'Stacking insufficiente',
          metric: `Camps stacked: ${campsStacked} vs meta: ${meta.campsStacked}`,
          impact: 'medium',
          phase: 'early',
          recommendation: 'Stacka più camp per aiutare il carry a farmare'
        })
      }
    }
    
    // Analyze carry-specific metrics
    if (role === 'Carry') {
      if (towerDamage >= meta.towerDamage * 1.2) {
        goodActions.push({
          category: 'objective_control',
          action: 'Ottimo push',
          metric: `Tower Damage: ${towerDamage} vs meta: ${meta.towerDamage}`,
          impact: 'high',
          phase: 'late'
        })
      } else if (towerDamage < meta.towerDamage * 0.7) {
        badActions.push({
          category: 'objective_control',
          action: 'Push insufficiente',
          metric: `Tower Damage: ${towerDamage} vs meta: ${meta.towerDamage}`,
          impact: 'medium',
          phase: 'late',
          recommendation: 'Come carry, contribuisci di più alla distruzione delle torri per chiudere le partite'
        })
      }
    }
    
    // Analyze buybacks
    if (buybackCount > 2) {
      badActions.push({
        category: 'item_usage',
        action: 'Troppi buyback',
        metric: `Buyback: ${buybackCount}`,
        impact: 'medium',
        phase: 'late',
        recommendation: 'Valuta meglio quando usare il buyback in base alla situazione e alle risorse disponibili'
      })
    }
    
    // 2. TEAM COMPOSITION ANALYSIS
    const teamHeroes = teamPlayers.map((p: any) => p.hero_id).filter((id: number) => id && id > 0)
    const enemyHeroes = enemyPlayers.map((p: any) => p.hero_id).filter((id: number) => id && id > 0)
    
    // Analyze team composition
    const teamComposition = {
      yourTeam: {
        heroes: teamHeroes,
        roles: teamPlayers.map((p: any) => {
          const pGpm = p.gold_per_min || 0
          if (pGpm > 500) return 'Carry'
          if (pGpm < 350 && p.assists > p.kills) return 'Support'
          if (pGpm > 450 && pGpm <= 550 && p.kills > p.assists) return 'Mid'
          if (pGpm > 350 && pGpm <= 500 && p.deaths < 8) return 'Offlane'
          return 'Core'
        }),
        strengths: [] as string[],
        weaknesses: [] as string[],
        synergyScore: 70, // Placeholder
        synergyIssues: [] as string[]
      },
      enemyTeam: {
        heroes: enemyHeroes,
        roles: enemyPlayers.map((p: any) => {
          const pGpm = p.gold_per_min || 0
          if (pGpm > 500) return 'Carry'
          if (pGpm < 350 && p.assists > p.kills) return 'Support'
          if (pGpm > 450 && pGpm <= 550 && p.kills > p.assists) return 'Mid'
          if (pGpm > 350 && pGpm <= 500 && p.deaths < 8) return 'Offlane'
          return 'Core'
        }),
        strengths: [] as string[],
        weaknesses: [] as string[]
      },
      recommendations: [] as Array<{
        type: 'draft' | 'strategy' | 'itemization'
        priority: 'high' | 'medium' | 'low'
        advice: string
        reasoning: string
      }>
    }
    
    // Check for role distribution
    const roleCount = teamComposition.yourTeam.roles.reduce((acc: Record<string, number>, role: string) => {
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {})
    
    if (!roleCount['Support'] || roleCount['Support'] < 2) {
      teamComposition.yourTeam.weaknesses.push('Mancano support')
      teamComposition.yourTeam.synergyIssues.push('Team senza support adeguato')
    }
    
    if (!roleCount['Carry']) {
      teamComposition.yourTeam.weaknesses.push('Manca carry')
      teamComposition.yourTeam.synergyIssues.push('Team senza carry')
    }
    
    // 3. MACRO ADVICE
    const macroAdvice: Array<{
      phase: 'early' | 'mid' | 'late'
      decision: string
      reasoning: string
      timing: string
      priority: 'high' | 'medium' | 'low'
    }> = []
    
    // Analyze objective control
    if (roshKills === 0 && duration > 2400) {
      macroAdvice.push({
        phase: 'late',
        decision: 'Mancato controllo di Roshan',
        reasoning: 'Roshan non è stato ucciso in una partita lunga, perdendo opportunità di Aegis',
        timing: 'Minuto 20+',
        priority: 'high'
      })
    }
    
    // Analyze tower damage
    const teamTowerDamage = teamPlayers.reduce((sum: number, p: any) => sum + (p.tower_damage || 0), 0)
    const enemyTowerDamage = enemyPlayers.reduce((sum: number, p: any) => sum + (p.tower_damage || 0), 0)
    
    if (teamTowerDamage < enemyTowerDamage * 0.8) {
      macroAdvice.push({
        phase: 'mid',
        decision: 'Push insufficiente',
        reasoning: 'Il team ha fatto meno damage alle torri rispetto al nemico',
        timing: 'Minuto 15-30',
        priority: 'high'
      })
    }
    
    // 4. MICRO ADVICE
    const microAdvice: Array<{
      category: string
      issue: string
      recommendation: string
      examples: string[]
    }> = []
    
    // Analyze item timing if available
    if (itemTimings.length > 0) {
      // Simple check: if key items are purchased late
      const keyItems = ['item_blink', 'item_black_king_bar', 'item_force_staff', 'item_glimmer_cape']
      const lateItems = itemTimings.filter((item: any) => {
        const isKeyItem = keyItems.some(key => item.itemName.includes(key))
        const isLate = item.purchaseTime > 20 * 60 // After 20 minutes
        return isKeyItem && isLate
      })
      
      if (lateItems.length > 0) {
        microAdvice.push({
          category: 'item_usage',
          issue: 'Item timing lento',
          recommendation: 'Cerca di farmare gli item chiave più velocemente',
          examples: lateItems.slice(0, 3).map((item: any) => 
            `${item.itemName} a ${Math.floor(item.purchaseTime / 60)}min`
          )
        })
      }
    }
    
    // 5. TEAMPLAY ADVICE
    const teamplayAdvice: Array<{
      type: string
      issue: string
      recommendation: string
      teammates: number[]
    }> = []
    
    // Analyze teamfight participation from match data
    const teamfights = match.teamfights || []
    if (teamfights.length > 0) {
      const playerTeamfights = teamfights.filter((tf: any) => {
        if (tf.players && Array.isArray(tf.players)) {
          return tf.players.some((p: any) => {
            const tfSlot = p.player_slot !== undefined ? p.player_slot : p.slot
            return tfSlot === playerSlot && (p.damage > 0 || p.deaths > 0)
          })
        }
        return false
      })
      
      const participationRate = teamfights.length > 0 
        ? (playerTeamfights.length / teamfights.length) * 100 
        : 0
      
      if (participationRate < 70) {
        teamplayAdvice.push({
          type: 'coordination',
          issue: 'Partecipazione ai teamfight bassa',
          recommendation: 'Cerca di essere presente nei teamfight principali del team',
          teammates: []
        })
      }
    }
    
    return NextResponse.json({
      playerId: parseInt(playerId),
      matchId: parseInt(id),
      role,
      teamWon,
      actions: {
        good: goodActions,
        bad: badActions
      },
      teamComposition,
      macroAdvice,
      microAdvice,
      teamplayAdvice
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error fetching game advice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}