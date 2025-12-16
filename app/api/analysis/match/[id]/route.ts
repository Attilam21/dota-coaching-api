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
    
    // Analyze individual player performance with advanced metrics
    const playerPerformance = (match.players as Player[]).map((player: any) => {
      const kda = (player.kills + player.assists) / Math.max(player.deaths, 1)
      const goldPerMin = player.gold_per_min || 0
      const xpPerMin = player.xp_per_min || 0
      const lastHits = player.last_hits || 0
      const denies = player.denies || 0
      const heroDamage = player.hero_damage || 0
      const towerDamage = player.tower_damage || 0
      const heroHealing = player.hero_healing || 0
      const netWorth = player.net_worth || 0
      const goldSpent = player.gold_spent || 0
      const observerWards = player.observer_uses || 0
      const sentryWards = player.sentry_uses || 0
      const observerKilled = player.observer_kills || player.obs_killed || 0
      const buybackCount = player.buyback_count || 0
      const stuns = player.stuns || 0
      const runePickups = player.rune_pickups || 0
      const campsStacked = player.camps_stacked || 0
      const courierKills = player.courier_kills || 0
      const roshKills = player.roshans_killed || 0
      const firstBloodClaimed = player.firstblood_claimed || 0
      const teamfightParticipations = player.teamfight_participations || 0
      const towersKilled = player.towers_killed || 0
      
      const isCarry = goldPerMin > 500
      const isSupport = goldPerMin < 350 && player.assists > player.kills
      const isMid = goldPerMin > 450 && goldPerMin < 550 && player.kills > player.assists
      const isOfflane = goldPerMin > 350 && goldPerMin < 500 && player.deaths < 8
      
      // Farm efficiency: (last_hits + denies) / (duration in minutes)
      const farmEfficiency = match.duration > 0 ? ((lastHits + denies) / (match.duration / 60)).toFixed(1) : '0'
      
      // Damage efficiency: damage per death (avoid division by zero)
      const damageEfficiency = player.deaths > 0 ? (heroDamage / player.deaths).toFixed(0) : heroDamage.toFixed(0)
      
      // Gold utilization
      const totalGold = goldSpent + netWorth
      const goldUtilization = totalGold > 0 
        ? ((goldSpent / totalGold) * 100).toFixed(1) 
        : '0'
      
      // Kill participation - calculate from team total kills
      const playerTeam = player.player_slot < 128 
        ? (match.players as Player[]).slice(0, 5)
        : (match.players as Player[]).slice(5, 10)
      const teamTotalKills = playerTeam.reduce((sum: number, p: any) => sum + p.kills, 0)
      const killParticipation = teamTotalKills > 0 
        ? (((player.kills + player.assists) / teamTotalKills) * 100).toFixed(1)
        : '0'
      
      // CS (Creep Score) per minute
      const csPerMin = match.duration > 0 ? ((lastHits + denies) / (match.duration / 60)).toFixed(1) : '0'
      
      // XPM/GPM ratio (efficiency indicator)
      const xpmGpmRatio = goldPerMin > 0 ? (xpPerMin / goldPerMin).toFixed(2) : '0'
      
      // Support score (for supports)
      const supportScore = isSupport 
        ? (observerWards * 2 + sentryWards * 1.5 + player.assists * 3 + heroHealing / 100).toFixed(0)
        : '0'
      
      // Carry impact score
      const carryImpactScore = isCarry
        ? (goldPerMin * 0.5 + towerDamage * 0.3 + heroDamage * 0.001 + kda * 10).toFixed(0)
        : '0'
      
      let rating = 'needs improvement'
      if (kda > 2.5 && player.deaths < 4 && goldPerMin > 450) {
        rating = 'excellent'
      } else if (kda > 2 && player.deaths < 5 && goldPerMin > 400) {
        rating = 'good'
      } else if (kda > 1.5 && player.deaths < 7) {
        rating = 'average'
      }
      
      // Role-specific recommendations with more detailed analysis
      const roleRecommendations: string[] = []
      
      if (isCarry) {
        if (goldPerMin < 450) {
          roleRecommendations.push('⚠️ Farm rate basso per un carry. Pratica il last hitting, migliora la gestione delle lane e considera rotazioni più efficienti.')
        }
        if (towerDamage < 500) {
          roleRecommendations.push('⚠️ Push damage insufficiente. Come carry, contribuisci di più alla distruzione delle torri per chiudere le partite.')
        }
        if (buybackCount > 2) {
          roleRecommendations.push('⚠️ Troppi buyback utilizzati. Valuta meglio quando usare il buyback in base alla situazione e alle risorse disponibili.')
        }
        if (parseFloat(killParticipation) < 50) {
          roleRecommendations.push('⚠️ Partecipazione ai fight bassa. Partecipa di più ai teamfight critici per avere maggiore impatto.')
        }
        if (parseFloat(csPerMin) < 5) {
          roleRecommendations.push('⚠️ CS per minuto basso. Migliora il farm continuo durante tutta la partita, non solo in laning phase.')
        }
      }
      
      if (isMid) {
        if (goldPerMin < 450) {
          roleRecommendations.push('⚠️ Farm rate migliorabile per un mid. Ottimizza le rotazioni tra farm e partecipazione ai fight.')
        }
        if (player.deaths > 6) {
          roleRecommendations.push('⚠️ Troppe morti. Migliora il positioning e valuta meglio quando ingaggiare in mid game.')
        }
        if (roshKills === 0 && match.duration > 2400) {
          roleRecommendations.push('💡 Considera di contribuire di più al controllo di Roshan nelle partite lunghe.')
        }
      }
      
      if (isOfflane) {
        if (player.deaths > 8) {
          roleRecommendations.push('⚠️ Troppe morti per un offlane. Migliora la gestione della lane difficile e la sopravvivenza.')
        }
        if (parseFloat(killParticipation) < 60) {
          roleRecommendations.push('⚠️ Partecipazione ai fight migliorabile. Come offlane, dovresti essere presente nei teamfight principali.')
        }
      }
      
      if (isSupport) {
        if (player.assists < 10) {
          roleRecommendations.push('⚠️ Assist insufficienti. Come support, aumenta la partecipazione ai teamfight e proteggi i tuoi core.')
        }
        if (observerWards + sentryWards < 8) {
          roleRecommendations.push('⚠️ Warding insufficiente. Le wards sono cruciali - punta ad almeno 8-10 wards per partita.')
        }
        if (heroHealing > 0 && heroHealing < 1500) {
          roleRecommendations.push('⚠️ Healing migliorabile. Aumenta l\'healing ai compagni durante i teamfight e le rotazioni.')
        }
        if (campsStacked < 3) {
          roleRecommendations.push('💡 Aumenta lo stacking dei camp per aiutare il farm dei tuoi carry.')
        }
        if (goldPerMin > 350) {
          roleRecommendations.push('💡 Considera di lasciare più farm ai tuoi core se stai accumulando troppo gold come support.')
        }
      }
      
      // General recommendations
      if (player.deaths > 10) {
        roleRecommendations.push('🔴 Troppe morti. Migliora il positioning, evita posizioni pericolose senza visione, valuta meglio quando ingaggiare.')
      } else if (player.deaths > 7) {
        roleRecommendations.push('🟡 Morte elevate. Analizza le situazioni in cui muori e migliora la mappa awareness.')
      }
      
      if (lastHits < 30 && !isSupport && !isOfflane) {
        roleRecommendations.push('🟡 Last hits bassi. Pratica il timing dei colpi per massimizzare il farm, soprattutto in laning phase.')
      }
      
      if (parseFloat(goldUtilization) < 70) {
        roleRecommendations.push('🟡 Utilizzo del gold inefficiente. Spendi il gold più rapidamente in item utili invece di accumularlo.')
      }
      
      if (parseFloat(killParticipation) < 40 && !isCarry) {
        roleRecommendations.push('🟡 Partecipazione ai fight bassa. Sii più presente nei teamfight e nelle rotazioni del team.')
      }
      
      if (observerKilled < 1 && !isCarry) {
        roleRecommendations.push('💡 Considera di dewardare di più per negare visione agli avversari.')
      }
      
      if (stuns > 0 && parseFloat(stuns.toString()) / match.duration * 60 < 2) {
        roleRecommendations.push('💡 Utilizza meglio gli stun - timing e posizionamento degli stun possono essere cruciali nei teamfight.')
      }
      
      if (firstBloodClaimed === 0 && (isMid || isOfflane)) {
        roleRecommendations.push('💡 Considera strategie più aggressive per ottenere first blood in early game.')
      }
      
      return {
        heroId: player.hero_id,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        gpm: goldPerMin,
        xpm: xpPerMin,
        kda: kda.toFixed(2),
        rating,
        roleRecommendations,
        // Advanced metrics
        lastHits,
        denies,
        heroDamage,
        towerDamage,
        heroHealing,
        netWorth,
        goldSpent,
        observerWards,
        sentryWards,
        observerKilled,
        buybackCount,
        farmEfficiency,
        damageEfficiency,
        goldUtilization,
        killParticipation,
        // Extended metrics
        csPerMin,
        xpmGpmRatio,
        supportScore: isSupport ? supportScore : undefined,
        carryImpactScore: isCarry ? carryImpactScore : undefined,
        stuns,
        runePickups,
        campsStacked,
        courierKills,
        roshKills,
        firstBloodClaimed,
        teamfightParticipations,
        towersKilled,
        role: isCarry ? 'Carry' : isSupport ? 'Support' : isMid ? 'Mid' : isOfflane ? 'Offlane' : 'Core',
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

    // Calculate team-wide advanced stats
    const radiantTotalDamage = radiantPlayers.reduce((sum: number, p: any) => sum + (p.hero_damage || 0), 0)
    const direTotalDamage = direPlayers.reduce((sum: number, p: any) => sum + (p.hero_damage || 0), 0)
    const radiantTotalWards = radiantPlayers.reduce((sum: number, p: any) => sum + (p.observer_uses || 0) + (p.sentry_uses || 0), 0)
    const direTotalWards = direPlayers.reduce((sum: number, p: any) => sum + (p.observer_uses || 0) + (p.sentry_uses || 0), 0)
    const radiantTotalTowerDamage = radiantPlayers.reduce((sum: number, p: any) => sum + (p.tower_damage || 0), 0)
    const direTotalTowerDamage = direPlayers.reduce((sum: number, p: any) => sum + (p.tower_damage || 0), 0)
    
    // Generate comprehensive overview
    const winningTeamName = match.radiant_win ? 'Radiant' : 'Dire'
    const losingTeamName = match.radiant_win ? 'Dire' : 'Radiant'
    const winningGpm = match.radiant_win ? radiantAvgGpm : direAvgGpm
    const losingGpm = match.radiant_win ? direAvgGpm : radiantAvgGpm
    const winningDamage = match.radiant_win ? radiantTotalDamage : direTotalDamage
    const losingDamage = match.radiant_win ? direTotalDamage : radiantTotalDamage
    
    const overview = `Partita durata ${Math.floor(match.duration / 60)} minuti e ${match.duration % 60} secondi. ` +
      `Vittoria ${winningTeamName}. ` +
      `Il team vincente ha dominato con una media GPM di ${Math.round(winningGpm)} ` +
      `(vs ${Math.round(losingGpm)} del team sconfitto), ` +
      `infliggendo ${Math.round(winningDamage / 1000)}K di hero damage ` +
      `rispetto ai ${Math.round(losingDamage / 1000)}K del team avversario. ` +
      (match.duration < 1800 
        ? 'Partita conclusa rapidamente, indicando un controllo precoce della mappa e obiettivi.' 
        : match.duration > 3600 
        ? 'Partita molto lunga, caratterizzata da decisioni critiche in late game.' 
        : 'Partita di durata media, con momenti decisivi in tutte le fasi.')

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
          totalDamage: radiantTotalDamage,
          totalWards: radiantTotalWards,
          totalTowerDamage: radiantTotalTowerDamage,
        },
        dire: {
          avgGpm: Math.round(direAvgGpm),
          avgKda: direAvgKda.toFixed(2),
          totalDamage: direTotalDamage,
          totalWards: direTotalWards,
          totalTowerDamage: direTotalTowerDamage,
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