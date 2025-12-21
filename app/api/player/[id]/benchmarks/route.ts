import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint per recuperare benchmarks e percentili del giocatore
 * Utilizza endpoint OpenDota: /players/{id}/ratings e /players/{id}/rankings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch ratings (percentiles per ruolo)
    let ratings: any = null
    try {
      const ratingsResponse = await fetch(
        `https://api.opendota.com/api/players/${id}/ratings`,
        { next: { revalidate: 1800 } } // 30 minuti cache
      )
      
      if (ratingsResponse.ok) {
        ratings = await ratingsResponse.json()
      }
    } catch (err) {
      console.log('[Benchmarks] Error fetching ratings:', err)
    }
    
    // Fetch rankings (ranking globale e per ruolo)
    let rankings: any = null
    try {
      const rankingsResponse = await fetch(
        `https://api.opendota.com/api/players/${id}/rankings`,
        { next: { revalidate: 1800 } } // 30 minuti cache
      )
      
      if (rankingsResponse.ok) {
        rankings = await rankingsResponse.json()
      }
    } catch (err) {
      console.log('[Benchmarks] Error fetching rankings:', err)
    }
    
    // Fetch basic stats per calcolare percentili manuali se ratings non disponibili
    let basicStats: any = null
    try {
      const statsResponse = await fetch(
        `https://api.opendota.com/api/players/${id}/matches?limit=20`,
        { next: { revalidate: 3600 } }
      )
      
      if (statsResponse.ok) {
        const matches = await statsResponse.json()
        if (matches && matches.length > 0) {
          // Calcola medie per confronto
          const avgGPM = matches.reduce((acc: number, m: any) => acc + (m.gold_per_min || 0), 0) / matches.length
          const avgXPM = matches.reduce((acc: number, m: any) => acc + (m.xp_per_min || 0), 0) / matches.length
          const avgKDA = matches.reduce((acc: number, m: any) => {
            const kda = (m.kills + m.assists) / Math.max(m.deaths, 1)
            return acc + kda
          }, 0) / matches.length
          
          basicStats = {
            avgGPM,
            avgXPM,
            avgKDA,
            totalMatches: matches.length
          }
        }
      }
    } catch (err) {
      console.log('[Benchmarks] Error fetching basic stats:', err)
    }
    
    // Calcola percentili approssimativi basati su standard Dota 2
    // Questi sono valori di riferimento generali, non percentili reali
    const calculatePercentile = (value: number, metric: 'gpm' | 'xpm' | 'kda', role?: string) => {
      // Standard di riferimento (basati su dati pubblici Dota 2)
      const standards: Record<string, Record<string, { p50: number; p75: number; p90: number; p95: number }>> = {
        gpm: {
          carry: { p50: 450, p75: 550, p90: 650, p95: 750 },
          mid: { p50: 450, p75: 550, p90: 650, p95: 750 },
          offlane: { p50: 400, p75: 500, p90: 600, p95: 700 },
          support: { p50: 300, p75: 400, p90: 500, p95: 600 },
          default: { p50: 400, p75: 500, p90: 600, p95: 700 }
        },
        xpm: {
          carry: { p50: 500, p75: 600, p90: 700, p95: 800 },
          mid: { p50: 550, p75: 650, p90: 750, p95: 850 },
          offlane: { p50: 450, p75: 550, p90: 650, p95: 750 },
          support: { p50: 350, p75: 450, p90: 550, p95: 650 },
          default: { p50: 450, p75: 550, p90: 650, p95: 750 }
        },
        kda: {
          carry: { p50: 2.0, p75: 2.5, p90: 3.0, p95: 3.5 },
          mid: { p50: 2.2, p75: 2.7, p90: 3.2, p95: 3.7 },
          offlane: { p50: 1.8, p75: 2.3, p90: 2.8, p95: 3.3 },
          support: { p50: 1.5, p75: 2.0, p90: 2.5, p95: 3.0 },
          default: { p50: 2.0, p75: 2.5, p90: 3.0, p95: 3.5 }
        }
      }
      
      const roleKey = role || 'default'
      const metricStandards = standards[metric]?.[roleKey] || standards[metric]?.default || standards[metric]?.carry
      
      if (!metricStandards) return 50 // Default percentile
      
      if (value >= metricStandards.p95) return 95
      if (value >= metricStandards.p90) return 90
      if (value >= metricStandards.p75) return 75
      if (value >= metricStandards.p50) return 50
      if (value >= metricStandards.p50 * 0.8) return 25
      return 10
    }
    
    // Costruisci risposta con percentili
    const benchmarks: any = {
      ratings: ratings || null,
      rankings: rankings || null,
      calculatedPercentiles: null,
      source: ratings ? 'opendota_ratings' : 'calculated'
    }
    
    // Se abbiamo ratings da OpenDota, usali (più accurati)
    if (ratings) {
      const hasGpm = ratings.gold_per_min && ratings.gold_per_min.percentile !== undefined
      const hasXpm = ratings.xp_per_min && ratings.xp_per_min.percentile !== undefined
      const hasKda = ratings.kda && ratings.kda.percentile !== undefined
      
      // Solo se abbiamo almeno un percentile valido, crea l'oggetto percentiles
      if (hasGpm || hasXpm || hasKda) {
        benchmarks.percentiles = {
          gpm: hasGpm ? {
            percentile: ratings.gold_per_min.percentile || 50,
            label: getPercentileLabel(ratings.gold_per_min.percentile || 50)
          } : null,
          xpm: hasXpm ? {
            percentile: ratings.xp_per_min.percentile || 50,
            label: getPercentileLabel(ratings.xp_per_min.percentile || 50)
          } : null,
          kda: hasKda ? {
            percentile: ratings.kda.percentile || 50,
            label: getPercentileLabel(ratings.kda.percentile || 50)
          } : null
        }
      }
    }
    
    // Se abbiamo basic stats e (non abbiamo ratings o ratings non ha percentili validi), calcola percentili approssimativi
    if (basicStats && (!ratings || !benchmarks.percentiles)) {
      benchmarks.calculatedPercentiles = {
        gpm: {
          value: basicStats.avgGPM,
          percentile: calculatePercentile(basicStats.avgGPM, 'gpm'),
          label: getPercentileLabel(calculatePercentile(basicStats.avgGPM, 'gpm'))
        },
        xpm: {
          value: basicStats.avgXPM,
          percentile: calculatePercentile(basicStats.avgXPM, 'xpm'),
          label: getPercentileLabel(calculatePercentile(basicStats.avgXPM, 'xpm'))
        },
        kda: {
          value: basicStats.avgKDA,
          percentile: calculatePercentile(basicStats.avgKDA, 'kda'),
          label: getPercentileLabel(calculatePercentile(basicStats.avgKDA, 'kda'))
        }
      }
      // Se non avevamo ratings, aggiorna source
      if (!ratings) {
        benchmarks.source = 'calculated'
      }
    }
    
    // Se non abbiamo né percentiles né calculatedPercentiles, restituisci null
    // per evitare di mostrare una card vuota nel frontend
    if (!benchmarks.percentiles && !benchmarks.calculatedPercentiles) {
      return NextResponse.json(null, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      })
    }
    
    return NextResponse.json(benchmarks, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
    
  } catch (error) {
    console.error('Error fetching benchmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    )
  }
}

/**
 * Helper per convertire percentile in label leggibile
 */
function getPercentileLabel(percentile: number): string {
  if (percentile >= 95) return 'Top 5%'
  if (percentile >= 90) return 'Top 10%'
  if (percentile >= 75) return 'Top 25%'
  if (percentile >= 50) return 'Top 50%'
  if (percentile >= 25) return 'Top 75%'
  return 'Needs Improvement'
}