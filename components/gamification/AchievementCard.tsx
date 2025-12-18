'use client'

import { useState } from 'react'
import { Trophy, Lock, CheckCircle2, Sparkles } from 'lucide-react'

interface AchievementCardProps {
  id: string
  name: string
  description: string
  icon?: string
  xpReward: number
  category: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number // 0-100 for progress-based achievements
  size?: 'sm' | 'md' | 'lg'
}

export default function AchievementCard({
  id,
  name,
  description,
  icon,
  xpReward,
  category,
  unlocked,
  unlockedAt,
  progress,
  size = 'md'
}: AchievementCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getCategoryColor = () => {
    switch (category) {
      case 'progression':
        return 'border-purple-500/50 bg-purple-900/20'
      case 'milestone':
        return 'border-blue-500/50 bg-blue-900/20'
      case 'consistency':
        return 'border-green-500/50 bg-green-900/20'
      case 'platform':
        return 'border-yellow-500/50 bg-yellow-900/20'
      case 'streak':
        return 'border-orange-500/50 bg-orange-900/20'
      default:
        return 'border-gray-500/50 bg-gray-900/20'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3'
      case 'lg':
        return 'p-6'
      default:
        return 'p-4'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all duration-300
        ${unlocked 
          ? `${getCategoryColor()} cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20` 
          : 'border-gray-700/50 bg-gray-800/50 opacity-60'
        }
        ${getSizeClasses()}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Unlocked glow effect */}
      {unlocked && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-400/10 via-transparent to-purple-400/10 pointer-events-none" />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 rounded-full p-3
          ${unlocked 
            ? 'bg-gradient-to-br from-yellow-400 to-purple-500 shadow-lg' 
            : 'bg-gray-700'
          }
          transition-all duration-300
          ${isHovered && unlocked ? 'scale-110 rotate-6' : ''}
        `}>
          {unlocked ? (
            <Trophy className="w-6 h-6 text-white" />
          ) : (
            <Lock className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`
              font-bold text-lg
              ${unlocked ? 'text-white' : 'text-gray-400'}
            `}>
              {name}
            </h3>
            {unlocked && (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            )}
          </div>

          <p className={`
            text-sm mb-2
            ${unlocked ? 'text-gray-300' : 'text-gray-500'}
          `}>
            {description}
          </p>

          {/* Progress bar for progress-based achievements */}
          {progress !== undefined && progress < 100 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-gray-700/50 text-gray-300">
                {category}
              </span>
              {unlocked && unlockedAt && (
                <span className="text-xs text-gray-400">
                  Sbloccato: {formatDate(unlockedAt)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">+{xpReward} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shine effect on hover (unlocked only) */}
      {unlocked && isHovered && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine pointer-events-none" />
      )}

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(200%) translateY(200%) rotate(45deg);
          }
        }
        .animate-shine {
          animation: shine 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}

