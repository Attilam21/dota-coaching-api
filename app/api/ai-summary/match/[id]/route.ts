import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' },
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

