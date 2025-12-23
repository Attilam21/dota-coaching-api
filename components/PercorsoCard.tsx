'use client'

import React from 'react'
import { motion } from 'framer-motion'
import FantasyRankAvatar from './FantasyRankAvatar'
import { getCurrentRank, getNextRank, getRankProgress, getProgressText, type Rank } from '@/lib/ranks'

interface PercorsoCardProps {
  xp: number
  isLoading?: boolean
}

/**
 * Card "Percorso" gamification wow
 * Mostra rank, avatar fantasy, progress bar animata senza numeri
 */
export default function PercorsoCard({ xp, isLoading = false }: PercorsoCardProps) {
  const currentRank = getCurrentRank(xp)
  const nextRank = getNextRank(currentRank)
  const progress = getRankProgress(xp, currentRank, nextRank)
  const progressText = getProgressText(progress)
  const percentage = Math.round(progress * 100)

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="h-16 bg-gray-700 rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-8 bg-gray-700 rounded w-full animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg"
    >
      {/* Header con Rank e Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0">
          <FantasyRankAvatar icon={currentRank.avatarIcon} color={currentRank.color} size={64} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">Percorso</h3>
          <p className="text-sm text-gray-400">Rank: <span style={{ color: currentRank.color }}>{currentRank.name}</span></p>
          {nextRank && (
            <p className="text-xs text-gray-500 mt-1">
              Prossimo: <span style={{ color: nextRank.color }}>{nextRank.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar con Avatar */}
      <div className="space-y-2">
        <div className="relative w-full h-12 bg-gray-800 rounded-full overflow-visible border border-gray-700 flex items-center">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full" />
          
          {/* Avatar livello attuale (sinistra) */}
          <div className="absolute left-0 z-10 flex items-center justify-center" style={{ transform: 'translateX(-50%)' }}>
            <div className="bg-gray-800 border-2 rounded-full p-1" style={{ borderColor: currentRank.color }}>
              <FantasyRankAvatar icon={currentRank.avatarIcon} color={currentRank.color} size={40} />
            </div>
          </div>
          
          {/* Avatar livello obiettivo (destra) */}
          {nextRank && (
            <div className="absolute right-0 z-10 flex items-center justify-center" style={{ transform: 'translateX(50%)' }}>
              <div className="bg-gray-800 border-2 rounded-full p-1" style={{ borderColor: nextRank.color }}>
                <FantasyRankAvatar icon={nextRank.avatarIcon} color={nextRank.color} size={40} />
              </div>
            </div>
          )}
          
          {/* Progress fill con animazione */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(to right, ${currentRank.color}, ${nextRank?.color || currentRank.color})`,
              width: `${percentage}%`,
              marginLeft: '20px', // Spazio per avatar sinistra
              marginRight: nextRank ? '20px' : '0' // Spazio per avatar destra se presente
            }}
            initial={{ width: 0 }}
            animate={{ width: `calc(${percentage}% - ${nextRank ? '40px' : '20px'})` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Shine effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" 
              style={{ animation: 'shimmer 2s infinite' }} 
            />
          </motion.div>

          {/* Text overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-0" style={{ paddingLeft: '24px', paddingRight: nextRank ? '24px' : '0' }}>
            <span className="text-sm font-semibold text-white drop-shadow-lg">
              {progressText}
            </span>
          </div>
        </div>
      </div>

      {/* Reward Card (solo quando sbloccato) */}
      {progress >= 1 && nextRank === null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <FantasyRankAvatar icon="crown" color="#FBBF24" size={32} />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-200">Premio Sbloccato!</h4>
              <p className="text-sm text-yellow-300/80">Hai raggiunto il massimo livello</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

