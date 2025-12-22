/**
 * Shared TypeScript interfaces for Advanced Stats
 * Used across all advanced analysis pages
 */

export interface LaneStats {
  avgLastHits: number
  avgDenies: number
  avgCS: number
  csPerMinute: string
  estimatedCSAt10Min: string
  denyRate: number
  firstBloodInvolvement: number
}

export interface FarmStats {
  avgGPM: number
  avgXPM: number
  avgNetWorth: number
  goldUtilization: number
  avgBuybacks: number
  buybackEfficiency: string
  buybackUsageRate: number
  farmEfficiency: number
  phaseAnalysis: {
    early: { matches: number; winrate: string; avgDuration: number }
    mid: { matches: number; winrate: string; avgDuration: number }
    late: { matches: number; winrate: string; avgDuration: number }
  }
}

export interface FightStats {
  avgKills: number
  avgAssists: number
  avgDeaths: number
  deathsPerMinute: string
  killParticipation: number
  teamfightParticipation: string
  avgHeroDamage: number
  avgTowerDamage: number
  avgHealing: number
  damageEfficiency: number
  damagePerMinute: string
}

export interface VisionStats {
  avgObserverPlaced: number
  avgObserverKilled: number
  avgSentryPlaced: number
  avgSentryKilled: number
  wardEfficiency: number
  dewardEfficiency: string
  avgRunes: number
  runesPerMinute: string
  avgCampsStacked: string
  avgCourierKills: string
  avgRoshanKills: string
  roshanControlRate: string
  visionScore: number
}

export interface AdvancedStats {
  lane: LaneStats
  farm: FarmStats
  fights: FightStats
  vision: VisionStats
}

export interface AdvancedStatsMatch {
  match_id: number
  win: boolean
  gpm: number
  xpm: number
  last_hits: number
  denies: number
  hero_damage: number
  tower_damage: number
  healing: number
  kda: number
  observer_placed: number
  observer_killed: number
  net_worth: number
  start_time: number
}

export interface AdvancedStatsResponse {
  matches: AdvancedStatsMatch[]
  stats: AdvancedStats
  sampleSize: number
}

