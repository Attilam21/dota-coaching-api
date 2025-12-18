'use client'

import { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface ChemistryScore {
  score: number
  breakdown: {
    winrate: { value: number; weight: number; contribution: number }
    communication: { value: number; weight: number; contribution: number }
    roleCompatibility: { value: number; weight: number; contribution: number }
    timeTogether: { value: number; weight: number; contribution: number }
    recentForm: { value: number; weight: number; contribution: number }
  }
  label: string
  color: string
  insights: string[]
  totalTeammates?: number
  totalGames?: number
  avgWinrate?: string
}

interface TeamChemistryScoreProps {
  playerId: string
}

export default function TeamChemistryScore({ playerId }: TeamChemistryScoreProps) {
  const [data, setData] = useState<ChemistryScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/player/${playerId}/team/chemistry-score`)
        if (!response.ok) throw new Error('Failed to fetch chemistry score')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chemistry score')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [playerId])

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-400 text-sm">Calcolo Team Chemistry Score...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          <p className="font-semibold">Errore</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-400'
      case 'blue': return 'text-blue-400'
      case 'yellow': return 'text-yellow-400'
      case 'orange': return 'text-orange-400'
      case 'red': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getGaugeColor = (score: number) => {
    if (score >= 85) return '#10B981' // green
    if (score >= 70) return '#3B82F6' // blue
    if (score >= 50) return '#EAB308' // yellow
    if (score >= 30) return '#F97316' // orange
    return '#EF4444' // red
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Team Chemistry Score</h2>
        <span className={`text-lg font-bold ${getColorClass(data.color)}`}>
          {data.label}
        </span>
      </div>

      {/* Gauge Chart - Custom SVG */}
      <div className="flex justify-center py-6">
        <div className="relative w-80 h-48">
          <svg width="320" height="160" viewBox="0 0 320 160" className="overflow-visible">
            {/* Background arc (semicircle) */}
            <path
              d="M 30 130 A 130 130 0 0 1 290 130"
              fill="none"
              stroke="#374151"
              strokeWidth="24"
              strokeLinecap="round"
            />
            {/* Score arc */}
            <path
              d="M 30 130 A 130 130 0 0 1 290 130"
              fill="none"
              stroke={getGaugeColor(data.score)}
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray={`${(data.score / 100) * 408} 408`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center -mt-4">
            <p className="text-6xl font-bold text-white">{data.score}</p>
            <p className="text-sm text-gray-400">/ 100</p>
            <p className={`text-xl font-semibold mt-2 ${getColorClass(data.color)}`}>
              {data.label}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {data.totalTeammates && data.totalGames && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{data.totalTeammates}</p>
            <p className="text-xs text-gray-400">Compagni</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{data.totalGames}</p>
            <p className="text-xs text-gray-400">Partite</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{data.avgWinrate}%</p>
            <p className="text-xs text-gray-400">Winrate</p>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Breakdown del Score</h3>
        {Object.entries(data.breakdown).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 capitalize">
                {key === 'winrate' ? 'Winrate' :
                 key === 'communication' ? 'Comunicazione' :
                 key === 'roleCompatibility' ? 'Compatibilità Ruoli' :
                 key === 'timeTogether' ? 'Tempo Insieme' :
                 'Forma Recente'}
              </span>
              <span className="text-gray-400">
                {value.contribution.toFixed(1)} / {value.weight} ({value.value.toFixed(1)})
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${(value.contribution / value.weight) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Insights</h3>
          <ul className="space-y-1">
            {data.insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-blue-200">• {insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

