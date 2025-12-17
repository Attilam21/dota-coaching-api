import { NextRequest, NextResponse } from 'next/server'

// Helper function to generate AI summary using Gemini or OpenAI
async function generateInsight(
  prompt: string
): Promise<string> {
  // Try Gemini first
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (text && text.trim()) {
        return text.trim()
      }
    } catch (error) {
      console.error('Gemini API error:', error)
    }
  }

  // Fallback to OpenAI
  const openaiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY
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
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content

      if (text && text.trim()) {
        return text.trim()
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  throw new Error('Both Gemini and OpenAI failed or are not configured')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, elementType, elementId, contextData } = body

    if (!playerId || !elementType || !elementId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build context-specific prompt based on element type
    // Tono: Coach professionale, diretto, assertivo, senza condizionali
    let prompt = ''

    switch (elementType) {
      case 'fzth-score':
        prompt = `Sei un coach professionale di Dota 2 con anni di esperienza. Il FZTH Score è ${contextData.score}/100 per un giocatore ${contextData.role || 'di ruolo non specificato'}. 
        Scrivi un feedback diretto e assertivo (max 150 parole) identificando il punto debole principale e dando un'azione concreta per migliorarlo. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che sa esattamente cosa fare.`
        break

      case 'role':
        prompt = `Sei un coach professionale di Dota 2. Un giocatore è classificato come ${contextData.role} (confidenza: ${contextData.confidence}). 
        Scrivi un feedback diretto (max 120 parole) su cosa deve migliorare in questo ruolo. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che conosce perfettamente il ruolo.`
        break

      case 'playstyle':
        prompt = `Sei un coach professionale di Dota 2. Il giocatore ha uno stile "${contextData.playstyle}". 
        Scrivi un feedback diretto (max 120 parole) su come ottimizzare questo stile. Identifica un punto specifico da migliorare e dai un'azione concreta. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach esperto.`
        break

      case 'trend-gpm':
      case 'trend-xpm':
      case 'trend-kda':
      case 'trend-winrate':
        const metric = elementType.replace('trend-', '').toUpperCase()
        const direction = contextData.direction
        const value = contextData.value
        const label = contextData.label
        
        prompt = `Sei un coach professionale di Dota 2. Il ${metric} mostra un trend ${direction === 'up' ? 'in aumento' : direction === 'down' ? 'in calo' : 'stabile'} (${label}, valore: ${value}). 
        Scrivi un feedback diretto (max 120 parole) spiegando cosa significa questo trend e cosa fare. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che interpreta i dati con precisione.`
        break

      case 'metric-card':
        const metricName = contextData.metricName
        const metricValue = contextData.value
        const benchmark = contextData.benchmark
        
        prompt = `Sei un coach professionale di Dota 2. Il ${metricName} è ${metricValue}${benchmark ? ` (benchmark ruolo: ${benchmark})` : ''}. 
        Scrivi un feedback diretto (max 120 parole) valutando questa metrica e dando un'azione concreta. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che valuta le metriche con competenza.`
        break

      case 'trend-chart':
        prompt = `Sei un coach professionale di Dota 2. Il trend chart mostra GPM, XPM e KDA nelle ultime partite. Pattern: ${JSON.stringify(contextData.trends || {})}. 
        Scrivi un feedback diretto (max 150 parole) interpretando questi trend e dando azioni concrete. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che legge i grafici con esperienza.`
        break

      case 'phase-analysis':
        const phase = contextData.phase
        const phaseScore = contextData.score
        const phaseStrength = contextData.strength
        
        prompt = `Sei un coach professionale di Dota 2. Nella fase ${phase} le performance sono ${phaseStrength} (score: ${phaseScore}/100). 
        Scrivi un feedback diretto (max 120 parole) identificando il problema specifico di questa fase e dando un'azione concreta. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che conosce ogni fase di gioco.`
        break

      case 'comparative-analysis':
        prompt = `Sei un coach professionale di Dota 2. L'analisi comparativa per il ruolo ${contextData.role} mostra: ${JSON.stringify(contextData.metrics || {})}. 
        Scrivi un feedback diretto (max 150 parole) confrontando con i benchmark del ruolo e dando azioni concrete per migliorare. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che conosce i benchmark di ogni ruolo.`
        break

      case 'pattern':
        prompt = `Sei un coach professionale di Dota 2. Pattern identificati: ${contextData.patterns?.join(', ') || 'Nessun pattern specifico'}. 
        Scrivi un feedback diretto (max 120 parole) su come sfruttare o modificare questi pattern. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che riconosce i pattern di gioco.`
        break

      default:
        prompt = `Sei un coach professionale di Dota 2 con anni di esperienza. Dati: ${JSON.stringify(contextData)}. 
        Scrivi un feedback diretto e assertivo (max 150 parole) identificando il problema principale e dando un'azione concreta. 
        Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach esperto.`
    }

    const insight = await generateInsight(prompt)

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Error generating insight:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insight' },
      { status: 500 }
    )
  }
}

