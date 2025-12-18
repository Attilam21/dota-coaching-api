import { NextRequest, NextResponse } from 'next/server'

// Helper function to generate AI insight using Gemini or OpenAI
async function generateWinConditionInsight(prompt: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY

  // Try Gemini first
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && typeof text === 'string' && text.trim().length > 0) {
          return text.trim()
        }
      }
    } catch (error) {
      console.warn('Gemini API error, trying OpenAI fallback:', error)
    }
  }

  // Fallback to OpenAI
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.choices?.[0]?.message?.content
        if (text && typeof text === 'string' && text.trim().length > 0) {
          return text.trim()
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch matches data
    const matchesResponse = await fetch(`https://api.opendota.com/api/players/${id}/matches?limit=20`, {
      next: { revalidate: 3600 }
    })

    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matchesSummary: any[] = await matchesResponse.json()

    if (!matchesSummary || matchesSummary.length === 0) {
      return NextResponse.json({
        error: 'No matches found',
        analysis: null
      })
    }

    // Fetch full match details for analysis
    const fullMatchesPromises = matchesSummary.slice(0, 20).map((m: any) =>
      fetch(`https://api.opendota.com/api/matches/${m.match_id}`, {
        next: { revalidate: 3600 }
      }).then(res => res.ok ? res.json() : null).catch(() => null)
    )

    const fullMatches = await Promise.all(fullMatchesPromises)

    // Enrich matches with player data
    const enrichedMatches = matchesSummary.map((summaryMatch: any, idx: number) => {
      const fullMatch = idx < fullMatches.length ? fullMatches[idx] : null
      const playerInMatch = fullMatch?.players?.find((p: any) => 
        p.account_id?.toString() === id || p.player_slot === summaryMatch.player_slot
      )

      const isWin = (summaryMatch.player_slot < 128 && summaryMatch.radiant_win) ||
                   (summaryMatch.player_slot >= 128 && !summaryMatch.radiant_win)

      return {
        match_id: summaryMatch.match_id,
        win: isWin,
        duration: fullMatch?.duration || summaryMatch.duration || 0,
        gpm: playerInMatch?.gold_per_min || summaryMatch.gold_per_min || 0,
        xpm: playerInMatch?.xp_per_min || summaryMatch.xp_per_min || 0,
        kills: summaryMatch.kills || 0,
        deaths: summaryMatch.deaths || 0,
        assists: summaryMatch.assists || 0,
        kda: ((summaryMatch.kills || 0) + (summaryMatch.assists || 0)) / Math.max(summaryMatch.deaths || 1, 1),
        hero_damage: playerInMatch?.hero_damage || 0,
        tower_damage: playerInMatch?.tower_damage || 0,
        last_hits: playerInMatch?.last_hits || 0,
        denies: playerInMatch?.denies || 0,
        gold_spent: playerInMatch?.gold_spent || 0,
        net_worth: playerInMatch?.net_worth || 0,
        buyback_count: playerInMatch?.buyback_count || 0,
        observer_uses: playerInMatch?.observer_uses || 0,
        sentry_uses: playerInMatch?.sentry_uses || 0,
        teamfight_participations: playerInMatch?.teamfight_participations || 0,
        stuns: playerInMatch?.stuns || 0,
        rune_pickups: playerInMatch?.rune_pickups || 0,
      }
    })

    const validMatches = enrichedMatches.filter(m => m.duration > 0)

    if (validMatches.length === 0) {
      return NextResponse.json({
        error: 'No valid matches found',
        analysis: null
      })
    }

    // Separate wins and losses
    const wins = validMatches.filter(m => m.win)
    const losses = validMatches.filter(m => !m.win)

    if (wins.length === 0 || losses.length === 0) {
      return NextResponse.json({
        error: 'Insufficient data: need both wins and losses for comparison',
        analysis: null
      })
    }

    // Calculate averages for wins vs losses
    const calculateAvg = (matches: typeof validMatches, key: keyof typeof validMatches[0]) => {
      return matches.reduce((acc, m) => acc + (m[key] as number || 0), 0) / matches.length
    }

    const winStats = {
      count: wins.length,
      avgGPM: calculateAvg(wins, 'gpm'),
      avgXPM: calculateAvg(wins, 'xpm'),
      avgKDA: calculateAvg(wins, 'kda'),
      avgKills: calculateAvg(wins, 'kills'),
      avgDeaths: calculateAvg(wins, 'deaths'),
      avgAssists: calculateAvg(wins, 'assists'),
      avgHeroDamage: calculateAvg(wins, 'hero_damage'),
      avgTowerDamage: calculateAvg(wins, 'tower_damage'),
      avgLastHits: calculateAvg(wins, 'last_hits'),
      avgDenies: calculateAvg(wins, 'denies'),
      avgGoldSpent: calculateAvg(wins, 'gold_spent'),
      avgNetWorth: calculateAvg(wins, 'net_worth'),
      avgBuybacks: calculateAvg(wins, 'buyback_count'),
      avgObserverWards: calculateAvg(wins, 'observer_uses'),
      avgSentryWards: calculateAvg(wins, 'sentry_uses'),
      avgTeamfightParticipation: calculateAvg(wins, 'teamfight_participations'),
      avgStuns: calculateAvg(wins, 'stuns'),
      avgRunePickups: calculateAvg(wins, 'rune_pickups'),
      avgDuration: calculateAvg(wins, 'duration'),
    }

    const lossStats = {
      count: losses.length,
      avgGPM: calculateAvg(losses, 'gpm'),
      avgXPM: calculateAvg(losses, 'xpm'),
      avgKDA: calculateAvg(losses, 'kda'),
      avgKills: calculateAvg(losses, 'kills'),
      avgDeaths: calculateAvg(losses, 'deaths'),
      avgAssists: calculateAvg(losses, 'assists'),
      avgHeroDamage: calculateAvg(losses, 'hero_damage'),
      avgTowerDamage: calculateAvg(losses, 'tower_damage'),
      avgLastHits: calculateAvg(losses, 'last_hits'),
      avgDenies: calculateAvg(losses, 'denies'),
      avgGoldSpent: calculateAvg(losses, 'gold_spent'),
      avgNetWorth: calculateAvg(losses, 'net_worth'),
      avgBuybacks: calculateAvg(losses, 'buyback_count'),
      avgObserverWards: calculateAvg(losses, 'observer_uses'),
      avgSentryWards: calculateAvg(losses, 'sentry_uses'),
      avgTeamfightParticipation: calculateAvg(losses, 'teamfight_participations'),
      avgStuns: calculateAvg(losses, 'stuns'),
      avgRunePickups: calculateAvg(losses, 'rune_pickups'),
      avgDuration: calculateAvg(losses, 'duration'),
    }

    // Calculate differences and gaps
    const differences = {
      gpm: {
        win: winStats.avgGPM,
        loss: lossStats.avgGPM,
        diff: winStats.avgGPM - lossStats.avgGPM,
        diffPercent: ((winStats.avgGPM - lossStats.avgGPM) / lossStats.avgGPM) * 100,
      },
      xpm: {
        win: winStats.avgXPM,
        loss: lossStats.avgXPM,
        diff: winStats.avgXPM - lossStats.avgXPM,
        diffPercent: ((winStats.avgXPM - lossStats.avgXPM) / lossStats.avgXPM) * 100,
      },
      kda: {
        win: winStats.avgKDA,
        loss: lossStats.avgKDA,
        diff: winStats.avgKDA - lossStats.avgKDA,
        diffPercent: ((winStats.avgKDA - lossStats.avgKDA) / lossStats.avgKDA) * 100,
      },
      heroDamage: {
        win: winStats.avgHeroDamage,
        loss: lossStats.avgHeroDamage,
        diff: winStats.avgHeroDamage - lossStats.avgHeroDamage,
        diffPercent: ((winStats.avgHeroDamage - lossStats.avgHeroDamage) / lossStats.avgHeroDamage) * 100,
      },
      towerDamage: {
        win: winStats.avgTowerDamage,
        loss: lossStats.avgTowerDamage,
        diff: winStats.avgTowerDamage - lossStats.avgTowerDamage,
        diffPercent: ((winStats.avgTowerDamage - lossStats.avgTowerDamage) / lossStats.avgTowerDamage) * 100,
      },
      deaths: {
        win: winStats.avgDeaths,
        loss: lossStats.avgDeaths,
        diff: winStats.avgDeaths - lossStats.avgDeaths,
        diffPercent: ((winStats.avgDeaths - lossStats.avgDeaths) / lossStats.avgDeaths) * 100,
      },
      lastHits: {
        win: winStats.avgLastHits,
        loss: lossStats.avgLastHits,
        diff: winStats.avgLastHits - lossStats.avgLastHits,
        diffPercent: ((winStats.avgLastHits - lossStats.avgLastHits) / lossStats.avgLastHits) * 100,
      },
      teamfightParticipation: {
        win: winStats.avgTeamfightParticipation,
        loss: lossStats.avgTeamfightParticipation,
        diff: winStats.avgTeamfightParticipation - lossStats.avgTeamfightParticipation,
        diffPercent: ((winStats.avgTeamfightParticipation - lossStats.avgTeamfightParticipation) / lossStats.avgTeamfightParticipation) * 100,
      },
    }

    // Identify top 3 key differentiators (what you do differently in wins)
    const keyDifferentiators = Object.entries(differences)
      .map(([key, data]) => ({
        metric: key,
        winValue: data.win,
        lossValue: data.loss,
        difference: data.diff,
        differencePercent: data.diffPercent,
        impact: Math.abs(data.diffPercent),
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)

    // Generate AI insight
    const prompt = `Sei un coach professionale di Dota 2 con anni di esperienza. Analizza questi pattern di vittoria:

STATISTICHE VITTORIE (${winStats.count} partite):
- GPM: ${winStats.avgGPM.toFixed(0)} (vs ${lossStats.avgGPM.toFixed(0)} nelle sconfitte, +${differences.gpm.diffPercent.toFixed(1)}%)
- XPM: ${winStats.avgXPM.toFixed(0)} (vs ${lossStats.avgXPM.toFixed(0)}, +${differences.xpm.diffPercent.toFixed(1)}%)
- KDA: ${winStats.avgKDA.toFixed(2)} (vs ${lossStats.avgKDA.toFixed(2)}, +${differences.kda.diffPercent.toFixed(1)}%)
- Hero Damage: ${winStats.avgHeroDamage.toFixed(0)} (vs ${lossStats.avgHeroDamage.toFixed(0)}, +${differences.heroDamage.diffPercent.toFixed(1)}%)
- Tower Damage: ${winStats.avgTowerDamage.toFixed(0)} (vs ${lossStats.avgTowerDamage.toFixed(0)}, +${differences.towerDamage.diffPercent.toFixed(1)}%)
- Morti: ${winStats.avgDeaths.toFixed(1)} (vs ${lossStats.avgDeaths.toFixed(1)}, ${differences.deaths.diffPercent.toFixed(1)}%)
- Last Hits: ${winStats.avgLastHits.toFixed(0)} (vs ${lossStats.avgLastHits.toFixed(0)}, +${differences.lastHits.diffPercent.toFixed(1)}%)
- Teamfight Participation: ${winStats.avgTeamfightParticipation.toFixed(1)} (vs ${lossStats.avgTeamfightParticipation.toFixed(1)}, +${differences.teamfightParticipation.diffPercent.toFixed(1)}%)

DIFFERENZIATORI CHIAVE (cosa fai di diverso quando vinci):
${keyDifferentiators.map((d, i) => `${i + 1}. ${d.metric}: ${d.differencePercent > 0 ? '+' : ''}${d.differencePercent.toFixed(1)}%`).join('\n')}

Genera un'analisi enterprise (max 250 parole) che:
1. Identifica il pattern principale che distingue le tue vittorie dalle sconfitte
2. Spiega la causa root di questo pattern
3. Fornisce un'azione concreta e replicabile per aumentare le vittorie
4. Include un suggerimento non scontato basato su questo pattern

Tono: professionale, diretto, assertivo. NON usare "potresti", "dovresti", "considera". Scrivi come un coach che ha identificato il pattern vincente.`

    const aiInsight = await generateWinConditionInsight(prompt)

    // Calculate win condition score (how well you replicate win patterns)
    const winConditionScore = {
      gpmReplication: (lossStats.avgGPM / winStats.avgGPM) * 100, // % di quanto replichi il GPM delle vittorie
      xpmReplication: (lossStats.avgXPM / winStats.avgXPM) * 100,
      kdaReplication: (lossStats.avgKDA / winStats.avgKDA) * 100,
      overallScore: ((lossStats.avgGPM / winStats.avgGPM) * 0.3 +
                     (lossStats.avgXPM / winStats.avgXPM) * 0.2 +
                     (lossStats.avgKDA / winStats.avgKDA) * 0.3 +
                     (1 - (lossStats.avgDeaths / winStats.avgDeaths)) * 0.2) * 100,
    }

    return NextResponse.json({
      summary: {
        totalMatches: validMatches.length,
        wins: winStats.count,
        losses: lossStats.count,
        winrate: (winStats.count / validMatches.length) * 100,
      },
      winStats,
      lossStats,
      differences,
      keyDifferentiators,
      winConditionScore,
      aiInsight,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error analyzing win conditions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

