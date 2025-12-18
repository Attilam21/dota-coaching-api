'use client'

import Image from 'next/image'
import { User } from 'lucide-react'

interface PlayerAvatarProps {
  accountId?: number
  avatarUrl?: string // Da profile.avatarfull o profile.avatar
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  playerName?: string
  className?: string
}

export default function PlayerAvatar({
  accountId,
  avatarUrl,
  size = 'md',
  showName = false,
  playerName,
  className = ''
}: PlayerAvatarProps) {
  // Generate Steam avatar URL from account ID if avatarUrl not provided
  const getAvatarUrl = () => {
    if (avatarUrl) return avatarUrl
    
    // If we have accountId, we could try to construct URL, but Steam requires hash
    // So we return null and show fallback
    return null
  }

  const imageUrl = getAvatarUrl()
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div
      className={`relative flex items-center gap-2 ${className}`}
      title={playerName || `Player ${accountId || ''}`}
    >
      {/* Avatar Image */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-gray-700 rounded-full border border-gray-600 overflow-hidden flex-shrink-0`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={playerName || `Player ${accountId || ''}`}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              // Fallback: hide image and show icon
              const target = e.currentTarget as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
            <User className={`${iconSizeClasses[size]} text-gray-400`} />
          </div>
        )}
      </div>

      {/* Player Name (optional) */}
      {showName && playerName && (
        <div className={`${textSizeClasses[size]} text-gray-300 font-medium truncate max-w-[150px]`} title={playerName}>
          {playerName}
        </div>
      )}
    </div>
  )
}

