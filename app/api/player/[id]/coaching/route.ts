import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/fetch-utils'

// Helper function to generate AI coaching advice
async function generateCoachingAdvice(prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          timeout: 15000, // 15 seconds for AI API
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
  const openaiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY
  if (openaiKey) {
    try {
      const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
        timeout: 15000, // 15 seconds for AI API
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

  throw new Error('AI service unavailable')
}

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

    // Fetch profile and stats with timeout to prevent hanging
    // Use absolute URL with internal call header to bypass Vercel Deployment Protection
    const baseUrl = request.nextUrl.origin
    
    const [profileResponse, statsResponse, advancedResponse] = await Promise.allSettled([
      fetchWithTimeout(`${baseUrl}/api/player/${playerId}/profile`, {
        timeout: 15000,
        next: { revalidate: 3600 },
        headers: {
          'x-internal-call': 'true',
          'user-agent': 'Internal-API-Call/1.0',
        }
      }),
      fetchWithTimeout(`${baseUrl}/api/player/${playerId}/stats`, {
        timeout: 15000,
        next: { revalidate: 3600 },
        headers: {
          'x-internal-call': 'true',
          'user-agent': 'Internal-API-Call/1.0',
        }
      }),
      fetchWithTimeout(`${baseUrl}/api/player/${playerId}/advanced-stats`, {
        timeout: 15000,
        next: { revalidate: 3600 },
        headers: {
          'x-internal-call': 'true',
          'user-agent': 'Internal-API-Call/1.0',
        }
      }).catch(() => null),
    ])

    // Check if critical responses succeeded
    if (profileResponse.status === 'rejected' || statsResponse.status === 'rejected') {
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      )
    }

    if (!profileResponse.value.ok || !statsResponse.value.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      )
    }

    const profile = await profileResponse.value.json()
    const statsData = await statsResponse.value.json()
    const advancedData = advancedResponse?.status === 'fulfilled' && advancedResponse.value?.ok 
      ? await advancedResponse.value.json() 
      : null

    const stats = statsData.stats
    const advanced = advancedData?.stats || {
      lane: { avgLastHits: 0, avgDenies: 0 },
      farm: { avgGPM: 0, avgXPM: 0, goldUtilization: 0 },
      fights: { killParticipation: 0, avgHeroDamage: 0, avgDeaths: 0 },
      vision: { avgObserverPlaced: 0 },
    }

    const matches = stats.matches || []
    if (matches.length === 0) {
      return NextResponse.json({ error: 'No matches found' }, { status: 400 })
    }

    // Calculate metrics
    const avgGPM = stats.farm?.gpm?.last10 || 0
    const avgXPM = stats.farm?.xpm?.last10 || 0
    const avgKDA = matches.length > 0
      ? matches.reduce((acc: number, m: any) => acc + (m.kda || 0), 0) / matches.length
      : 0
    const winrate = stats.winrate?.last10 || 0
    const avgDeaths = advanced.fights?.avgDeaths || 0
    const role = profile.role || 'Core'

    // Benchmark per ruolo
    const benchmarks: Record<string, { gpm: number; xpm: number; kda: number; deaths: number }> = {
      Carry: { gpm: 550, xpm: 600, kda: 2.5, deaths: 5 },
      Mid: { gpm: 500, xpm: 550, kda: 2.8, deaths: 5 },
      Offlane: { gpm: 450, xpm: 500, kda: 2.2, deaths: 6 },
      Support: { gpm: 300, xpm: 350, kda: 1.8, deaths: 6 },
      Core: { gpm: 500, xpm: 550, kda: 2.5, deaths: 5 },
    }

    const benchmark = benchmarks[role] || benchmarks.Core

    // Calculate gaps
    const gaps = {
      gpm: { value: avgGPM - benchmark.gpm, percent: ((avgGPM - benchmark.gpm) / benchmark.gpm) * 100 },
      xpm: { value: avgXPM - benchmark.xpm, percent: ((avgXPM - benchmark.xpm) / benchmark.xpm) * 100 },
      kda: { value: avgKDA - benchmark.kda, percent: ((avgKDA - benchmark.kda) / benchmark.kda) * 100 },
      deaths: { value: avgDeaths - benchmark.deaths, percent: ((avgDeaths - benchmark.deaths) / benchmark.deaths) * 100 },
    }

    // Detect patterns
    const recent5 = matches.slice(0, 5)
    const recent10 = matches.slice(5, 10)

    // Pattern 1: Late game farm drop
    const gpm5 = recent5.length > 0 ? recent5.reduce((acc: number, m: any) => acc + (m.gpm || 0), 0) / recent5.length : 0
    const gpm10 = recent10.length > 0 ? recent10.reduce((acc: number, m: any) => acc + (m.gpm || 0), 0) / recent10.length : 0
    const lateGameFarmDrop = gpm5 < gpm10 * 0.85 ? {
      detected: true,
      drop: ((gpm10 - gpm5) / gpm10) * 100,
      severity: gpm5 < gpm10 * 0.75 ? 'high' : 'medium',
    } : null

    // Pattern 2: Death timing (if we have match details)
    const deathTiming = avgDeaths > benchmark.deaths * 1.2 ? {
      detected: true,
      avgDeaths,
      benchmark: benchmark.deaths,
      excess: avgDeaths - benchmark.deaths,
    } : null

    // Pattern 3: Kill participation vs farm
    const killParticipation = advanced.fights?.killParticipation || 0
    const farmVsFight = killParticipation > 75 && avgGPM < benchmark.gpm * 0.9 ? {
      detected: true,
      issue: 'High fight participation but low farm',
    } : null

    // Identify main issue (highest priority)
    let mainIssue = {
      type: 'general',
      description: 'Performance generale da migliorare',
      gap: 0,
      priority: 0,
    }

    if (Math.abs(gaps.gpm.percent) > 15 && gaps.gpm.percent < 0) {
      mainIssue = {
        type: 'farm',
        description: `GPM ${avgGPM.toFixed(0)} vs benchmark ${benchmark.gpm} (gap ${gaps.gpm.percent.toFixed(1)}%)`,
        gap: gaps.gpm.percent,
        priority: Math.abs(gaps.gpm.percent),
      }
    } else if (Math.abs(gaps.kda.percent) > 20 && gaps.kda.percent < 0) {
      mainIssue = {
        type: 'kda',
        description: `KDA ${avgKDA.toFixed(2)} vs benchmark ${benchmark.kda} (gap ${gaps.kda.percent.toFixed(1)}%)`,
        gap: gaps.kda.percent,
        priority: Math.abs(gaps.kda.percent),
      }
    } else if (deathTiming) {
      mainIssue = {
        type: 'deaths',
        description: `Morti medie ${avgDeaths.toFixed(1)} vs benchmark ${benchmark.deaths} (${deathTiming.excess.toFixed(1)} in eccesso)`,
        gap: gaps.deaths.percent,
        priority: Math.abs(gaps.deaths.percent),
      }
    }

    // Build context for prompt (max 50 words)
    let context = `Ruolo ${role}. `
    if (mainIssue.type !== 'general') {
      context += `Problema: ${mainIssue.description}. `
    }
    if (lateGameFarmDrop?.detected) {
      context += `GPM cala ${lateGameFarmDrop.drop.toFixed(0)}% nelle ultime partite. `
    }
    if (deathTiming?.detected) {
      context += `Morti ${deathTiming.excess.toFixed(1)} sopra benchmark. `
    }
    if (farmVsFight?.detected) {
      context += `Alta partecipazione fight ma farm basso. `
    }
    context += `Winrate ${winrate.toFixed(1)}%.`

    // Generate prompt
    const prompt = `CONTESTO (${context.length} caratteri):
${context}

AZIONE:
Scrivi 3 bullet points specifici (max 20 parole ciascuno):
1. Cosa fare DURANTE la partita (azione immediata)
2. Cosa praticare TRA le partite (skill da migliorare)
3. Come misurare il miglioramento (metrica target)

FORMATO: Solo bullet points, niente introduzione, tono diretto.`

    // Generate advice
    const advice = await generateCoachingAdvice(prompt)

    return NextResponse.json({
      advice,
      mainIssue: {
        type: mainIssue.type,
        description: mainIssue.description,
      },
      patterns: {
        lateGameFarmDrop: lateGameFarmDrop?.detected || false,
        deathTiming: deathTiming?.detected || false,
        farmVsFight: farmVsFight?.detected || false,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800',
      },
    })
  } catch (error) {
    console.error('Error generating coaching advice:', error)
    return NextResponse.json(
      { error: 'Failed to generate coaching advice' },
      { status: 500 }
    )
  }
}
