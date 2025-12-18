'use client'

import { Trophy, Star, Sparkles } from 'lucide-react'

interface UserLevelBadgeProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  showStars?: boolean
}

export default function UserLevelBadge({ level, size = 'md', showStars = true }: UserLevelBadgeProps) {
  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-yellow-500 via-yellow-400 to-yellow-600 text-yellow-100'
    if (level >= 30) return 'from-purple-500 via-purple-400 to-purple-600 text-purple-100'
    if (level >= 20) return 'from-blue-500 via-blue-400 to-blue-600 text-blue-100'
    if (level >= 10) return 'from-green-500 via-green-400 to-green-600 text-green-100'
    return 'from-gray-500 via-gray-400 to-gray-600 text-gray-100'
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'lg':
        return 'px-4 py-2 text-lg'
      default:
        return 'px-3 py-1.5 text-sm'
    }
  }

  const getIconSize = (): string => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-4 h-4'
    }
  }

  const renderStars = () => {
    if (!showStars) return null
    
    const starCount = Math.min(Math.floor(level / 10), 5)
    return (
      <div className="flex items-center gap-0.5">
        {Array(starCount).fill(0).map((_, i) => (
          <Star key={i} className={`${getIconSize()} fill-current text-yellow-300`} />
        ))}
        {starCount === 0 && <Sparkles className={`${getIconSize()} text-gray-400`} />}
      </div>
    )
  }

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full font-bold
        bg-gradient-to-r ${getLevelColor(level)}
        shadow-lg shadow-black/50
        border border-white/20
        ${getSizeClasses()}
        transition-all duration-300
        hover:scale-105 hover:shadow-xl
        animate-pulse-subtle
      `}
      style={{
        animation: 'pulse-subtle 2s ease-in-out infinite',
      }}
    >
      <Trophy className={getIconSize()} />
      <span className="font-mono">LVL {level}</span>
      {renderStars()}
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 215, 0, 0.2);
          }
          50% {
            opacity: 0.95;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.4);
          }
        }
      `}</style>
    </div>
  )
}

