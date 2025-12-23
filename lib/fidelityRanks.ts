/**
 * Fidelity Ranks - Sistema di livelli cosmetica per fidelizzazione
 * 
 * Separato dalla skill reale (percentili/metriche).
 * Nomi neutri e pro-friendly, non giudicanti.
 */

export interface FidelityRank {
  id: number
  name: string
  minXp: number
  color: string
  icon: string // Nome icona SVG
}

export const FIDELITY_RANKS: FidelityRank[] = [
  { id: 1, name: 'Scout', minXp: 0, color: 'from-gray-500 to-gray-600', icon: 'compass' },
  { id: 2, name: 'Analyst', minXp: 50, color: 'from-blue-500 to-blue-600', icon: 'scroll' },
  { id: 3, name: 'Strategist', minXp: 120, color: 'from-purple-500 to-purple-600', icon: 'crystal' },
  { id: 4, name: 'Captain', minXp: 220, color: 'from-orange-500 to-orange-600', icon: 'shield' },
  { id: 5, name: 'Commander', minXp: 360, color: 'from-red-500 to-red-600', icon: 'helm' },
  { id: 6, name: 'Legend', minXp: 550, color: 'from-yellow-500 to-yellow-600', icon: 'crown' },
]

/**
 * Ottiene il rank corrente basato su XP
 */
export function getCurrentRank(xp: number): FidelityRank {
  // Trova il rank più alto che l'utente ha raggiunto
  for (let i = FIDELITY_RANKS.length - 1; i >= 0; i--) {
    if (xp >= FIDELITY_RANKS[i].minXp) {
      return FIDELITY_RANKS[i]
    }
  }
  return FIDELITY_RANKS[0] // Fallback a Scout
}

/**
 * Ottiene il prossimo rank
 */
export function getNextRank(xp: number): FidelityRank | null {
  const current = getCurrentRank(xp)
  const currentIndex = FIDELITY_RANKS.findIndex(r => r.id === current.id)
  
  if (currentIndex >= FIDELITY_RANKS.length - 1) {
    return null // Già al massimo livello
  }
  
  return FIDELITY_RANKS[currentIndex + 1]
}

/**
 * Calcola progresso verso prossimo rank (0-1)
 */
export function getRankProgress(xp: number): number {
  const current = getCurrentRank(xp)
  const next = getNextRank(xp)
  
  if (!next) {
    return 1 // Già al massimo
  }
  
  const range = next.minXp - current.minXp
  const progress = (xp - current.minXp) / range
  
  return Math.max(0, Math.min(1, progress))
}

/**
 * Tipo per badge prestazione recente
 */
export type PerformanceBadge = 'HOT' | 'STABLE' | 'COLD'

export interface PerformanceBadgeInfo {
  type: PerformanceBadge
  label: string
  emoji: string
  color: string
  bonusXp: number
}

export const PERFORMANCE_BADGES: Record<PerformanceBadge, PerformanceBadgeInfo> = {
  HOT: {
    type: 'HOT',
    label: 'In Forma',
    emoji: '🔥',
    color: 'text-red-400 bg-red-900/30 border-red-500',
    bonusXp: 10,
  },
  STABLE: {
    type: 'STABLE',
    label: 'Stabile',
    emoji: '⚡',
    color: 'text-yellow-400 bg-yellow-900/30 border-yellow-500',
    bonusXp: 5,
  },
  COLD: {
    type: 'COLD',
    label: 'In Ripresa',
    emoji: '❄️',
    color: 'text-blue-400 bg-blue-900/30 border-blue-500',
    bonusXp: 0,
  },
}

/**
 * Calcola badge prestazione basato su trend
 */
export function calculatePerformanceBadge(winrateTrend: { label: string; delta?: number } | null, kdaTrend: { label: string; delta?: number } | null): PerformanceBadge {
  // Usa winrate trend come priorità, fallback a KDA
  const trend = winrateTrend || kdaTrend
  
  if (!trend) {
    return 'STABLE'
  }
  
  // Controlla label o delta
  const label = trend.label.toLowerCase()
  const delta = trend.delta || 0
  
  if (label.includes('aumento') || label.includes('migliora') || delta > 0) {
    return 'HOT'
  } else if (label.includes('calo') || label.includes('peggiora') || delta < 0) {
    return 'COLD'
  }
  
  return 'STABLE'
}

