import { NextRequest, NextResponse } from 'next/server'

// Helper function to generate AI summary with fallback
async function generateSummary(prompt: string): Promise<{ summary: string; provider: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY

  // Try Gemini first
  if (geminiApiKey) {
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          }),
        }
      )

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json()
        const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (summary && summary.trim().length > 0) {
          console.log('Summary generated with Gemini')
          return { summary, provider: 'gemini' }
        } else {
          console.warn('Gemini API returned empty or undefined summary:', {
            hasCandidates: !!geminiData.candidates,
            candidatesLength: geminiData.candidates?.length || 0,
            dataStructure: JSON.stringify(geminiData).substring(0, 200)
          })
        }
      } else {
        const errorText = await geminiResponse.text().catch(() => 'Unknown error')
        console.warn('Gemini API failed, trying OpenAI fallback:', {
          status: geminiResponse.status,
          statusText: geminiResponse.statusText,
          error: errorText.substring(0, 200)
        })
      }
    } catch (error) {
      console.warn('Gemini API error, trying OpenAI fallback:', error)
    }
  }

  // Fallback to OpenAI
  if (openaiApiKey) {
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Sei un coach professionista di Dota 2. Rispondi sempre in italiano.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        const summary = openaiData.choices?.[0]?.message?.content
        if (summary && summary.trim().length > 0) {
          console.log('Summary generated with OpenAI')
          return { summary, provider: 'openai' }
        } else {
          console.warn('OpenAI API returned empty or undefined summary:', {
            hasChoices: !!openaiData.choices,
            choicesLength: openaiData.choices?.length || 0,
            dataStructure: JSON.stringify(openaiData).substring(0, 200)
          })
        }
      } else {
        const errorText = await openaiResponse.text().catch(() => 'Unknown error')
        console.error('OpenAI API error:', {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorText.substring(0, 200)
        })
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  // Generate detailed error message
  const hasGeminiKey = !!geminiApiKey
  const hasOpenaiKey = !!openaiApiKey
  
  if (!hasGeminiKey && !hasOpenaiKey) {
    throw new Error('No AI API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in Vercel environment variables')
  }
  
  const configuredProviders = []
  if (hasGeminiKey) configuredProviders.push('Gemini')
  if (hasOpenaiKey) configuredProviders.push('OpenAI')
  
  const bothText = configuredProviders.length > 1 ? 'both ' : ''
  throw new Error(`Failed to generate summary: ${configuredProviders.join(' and ')} ${bothText}returned empty content or failed. Check Vercel logs for details.`)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    
    const geminiApiKey = process.env.GEMINI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY

    console.log('AI Summary Match - Starting:', {
      matchId: id,
      playerId,
      geminiKeyPresent: !!geminiApiKey,
      openaiKeyPresent: !!openaiApiKey
    })

    if (!geminiApiKey && !openaiApiKey) {
      console.error('No AI API keys found in environment variables')
      return NextResponse.json(
        { error: 'No AI API key configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in Vercel environment variables.' },
        { status: 500 }
      )
    }

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      )
    }

    // Fetch match data directly from OpenDota
    const matchResponse = await fetch(`https://api.opendota.com/api/matches/${id}`)
    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }
    const match = await matchResponse.json()

    // Find the player in the match
    const player = match.players.find((p: any) => p.account_id === parseInt(playerId))
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found in this match' },
        { status: 404 }
      )
    }

    // Fetch match analysis data for recommendations
    const analysisResponse = await fetch(`${request.nextUrl.origin}/api/analysis/match/${id}`)
    let playerPerformance = null
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json()
      // Find player performance in the analysis array
      playerPerformance = analysisData.playerPerformance?.find((p: any) => {
        // Match by hero ID and similar stats
        return p.heroId === player.hero_id
      })
    }

    // Get hero name
    const heroesResponse = await fetch('https://api.opendota.com/api/heroes')
    const heroes = heroesResponse.ok ? await heroesResponse.json() : []
    const hero = heroes.find((h: any) => h.id === player.hero_id)
    const heroName = hero?.localized_name || 'Unknown'

    // Determine win/loss
    const playerTeam = player.player_slot < 128 ? 'radiant' : 'dire'
    const won = (playerTeam === 'radiant' && match.radiant_win) || (playerTeam === 'dire' && !match.radiant_win)

    // Prepare data for Gemini
    const matchSummary = {
      matchId: id,
      duration: `${Math.floor(match.duration / 60)}:${String(match.duration % 60).padStart(2, '0')}`,
      result: won ? 'Vittoria' : 'Sconfitta',
      hero: heroName,
      role: playerPerformance?.role || 'Unknown',
      kda: `${player.kills}/${player.deaths}/${player.assists}`,
      kdaValue: player.deaths > 0 ? ((player.kills + player.assists) / player.deaths).toFixed(2) : (player.kills + player.assists).toFixed(2),
      gpm: player.gold_per_min || 0,
      xpm: player.xp_per_min || 0,
      lastHits: player.last_hits || 0,
      denies: player.denies || 0,
      heroDamage: player.hero_damage || 0,
      towerDamage: player.tower_damage || 0,
      netWorth: player.net_worth || 0,
      strengths: [], // Not available in current structure
      weaknesses: [], // Not available in current structure
      recommendations: playerPerformance?.roleRecommendations || [],
    }

    // Create prompt for Gemini
    const prompt = `Sei un coach professionista di Dota 2. Genera un riassunto dettagliato e professionale in italiano di questa partita.

DATI PARTITA:
- Match ID: ${matchSummary.matchId}
- Durata: ${matchSummary.duration}
- Risultato: ${matchSummary.result}
- Eroe: ${matchSummary.hero}
- Ruolo: ${matchSummary.role}

PERFORMANCE:
- KDA: ${matchSummary.kda} (valore: ${matchSummary.kdaValue})
- GPM: ${matchSummary.gpm}
- XPM: ${matchSummary.xpm}
- Last Hits: ${matchSummary.lastHits}
- Denies: ${matchSummary.denies}
- Hero Damage: ${matchSummary.heroDamage.toLocaleString()}
- Tower Damage: ${matchSummary.towerDamage.toLocaleString()}
- Net Worth: ${matchSummary.netWorth.toLocaleString()}

RACCOMANDAZIONI: ${matchSummary.recommendations.length > 0 ? matchSummary.recommendations.join(' | ') : 'Nessuna raccomandazione specifica disponibile'}

Genera un riassunto professionale in italiano (max 300 parole) che includa:
1. Analisi dell'esito della partita e del contesto generale
2. Performance chiave del giocatore (KDA, farm, damage, ecc.)
3. Analisi delle metriche principali rispetto al ruolo giocato
4. Aree di miglioramento identificate
5. Un suggerimento principale per migliorare basato sulle raccomandazioni

Il tono deve essere professionale, costruttivo e orientato al miglioramento.`

    // Generate summary with fallback (Gemini -> OpenAI)
    let summary: string
    let provider: string
    try {
      const result = await generateSummary(prompt)
      summary = result.summary
      provider = result.provider
      console.log(`Summary generated successfully using ${provider}`)
    } catch (summaryError: any) {
      console.error('Failed to generate summary with both providers:', summaryError)
      return NextResponse.json(
        { 
          error: 'Failed to generate summary',
          details: summaryError?.message || 'Both Gemini and OpenAI failed or are not configured'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      summary,
      matchId: id,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error generating match summary:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}