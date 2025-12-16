import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const geminiApiKey = process.env.GEMINI_API_KEY

    console.log('AI Summary Profile - Starting:', {
      playerId: id,
      apiKeyPresent: !!geminiApiKey,
      apiKeyLength: geminiApiKey?.length || 0
    })

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' },
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

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text().catch(() => 'Unknown error')
      const errorStatus = geminiResponse.status
      console.error('Gemini API error:', {
        status: errorStatus,
        statusText: geminiResponse.statusText,
        error: errorText,
        apiKeyPresent: !!geminiApiKey,
        apiKeyLength: geminiApiKey?.length || 0
      })
      
      // Try to parse error as JSON
      let errorMessage = 'Failed to generate summary'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorStatus === 401 ? 'Invalid API key' : errorStatus === 429 ? 'Rate limit exceeded' : 'Gemini API error'
        },
        { status: 500 }
      )
    }

    let geminiData
    try {
      geminiData = await geminiResponse.json()
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      return NextResponse.json(
        { error: 'Invalid response from Gemini API' },
        { status: 500 }
      )
    }
    
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Impossibile generare il riassunto.'
    
    if (!summary || summary === 'Impossibile generare il riassunto.') {
      console.error('Empty or invalid summary from Gemini:', geminiData)
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

