'use client'

import { TrendingUp, TrendingDown, Minus, Coins, Zap, Sword } from 'lucide-react'

interface PercentileData {
  value?: number
  percentile?: number
  label?: string
}

interface ProgressionWidgetProps {
  gpm?: PercentileData
  xpm?: PercentileData
  kda?: PercentileData
  globalRank?: number
  countryRank?: number
  winrate?: number
  previousGpm?: number
  previousXpm?: number
  previousKda?: number
  previousGlobalRank?: number
  previousWinrate?: number
}

export default function ProgressionWidget({
  gpm,
  xpm,
  kda,
  globalRank,
  countryRank,
  winrate,
  previousGpm,
  previousXpm,
  previousKda,
  previousGlobalRank,
  previousWinrate
}: ProgressionWidgetProps) {
  
  const getPercentileColor = (percentile?: number) => {
    if (!percentile) return 'text-gray-400'
    if (percentile >= 90) return 'text-yellow-400'
    if (percentile >= 75) return 'text-blue-400'
    if (percentile >= 50) return 'text-green-400'
    return 'text-gray-400'
  }

  const getPercentileGradient = (percentile?: number) => {
    if (!percentile) return 'from-gray-600 to-gray-700'
    if (percentile >= 90) return 'from-yellow-500 via-yellow-400 to-yellow-600'
    if (percentile >= 75) return 'from-blue-500 via-blue-400 to-blue-600'
    if (percentile >= 50) return 'from-green-500 via-green-400 to-green-600'
    return 'from-gray-600 to-gray-700'
  }

  const getProgressBarWidth = (percentile?: number) => {
    return percentile ? Math.min(100, percentile) : 0
  }

  const getTrend = (current?: number, previous?: number) => {
    if (!current || !previous) return null
    const diff = current - previous
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: 'text-gray-400', label: 'Stabile' }
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-400', label: `+${diff.toFixed(1)}%` }
    return { icon: TrendingDown, color: 'text-red-400', label: `${diff.toFixed(1)}%` }
  }

  const gpmTrend = getTrend(gpm?.percentile, previousGpm)
  const xpmTrend = getTrend(xpm?.percentile, previousXpm)
  const kdaTrend = getTrend(kda?.percentile, previousKda)
  const rankTrend = previousGlobalRank && globalRank 
    ? { 
        icon: globalRank < previousGlobalRank ? TrendingUp : TrendingDown, 
        color: globalRank < previousGlobalRank ? 'text-green-400' : 'text-red-400',
        label: globalRank < previousGlobalRank 
          ? `+${(previousGlobalRank - globalRank).toLocaleString()} posizioni`
          : `-${(globalRank - previousGlobalRank).toLocaleString()} posizioni`
      }
    : null
  const winrateTrend = getTrend(winrate, previousWinrate)

  const renderPercentileBar = (
    label: string,
    data: PercentileData | undefined,
    icon: React.ReactNode,
    trend: ReturnType<typeof getTrend> | null
  ) => {
    const percentile = data?.percentile || 0
    const labelText = data?.label || `${percentile}% percentile`

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-semibold text-gray-300">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {trend && (
              <>
                <trend.icon className={`w-4 h-4 ${trend.color}`} />
                <span className={`text-xs font-semibold ${trend.color}`}>
                  {trend.label}
                </span>
              </>
            )}
            <span className={`text-sm font-bold ${getPercentileColor(percentile)}`}>
              {labelText}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className={`
              absolute top-0 left-0 h-full
              bg-gradient-to-r ${getPercentileGradient(percentile)}
              transition-all duration-1000 ease-out
              shadow-lg
            `}
            style={{ width: `${getProgressBarWidth(percentile)}%` }}
          />
          
          {/* Shine effect for high percentiles */}
          {percentile >= 75 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-purple-400" />
        La Tua Progressione
      </h2>

      <div className="space-y-6">
        {/* Percentiles */}
        {gpm && renderPercentileBar(
          'Gold Per Minute (GPM)',
          gpm,
          <Coins className="w-5 h-5 text-yellow-400" />,
          gpmTrend
        )}

        {xpm && renderPercentileBar(
          'Experience Per Minute (XPM)',
          xpm,
          <Zap className="w-5 h-5 text-blue-400" />,
          xpmTrend
        )}

        {kda && renderPercentileBar(
          'Kill/Death/Assist Ratio (KDA)',
          kda,
          <Sword className="w-5 h-5 text-red-400" />,
          kdaTrend
        )}

        {/* Rankings */}
        {(globalRank || countryRank) && (
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-300">Global Ranking</span>
              {rankTrend && (
                <div className="flex items-center gap-2">
                  <rankTrend.icon className={`w-4 h-4 ${rankTrend.color}`} />
                  <span className={`text-xs font-semibold ${rankTrend.color}`}>
                    {rankTrend.label}
                  </span>
                </div>
              )}
            </div>
            {globalRank && (
              <div className="text-2xl font-bold text-white">
                #{globalRank.toLocaleString()}
              </div>
            )}
            {countryRank && (
              <div className="text-sm text-gray-400 mt-1">
                #{countryRank.toLocaleString()} nel tuo paese
              </div>
            )}
          </div>
        )}

        {/* Winrate */}
        {winrate !== undefined && (
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-300">Winrate</span>
              {winrateTrend && (
                <div className="flex items-center gap-2">
                  <winrateTrend.icon className={`w-4 h-4 ${winrateTrend.color}`} />
                  <span className={`text-xs font-semibold ${winrateTrend.color}`}>
                    {winrateTrend.label}
                  </span>
                </div>
              )}
            </div>
            <div className={`
              text-2xl font-bold
              ${winrate >= 55 ? 'text-green-400' : winrate >= 50 ? 'text-yellow-400' : 'text-red-400'}
            `}>
              {winrate.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

