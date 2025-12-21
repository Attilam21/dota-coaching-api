'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import HeroIcon from '@/components/HeroIcon'
import InsightBulb from '@/components/InsightBulb'

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
 * Mostra 3 partite chiave: BEST, WORST, OUTLIER
 * Ogni card mostra: icona eroe, Win/Loss, KDA, InsightBulb, CTA
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

  // Genera insight per ogni match
  const getInsight = (match: Match, type: 'best' | 'worst' | 'outlier') => {
    const kdaDelta = match.kda ? ((match.kda - avgKda) / avgKda * 100) : 0
    
    if (type === 'best') {
      return {
        title: 'Prestazione Eccellente',
        reason: `KDA ${kdaDelta > 0 ? '+' : ''}${kdaDelta.toFixed(0)}% rispetto alla media. Partita dominante.`
      }
    } else if (type === 'worst') {
      return {
        title: 'Prestazione da Migliorare',
        reason: `KDA ${kdaDelta.toFixed(0)}% sotto la media. Analizza gli errori per migliorare.`
      }
    } else {
      return {
        title: 'Partita Atipica',
        reason: `Metriche molto diverse dalla media. Valuta cosa è andato diversamente.`
      }
    }
  }

  const keyMatches = [
    { 
      match: bestMatch, 
      label: 'Best Match', 
      type: 'best' as const,
      icon: TrendingUp, 
      color: 'text-green-400', 
      bgColor: 'bg-green-900/20', 
      borderColor: 'border-green-700/50' 
    },
    { 
      match: worstMatch, 
      label: 'Worst Match', 
      type: 'worst' as const,
      icon: TrendingDown, 
      color: 'text-red-400', 
      bgColor: 'bg-red-900/20', 
      borderColor: 'border-red-700/50' 
    },
    { 
      match: outlierMatch, 
      label: 'Match Outlier', 
      type: 'outlier' as const,
      icon: AlertCircle, 
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-900/20', 
      borderColor: 'border-yellow-700/50' 
    }
  ].filter(item => item.match) // Rimuovi eventuali undefined

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h3 className="text-base font-semibold text-white mb-4">Partite Chiave</h3>
      
      {keyMatches.length > 0 ? (
        <div className="space-y-3">
          {keyMatches.map((item) => {
            const match = item.match
            const heroName = match.hero_id && heroes[match.hero_id] 
              ? heroes[match.hero_id].localized_name 
              : match.hero_id ? `Hero ${match.hero_id}` : 'N/A'
            
            const insight = getInsight(match, item.type)

            return (
              <div
                key={`${item.label}-${match.match_id}`}
                className={`border rounded-lg p-3 ${item.borderColor} ${item.bgColor}`}
              >
                {/* Header: Label + Win/Loss */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className={`text-sm font-semibold ${item.color}`}>{item.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      match.win ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {match.win ? 'Win' : 'Loss'}
                    </span>
                  </div>
                </div>

                {/* Hero Icon + KDA */}
                <div className="flex items-center gap-3 mb-3">
                  {match.hero_id && heroes[match.hero_id] && (
                    <HeroIcon
                      heroId={match.hero_id}
                      heroName={heroes[match.hero_id].name}
                      size={40}
                      className="rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-gray-300 mb-1">{heroName}</div>
                    <div className="text-lg font-bold text-white">
                      KDA: {match.kda.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Insight Bulb */}
                <div className="mb-3">
                  <InsightBulb
                    title={insight.title}
                    reason={insight.reason}
                  />
                </div>

                {/* CTA Button */}
                <Link
                  href={`/analysis/match/${match.match_id}`}
                  className="block w-full text-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg py-2 transition-colors"
                >
                  Vai all'analisi
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-4">Nessuna partita chiave disponibile</p>
      )}
    </div>
  )
}