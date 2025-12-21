'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User, Award, Trophy, TrendingUp, Clock, Settings } from 'lucide-react'
import { useState } from 'react'

interface PlayerHeaderProps {
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
  
  // Optional
  showSettingsLink?: boolean
  className?: string
}

export default function PlayerHeader({
  playerId,
  avatarUrl,
  playerName,
  rankTier = 0,
  rankMedalUrl,
  soloMMR,
  winrate,
  totalMatches,
  lastMatchTime,
  showSettingsLink = true,
  className = ''
}: PlayerHeaderProps) {
  const [rankImageError, setRankImageError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  // Get rank name and color from tier
  const getRankInfo = (tier: number) => {
    if (tier === 0) return { name: 'Unranked', color: 'bg-gray-600 border-gray-500 text-gray-200' }
    if (tier <= 5) return { name: 'Herald', color: 'bg-amber-800 border-amber-700 text-amber-100' }
    if (tier <= 10) return { name: 'Guardian', color: 'bg-emerald-600 border-emerald-500 text-emerald-100' }
    if (tier <= 15) return { name: 'Crusader', color: 'bg-cyan-600 border-cyan-500 text-cyan-100' }
    if (tier <= 20) return { name: 'Archon', color: 'bg-blue-600 border-blue-500 text-blue-100' }
    if (tier <= 25) return { name: 'Legend', color: 'bg-violet-600 border-violet-500 text-violet-100' }
    if (tier <= 30) return { name: 'Ancient', color: 'bg-red-600 border-red-500 text-red-100' }
    if (tier <= 40) return { name: 'Divine', color: 'bg-orange-600 border-orange-500 text-orange-100' }
    if (tier >= 41) return { name: 'Immortal', color: 'bg-amber-500 border-amber-400 text-amber-50' }
    return { name: 'Unknown', color: 'bg-gray-600 border-gray-500 text-gray-200' }
  }

  const rankInfo = getRankInfo(rankTier)

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

  return (
    <div className={`bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg ${className}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        {/* Left: Avatar Section */}
        <div className="flex-shrink-0">
          <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full border-2 border-gray-600 overflow-hidden bg-gray-700 shadow-md">
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
                <User className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Center: Player Info Card */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">
                {playerName || `Player ${playerId || ''}`}
              </h1>
              {playerName && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                  Pro
                </span>
              )}
            </div>
          </div>

          {/* Rank Badge - Enterprise Design */}
          <div className="flex items-center gap-3 flex-wrap">
            <div 
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${rankInfo.color} shadow-sm`}
              title={rankTier > 0 ? `${rankInfo.name}${soloMMR ? ` - ${soloMMR} MMR` : ''}` : 'Unranked'}
            >
              {rankMedalUrl && rankTier > 0 && !rankImageError ? (
                <div className="relative w-5 h-5">
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
                <Award className={`w-4 h-4 ${rankTier > 0 ? 'text-current' : 'text-gray-400'}`} />
              )}
              <span className="text-sm font-semibold">{rankInfo.name}</span>
            </div>

            {soloMMR && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">{soloMMR} MMR</span>
              </div>
            )}

            {playerId && (
              <span className="text-xs text-gray-500 font-mono">
                ID: {playerId}
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Stats Cards */}
        <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto lg:min-w-[140px]">
          {/* Winrate Card */}
          {winrate !== undefined && (
            <div className="flex-1 lg:flex-none bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-lg p-3 shadow-sm hover:border-green-600/70 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Winrate</span>
              </div>
              <p className="text-xl font-bold text-green-400">{formatWinrate(winrate)}</p>
              {totalMatches && (
                <p className="text-xs text-gray-500 mt-1">{totalMatches} partite</p>
              )}
            </div>
          )}

          {/* Last Match Card */}
          {lastMatchTime && (
            <div className="flex-1 lg:flex-none bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/50 rounded-lg p-3 shadow-sm hover:border-blue-600/70 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Ultima</span>
              </div>
              <p className="text-lg font-semibold text-blue-400">{formatLastMatch(lastMatchTime)}</p>
              <p className="text-xs text-gray-500 mt-1">partita</p>
            </div>
          )}
        </div>

        {/* Settings Link */}
        {showSettingsLink && (
          <div className="absolute top-4 right-4">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Modifica Profilo"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Impostazioni</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

