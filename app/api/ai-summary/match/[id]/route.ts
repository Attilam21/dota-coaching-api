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

    // Fetch match analysis data
    const analysisResponse = await fetch(`${request.nextUrl.origin}/api/analysis/match/${id}`)
    if (!analysisResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch match data' },
        { status: 404 }
      )
    }

    const analysisData = await analysisResponse.json()
    const match = analysisData.match
    const player = analysisData.player
    const analysis = analysisData.analysis

    // Prepare data for Gemini
    const matchSummary = {
      matchId: id,
      duration: `${Math.floor(match.duration / 60)}:${String(match.duration % 60).padStart(2, '0')}`,
      result: player.win ? 'Vittoria' : 'Sconfitta',
      hero: player.hero_name || 'Unknown',
      role: analysis.role || 'Unknown',
      kda: `${player.kills}/${player.deaths}/${player.assists}`,
      kdaValue: player.kda?.toFixed(2) || '0.00',
      gpm: player.gold_per_min || 0,
      xpm: player.xp_per_min || 0,
      lastHits: player.last_hits || 0,
      denies: player.denies || 0,
      heroDamage: player.hero_damage || 0,
      towerDamage: player.tower_damage || 0,
      netWorth: player.net_worth || 0,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendations: analysis.recommendations || [],
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

PUNTI DI FORZA: ${matchSummary.strengths.join(', ') || 'Nessuno identificato'}
DEBOLEZZE: ${matchSummary.weaknesses.join(', ') || 'Nessuna identificata'}

Genera un riassunto professionale in italiano (max 300 parole) che includa:
1. Analisi dell'esito della partita
2. Performance chiave del giocatore
3. Punti di forza evidenziati
4. Aree di miglioramento
5. Un suggerimento principale per migliorare

Il tono deve essere professionale, costruttivo e orientato al miglioramento.`

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
      matchId: id,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating match summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

