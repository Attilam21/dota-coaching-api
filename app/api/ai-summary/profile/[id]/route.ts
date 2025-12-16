import { NextRequest, NextResponse } from 'next/server'

// Helper function to generate AI summary with fallback
async function generateSummary(prompt: string): Promise<{ summary: string; provider: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY

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
        if (summary) {
          console.log('Summary generated with Gemini')
          return { summary, provider: 'gemini' }
        }
      } else {
        console.warn('Gemini API failed, trying OpenAI fallback:', geminiResponse.status)
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
        if (summary) {
          console.log('Summary generated with OpenAI')
          return { summary, provider: 'openai' }
        }
      } else {
        const errorText = await openaiResponse.text()
        console.error('OpenAI API error:', openaiResponse.status, errorText)
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  throw new Error('Both Gemini and OpenAI failed or are not configured')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const geminiApiKey = process.env.GEMINI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY

    console.log('AI Summary Profile - Starting:', {
      playerId: id,
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

    // Fetch profile data
    // Use request.nextUrl.origin for internal API calls (works on Vercel)
    const profileUrl = `${request.nextUrl.origin}/api/player/${id}/profile`
    console.log('Fetching profile from:', profileUrl)
    
    const profileResponse = await fetch(profileUrl)
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json().catch(() => ({}))
      const errorText = await profileResponse.text().catch(() => 'Unknown error')
      console.error('Profile fetch failed:', {
        status: profileResponse.status,
        statusText: profileResponse.statusText,
        errorData,
        errorText
      })
      return NextResponse.json(
        { 
          error: errorData.error || 'Failed to fetch profile data',
          details: `Profile API returned ${profileResponse.status}: ${errorText.substring(0, 200)}`
        },
        { status: profileResponse.status }
      )
    }

    const profile = await profileResponse.json()

    // Fetch stats for trends (optional, don't fail if this fails)
    let stats = null
    try {
      const statsResponse = await fetch(`${request.nextUrl.origin}/api/player/${id}/stats`)
      if (statsResponse.ok) {
        stats = await statsResponse.json()
      }
    } catch (err) {
      console.warn('Failed to fetch stats for trends:', err)
    }

    // Prepare data for Gemini
    const profileData = {
      role: profile.role || 'Unknown',
      roleConfidence: profile.roleConfidence || 'Unknown',
      playstyle: profile.playstyle || 'Unknown',
      fzthScore: profile.fzthScore || 0,
      winrate: profile.metrics?.winrate || '0%',
      avgGPM: profile.metrics?.avgGPM || '0',
      avgXPM: profile.metrics?.avgXPM || '0',
      avgKDA: profile.metrics?.avgKDA || '0',
      avgDeaths: profile.metrics?.avgDeaths || '0',
      killParticipation: profile.metrics?.killParticipation || '0%',
      strengths: profile.strengths || [],
      weaknesses: profile.weaknesses || [],
      recommendations: profile.recommendations || [],
      trends: profile.trends || {},
      phaseAnalysis: profile.phaseAnalysis || {},
      patterns: profile.patterns || [],
    }

    // Create prompt for Gemini
    const prompt = `Sei un coach professionista di Dota 2. Genera un riassunto completo e professionale in italiano del profilo di questo giocatore.

PROFILO GIOCATORE:
- Ruolo principale: ${profileData.role} (${profileData.roleConfidence})
- Stile di gioco: ${profileData.playstyle}
- FZTH Score: ${profileData.fzthScore}/100

METRICHE CHIAVE:
- Winrate: ${profileData.winrate}
- GPM medio: ${profileData.avgGPM}
- XPM medio: ${profileData.avgXPM}
- KDA medio: ${profileData.avgKDA}
- Morti medie: ${profileData.avgDeaths}
- Kill Participation: ${profileData.killParticipation}

PUNTI DI FORZA (${profileData.strengths.length}): ${profileData.strengths.join(', ') || 'Nessuno'}
DEBOLEZZE (${profileData.weaknesses.length}): ${profileData.weaknesses.join(', ') || 'Nessuna'}
RACCOMANDAZIONI (${profileData.recommendations.length}): ${profileData.recommendations.slice(0, 3).join('; ') || 'Nessuna'}

TREND:
${profileData.trends.gpm ? `- GPM: ${profileData.trends.gpm.label} (${profileData.trends.gpm.direction})` : ''}
${profileData.trends.kda ? `- KDA: ${profileData.trends.kda.label} (${profileData.trends.kda.direction})` : ''}
${profileData.trends.winrate ? `- Winrate: ${profileData.trends.winrate.label} (${profileData.trends.winrate.direction})` : ''}

ANALISI FASI:
${profileData.phaseAnalysis.early ? `- Early Game: ${profileData.phaseAnalysis.early.strength}` : ''}
${profileData.phaseAnalysis.mid ? `- Mid Game: ${profileData.phaseAnalysis.mid.strength}` : ''}
${profileData.phaseAnalysis.late ? `- Late Game: ${profileData.phaseAnalysis.late.strength}` : ''}

PATTERN IDENTIFICATI: ${profileData.patterns.join(', ') || 'Nessuno'}

Genera un riassunto professionale in italiano (max 400 parole) che includa:
1. Analisi del profilo generale del giocatore
2. Ruolo e stile di gioco identificati
3. Punti di forza principali
4. Aree di miglioramento critiche
5. Trend delle performance recenti
6. Raccomandazione strategica principale per il miglioramento

Il tono deve essere professionale, motivazionale e orientato al miglioramento continuo.`

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
      playerId: id,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error generating profile summary:', {
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

