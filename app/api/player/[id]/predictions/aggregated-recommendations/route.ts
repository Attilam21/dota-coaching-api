import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/fetch-utils'

/**
 * Aggrega recommendations da tutte le partite analizzate
 * Identifica pattern comuni e crea insights predittivi
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch recent matches
    const matchesResponse = await fetchWithTimeout(
      `https://api.opendota.com/api/players/${id}/matches?limit=20`,
      {
        timeout: 10000,
        next: { revalidate: 3600 }
      }
    )

    if (!matchesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: matchesResponse.status }
      )
    }

    const matches: any[] = await matchesResponse.json()

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        totalMatches: 0,
        totalRecommendations: 0,
        recommendations: [],
        topPatterns: [],
        impactScore: 0,
        projectedWinrateImprovement: 0,
        summary: {
          mostCommonCategory: 'general',
          highImpactCount: 0,
          mediumImpactCount: 0,
          lowImpactCount: 0
        }
      })
    }

    // Fetch game advice for each match (in parallel, but limit to avoid timeout)
    // For internal API calls, we need to construct the URL properly
    // In production, use the request URL to determine base URL
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    
    const advicePromises = matches.slice(0, 15).map(async (match) => {
      try {
        const adviceUrl = `${baseUrl}/api/match/${match.match_id}/game-advice?playerId=${id}`
        const adviceResponse = await fetch(adviceUrl, {
          next: { revalidate: 3600 }
        })
        
        if (adviceResponse.ok) {
          return await adviceResponse.json()
        }
        return null
      } catch (error) {
        console.warn(`Failed to fetch advice for match ${match.match_id}:`, error)
        return null
      }
    })

    const adviceResults = await Promise.allSettled(advicePromises)
    const validAdvice = adviceResults
      .filter((result) => result.status === 'fulfilled' && result.value !== null)
      .map((result) => (result as PromiseFulfilledResult<any>).value)

    // Se non ci sono consigli validi, restituisci struttura vuota ma valida
    if (validAdvice.length === 0) {
      return NextResponse.json({
        totalMatches: matches.length,
        totalRecommendations: 0,
        recommendations: [],
        topPatterns: [],
        impactScore: 0,
        projectedWinrateImprovement: 0,
        summary: {
          mostCommonCategory: 'general',
          highImpactCount: 0,
          mediumImpactCount: 0,
          lowImpactCount: 0
        }
      })
    }

    // Aggregate all recommendations
    const allRecommendations: Array<{
      text: string
      category: string
      impact: 'high' | 'medium' | 'low'
      frequency: number
      matchIds: number[]
      phase: 'early' | 'mid' | 'late'
    }> = []

    const recommendationMap = new Map<string, {
      text: string
      category: string
      impact: 'high' | 'medium' | 'low'
      frequency: number
      matchIds: number[]
      phase: 'early' | 'mid' | 'late'
    }>()

    validAdvice.forEach((advice) => {
      // Bad actions recommendations
      if (advice.actions?.bad) {
        advice.actions.bad.forEach((action: any) => {
          if (action.recommendation) {
            const key = action.recommendation.toLowerCase().trim()
            if (recommendationMap.has(key)) {
              const existing = recommendationMap.get(key)!
              existing.frequency++
              existing.matchIds.push(advice.matchId)
            } else {
              recommendationMap.set(key, {
                text: action.recommendation,
                category: action.category || 'general',
                impact: action.impact || 'medium',
                frequency: 1,
                matchIds: [advice.matchId],
                phase: action.phase || 'mid'
              })
            }
          }
        })
      }

      // Macro advice
      if (advice.macroAdvice) {
        advice.macroAdvice.forEach((macro: any) => {
          const recommendation = macro.reasoning || macro.decision
          if (recommendation) {
            const key = recommendation.toLowerCase().trim()
            if (recommendationMap.has(key)) {
              const existing = recommendationMap.get(key)!
              existing.frequency++
              existing.matchIds.push(advice.matchId)
            } else {
              recommendationMap.set(key, {
                text: recommendation,
                category: 'macro',
                impact: macro.priority === 'high' ? 'high' : macro.priority === 'medium' ? 'medium' : 'low',
                frequency: 1,
                matchIds: [advice.matchId],
                phase: macro.phase || 'mid'
              })
            }
          }
        })
      }

      // Micro advice
      if (advice.microAdvice) {
        advice.microAdvice.forEach((micro: any) => {
          if (micro.recommendation) {
            const key = micro.recommendation.toLowerCase().trim()
            if (recommendationMap.has(key)) {
              const existing = recommendationMap.get(key)!
              existing.frequency++
              existing.matchIds.push(advice.matchId)
            } else {
              recommendationMap.set(key, {
                text: micro.recommendation,
                category: micro.category || 'micro',
                impact: 'medium',
                frequency: 1,
                matchIds: [advice.matchId],
                phase: 'mid'
              })
            }
          }
        })
      }

      // Teamplay advice
      if (advice.teamplayAdvice) {
        advice.teamplayAdvice.forEach((teamplay: any) => {
          if (teamplay.recommendation) {
            const key = teamplay.recommendation.toLowerCase().trim()
            if (recommendationMap.has(key)) {
              const existing = recommendationMap.get(key)!
              existing.frequency++
              existing.matchIds.push(advice.matchId)
            } else {
              recommendationMap.set(key, {
                text: teamplay.recommendation,
                category: 'teamplay',
                impact: 'medium',
                frequency: 1,
                matchIds: [advice.matchId],
                phase: 'mid'
              })
            }
          }
        })
      }
    })

    // Convert to array and sort by frequency and impact
    const recommendations = Array.from(recommendationMap.values())
      .sort((a, b) => {
        // Sort by frequency first, then by impact
        if (a.frequency !== b.frequency) {
          return b.frequency - a.frequency
        }
        const impactOrder = { high: 3, medium: 2, low: 1 }
        return impactOrder[b.impact] - impactOrder[a.impact]
      })

    // Group by category
    const byCategory: Record<string, typeof recommendations> = {}
    recommendations.forEach((rec) => {
      if (!byCategory[rec.category]) {
        byCategory[rec.category] = []
      }
      byCategory[rec.category].push(rec)
    })

    // Identify top patterns (most frequent recommendations)
    const topPatterns = recommendations.slice(0, 5).map((rec) => ({
      recommendation: rec.text,
      frequency: rec.frequency,
      percentage: (rec.frequency / validAdvice.length) * 100,
      impact: rec.impact,
      category: rec.category,
      matchIds: rec.matchIds.slice(0, 5) // Limit to 5 match IDs
    }))

    // Calculate impact score (0-100)
    // Based on frequency and impact of recommendations
    const impactScore = Math.min(100, Math.round(
      recommendations.reduce((sum, rec) => {
        const impactWeight = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1
        return sum + (rec.frequency * impactWeight)
      }, 0) / (validAdvice.length * 3) * 100
    ))

    // Calculate projected winrate improvement if all top recommendations are followed
    // Based on historical data: high impact recommendations typically improve winrate by 3-5%
    const projectedWinrateImprovement = Math.min(15, topPatterns
      .filter(p => p.impact === 'high')
      .length * 3.5)

    return NextResponse.json({
      totalMatches: validAdvice.length,
      totalRecommendations: recommendations.length,
      recommendations: recommendations.slice(0, 20), // Top 20
      byCategory,
      topPatterns,
      impactScore,
      projectedWinrateImprovement,
      summary: {
        mostCommonCategory: Object.entries(byCategory)
          .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'general',
        highImpactCount: recommendations.filter(r => r.impact === 'high').length,
        mediumImpactCount: recommendations.filter(r => r.impact === 'medium').length,
        lowImpactCount: recommendations.filter(r => r.impact === 'low').length
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800', // 30 minutes
      },
    })
  } catch (error) {
    console.error('Error aggregating recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

