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

    // Meta standards for Dota 2 (2024)
    const META_STANDARDS = {
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
      
      // Determine role with mutually exclusive conditions (priority order: Carry > Mid > Offlane > Support)
      let role = 'Core' // default
      let isCarry = false
      let isSupport = false
      let isMid = false
      let isOfflane = false
      
      if (goldPerMin > 500) {
        role = 'Carry'
        isCarry = true
      } else if (goldPerMin < 350 && player.assists > player.kills) {
        role = 'Support'
        isSupport = true
      } else if (goldPerMin > 450 && goldPerMin <= 550 && player.kills > player.assists) {
        role = 'Mid'
        isMid = true
      } else if (goldPerMin > 350 && goldPerMin <= 500 && player.deaths < 8) {
        role = 'Offlane'
        isOfflane = true
      }
      
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
      
      // Role-specific recommendations with meta comparisons and detailed analysis
      const roleRecommendations: string[] = []
      
      if (isCarry) {
        const meta = META_STANDARDS.carry
        // GPM comparison
        if (goldPerMin < meta.gpm * 0.85) {
          const diff = Math.round(meta.gpm - goldPerMin)
          roleRecommendations.push(`⚠️ GPM ${goldPerMin} vs meta ${meta.gpm} (-${diff}). Pratica il last hitting, migliora la gestione delle lane e considera rotazioni più efficienti.`)
        } else if (goldPerMin >= meta.gpm * 1.1) {
          roleRecommendations.push(`✅ Eccellente GPM ${goldPerMin} (meta: ${meta.gpm}). Ottimo farm rate, continua così!`)
        }
        
        // XPM comparison
        if (xpPerMin < meta.xpm * 0.85) {
          const diff = Math.round(meta.xpm - xpPerMin)
          roleRecommendations.push(`⚠️ XPM ${xpPerMin} vs meta ${meta.xpm} (-${diff}). Partecipa di più ai fight e alle rotazioni per guadagnare più XP.`)
        } else if (xpPerMin >= meta.xpm * 1.1) {
          roleRecommendations.push(`✅ Eccellente XPM ${xpPerMin} (meta: ${meta.xpm}). Ottima gestione dell'XP!`)
        }
        
        // CS per minute
        const csPerMinNum = parseFloat(csPerMin)
        if (csPerMinNum < meta.csPerMin * 0.85) {
          roleRecommendations.push(`⚠️ CS/min ${csPerMin} vs meta ${meta.csPerMin}. Migliora il farm continuo durante tutta la partita, non solo in laning phase.`)
        } else if (csPerMinNum >= meta.csPerMin * 1.1) {
          roleRecommendations.push(`✅ Eccellente CS/min ${csPerMin} (meta: ${meta.csPerMin}). Farm molto efficiente!`)
        }
        
        // Kill Participation
        const kpNum = parseFloat(killParticipation)
        if (kpNum < meta.killParticipation * 0.85) {
          roleRecommendations.push(`⚠️ Kill Participation ${killParticipation}% vs meta ${meta.killParticipation}%. Partecipa di più ai teamfight critici per avere maggiore impatto.`)
        } else if (kpNum >= meta.killParticipation * 1.1) {
          roleRecommendations.push(`✅ Eccellente Kill Participation ${killParticipation}% (meta: ${meta.killParticipation}%). Ottima presenza nei fight!`)
        }
        
        // Tower Damage
        if (towerDamage < meta.towerDamage * 0.7) {
          roleRecommendations.push(`⚠️ Tower Damage ${towerDamage} vs meta ${meta.towerDamage} (-${meta.towerDamage - towerDamage}). Come carry, contribuisci di più alla distruzione delle torri per chiudere le partite.`)
        } else if (towerDamage >= meta.towerDamage * 1.2) {
          roleRecommendations.push(`✅ Eccellente Tower Damage ${towerDamage} (meta: ${meta.towerDamage}). Ottimo push!`)
        }
        
        // Deaths
        if (player.deaths > meta.deaths) {
          roleRecommendations.push(`⚠️ ${player.deaths} morti vs meta ${meta.deaths}. Migliora il positioning e valuta meglio quando ingaggiare.`)
        } else if (player.deaths <= meta.deaths * 0.7) {
          roleRecommendations.push(`✅ Eccellente sopravvivenza: ${player.deaths} morti (meta: ${meta.deaths}). Ottimo positioning!`)
        }
        
        // KDA
        if (kda < meta.kda * 0.85) {
          roleRecommendations.push(`⚠️ KDA ${kda.toFixed(2)} vs meta ${meta.kda}. Migliora il rapporto kill/death per avere maggiore impatto.`)
        } else if (kda >= meta.kda * 1.2) {
          roleRecommendations.push(`✅ Eccellente KDA ${kda.toFixed(2)} (meta: ${meta.kda}). Performance top!`)
        }
        
        // Buyback
        if (buybackCount > 2) {
          roleRecommendations.push(`⚠️ ${buybackCount} buyback utilizzati. Valuta meglio quando usare il buyback in base alla situazione e alle risorse disponibili.`)
        }
      }
      
      if (isMid) {
        const meta = META_STANDARDS.mid
        // GPM comparison
        if (goldPerMin < meta.gpm * 0.85) {
          const diff = Math.round(meta.gpm - goldPerMin)
          roleRecommendations.push(`⚠️ GPM ${goldPerMin} vs meta ${meta.gpm} (-${diff}). Ottimizza le rotazioni tra farm e partecipazione ai fight.`)
        } else if (goldPerMin >= meta.gpm * 1.1) {
          roleRecommendations.push(`✅ Eccellente GPM ${goldPerMin} (meta: ${meta.gpm}). Ottimo farm rate!`)
        }
        
        // XPM comparison
        if (xpPerMin < meta.xpm * 0.85) {
          const diff = Math.round(meta.xpm - xpPerMin)
          roleRecommendations.push(`⚠️ XPM ${xpPerMin} vs meta ${meta.xpm} (-${diff}). Partecipa di più ai fight per guadagnare più XP.`)
        } else if (xpPerMin >= meta.xpm * 1.1) {
          roleRecommendations.push(`✅ Eccellente XPM ${xpPerMin} (meta: ${meta.xpm}). Ottima gestione dell'XP!`)
        }
        
        // Kill Participation
        const kpNum = parseFloat(killParticipation)
        if (kpNum < meta.killParticipation * 0.85) {
          roleRecommendations.push(`⚠️ Kill Participation ${killParticipation}% vs meta ${meta.killParticipation}%. Come mid, dovresti essere presente nei fight principali.`)
        } else if (kpNum >= meta.killParticipation * 1.1) {
          roleRecommendations.push(`✅ Eccellente Kill Participation ${killParticipation}% (meta: ${meta.killParticipation}%). Ottima presenza nei fight!`)
        }
        
        // Deaths
        if (player.deaths > meta.deaths) {
          roleRecommendations.push(`⚠️ ${player.deaths} morti vs meta ${meta.deaths}. Migliora il positioning e valuta meglio quando ingaggiare in mid game.`)
        } else if (player.deaths <= meta.deaths * 0.7) {
          roleRecommendations.push(`✅ Eccellente sopravvivenza: ${player.deaths} morti (meta: ${meta.deaths}). Ottimo positioning!`)
        }
        
        // KDA
        if (kda < meta.kda * 0.85) {
          roleRecommendations.push(`⚠️ KDA ${kda.toFixed(2)} vs meta ${meta.kda}. Migliora il rapporto kill/death.`)
        } else if (kda >= meta.kda * 1.2) {
          roleRecommendations.push(`✅ Eccellente KDA ${kda.toFixed(2)} (meta: ${meta.kda}). Performance top!`)
        }
        
        // Roshan control
        if (roshKills === 0 && match.duration > 2400) {
          roleRecommendations.push('💡 Considera di contribuire di più al controllo di Roshan nelle partite lunghe.')
        } else if (roshKills > 0) {
          roleRecommendations.push(`✅ Ottimo controllo di Roshan: ${roshKills} kill.`)
        }
      }
      
      if (isOfflane) {
        const meta = META_STANDARDS.offlane
        // Kill Participation (most important for offlane)
        const kpNum = parseFloat(killParticipation)
        if (kpNum < meta.killParticipation * 0.85) {
          roleRecommendations.push(`⚠️ Kill Participation ${killParticipation}% vs meta ${meta.killParticipation}%. Come offlane, dovresti essere presente nei teamfight principali.`)
        } else if (kpNum >= meta.killParticipation * 1.1) {
          roleRecommendations.push(`✅ Eccellente Kill Participation ${killParticipation}% (meta: ${meta.killParticipation}%). Ottima presenza nei fight!`)
        }
        
        // Deaths (critical for offlane)
        if (player.deaths > meta.deaths) {
          roleRecommendations.push(`⚠️ ${player.deaths} morti vs meta ${meta.deaths}. Migliora la gestione della lane difficile e la sopravvivenza.`)
        } else if (player.deaths <= meta.deaths * 0.7) {
          roleRecommendations.push(`✅ Eccellente sopravvivenza: ${player.deaths} morti (meta: ${meta.deaths}). Ottima gestione della lane!`)
        }
        
        // GPM
        if (goldPerMin < meta.gpm * 0.85) {
          const diff = Math.round(meta.gpm - goldPerMin)
          roleRecommendations.push(`⚠️ GPM ${goldPerMin} vs meta ${meta.gpm} (-${diff}). Migliora il farm nelle rotazioni.`)
        } else if (goldPerMin >= meta.gpm * 1.1) {
          roleRecommendations.push(`✅ Eccellente GPM ${goldPerMin} (meta: ${meta.gpm}). Ottimo farm rate!`)
        }
        
        // KDA
        if (kda < meta.kda * 0.85) {
          roleRecommendations.push(`⚠️ KDA ${kda.toFixed(2)} vs meta ${meta.kda}. Migliora il rapporto kill/death.`)
        } else if (kda >= meta.kda * 1.2) {
          roleRecommendations.push(`✅ Eccellente KDA ${kda.toFixed(2)} (meta: ${meta.kda}). Performance top!`)
        }
      }
      
      if (isSupport) {
        const meta = META_STANDARDS.support
        // Warding (most important for support)
        const totalWards = observerWards + sentryWards
        if (totalWards < meta.wards * 0.8) {
          const diff = meta.wards - totalWards
          roleRecommendations.push(`⚠️ ${totalWards} wards vs meta ${meta.wards} (-${diff}). Le wards sono cruciali - punta ad almeno ${meta.wards} wards per partita.`)
        } else if (totalWards >= meta.wards * 1.2) {
          roleRecommendations.push(`✅ Eccellente warding: ${totalWards} wards (meta: ${meta.wards}). Ottima visione!`)
        }
        
        // Assists
        if (player.assists < meta.assists * 0.85) {
          const diff = meta.assists - player.assists
          roleRecommendations.push(`⚠️ ${player.assists} assist vs meta ${meta.assists} (-${diff}). Aumenta la partecipazione ai teamfight e proteggi i tuoi core.`)
        } else if (player.assists >= meta.assists * 1.2) {
          roleRecommendations.push(`✅ Eccellenti assist: ${player.assists} (meta: ${meta.assists}). Ottima presenza nei fight!`)
        }
        
        // Kill Participation
        const kpNum = parseFloat(killParticipation)
        if (kpNum < meta.killParticipation * 0.85) {
          roleRecommendations.push(`⚠️ Kill Participation ${killParticipation}% vs meta ${meta.killParticipation}%. Come support, dovresti essere presente in quasi tutti i fight.`)
        } else if (kpNum >= meta.killParticipation * 1.1) {
          roleRecommendations.push(`✅ Eccellente Kill Participation ${killParticipation}% (meta: ${meta.killParticipation}%). Ottima presenza nei fight!`)
        }
        
        // Healing
        if (heroHealing > 0 && heroHealing < 1500) {
          roleRecommendations.push(`⚠️ Healing ${Math.round(heroHealing)}. Aumenta l'healing ai compagni durante i teamfight e le rotazioni.`)
        } else if (heroHealing >= 3000) {
          roleRecommendations.push(`✅ Eccellente healing: ${Math.round(heroHealing)}. Ottimo supporto ai compagni!`)
        }
        
        // Camps Stacked
        if (campsStacked < meta.campsStacked) {
          const diff = meta.campsStacked - campsStacked
          roleRecommendations.push(`⚠️ ${campsStacked} camp stacked vs meta ${meta.campsStacked} (-${diff}). Aumenta lo stacking per aiutare il farm dei tuoi carry.`)
        } else if (campsStacked >= meta.campsStacked * 1.5) {
          roleRecommendations.push(`✅ Eccellente stacking: ${campsStacked} camp (meta: ${meta.campsStacked}). Ottimo supporto al farm!`)
        }
        
        // GPM (should not be too high for support)
        if (goldPerMin > meta.gpm * 1.3) {
          roleRecommendations.push(`💡 GPM ${goldPerMin} molto alto per un support (meta: ${meta.gpm}). Considera di lasciare più farm ai tuoi core.`)
        }
        
        // Deaths
        if (player.deaths > meta.deaths) {
          roleRecommendations.push(`⚠️ ${player.deaths} morti vs meta ${meta.deaths}. Migliora il positioning per sopravvivere meglio.`)
        } else if (player.deaths <= meta.deaths * 0.7) {
          roleRecommendations.push(`✅ Eccellente sopravvivenza: ${player.deaths} morti (meta: ${meta.deaths}). Ottimo positioning!`)
        }
        
        // KDA
        if (kda < meta.kda * 0.85) {
          roleRecommendations.push(`⚠️ KDA ${kda.toFixed(2)} vs meta ${meta.kda}. Migliora il rapporto kill/death.`)
        } else if (kda >= meta.kda * 1.2) {
          roleRecommendations.push(`✅ Eccellente KDA ${kda.toFixed(2)} (meta: ${meta.kda}). Performance top!`)
        }
      }
      
      // General recommendations (apply to all roles)
      if (player.deaths > 10) {
        roleRecommendations.push(`🔴 ${player.deaths} morti - troppe. Migliora il positioning, evita posizioni pericolose senza visione, valuta meglio quando ingaggiare.`)
      } else if (player.deaths > 7 && !isSupport) {
        roleRecommendations.push(`🟡 ${player.deaths} morti - elevate. Analizza le situazioni in cui muori e migliora la mappa awareness.`)
      }
      
      if (lastHits < 30 && !isSupport && !isOfflane) {
        roleRecommendations.push(`🟡 Last hits ${lastHits} bassi. Pratica il timing dei colpi per massimizzare il farm, soprattutto in laning phase.`)
      }
      
      if (parseFloat(goldUtilization) < 70) {
        roleRecommendations.push(`🟡 Gold Utilization ${goldUtilization}% basso. Spendi il gold più rapidamente in item utili invece di accumularlo.`)
      } else if (parseFloat(goldUtilization) >= 90) {
        roleRecommendations.push(`✅ Eccellente Gold Utilization ${goldUtilization}%. Ottima gestione del gold!`)
      }
      
      if (parseFloat(killParticipation) < 40 && !isCarry) {
        roleRecommendations.push(`🟡 Kill Participation ${killParticipation}% bassa. Sii più presente nei teamfight e nelle rotazioni del team.`)
      }
      
      if (observerKilled < 1 && !isCarry) {
        roleRecommendations.push('💡 Considera di dewardare di più per negare visione agli avversari.')
      } else if (observerKilled >= 3) {
        roleRecommendations.push(`✅ Eccellente dewarding: ${observerKilled} wards distrutte. Ottima negazione della visione!`)
      }
      
      if (stuns > 0 && parseFloat(stuns.toString()) / match.duration * 60 < 2) {
        roleRecommendations.push('💡 Utilizza meglio gli stun - timing e posizionamento degli stun possono essere cruciali nei teamfight.')
      } else if (stuns > 0 && parseFloat(stuns.toString()) / match.duration * 60 >= 3) {
        roleRecommendations.push(`✅ Eccellente uso degli stun: ${stuns.toFixed(1)}s totali. Ottimo controllo!`)
      }
      
      if (firstBloodClaimed === 0 && (isMid || isOfflane)) {
        roleRecommendations.push('💡 Considera strategie più aggressive per ottenere first blood in early game.')
      } else if (firstBloodClaimed > 0) {
        roleRecommendations.push(`✅ First Blood ottenuto! Ottimo inizio di partita!`)
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
        role,
      }
    })

    // Key moments - REMOVED: These were simulated. Real events are now fetched from timeline endpoint
    // The frontend should use the timeline endpoint for real events instead
    const keyMoments: Array<{ time: number; event: string; description: string }> = []
    
    // Only add match start (real event)
    keyMoments.push({
      time: 0,
      event: 'Match Started',
      description: 'La partita è iniziata',
    })
    
    // Match end (real event)
    keyMoments.push({
      time: match.duration,
      event: match.radiant_win ? 'Radiant Victory' : 'Dire Victory',
      description: `Partita conclusa - ${match.radiant_win ? 'Radiant' : 'Dire'} vince`,
    })
    
    // Note: For detailed real events (kills, towers, roshan), use the timeline endpoint
    // which fetches real events from OpenDota match log

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