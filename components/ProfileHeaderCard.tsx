'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User, Award, Trophy, TrendingUp, Clock, Settings } from 'lucide-react'
import { useState } from 'react'

interface ProfileHeaderCardProps {
  // Player Identity
  playerId?: string
  avatarUrl?: string
  playerName?: string
  rankTier?: number
  rankMedalUrl?: string
  soloMMR?: number | string | null
  
  // Quick Stats
  winrate?: number | string
  totalMatches?: number
  lastMatchTime?: number // Unix timestamp
  winLoss?: { win: number; lose: number } | null
  
  // Optional
  showSettingsLink?: boolean
  className?: string
}

export default function ProfileHeaderCard({
  playerId,
  avatarUrl,
  playerName,
  rankTier = 0,
  rankMedalUrl,
  soloMMR,
  winrate,
  totalMatches,
  lastMatchTime,
  winLoss,
  showSettingsLink = true,
  className = ''
}: ProfileHeaderCardProps) {
  const [rankImageError, setRankImageError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  // Get rank name from tier
  const getRankName = (tier: number): string => {
    if (tier === 0) return 'Unranked'
    if (tier <= 5) return 'Herald'
    if (tier <= 10) return 'Guardian'
    if (tier <= 15) return 'Crusader'
    if (tier <= 20) return 'Archon'
    if (tier <= 25) return 'Legend'
    if (tier <= 30) return 'Ancient'
    if (tier <= 40) return 'Divine'
    if (tier >= 41) return 'Immortal'
    return 'Unknown'
  }

  // Format last match time
  const formatLastMatch = (timestamp?: number): string => {
    if (!timestamp) return 'N/A'
    const now = Date.now() / 1000
    const diff = now - timestamp
    const hours = Math.floor(diff / 3600)
    const days = Math.floor(diff / 86400)
    
    if (days > 0) return `${days}d fa`
    if (hours > 0) return `${hours}h fa`
    const minutes = Math.floor(diff / 60)
    return minutes > 0 ? `${minutes}m fa` : 'Ora'
  }

  // Format winrate
  const formatWinrate = (wr?: number | string): string => {
    if (wr === undefined || wr === null) return 'N/A'
    const num = typeof wr === 'string' ? parseFloat(wr) : wr
    return `${num.toFixed(1)}%`
  }

  const rankName = getRankName(rankTier)

  return (
    <div className={`relative bg-gray-800 border border-gray-700 rounded-2xl p-5 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        {/* Left: Avatar + Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative w-14 h-14 rounded-full border border-gray-600 overflow-hidden bg-gray-700">
              {avatarUrl && !avatarError ? (
                <Image
                  src={avatarUrl}
                  alt={playerName || `Player ${playerId || ''}`}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            {/* Name + Pro badge */}
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-white truncate">
                {playerName || `Player ${playerId || ''}`}
              </h1>
              {playerName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                  Pro
                </span>
              )}
            </div>

            {/* Rank + ID + Matches pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Rank */}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-700/50 border border-gray-600 text-xs text-gray-300">
                {rankMedalUrl && rankTier > 0 && !rankImageError ? (
                  <div className="relative w-3.5 h-3.5">
                    <Image
                      src={rankMedalUrl}
                      alt={`Rank ${rankTier}`}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={() => setRankImageError(true)}
                    />
                  </div>
                ) : (
                  <Award className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className="opacity-70">{rankName}</span>
              </div>

              {/* Player ID */}
              {playerId && (
                <span className="text-xs text-gray-500 font-mono opacity-60">
                  ID: {playerId}
                </span>
              )}

              {/* Total Matches */}
              {totalMatches !== undefined && (
                <span className="text-xs text-gray-500 opacity-60">
                  {totalMatches} partite
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Mini KPI Pills */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Winrate */}
          {winrate !== undefined && (
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 min-w-[100px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Winrate</span>
              </div>
              <p className="text-lg font-bold text-green-400 leading-none">{formatWinrate(winrate)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">ultime 20</p>
            </div>
          )}

          {/* Last Match */}
          {lastMatchTime && (
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 min-w-[90px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Ultima</span>
              </div>
              <p className="text-base font-semibold text-blue-400 leading-none">{formatLastMatch(lastMatchTime)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">partita</p>
            </div>
          )}

        </div>
      </div>

      {/* Settings Link */}
      {showSettingsLink && (
        <div className="absolute top-4 right-4">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            title="Impostazioni"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Impostazioni</span>
          </Link>
        </div>
      )}
    </div>
  )
}

