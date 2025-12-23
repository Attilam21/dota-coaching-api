'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'

const REWARD_THRESHOLD = 100 // Soglia interna (non visualizzata)

interface XpProgressBarProps {
  xp: number
  onRedeem?: () => void
}

/**
 * Barra progresso XP "wow" senza numeri
 * 
 * Mostra progresso verso premio senza esporre XP numerico.
 * Testi dinamici basati su percentuale.
 */
export default function XpProgressBar({ xp, onRedeem }: XpProgressBarProps) {
  // Calcola progresso (0-1)
  const progress = Math.min(xp / REWARD_THRESHOLD, 1)
  const percentage = Math.round(progress * 100)

  // Testo dinamico basato su percentuale
  const getProgressText = () => {
    if (percentage < 25) {
      return 'Iniziamo!'
    } else if (percentage < 60) {
      return 'Stai caricando la barra...'
    } else if (percentage < 90) {
      return 'Ci sei quasi!'
    } else if (percentage < 100) {
      return 'Ultimo sprint!'
    } else {
      return 'Premio sbloccato: Eroe 3D'
    }
  }

  const progressText = getProgressText()
  const isUnlocked = progress >= 1

  return (
    <div className="w-full space-y-3">
      {/* Barra progresso */}
      <div className="relative w-full h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800" />
        
        {/* Progress fill con animazione */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-red-600 to-red-700"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 2s infinite' }} />
        </motion.div>

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white drop-shadow-lg">
            {progressText}
          </span>
        </div>
      </div>

      {/* Card premio (solo quando sbloccato) */}
      {isUnlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-200">Premio Sbloccato!</h3>
              <p className="text-sm text-yellow-300/80">Eroe 3D disponibile</p>
            </div>
          </div>
          {onRedeem && (
            <button
              onClick={onRedeem}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Riscatta
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}

