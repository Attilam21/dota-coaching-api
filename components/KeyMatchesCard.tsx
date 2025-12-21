'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface Match {
  match_id: number
  win: boolean
  kda: number
  gpm: number
  start_time: number
  hero_id?: number
  kills?: number
  deaths?: number
  assists?: number
  duration?: number
}

interface KeyMatchesCardProps {
  matches: Match[]
  heroes: Record<number, { name: string; localized_name: string }>
  formatMatchDate: (timestamp: number) => string
  formatDuration: (seconds?: number) => string
}

/**
 * Mostra 3-4 partite chiave: BEST, WORST, OUTLIER
 * Invece di semplicemente le ultime partite
 */
export default function KeyMatchesCard({
  matches,
  heroes,
  formatMatchDate,
  formatDuration
}: KeyMatchesCardProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="text-base font-semibold text-white mb-3">Partite Chiave</h3>
        <p className="text-sm text-gray-500 py-4">Nessuna partita disponibile</p>
      </div>
    )
  }

  // Calcola medie per identificare outlier
  const last20 = matches.slice(0, 20)
  const avgKda = last20.reduce((sum, m) => sum + (m.kda || 0), 0) / last20.length
  const avgGpm = last20.reduce((sum, m) => sum + (m.gpm || 0), 0) / last20.length
  
  // Trova BEST match (highest KDA tra le vittorie)
  const bestMatch = [...last20]
    .filter(m => m.win)
    .sort((a, b) => (b.kda || 0) - (a.kda || 0))[0]

  // Trova WORST match (lowest KDA tra le sconfitte, o peggiore KDA overall se non ci sono sconfitte)
  const worstMatch = [...last20]
    .filter(m => !m.win)
    .sort((a, b) => (a.kda || 0) - (b.kda || 0))[0] 
    || [...last20].sort((a, b) => (a.kda || 0) - (b.kda || 0))[0]

  // Trova OUTLIER (match con KDA o GPM molto diverso dalla media)
  const outlierMatch = last20.reduce((outlier, match) => {
    if (!outlier) return match
    const currentDeviation = Math.abs((match.kda || 0) - avgKda) + Math.abs((match.gpm || 0) - avgGpm) / 100
    const outlierDeviation = Math.abs((outlier.kda || 0) - avgKda) + Math.abs((outlier.gpm || 0) - avgGpm) / 100
    return currentDeviation > outlierDeviation ? match : outlier
  }, last20[0])

  const keyMatches = [
    { match: bestMatch, label: 'BEST', icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-900/20', borderColor: 'border-green-700/50' },
    { match: worstMatch, label: 'WORST', icon: TrendingDown, color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700/50' },
    { match: outlierMatch, label: 'OUTLIER', icon: AlertCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700/50' }
  ].filter(item => item.match) // Rimuovi eventuali undefined

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-white">Partite Chiave</h3>
        <Link
          href="/dashboard/matches"
          className="text-xs text-red-400 hover:text-red-300"
        >
          Vedi tutto →
        </Link>
      </div>
      
      {keyMatches.length > 0 ? (
        <div className="space-y-2">
          {keyMatches.map((item, idx) => {
            const match = item.match
            const heroName = match.hero_id && heroes[match.hero_id] 
              ? heroes[match.hero_id].localized_name 
              : match.hero_id ? `Hero ${match.hero_id}` : 'N/A'
            
            const kdaDelta = match.kda ? ((match.kda - avgKda) / avgKda * 100) : 0
            const gpmDelta = match.gpm ? ((match.gpm - avgGpm) / avgGpm * 100) : 0

            return (
              <Link
                key={`${item.label}-${match.match_id}`}
                href={`/analysis/match/${match.match_id}`}
                className={`block border rounded-lg p-2.5 hover:opacity-80 transition-opacity ${item.borderColor} ${item.bgColor}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className={`text-xs font-semibold ${item.color}`}>{item.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                      match.win ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {match.win ? 'V' : 'S'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {formatMatchDate(match.start_time)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 truncate flex-1">{heroName}</span>
                  <div className="flex items-center gap-3 ml-2">
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {match.kills ?? 0}/{match.deaths ?? 0}/{match.assists ?? 0}
                      </div>
                      {kdaDelta !== 0 && (
                        <div className={`text-[10px] ${kdaDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {kdaDelta > 0 ? '+' : ''}{kdaDelta.toFixed(0)}% vs media
                        </div>
                      )}
                    </div>
                    <div className="text-right text-gray-400">
                      <div>{match.gpm?.toLocaleString() || 0} GPM</div>
                      {match.duration && (
                        <div className="text-[10px]">{formatDuration(match.duration)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-4">Nessuna partita chiave disponibile</p>
      )}
    </div>
  )
}