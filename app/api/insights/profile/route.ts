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
    let prompt = ''

    switch (elementType) {
      case 'fzth-score':
        prompt = `Analizza il FZTH Score di ${contextData.score}/100 per un giocatore di Dota 2 con ruolo ${contextData.role || 'non specificato'}. 
        Fornisci un suggerimento breve e pratico (max 150 parole) su come migliorare il punteggio, concentrandoti sui punti deboli identificati. 
        Sii specifico e actionable.`
        break

      case 'role':
        prompt = `Un giocatore di Dota 2 è stato classificato come ${contextData.role} con confidenza ${contextData.confidence}. 
        Analizza questo ruolo e fornisci un suggerimento breve (max 120 parole) su come migliorare le performance in questo ruolo specifico. 
        Sii pratico e specifico.`
        break

      case 'playstyle':
        prompt = `Un giocatore di Dota 2 ha uno stile di gioco identificato come "${contextData.playstyle}". 
        Analizza questo stile di gioco e fornisci un suggerimento breve (max 120 parole) su come ottimizzare o bilanciare questo stile per migliorare le performance. 
        Sii pratico e specifico.`
        break

      case 'trend-gpm':
      case 'trend-xpm':
      case 'trend-kda':
      case 'trend-winrate':
        const metric = elementType.replace('trend-', '').toUpperCase()
        const direction = contextData.direction
        const value = contextData.value
        const label = contextData.label
        
        prompt = `Il ${metric} di un giocatore di Dota 2 mostra un trend ${direction === 'up' ? 'in aumento' : direction === 'down' ? 'in calo' : 'stabile'} (${label}). 
        Valore: ${value}. Fornisci un suggerimento breve e pratico (max 120 parole) su come interpretare e agire su questo trend. 
        Sii specifico e actionable.`
        break

      case 'metric-card':
        const metricName = contextData.metricName
        const metricValue = contextData.value
        const benchmark = contextData.benchmark
        
        prompt = `Un giocatore di Dota 2 ha un ${metricName} di ${metricValue}${benchmark ? ` (benchmark: ${benchmark})` : ''}. 
        Analizza questa metrica e fornisci un suggerimento breve (max 120 parole) su come migliorarla o mantenerla. 
        Sii pratico e specifico.`
        break

      case 'trend-chart':
        prompt = `Analizza il trend chart di un giocatore di Dota 2 che mostra GPM, XPM e KDA nelle ultime partite. 
        Pattern identificati: ${JSON.stringify(contextData.trends || {})}. 
        Fornisci un suggerimento breve (max 150 parole) su come interpretare questi trend e quali azioni intraprendere. 
        Sii specifico e actionable.`
        break

      case 'phase-analysis':
        const phase = contextData.phase
        const phaseScore = contextData.score
        const phaseStrength = contextData.strength
        
        prompt = `Un giocatore di Dota 2 ha performance ${phaseStrength} nella fase ${phase} (score: ${phaseScore}/100). 
        Analizza questa fase di gioco e fornisci un suggerimento breve (max 120 parole) su come migliorare le performance in questa fase specifica. 
        Sii pratico e specifico.`
        break

      case 'comparative-analysis':
        prompt = `Analizza l'analisi comparativa di un giocatore di Dota 2 nel ruolo ${contextData.role}. 
        Metriche: ${JSON.stringify(contextData.metrics || {})}. 
        Fornisci un suggerimento breve (max 150 parole) su come migliorare le performance rispetto ai benchmark del ruolo. 
        Sii specifico e actionable.`
        break

      case 'pattern':
        prompt = `Sono stati identificati questi pattern di gioco per un giocatore di Dota 2: ${contextData.patterns?.join(', ') || 'Nessun pattern specifico'}. 
        Analizza questi pattern e fornisci un suggerimento breve (max 120 parole) su come sfruttarli o modificarli per migliorare. 
        Sii pratico e specifico.`
        break

      default:
        prompt = `Analizza i dati di performance di un giocatore di Dota 2: ${JSON.stringify(contextData)}. 
        Fornisci un suggerimento breve e pratico (max 150 parole) su come migliorare le performance. 
        Sii specifico e actionable.`
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

