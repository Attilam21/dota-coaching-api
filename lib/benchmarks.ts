/**
 * Centralized Dota 2 role benchmarks and metrics
 * 
 * This module provides role-specific benchmarks with:
 * - Static fallback values (when percentiles unavailable)
 * - Support for dynamic percentiles from OpenDota
 * - Metric priority definitions per role
 * - Role-specific metric calculations
 */

export type Role = 'carry' | 'mid' | 'offlane' | 'support' | 'core'

export interface RoleBenchmark {
  gpm: number
  xpm: number
  kda: number
  deaths: number
  csPerMin?: number
  killParticipation: number
  towerDamage?: number
  wards?: number
  assists?: number
  campsStacked?: number
  heroDamage?: number
  lastHits?: number
}

export interface MetricPriority {
  metric: string
  priority: number // 1 = highest priority
  description: string
}

/**
 * Static fallback benchmarks (used when OpenDota percentiles unavailable)
 * Based on community standards and meta analysis
 */
const STATIC_BENCHMARKS: Record<Role, RoleBenchmark> = {
  carry: {
    gpm: 550,
    xpm: 600,
    kda: 2.5,
    deaths: 5,
    csPerMin: 7,
    killParticipation: 60,
    towerDamage: 1500,
    heroDamage: 20000,
    lastHits: 250,
  },
  mid: {
    gpm: 550,
    xpm: 650,
    kda: 2.8,
    deaths: 5,
    csPerMin: 6.5,
    killParticipation: 70,
    towerDamage: 1000,
    heroDamage: 23000,
    lastHits: 230,
  },
  offlane: {
    gpm: 450,
    xpm: 500,
    kda: 2.2,
    deaths: 6,
    csPerMin: 5,
    killParticipation: 75,
    towerDamage: 800,
    heroDamage: 17000,
    lastHits: 200,
  },
  support: {
    gpm: 300,
    xpm: 350,
    kda: 1.8,
    deaths: 6,
    csPerMin: 3,
    killParticipation: 80,
    wards: 10,
    assists: 12,
    campsStacked: 4,
    heroDamage: 12000,
    lastHits: 80,
  },
  core: {
    gpm: 500,
    xpm: 550,
    kda: 2.5,
    deaths: 5,
    csPerMin: 6,
    killParticipation: 65,
    towerDamage: 1200,
    heroDamage: 20000,
    lastHits: 220,
  },
}

/**
 * Metric priorities per role (1 = highest priority)
 * Used to determine which metrics to focus on in feedback
 */
export const METRIC_PRIORITIES: Record<Role, MetricPriority[]> = {
  carry: [
    { metric: 'gpm', priority: 1, description: 'GPM - Critical for late game impact' },
    { metric: 'csPerMin', priority: 2, description: 'CS/min - Farm efficiency' },
    { metric: 'towerDamage', priority: 3, description: 'Tower Damage - Objective control' },
    { metric: 'kda', priority: 4, description: 'KDA - Teamfight impact' },
    { metric: 'deaths', priority: 5, description: 'Deaths - Survival rate' },
    { metric: 'killParticipation', priority: 6, description: 'Kill Participation - Less critical for carry' },
  ],
  mid: [
    { metric: 'xpm', priority: 1, description: 'XPM - Critical for level advantage' },
    { metric: 'killParticipation', priority: 2, description: 'Kill Participation - Presence in fights' },
    { metric: 'gpm', priority: 3, description: 'GPM - Farm efficiency' },
    { metric: 'kda', priority: 4, description: 'KDA - Teamfight impact' },
    { metric: 'deaths', priority: 5, description: 'Deaths - Survival rate' },
    { metric: 'towerDamage', priority: 6, description: 'Tower Damage - Objective control' },
  ],
  offlane: [
    { metric: 'killParticipation', priority: 1, description: 'Kill Participation - Critical for offlane presence' },
    { metric: 'deaths', priority: 2, description: 'Deaths - Lane survival and positioning' },
    { metric: 'towerDamage', priority: 3, description: 'Tower Damage - Space creation' },
    { metric: 'gpm', priority: 4, description: 'GPM - Resource efficiency' },
    { metric: 'kda', priority: 5, description: 'KDA - Teamfight impact' },
    { metric: 'xpm', priority: 6, description: 'XPM - Level progression' },
  ],
  support: [
    { metric: 'killParticipation', priority: 1, description: 'Kill Participation - Must be present in fights' },
    { metric: 'wards', priority: 2, description: 'Wards - Vision control is crucial' },
    { metric: 'assists', priority: 3, description: 'Assists - Supporting team fights' },
    { metric: 'deaths', priority: 4, description: 'Deaths - Positioning and survival' },
    { metric: 'campsStacked', priority: 5, description: 'Camps Stacked - Supporting farm' },
    { metric: 'kda', priority: 6, description: 'KDA - Less critical for support' },
    { metric: 'gpm', priority: 7, description: 'GPM - Less critical, context matters' },
    { metric: 'xpm', priority: 8, description: 'XPM - Less critical, context matters' },
  ],
  core: [
    { metric: 'gpm', priority: 1, description: 'GPM - Resource efficiency' },
    { metric: 'kda', priority: 2, description: 'KDA - Teamfight impact' },
    { metric: 'deaths', priority: 3, description: 'Deaths - Survival rate' },
    { metric: 'killParticipation', priority: 4, description: 'Kill Participation - Team presence' },
  ],
}

/**
 * Get benchmark for a specific role
 * 
 * @param role - The role to get benchmarks for
 * @param usePercentiles - Whether to use percentiles if available (future enhancement)
 * @returns RoleBenchmark object with all metrics for the role
 */
export function getRoleBenchmark(role: Role | string, usePercentiles: boolean = false): RoleBenchmark {
  const normalizedRole = role.toLowerCase() as Role
  const benchmark = STATIC_BENCHMARKS[normalizedRole] || STATIC_BENCHMARKS.core
  
  // TODO: Future enhancement - integrate OpenDota percentiles when available
  // if (usePercentiles && percentilesAvailable) {
  //   return mergeWithPercentiles(benchmark, percentiles)
  // }
  
  return { ...benchmark }
}

/**
 * Get metric priorities for a role
 * 
 * @param role - The role to get priorities for
 * @returns Array of MetricPriority sorted by priority (1 = highest)
 */
export function getMetricPriorities(role: Role | string): MetricPriority[] {
  const normalizedRole = role.toLowerCase() as Role
  return METRIC_PRIORITIES[normalizedRole] || METRIC_PRIORITIES.core
}

/**
 * Get all static benchmarks (for reference/debugging)
 */
export function getAllStaticBenchmarks(): Record<Role, RoleBenchmark> {
  return { ...STATIC_BENCHMARKS }
}

/**
 * Check if a metric value meets the benchmark threshold
 * 
 * @param value - Current value
 * @param benchmark - Benchmark value
 * @param threshold - Threshold multiplier (0.85 = 85% of benchmark)
 * @returns true if value meets threshold
 */
export function meetsBenchmark(value: number, benchmark: number, threshold: number = 0.85): boolean {
  return value >= benchmark * threshold
}

/**
 * Calculate gap percentage between value and benchmark
 * 
 * @param value - Current value
 * @param benchmark - Benchmark value
 * @returns Gap percentage (negative = below benchmark)
 */
export function calculateGapPercent(value: number, benchmark: number): number {
  if (benchmark === 0) return 0
  return ((value - benchmark) / benchmark) * 100
}

