/**
 * Sistema di Rank per Gamification
 * 6 livelli con soglie XP progressive
 */

export interface Rank {
  name: string
  minXp: number
  color: string
  avatarIcon: string
}

export const RANKS: Rank[] = [
  {
    name: 'Scout',
    minXp: 0,
    color: '#6B7280', // gray
    avatarIcon: 'rune'
  },
  {
    name: 'Analyst',
    minXp: 50,
    color: '#3B82F6', // blue
    avatarIcon: 'scroll'
  },
  {
    name: 'Strategist',
    minXp: 120,
    color: '#8B5CF6', // purple
    avatarIcon: 'crystal'
  },
  {
    name: 'Captain',
    minXp: 220,
    color: '#10B981', // green
    avatarIcon: 'shield'
  },
  {
    name: 'Commander',
    minXp: 360,
    color: '#F59E0B', // amber
    avatarIcon: 'helm'
  },
  {
    name: 'Legend',
    minXp: 550,
    color: '#EF4444', // red
    avatarIcon: 'crown'
  }
]

/**
 * Calcola il rank corrente basato su XP
 */
export function getCurrentRank(xp: number): Rank {
  // Trova il rank più alto che l'utente ha raggiunto
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp) {
      return RANKS[i]
    }
  }
  return RANKS[0] // Default: Scout
}

/**
 * Calcola il prossimo rank
 */
export function getNextRank(currentRank: Rank): Rank | null {
  const currentIndex = RANKS.findIndex(r => r.name === currentRank.name)
  if (currentIndex === -1 || currentIndex === RANKS.length - 1) {
    return null // Già al massimo
  }
  return RANKS[currentIndex + 1]
}

/**
 * Calcola progresso verso il prossimo rank (0-1)
 */
export function getRankProgress(xp: number, currentRank: Rank, nextRank: Rank | null): number {
  if (!nextRank) {
    return 1 // Già al massimo
  }
  
  const currentXp = xp - currentRank.minXp
  const neededXp = nextRank.minXp - currentRank.minXp
  
  if (neededXp <= 0) return 1
  
  return Math.min(Math.max(currentXp / neededXp, 0), 1)
}

/**
 * Genera microcopy motivazionale basato su progresso
 */
export function getProgressText(progress: number): string {
  if (progress < 0.25) {
    return 'Iniziamo!'
  } else if (progress < 0.60) {
    return 'Stai caricando la barra...'
  } else if (progress < 0.90) {
    return 'Ci sei quasi!'
  } else if (progress < 1) {
    return 'Ultimo sprint!'
  } else {
    return 'Premio sbloccato!'
  }
}

