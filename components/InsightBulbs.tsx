'use client'

import { BulbInsight } from '@/lib/insight-utils'

interface InsightBulbsProps {
  insights: BulbInsight[]
  isLoading?: boolean
}

export default function InsightBulbs({ insights, isLoading }: InsightBulbsProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 flex-wrap">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-8 w-32 bg-gray-700/50 rounded animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-400">Dati insufficienti per insight affidabili</p>
      </div>
    )
  }

  const getBulbColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'bg-red-900/30 border-red-700 text-red-300'
      case 'bottleneck':
        return 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
      case 'strength':
        return 'bg-green-900/30 border-green-700 text-green-300'
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-300'
    }
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`${getBulbColor(insight.type)} border rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2`}
        >
          <span className="text-base">{insight.icon}</span>
          <span>{insight.text}</span>
        </div>
      ))}
    </div>
  )
}

