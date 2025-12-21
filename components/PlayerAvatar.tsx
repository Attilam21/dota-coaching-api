'use client'

import Image from 'next/image'
import { User, Award } from 'lucide-react'
import { useState } from 'react'

interface PlayerAvatarProps {
  accountId?: number
  avatarUrl?: string // Da profile.avatarfull o profile.avatar
  playerName?: string
  rankTier?: number
  rankMedalUrl?: string
  soloMMR?: number | string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  showRank?: boolean
  className?: string
  tooltipText?: string // Tooltip personalizzato (se non fornito, usa nome o accountId)
}

export default function PlayerAvatar({
  accountId,
  avatarUrl,
  playerName,
  rankTier,
  rankMedalUrl,
  soloMMR,
  size = 'md',
  showName = false,
  showRank = false,
  className = '',
  tooltipText
}: PlayerAvatarProps) {
  const [rankImageError, setRankImageError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20'
  }

  const rankSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  // Get rank name from tier
  const getRankName = (tier: number): string => {
    if (tier === 0) return 'Unranked'
    if (tier <= 5) return 'Herald'
    if (tier <= 10) return 'Guardian'
    if (tier <= 15) return 'Crusader'
    if (tier <= 20) return 'Archon'
    if (tier <= 25) return 'Legend'
    if (tier <= 30) return 'Ancient'
    if (tier <= 35) return 'Divine'
    if (tier <= 40) return 'Divine'
    if (tier >= 41) return 'Immortal'
    return 'Unknown'
  }

  // Costruisci il tooltip: se fornito tooltipText usa quello, altrimenti nome o accountId
  const tooltip = tooltipText || playerName || `Player ${accountId || ''}`

  return (
    <div
      className={`relative flex items-center gap-2 ${className}`}
      title={tooltip}
    >
      {/* Avatar Image */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-gray-700 rounded-full border border-gray-600 overflow-hidden flex-shrink-0`}>
        {avatarUrl && !avatarError ? (
          <Image
            src={avatarUrl}
            alt={playerName || `Player ${accountId || ''}`}
            fill
            className="object-cover"
            unoptimized
            onError={() => {
              setAvatarError(true)
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
            <User className={`${iconSizeClasses[size]} text-gray-400`} />
          </div>
        )}
      </div>

      {/* Rank Medal (optional) */}
      {showRank && (
        <div 
          className={`${rankSizeClasses[size]} relative flex-shrink-0 flex items-center justify-center`}
          title={rankTier && rankTier > 0 ? `${getRankName(rankTier)}${soloMMR ? ` - ${soloMMR} MMR` : ''}` : 'Unranked'}
        >
          {rankMedalUrl && rankTier && rankTier > 0 && !rankImageError ? (
            <Image
              src={rankMedalUrl}
              alt={`Rank ${rankTier}`}
              fill
              className="object-contain"
              unoptimized
              onError={() => {
                setRankImageError(true)
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded border border-gray-600">
              {rankTier && rankTier > 0 ? (
                <Award className={`${iconSizeClasses[size]} text-yellow-400`} />
              ) : (
                <span className="text-xs text-gray-400 font-medium">Unranked</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Player Name (optional) */}
      {showName && (
        <div className="flex flex-col">
          {playerName && (
            <div className={`${textSizeClasses[size]} text-gray-300 font-medium truncate max-w-[150px]`} title={playerName}>
              {playerName}
            </div>
          )}
          {showRank && soloMMR && (
            <div className={`${textSizeClasses[size === 'sm' ? 'sm' : 'sm']} text-gray-400`}>
              {soloMMR} MMR
            </div>
          )}
        </div>
      )}
    </div>
  )
}

