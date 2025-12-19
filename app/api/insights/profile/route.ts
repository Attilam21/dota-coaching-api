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
          max_tokens: 150,
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
        prompt = `Ruolo ${contextData.role || 'Core'}. AttilaLAB Score ${contextData.score}/100. 
        Scrivi 3 bullet points specifici (max 20 parole ciascuno):
        1. Problema principale identificato
        2. Azione concreta per migliorarlo
        3. Metrica target per misurare progresso
        FORMATO: Solo bullet points, tono diretto, niente "potresti/dovresti".`
        break

      case 'role':
        prompt = `Ruolo ${contextData.role} (confidenza: ${contextData.confidence}). 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Skill principale da migliorare per questo ruolo
        2. Azione specifica da fare
        3. Come misurare il miglioramento
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'playstyle':
        prompt = `Stile di gioco: ${contextData.playstyle}. 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Punto debole di questo stile
        2. Come ottimizzarlo
        3. Metrica per misurare miglioramento
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'trend-gpm':
      case 'trend-xpm':
      case 'trend-kda':
      case 'trend-winrate':
        const metric = elementType.replace('trend-', '').toUpperCase()
        const direction = contextData.direction
        const value = contextData.value
        const label = contextData.label
        
        prompt = `${metric} trend ${direction === 'up' ? 'in aumento' : direction === 'down' ? 'in calo' : 'stabile'} (${label}, ${value}). 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Cosa significa questo trend
        2. Azione immediata da fare
        3. Target per prossime partite
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'metric-card':
        const metricName = contextData.metricName
        const metricValue = contextData.value
        const benchmark = contextData.benchmark
        
        prompt = `${metricName}: ${metricValue}${benchmark ? ` (benchmark: ${benchmark})` : ''}. 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Valutazione della metrica
        2. Azione concreta per migliorarla
        3. Target da raggiungere
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'trend-chart':
        prompt = `Trend GPM/XPM/KDA ultime partite. Pattern: ${JSON.stringify(contextData.trends || {}).substring(0, 100)}. 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Pattern principale identificato
        2. Azione per migliorare
        3. Metrica target
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'phase-analysis':
        const phase = contextData.phase
        const phaseScore = contextData.score
        const phaseStrength = contextData.strength
        
        prompt = `Fase ${phase}: performance ${phaseStrength} (score ${phaseScore}/100). 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Problema specifico di questa fase
        2. Azione concreta per migliorarla
        3. Target per prossime partite
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'comparative-analysis':
        prompt = `Ruolo ${contextData.role}. Confronto con benchmark: ${JSON.stringify(contextData.metrics || {}).substring(0, 100)}. 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Gap principale vs benchmark
        2. Azione per colmare il gap
        3. Target misurabile
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'pattern':
        prompt = `Pattern identificati: ${contextData.patterns?.join(', ') || 'Nessun pattern specifico'}. 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Come sfruttare/modificare questi pattern
        2. Azione concreta
        3. Metrica per misurare miglioramento
        FORMATO: Solo bullet points, tono diretto.`
        break

      case 'builds':
        if (elementId === 'top-items') {
          const topItems = contextData.topItems || []
          const itemsList = topItems.map((item: any) => `${item.item_name} (${item.frequency}x, ${item.winrate}% WR)`).join(', ')
          prompt = `Top item: ${itemsList.substring(0, 150)}. 
          Scrivi 3 bullet points (max 20 parole ciascuno):
          1. Analisi item utilizzati
          2. Come ottimizzare le build
          3. Target winrate item
          FORMATO: Solo bullet points, tono diretto.`
        } else if (elementId === 'build-patterns') {
          const patterns = contextData.patterns || []
          const patternsList = patterns.map((p: any) => `${p.itemNames.join(' + ')} (${p.winrate}% WR, ${p.frequency}x)`).join('; ')
          prompt = `Build comuni: ${patternsList.substring(0, 150)}. 
          Scrivi 3 bullet points (max 20 parole ciascuno):
          1. Build più efficace e perché
          2. Come ottimizzare
          3. Target winrate build
          FORMATO: Solo bullet points, tono diretto.`
        } else if (elementId === 'underutilized') {
          const items = contextData.items || []
          const itemsList = items.map((item: any) => `${item.item_name} (${item.winrate}% WR, usato ${item.frequency}x)`).join(', ')
          prompt = `Item sottoutilizzati con alto winrate: ${itemsList.substring(0, 150)}. 
          Scrivi 3 bullet points (max 20 parole ciascuno):
          1. Perché questi item funzionano
          2. Come integrarli nelle build
          3. Target frequenza utilizzo
          FORMATO: Solo bullet points, tono diretto.`
        } else if (elementId === 'overpurchased') {
          const items = contextData.items || []
          const itemsList = items.map((item: any) => `${item.item_name} (${item.winrate}% WR, usato ${item.frequency}x)`).join(', ')
          prompt = `Item overpurchased con basso winrate: ${itemsList.substring(0, 150)}. 
          Scrivi 3 bullet points (max 20 parole ciascuno):
          1. Perché questi item non funzionano
          2. Alternative da usare
          3. Quando evitarli
          FORMATO: Solo bullet points, tono diretto.`
        } else if (elementId === 'efficiency') {
          const items = contextData.items || []
          const itemsList = items.map((item: any) => `${item.item_name} (${item.winrate}% WR, efficienza: ${item.efficiency?.toFixed(2) || 'N/A'})`).join(', ')
          prompt = `Efficienza item: ${itemsList.substring(0, 150)}. 
          Scrivi 3 bullet points (max 20 parole ciascuno):
          1. Analisi efficienza item
          2. Come ottimizzare le scelte
          3. Target efficienza
          FORMATO: Solo bullet points, tono diretto.`
        } else if (elementId === 'comparison') {
          const patterns = contextData.patterns || []
          const patternsList = patterns.map((p: any) => `${p.itemNames.join(' + ')} (${p.winrate}% WR)`).join('; ')
          prompt = `Confronto build: ${patternsList.substring(0, 150)}. 
          Scrivi 3 bullet points (max 20 parole ciascuno):
          1. Build più efficace e perché
          2. Quando usare ciascuna
          3. Target winrate
          FORMATO: Solo bullet points, tono diretto.`
        } else {
          prompt = `Analisi build: ${JSON.stringify(contextData).substring(0, 200)}. 
          Scrivi 3 bullet points (max 20 parole ciascuno):
          1. Analisi build
          2. Suggerimento concreto
          3. Target misurabile
          FORMATO: Solo bullet points, tono diretto.`
        }
        break

      default:
        prompt = `Dati: ${JSON.stringify(contextData).substring(0, 200)}. 
        Scrivi 3 bullet points (max 20 parole ciascuno):
        1. Problema principale
        2. Azione concreta
        3. Target misurabile
        FORMATO: Solo bullet points, tono diretto.`
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


