'use client'

import { useState, useEffect } from 'react'
import { Zap, TrendingUp } from 'lucide-react'

interface XPProgressBarProps {
  currentXP: number
  xpNeeded: number
  level: number
  nextLevel: number
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  animated?: boolean
}

export default function XPProgressBar({
  currentXP,
  xpNeeded,
  level,
  nextLevel,
  size = 'md',
  showDetails = true,
  animated = true
}: XPProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const progress = (currentXP / xpNeeded) * 100

  useEffect(() => {
    if (animated) {
      // Animate progress bar fill
      const duration = 1000
      const startTime = Date.now()
      const startProgress = 0

      const animate = () => {
        const elapsed = Date.now() - startTime
        const t = Math.min(elapsed / duration, 1)
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - t, 3)
        setAnimatedProgress(startProgress + (progress - startProgress) * easeOut)

        if (t < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    } else {
      setAnimatedProgress(progress)
    }
  }, [progress, animated])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2'
      case 'lg':
        return 'h-4'
      default:
        return 'h-3'
    }
  }

  const getGradientColor = () => {
    if (progress >= 90) return 'from-red-500 via-orange-500 to-yellow-500'
    if (progress >= 70) return 'from-orange-500 via-yellow-500 to-yellow-400'
    if (progress >= 50) return 'from-yellow-500 via-yellow-400 to-yellow-300'
    return 'from-red-600 via-red-500 to-orange-500'
  }

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="font-semibold text-yellow-300">{currentXP}</span>
            <span className="text-gray-500">/</span>
            <span>{xpNeeded} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Level {level}</span>
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400 font-semibold">{nextLevel}</span>
          </div>
        </div>
      )}
      
      <div className={`
        relative w-full ${getSizeClasses()} 
        bg-gray-800 rounded-full 
        overflow-hidden
        border border-gray-700
        shadow-inner
      `}>
        {/* Progress fill with gradient */}
        <div
          className={`
            absolute top-0 left-0 h-full
            bg-gradient-to-r ${getGradientColor()}
            rounded-full
            transition-all duration-500 ease-out
            shadow-lg
            relative
          `}
          style={{
            width: `${Math.min(100, Math.max(0, animatedProgress))}%`,
          }}
        >
          {/* Sparkle effect for high progress */}
          {progress >= 80 && (
            <div className="absolute inset-0 animate-sparkle">
              <div className="absolute top-0 left-1/4 w-1 h-1 bg-white rounded-full opacity-75 animate-ping" />
              <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full opacity-75 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute top-0 left-3/4 w-1 h-1 bg-white rounded-full opacity-75 animate-ping" style={{ animationDelay: '0.6s' }} />
            </div>
          )}
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
        </div>

        {/* Progress text overlay (for larger sizes) */}
        {size === 'lg' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.round(animatedProgress)}%
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  )
}

