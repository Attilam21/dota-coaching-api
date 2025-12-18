import { NextRequest, NextResponse } from 'next/server'

// Helper function to generate AI insight using Gemini or OpenAI
async function generateMetaInsight(prompt: string): Promise<string | null> {
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
          max_tokens: 500,
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

    // Fetch all necessary data
    const [statsResponse, advancedResponse, benchmarksResponse, profileResponse] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/player/${id}/stats`),
      fetch(`${request.nextUrl.origin}/api/player/${id}/advanced-stats`),
      fetch(`${request.nextUrl.origin}/api/player/${id}/benchmarks`).catch(() => null),
      fetch(`${request.nextUrl.origin}/api/player/${id}/profile`).catch(() => null),
    ])

    const statsData = statsResponse.ok ? await statsResponse.json() : null
    const advancedData = advancedResponse.ok ? await advancedResponse.json() : null
    const benchmarksData = benchmarksResponse?.ok ? await benchmarksResponse.json() : null
    const profileData = profileResponse?.ok ? await profileResponse.json() : null

    if (!statsData?.stats) {
      return NextResponse.json(
        { error: 'Failed to fetch player stats' },
        { status: 500 }
      )
    }

    const stats = statsData.stats
    const advanced = advancedData?.stats || {}
    const matches = stats.matches || []

    // Calculate player metrics
    const playerMetrics = {
      avgGPM: matches.length > 0
        ? matches.reduce((acc: number, m: any) => acc + (m.gpm || 0), 0) / matches.length
        : 0,
      avgXPM: matches.length > 0
        ? matches.reduce((acc: number, m: any) => acc + (m.xpm || 0), 0) / matches.length
        : 0,
      avgKDA: matches.length > 0
        ? matches.reduce((acc: number, m: any) => acc + (m.kda || 0), 0) / matches.length
        : 0,
      winrate: stats.winrate?.last10 || 0,
      avgDeaths: advanced.fights?.avgDeaths || 0,
      avgHeroDamage: advanced.fights?.avgHeroDamage || 0,
      avgTowerDamage: advanced.fights?.avgTowerDamage || 0,
      killParticipation: advanced.fights?.killParticipation || 0,
      avgLastHits: advanced.lane?.avgLastHits || 0,
      avgDenies: advanced.lane?.avgDenies || 0,
      denyRate: advanced.lane?.denyRate || 0,
      goldUtilization: advanced.farm?.goldUtilization || 0,
      visionScore: advanced.vision?.wardEfficiency || 0,
    }

    // Get role for meta benchmarks
    const role = profileData?.role || 'carry'
    const roleLower = role.toLowerCase()

    // Meta benchmarks per ruolo (basati su percentili 50, 75, 90)
    const metaBenchmarks: Record<string, Record<string, { p50: number; p75: number; p90: number }>> = {
      carry: {
        gpm: { p50: 450, p75: 550, p90: 650 },
        xpm: { p50: 500, p75: 600, p90: 700 },
        kda: { p50: 2.0, p75: 2.5, p90: 3.0 },
        heroDamage: { p50: 15000, p75: 20000, p90: 25000 },
        towerDamage: { p50: 3000, p75: 5000, p90: 7000 },
        lastHits: { p50: 200, p75: 250, p90: 300 },
      },
      mid: {
        gpm: { p50: 450, p75: 550, p90: 650 },
        xpm: { p50: 550, p75: 650, p90: 750 },
        kda: { p50: 2.2, p75: 2.7, p90: 3.2 },
        heroDamage: { p50: 18000, p75: 23000, p90: 28000 },
        towerDamage: { p50: 2000, p75: 4000, p90: 6000 },
        lastHits: { p50: 180, p75: 230, p90: 280 },
      },
      offlane: {
        gpm: { p50: 400, p75: 500, p90: 600 },
        xpm: { p50: 450, p75: 550, p90: 650 },
        kda: { p50: 1.8, p75: 2.3, p90: 2.8 },
        heroDamage: { p50: 12000, p75: 17000, p90: 22000 },
        towerDamage: { p50: 4000, p75: 6000, p90: 8000 },
        lastHits: { p50: 150, p75: 200, p90: 250 },
      },
      support: {
        gpm: { p50: 300, p75: 400, p90: 500 },
        xpm: { p50: 350, p75: 450, p90: 550 },
        kda: { p50: 1.5, p75: 2.0, p90: 2.5 },
        heroDamage: { p50: 8000, p75: 12000, p90: 16000 },
        towerDamage: { p50: 1000, p75: 2500, p90: 4000 },
        lastHits: { p50: 50, p75: 80, p90: 120 },
      },
    }

    const benchmarks = metaBenchmarks[roleLower] || metaBenchmarks.carry

    // Calculate comparisons
    const comparisons = {
      gpm: {
        player: playerMetrics.avgGPM,
        meta: {
          p50: benchmarks.gpm.p50,
          p75: benchmarks.gpm.p75,
          p90: benchmarks.gpm.p90,
        },
        percentile: playerMetrics.avgGPM >= benchmarks.gpm.p90 ? 90 :
                    playerMetrics.avgGPM >= benchmarks.gpm.p75 ? 75 :
                    playerMetrics.avgGPM >= benchmarks.gpm.p50 ? 50 : 25,
        gap: playerMetrics.avgGPM - benchmarks.gpm.p50,
        gapPercent: ((playerMetrics.avgGPM - benchmarks.gpm.p50) / benchmarks.gpm.p50) * 100,
      },
      xpm: {
        player: playerMetrics.avgXPM,
        meta: {
          p50: benchmarks.xpm.p50,
          p75: benchmarks.xpm.p75,
          p90: benchmarks.xpm.p90,
        },
        percentile: playerMetrics.avgXPM >= benchmarks.xpm.p90 ? 90 :
                    playerMetrics.avgXPM >= benchmarks.xpm.p75 ? 75 :
                    playerMetrics.avgXPM >= benchmarks.xpm.p50 ? 50 : 25,
        gap: playerMetrics.avgXPM - benchmarks.xpm.p50,
        gapPercent: ((playerMetrics.avgXPM - benchmarks.xpm.p50) / benchmarks.xpm.p50) * 100,
      },
      kda: {
        player: playerMetrics.avgKDA,
        meta: {
          p50: benchmarks.kda.p50,
          p75: benchmarks.kda.p75,
          p90: benchmarks.kda.p90,
        },
        percentile: playerMetrics.avgKDA >= benchmarks.kda.p90 ? 90 :
                    playerMetrics.avgKDA >= benchmarks.kda.p75 ? 75 :
                    playerMetrics.avgKDA >= benchmarks.kda.p50 ? 50 : 25,
        gap: playerMetrics.avgKDA - benchmarks.kda.p50,
        gapPercent: ((playerMetrics.avgKDA - benchmarks.kda.p50) / benchmarks.kda.p50) * 100,
      },
      winrate: {
        player: playerMetrics.winrate,
        meta: { p50: 50, p75: 55, p90: 60 },
        percentile: playerMetrics.winrate >= 60 ? 90 :
                    playerMetrics.winrate >= 55 ? 75 :
                    playerMetrics.winrate >= 50 ? 50 : 25,
        gap: playerMetrics.winrate - 50,
        gapPercent: ((playerMetrics.winrate - 50) / 50) * 100,
      },
      heroDamage: {
        player: playerMetrics.avgHeroDamage,
        meta: {
          p50: benchmarks.heroDamage.p50,
          p75: benchmarks.heroDamage.p75,
          p90: benchmarks.heroDamage.p90,
        },
        percentile: playerMetrics.avgHeroDamage >= benchmarks.heroDamage.p90 ? 90 :
                    playerMetrics.avgHeroDamage >= benchmarks.heroDamage.p75 ? 75 :
                    playerMetrics.avgHeroDamage >= benchmarks.heroDamage.p50 ? 50 : 25,
        gap: playerMetrics.avgHeroDamage - benchmarks.heroDamage.p50,
        gapPercent: ((playerMetrics.avgHeroDamage - benchmarks.heroDamage.p50) / benchmarks.heroDamage.p50) * 100,
      },
      towerDamage: {
        player: playerMetrics.avgTowerDamage,
        meta: {
          p50: benchmarks.towerDamage.p50,
          p75: benchmarks.towerDamage.p75,
          p90: benchmarks.towerDamage.p90,
        },
        percentile: playerMetrics.avgTowerDamage >= benchmarks.towerDamage.p90 ? 90 :
                    playerMetrics.avgTowerDamage >= benchmarks.towerDamage.p75 ? 75 :
                    playerMetrics.avgTowerDamage >= benchmarks.towerDamage.p50 ? 50 : 25,
        gap: playerMetrics.avgTowerDamage - benchmarks.towerDamage.p50,
        gapPercent: ((playerMetrics.avgTowerDamage - benchmarks.towerDamage.p50) / benchmarks.towerDamage.p50) * 100,
      },
      lastHits: {
        player: playerMetrics.avgLastHits,
        meta: {
          p50: benchmarks.lastHits.p50,
          p75: benchmarks.lastHits.p75,
          p90: benchmarks.lastHits.p90,
        },
        percentile: playerMetrics.avgLastHits >= benchmarks.lastHits.p90 ? 90 :
                    playerMetrics.avgLastHits >= benchmarks.lastHits.p75 ? 75 :
                    playerMetrics.avgLastHits >= benchmarks.lastHits.p50 ? 50 : 25,
        gap: playerMetrics.avgLastHits - benchmarks.lastHits.p50,
        gapPercent: ((playerMetrics.avgLastHits - benchmarks.lastHits.p50) / benchmarks.lastHits.p50) * 100,
      },
    }

    // Identify top 3 areas for improvement
    const improvementAreas = Object.entries(comparisons)
      .map(([key, comp]) => ({
        metric: key,
        gap: comp.gap,
        gapPercent: comp.gapPercent,
        percentile: comp.percentile,
        player: comp.player,
        meta: comp.meta.p50,
      }))
      .filter(area => area.gap < 0)
      .sort((a, b) => a.gapPercent - b.gapPercent)
      .slice(0, 3)

    // Generate AI insights for top improvement areas
    const aiInsights: Array<{ metric: string; insight: string }> = []
    
    for (const area of improvementAreas) {
      const metricName = {
        gpm: 'GPM (Gold Per Minute)',
        xpm: 'XPM (Experience Per Minute)',
        kda: 'KDA (Kill/Death/Assist)',
        winrate: 'Winrate',
        heroDamage: 'Hero Damage',
        towerDamage: 'Tower Damage',
        lastHits: 'Last Hits',
      }[area.metric] || area.metric

      const prompt = `Sei un coach professionale di Dota 2 con anni di esperienza. Analizza questa situazione specifica:

RUOLO: ${role}
METRICA: ${metricName}
VALORE GIOCATORE: ${area.player.toFixed(1)}
BENCHMARK META (p50): ${area.meta.toFixed(1)}
GAP: ${area.gapPercent.toFixed(1)}% sotto la media del meta
PERCENTILE: Top ${100 - area.percentile}% (${area.percentile}° percentile)

Genera un'analisi enterprise (max 200 parole) che:
1. Identifica il problema specifico e la causa root
2. Spiega l'impatto sul gameplay e sulle vittorie
3. Fornisce un'azione concreta e misurabile per migliorare
4. Include un suggerimento non scontato basato su pattern avanzati

Tono: professionale, diretto, assertivo. NON usare "potresti", "dovresti", "considera". Scrivi come un coach che sa esattamente cosa fare.`

      const insight = await generateMetaInsight(prompt)
      if (insight) {
        aiInsights.push({ metric: area.metric, insight })
      }
    }

    // Generate overall strategic recommendation
    const strategicPrompt = `Sei un coach professionale di Dota 2. Analisi completa giocatore:

RUOLO: ${role}
METRICHE CHIAVE:
- GPM: ${playerMetrics.avgGPM.toFixed(0)} (meta p50: ${benchmarks.gpm.p50}, gap: ${comparisons.gpm.gapPercent.toFixed(1)}%)
- XPM: ${playerMetrics.avgXPM.toFixed(0)} (meta p50: ${benchmarks.xpm.p50}, gap: ${comparisons.xpm.gapPercent.toFixed(1)}%)
- KDA: ${playerMetrics.avgKDA.toFixed(2)} (meta p50: ${benchmarks.kda.p50}, gap: ${comparisons.kda.gapPercent.toFixed(1)}%)
- Winrate: ${playerMetrics.winrate.toFixed(1)}% (meta: 50%, gap: ${comparisons.winrate.gapPercent.toFixed(1)}%)
- Hero Damage: ${playerMetrics.avgHeroDamage.toFixed(0)} (meta p50: ${benchmarks.heroDamage.p50})
- Tower Damage: ${playerMetrics.avgTowerDamage.toFixed(0)} (meta p50: ${benchmarks.towerDamage.p50})
- Last Hits: ${playerMetrics.avgLastHits.toFixed(0)} (meta p50: ${benchmarks.lastHits.p50})

AREE DI MIGLIORAMENTO PRIORITARIE:
${improvementAreas.map(a => `- ${a.metric}: ${a.gapPercent.toFixed(1)}% sotto meta`).join('\n')}

Genera una raccomandazione strategica enterprise (max 250 parole) che:
1. Identifica il pattern principale che limita le performance
2. Propone una strategia concreta e non scontata per migliorare
3. Include un focus specifico sul ruolo ${role}
4. Fornisce un obiettivo misurabile per le prossime 10 partite

Tono: professionale, motivazionale ma diretto. NON usare "potresti", "dovresti". Scrivi come un coach che ha analizzato migliaia di partite.`

    const strategicInsight = await generateMetaInsight(strategicPrompt)

    return NextResponse.json({
      role,
      playerMetrics,
      comparisons,
      improvementAreas,
      aiInsights,
      strategicInsight,
      benchmarks: benchmarksData,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error generating meta comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

