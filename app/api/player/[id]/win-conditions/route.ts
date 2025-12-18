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

    // Helper to safely calculate percentage difference
    const safePercentDiff = (win: number, loss: number) => {
      if (loss === 0) return win > 0 ? 100 : 0
      return ((win - loss) / loss) * 100
    }

    // Calculate differences and gaps
    const differences = {
      gpm: {
        win: winStats.avgGPM,
        loss: lossStats.avgGPM,
        diff: winStats.avgGPM - lossStats.avgGPM,
        diffPercent: safePercentDiff(winStats.avgGPM, lossStats.avgGPM),
      },
      xpm: {
        win: winStats.avgXPM,
        loss: lossStats.avgXPM,
        diff: winStats.avgXPM - lossStats.avgXPM,
        diffPercent: safePercentDiff(winStats.avgXPM, lossStats.avgXPM),
      },
      kda: {
        win: winStats.avgKDA,
        loss: lossStats.avgKDA,
        diff: winStats.avgKDA - lossStats.avgKDA,
        diffPercent: safePercentDiff(winStats.avgKDA, lossStats.avgKDA),
      },
      heroDamage: {
        win: winStats.avgHeroDamage,
        loss: lossStats.avgHeroDamage,
        diff: winStats.avgHeroDamage - lossStats.avgHeroDamage,
        diffPercent: safePercentDiff(winStats.avgHeroDamage, lossStats.avgHeroDamage),
      },
      towerDamage: {
        win: winStats.avgTowerDamage,
        loss: lossStats.avgTowerDamage,
        diff: winStats.avgTowerDamage - lossStats.avgTowerDamage,
        diffPercent: safePercentDiff(winStats.avgTowerDamage, lossStats.avgTowerDamage),
      },
      deaths: {
        win: winStats.avgDeaths,
        loss: lossStats.avgDeaths,
        diff: winStats.avgDeaths - lossStats.avgDeaths,
        diffPercent: safePercentDiff(winStats.avgDeaths, lossStats.avgDeaths),
      },
      lastHits: {
        win: winStats.avgLastHits,
        loss: lossStats.avgLastHits,
        diff: winStats.avgLastHits - lossStats.avgLastHits,
        diffPercent: safePercentDiff(winStats.avgLastHits, lossStats.avgLastHits),
      },
      teamfightParticipation: {
        win: winStats.avgTeamfightParticipation,
        loss: lossStats.avgTeamfightParticipation,
        diff: winStats.avgTeamfightParticipation - lossStats.avgTeamfightParticipation,
        diffPercent: safePercentDiff(winStats.avgTeamfightParticipation, lossStats.avgTeamfightParticipation),
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

    // Helper to safely format numbers for AI prompt
    const safeFormat = (value: number, decimals: number = 0) => {
      if (value == null || isNaN(value)) return '0'
      return value.toFixed(decimals)
    }

    // Generate AI insight
    const prompt = `Sei un coach professionale di Dota 2 con anni di esperienza. Analizza questi pattern di vittoria:

STATISTICHE VITTORIE (${winStats.count} partite):
- GPM: ${safeFormat(winStats.avgGPM, 0)} (vs ${safeFormat(lossStats.avgGPM, 0)} nelle sconfitte, ${differences.gpm.diffPercent >= 0 ? '+' : ''}${safeFormat(differences.gpm.diffPercent, 1)}%)
- XPM: ${safeFormat(winStats.avgXPM, 0)} (vs ${safeFormat(lossStats.avgXPM, 0)}, ${differences.xpm.diffPercent >= 0 ? '+' : ''}${safeFormat(differences.xpm.diffPercent, 1)}%)
- KDA: ${safeFormat(winStats.avgKDA, 2)} (vs ${safeFormat(lossStats.avgKDA, 2)}, ${differences.kda.diffPercent >= 0 ? '+' : ''}${safeFormat(differences.kda.diffPercent, 1)}%)
- Hero Damage: ${safeFormat(winStats.avgHeroDamage, 0)} (vs ${safeFormat(lossStats.avgHeroDamage, 0)}, ${differences.heroDamage.diffPercent >= 0 ? '+' : ''}${safeFormat(differences.heroDamage.diffPercent, 1)}%)
- Tower Damage: ${safeFormat(winStats.avgTowerDamage, 0)} (vs ${safeFormat(lossStats.avgTowerDamage, 0)}, ${differences.towerDamage.diffPercent >= 0 ? '+' : ''}${safeFormat(differences.towerDamage.diffPercent, 1)}%)
- Morti: ${safeFormat(winStats.avgDeaths, 1)} (vs ${safeFormat(lossStats.avgDeaths, 1)}, ${safeFormat(differences.deaths.diffPercent, 1)}%)
- Last Hits: ${safeFormat(winStats.avgLastHits, 0)} (vs ${safeFormat(lossStats.avgLastHits, 0)}, ${differences.lastHits.diffPercent >= 0 ? '+' : ''}${safeFormat(differences.lastHits.diffPercent, 1)}%)
- Teamfight Participation: ${safeFormat(winStats.avgTeamfightParticipation, 1)} (vs ${safeFormat(lossStats.avgTeamfightParticipation, 1)}, ${differences.teamfightParticipation.diffPercent >= 0 ? '+' : ''}${safeFormat(differences.teamfightParticipation.diffPercent, 1)}%)

DIFFERENZIATORI CHIAVE (cosa fai di diverso quando vinci):
${keyDifferentiators.map((d, i) => `${i + 1}. ${d.metric}: ${d.differencePercent >= 0 ? '+' : ''}${safeFormat(d.differencePercent, 1)}%`).join('\n')}

Genera un'analisi enterprise (max 250 parole) che:
1. Identifica il pattern principale che distingue le tue vittorie dalle sconfitte
2. Spiega la causa root di questo pattern
3. Fornisce un'azione concreta e replicabile per aumentare le vittorie
4. Include un suggerimento non scontato basato su questo pattern

Tono: professionale, diretto, assertivo. NON usare "potresti", "dovresti", "considera". Scrivi come un coach che ha identificato il pattern vincente.`

    const aiInsight = await generateWinConditionInsight(prompt)

    // Calculate win condition score (how well you replicate win patterns)
    // Prevent division by zero
    const winConditionScore = {
      gpmReplication: winStats.avgGPM > 0 ? (lossStats.avgGPM / winStats.avgGPM) * 100 : 0,
      xpmReplication: winStats.avgXPM > 0 ? (lossStats.avgXPM / winStats.avgXPM) * 100 : 0,
      kdaReplication: winStats.avgKDA > 0 ? (lossStats.avgKDA / winStats.avgKDA) * 100 : 0,
      overallScore: winStats.avgGPM > 0 && winStats.avgXPM > 0 && winStats.avgKDA > 0 && winStats.avgDeaths > 0
        ? ((lossStats.avgGPM / winStats.avgGPM) * 0.3 +
           (lossStats.avgXPM / winStats.avgXPM) * 0.2 +
           (lossStats.avgKDA / winStats.avgKDA) * 0.3 +
           (1 - (lossStats.avgDeaths / winStats.avgDeaths)) * 0.2) * 100
        : 0,
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

