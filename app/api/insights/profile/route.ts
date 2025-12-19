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

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (text && typeof text === 'string' && text.trim().length > 0) {
          console.log('Insight generated with Gemini')
          return text.trim()
        } else {
          console.warn('Gemini API returned empty or invalid response, trying OpenAI fallback:', {
            hasCandidates: !!data.candidates,
            candidatesLength: data.candidates?.length || 0,
          })
          // Continue to OpenAI fallback - don't return here
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn('Gemini API failed, trying OpenAI fallback:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200)
        })
        // Continue to OpenAI fallback - don't return here
      }
    } catch (error) {
      console.warn('Gemini API error, trying OpenAI fallback:', error)
      // Continue to OpenAI fallback
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

      if (response.ok) {
        const data = await response.json()
        const text = data.choices?.[0]?.message?.content
        
        if (text && typeof text === 'string' && text.trim().length > 0) {
          console.log('Insight generated with OpenAI')
          return text.trim()
        } else {
          console.warn('OpenAI API returned empty or invalid response:', {
            hasChoices: !!data.choices,
            choicesLength: data.choices?.length || 0,
          })
          // Will throw error below if both fail
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200)
        })
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      // Will throw error below if both fail
    }
  }

  // Check if keys are configured to give better error message
  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const hasOpenaiKey = !!(process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY)
  
  if (!hasGeminiKey && !hasOpenaiKey) {
    throw new Error('AI_API_KEYS_NOT_CONFIGURED')
  }
  
  throw new Error('AI_SERVICE_FAILED')
}

export async function POST(request: NextRequest) {
  try {
    // Check API keys availability first (before processing request)
    const hasGeminiKey = !!process.env.GEMINI_API_KEY
    const hasOpenaiKey = !!(process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY)
    
    if (!hasGeminiKey && !hasOpenaiKey) {
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          message: 'Le chiavi API per il servizio AI non sono configurate. La funzionalità di suggerimenti AI non è disponibile al momento.',
          code: 'API_KEYS_MISSING'
        },
        { status: 503 } // Service Unavailable
      )
    }

    const body = await request.json()
    const { playerId, elementType, elementId, contextData } = body

    if (!playerId || !elementType || !elementId) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: 'Campi richiesti mancanti: playerId, elementType, elementId',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      )
    }

    // Build context-specific prompt based on element type
    // Tono: Coach professionale, diretto, assertivo, senza condizionali
    let prompt = ''

    switch (elementType) {
      case 'fzth-score':
        prompt = `Sei un coach professionale di Dota 2 con anni di esperienza. L'AttilaLAB Score è ${contextData.score}/100 per un giocatore ${contextData.role || 'di ruolo non specificato'}. 
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

      case 'builds':
        if (elementId === 'top-items') {
          const topItems = contextData.topItems || []
          const itemsList = topItems.map((item: any) => `${item.item_name} (${item.frequency}x, ${item.winrate}% WR)`).join(', ')
          prompt = `Sei un coach professionale di Dota 2. I top item utilizzati sono: ${itemsList}. 
          Scrivi un feedback diretto (max 150 parole) analizzando questi item e dando suggerimenti concreti su come ottimizzare le build. 
          Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che conosce le build ottimali.`
        } else if (elementId === 'build-patterns') {
          const patterns = contextData.patterns || []
          const patternsList = patterns.map((p: any) => `${p.itemNames.join(' + ')} (${p.winrate}% WR, ${p.frequency}x)`).join('; ')
          prompt = `Sei un coach professionale di Dota 2. Le build più comuni sono: ${patternsList}. 
          Scrivi un feedback diretto (max 150 parole) analizzando queste build e identificando quale funziona meglio e perché. 
          Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che valuta le build con competenza.`
        } else if (elementId === 'underutilized') {
          const items = contextData.items || []
          const itemsList = items.map((item: any) => `${item.item_name} (${item.winrate}% WR, usato ${item.frequency}x)`).join(', ')
          prompt = `Sei un coach professionale di Dota 2. Item sottoutilizzati con alto winrate: ${itemsList}. 
          Scrivi un feedback diretto (max 150 parole) spiegando perché questi item funzionano bene e come integrarli più spesso nelle build. 
          Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che identifica item efficaci.`
        } else if (elementId === 'overpurchased') {
          const items = contextData.items || []
          const itemsList = items.map((item: any) => `${item.item_name} (${item.winrate}% WR, usato ${item.frequency}x)`).join(', ')
          prompt = `Sei un coach professionale di Dota 2. Item overpurchased con basso winrate: ${itemsList}. 
          Scrivi un feedback diretto (max 150 parole) spiegando perché questi item non funzionano e quali alternative usare. 
          Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che identifica item inefficaci.`
        } else if (elementId === 'efficiency') {
          const items = contextData.items || []
          const itemsList = items.map((item: any) => `${item.item_name} (${item.winrate}% WR, efficienza: ${item.efficiency?.toFixed(2) || 'N/A'})`).join(', ')
          prompt = `Sei un coach professionale di Dota 2. Efficienza item: ${itemsList}. 
          Scrivi un feedback diretto (max 150 parole) analizzando l'efficienza degli item e come ottimizzare le scelte. 
          Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che valuta l'efficienza degli item.`
        } else if (elementId === 'comparison') {
          const patterns = contextData.patterns || []
          const patternsList = patterns.map((p: any) => `${p.itemNames.join(' + ')} (${p.winrate}% WR)`).join('; ')
          prompt = `Sei un coach professionale di Dota 2. Confronto build: ${patternsList}. 
          Scrivi un feedback diretto (max 150 parole) confrontando queste build e identificando la più efficace e perché. 
          Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach che confronta le build con precisione.`
        } else {
          prompt = `Sei un coach professionale di Dota 2. Analisi build: ${JSON.stringify(contextData)}. 
          Scrivi un feedback diretto (max 150 parole) analizzando le build e dando suggerimenti concreti. 
          Usa un tono professionale e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", "analizza". Scrivi come un coach esperto di build.`
        }
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
    
    // Provide user-friendly error messages
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate insight'
    
    // Check if it's an API keys error
    if (errorMessage === 'AI_API_KEYS_NOT_CONFIGURED' || errorMessage === 'AI_SERVICE_FAILED' || 
        errorMessage.includes('API keys not configured') || errorMessage.includes('API calls failed')) {
      return NextResponse.json(
        { 
          error: 'AI service unavailable',
          message: 'Il servizio AI non è disponibile. Verifica la configurazione delle chiavi API.',
          code: errorMessage === 'AI_API_KEYS_NOT_CONFIGURED' ? 'API_KEYS_MISSING' : 'AI_SERVICE_ERROR'
        },
        { status: 503 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { 
        error: 'Failed to generate insight',
        message: 'Errore nel generare il suggerimento. Riprova più tardi.',
        code: 'GENERATION_ERROR'
      },
      { status: 500 }
    )
  }
}


