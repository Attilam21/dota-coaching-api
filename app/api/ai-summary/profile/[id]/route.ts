import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Fetch profile data
    const profileResponse = await fetch(`${request.nextUrl.origin}/api/player/${id}/profile`)
    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch profile data' },
        { status: 404 }
      )
    }

    const profile = await profileResponse.json()

    // Fetch stats for trends
    const statsResponse = await fetch(`${request.nextUrl.origin}/api/player/${id}/stats`)
    const stats = statsResponse.ok ? await statsResponse.json() : null

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
      const error = await geminiResponse.text()
      console.error('Gemini API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      )
    }

    const geminiData = await geminiResponse.json()
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Impossibile generare il riassunto.'

    return NextResponse.json({
      summary,
      playerId: id,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating profile summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

