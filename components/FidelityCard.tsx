'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { getCurrentRank, getNextRank, getRankProgress, type PerformanceBadge, PERFORMANCE_BADGES } from '@/lib/fidelityRanks'
import FidelityAvatar from './FidelityAvatar'

interface FidelityCardProps {
  xp: number
  performanceBadge?: PerformanceBadge
  isLoading?: boolean
}

/**
 * Card "Percorso" - Sistema fidelizzazione con rank, progress bar, avatar e badge prestazione
 * 
 * Separato dalla skill reale. Mostra solo fidelizzazione cosmetica.
 */
export default function FidelityCard({ xp, performanceBadge, isLoading = false }: FidelityCardProps) {
  const currentRank = getCurrentRank(xp)
  const nextRank = getNextRank(xp)
  const progress = getRankProgress(xp)
  const percentage = Math.round(progress * 100)

  const performanceInfo = performanceBadge ? PERFORMANCE_BADGES[performanceBadge] : null

  // Testo dinamico basato su progresso
  const getProgressText = () => {
    if (percentage < 25) {
      return 'Si sta sbloccando qualcosa...'
    } else if (percentage < 60) {
      return 'Stai avanzando nel percorso'
    } else if (percentage < 90) {
      return 'Ci sei quasi al prossimo livello'
    } else if (percentage < 100) {
      return 'Ultimo sprint verso il prossimo rank'
    } else {
      return nextRank ? `Pronto per ${nextRank.name}!` : 'Massimo livello raggiunto'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-8 bg-gray-700 rounded w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
      {/* Header con titolo e avatar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Percorso</h3>
          <p className="text-sm text-gray-400">Fidelizzazione piattaforma</p>
        </div>
        <FidelityAvatar icon={currentRank.icon} color={currentRank.color} size="md" />
      </div>

      {/* Rank corrente */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-white">{currentRank.name}</span>
        {nextRank && (
          <>
            <span className="text-gray-500">→</span>
            <span className="text-sm text-gray-400">Prossimo: {nextRank.name}</span>
          </>
        )}
        {!nextRank && (
          <span className="text-sm text-yellow-400">⭐ Massimo livello</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative w-full h-8 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700" />
          
          {/* Progress fill con animazione */}
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentRank.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 2s infinite' }} />
          </motion.div>

          {/* Text overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-white drop-shadow-lg">
              {getProgressText()}
            </span>
          </div>
        </div>
      </div>

      {/* Badge prestazione recente (separato) */}
      {performanceInfo && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${performanceInfo.color}`}>
          <span className="text-lg">{performanceInfo.emoji}</span>
          <span className="text-sm font-medium">{performanceInfo.label}</span>
          <span className="text-xs text-gray-400 ml-auto">Prestazione recente</span>
        </div>
      )}
    </div>
  )
}

