'use client'

import { useEffect, useState } from 'react'
import { X, Trophy, Sparkles } from 'lucide-react'

interface AchievementNotificationProps {
  achievement: {
    name: string
    description: string
    icon?: string
    xpReward: number
    category: string
  }
  onClose: () => void
  show: boolean
}

export default function AchievementNotification({
  achievement,
  onClose,
  show
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      // Trigger animation after render
      setTimeout(() => setIsVisible(true), 10)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)

      return () => clearTimeout(timer)
    } else {
      handleClose()
    }
  }, [show])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setShouldRender(false)
      onClose()
    }, 300)
  }

  if (!shouldRender) return null

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        transform transition-all duration-300 ease-out
        ${isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className="
        relative max-w-md w-full
        bg-gradient-to-br from-yellow-900/90 via-purple-900/90 to-blue-900/90
        border-2 border-yellow-400/50
        rounded-lg shadow-2xl
        p-5
        backdrop-blur-sm
      ">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          {/* Trophy icon with animation */}
          <div className="relative flex-shrink-0">
            <div className="
              w-16 h-16 rounded-full
              bg-gradient-to-br from-yellow-400 to-purple-500
              flex items-center justify-center
              shadow-lg animate-bounce-subtle
            ">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            
            {/* Sparkle particles */}
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-purple-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Text content */}
          <div className="flex-1">
            <div className="text-yellow-400 font-bold text-sm mb-1">
              🎉 Achievement Sbloccato!
            </div>
            <h3 className="text-white font-bold text-lg mb-1">
              {achievement.name}
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              {achievement.description}
            </p>
            
            {/* XP reward */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold">
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar animation */}
        <div className="mt-4 h-1 bg-gray-700/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 animate-progress" />
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-progress {
          animation: progress 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

