'use client'

import Image from 'next/image'
import { Sparkles } from 'lucide-react'

interface RuneIconProps {
  runeName: string // e.g., "double_damage", "bounty", "haste", "illusion", "invisibility", "regeneration", "arcane"
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  count?: number // Quante volte raccolta
  className?: string
}

export default function RuneIcon({
  runeName,
  size = 'md',
  showLabel = false,
  count,
  className = ''
}: RuneIconProps) {
  // Steam CDN URL for rune icons
  const getImageUrl = () => {
    // Normalize rune name
    const normalizedName = runeName.toLowerCase().replace(/\s+/g, '_')
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/rune_${normalizedName}.png`
  }

  const imageUrl = getImageUrl()
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Rune display names
  const runeDisplayNames: Record<string, string> = {
    bounty: 'Bounty',
    double_damage: 'Double Damage',
    haste: 'Haste',
    illusion: 'Illusion',
    invisibility: 'Invisibility',
    regeneration: 'Regeneration',
    arcane: 'Arcane'
  }

  const displayName = runeDisplayNames[runeName.toLowerCase()] || runeName

  return (
    <div className={`flex items-center gap-1 ${className}`} title={displayName}>
      <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-gray-700 rounded border border-gray-600 overflow-hidden`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            className="object-contain p-1"
            unoptimized
            onError={(e) => {
              // Fallback: hide image and show icon
              const target = e.currentTarget as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('.rune-fallback-icon')) {
                const iconWrapper = document.createElement('div')
                iconWrapper.className = 'rune-fallback-icon absolute inset-0 flex items-center justify-center'
                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                icon.setAttribute('class', `${sizeClasses[size]} text-blue-400`)
                icon.setAttribute('fill', 'none')
                icon.setAttribute('viewBox', '0 0 24 24')
                icon.setAttribute('stroke', 'currentColor')
                icon.setAttribute('stroke-width', '2')
                icon.innerHTML = '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>'
                iconWrapper.appendChild(icon)
                parent.appendChild(iconWrapper)
              }
            }}
          />
        ) : (
          <div className="rune-fallback-icon absolute inset-0 flex items-center justify-center">
            <Sparkles className={`${sizeClasses[size]} text-blue-400`} />
          </div>
        )}
      </div>
      {showLabel && (
        <span className={`${textSizeClasses[size]} text-gray-300 font-medium`}>
          {displayName}
          {count !== undefined && count > 1 && (
            <span className="ml-1 text-gray-400">({count})</span>
          )}
        </span>
      )}
    </div>
  )
}

