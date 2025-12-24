'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { getCurrentRank, getNextRank, getRankProgress, getProgressText, type Rank } from '@/lib/ranks'

interface PercorsoCardProps {
  xp: number
  isLoading?: boolean
}

/**
 * Card "Percorso" gamification wow
 * Avatar portrait fantasy a sinistra, info rank a destra, progress bar sotto
 */
export default function PercorsoCard({ xp, isLoading = false }: PercorsoCardProps) {
  const [imageError, setImageError] = useState(false)
  const currentRank = getCurrentRank(xp)
  const nextRank = getNextRank(currentRank)
  const progress = getRankProgress(xp, currentRank, nextRank)
  const progressText = getProgressText(progress)
  const percentage = Math.round(progress * 100)

  // Mapping icon -> nome file immagine
  const getImagePath = (icon: string): string => {
    const iconMap: Record<string, string> = {
      'rune': '/avatars/scout.png',
      'scroll': '/avatars/analyst.png',
      'crystal': '/avatars/strategist.png',
      'shield': '/avatars/captain.png',
      'helm': '/avatars/commander.png',
      'crown': '/avatars/legend.png'
    }
    return iconMap[icon] || '/avatars/scout.png'
  }

  const avatarPath = getImagePath(currentRank.avatarIcon)
  const hasHighProgress = progress > 0.7

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
      {/* Layout desktop: avatar sinistra, info destra */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
        {/* Avatar portrait (sinistra desktop, centrato mobile) */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          <div 
            className="relative overflow-hidden rounded-[14px] w-[104px] h-[150px] sm:w-[120px] sm:h-[170px] md:w-[96px] md:h-[140px] lg:w-[96px] lg:h-[140px]"
            style={{
              boxShadow: `0 0 20px ${currentRank.color}40, 0 0 40px ${currentRank.color}20`
            }}
          >
            {!imageError ? (
              <Image
                src={avatarPath}
                alt={currentRank.name}
                width={96}
                height={140}
                className="object-cover object-center object-top"
                style={{ width: '100%', height: '100%' }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: currentRank.color + '20' }}
              >
                <span className="text-xs text-gray-400">{currentRank.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info rank (destra desktop, sotto mobile) */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Percorso</h3>
          <p className="text-sm md:text-base text-gray-400 mb-1">
            Rank: <span style={{ color: currentRank.color, fontWeight: 600 }}>{currentRank.name}</span>
          </p>
          {nextRank && (
            <p className="text-xs md:text-sm text-gray-500">
              Prossimo: <span style={{ color: nextRank.color }}>{nextRank.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar (full width, senza avatar) */}
      <div className="space-y-2">
        {/* Statistiche XP sopra la barra */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 mb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs md:text-sm font-semibold text-gray-300">
                XP Attuale: <span style={{ color: currentRank.color, fontWeight: 700 }}>{xp.toLocaleString()}</span>
              </span>
              {nextRank && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">
                    Mancano <span className="font-semibold text-yellow-400">{(nextRank.minXp - xp).toLocaleString()}</span> XP
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold px-2 py-0.5 rounded" style={{ 
                color: currentRank.color,
                backgroundColor: currentRank.color + '15',
                border: `1px solid ${currentRank.color}40`
              }}>
                {percentage}%
              </span>
              {nextRank && (
                <span className="text-xs text-gray-400">
                  → <span style={{ color: nextRank.color }}>{nextRank.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div 
          className="relative w-full rounded-full overflow-hidden"
          style={{ 
            height: '12px',
            backgroundColor: '#1F2937'
          }}
        >
          {/* Progress fill con animazione */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(to right, ${currentRank.color}, ${nextRank?.color || currentRank.color})`,
              width: `${percentage}%`,
              boxShadow: hasHighProgress ? `0 0 10px ${currentRank.color}60, 0 0 20px ${currentRank.color}30` : 'none'
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Shine effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" 
              style={{ animation: 'shimmer 2s infinite' }} 
            />
          </motion.div>
        </div>

        {/* Micro-copy sotto la barra */}
        <p className="text-xs md:text-sm text-gray-400 text-center md:text-left">
          {nextRank ? `Il prossimo grado è vicino` : `Hai raggiunto il massimo livello`}
        </p>
      </div>

      {/* Reward Card (solo quando sbloccato) */}
      {progress >= 1 && nextRank === null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500 rounded-lg p-4"
        >
          <h4 className="font-semibold text-yellow-200 text-center">Premio Sbloccato!</h4>
          <p className="text-sm text-yellow-300/80 text-center mt-1">Hai raggiunto il massimo livello</p>
        </motion.div>
      )}
    </motion.div>
  )
}
