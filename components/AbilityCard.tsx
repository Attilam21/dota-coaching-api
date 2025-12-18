'use client'

import Image from 'next/image'
import { Zap } from 'lucide-react'

interface AbilityCardProps {
  abilityName: string // e.g., "antimage_blink", "pudge_meat_hook"
  size?: 'sm' | 'md' | 'lg'
  level?: number // Livello dell'abilità (1-4, o 6/11/16/18 per ultimate)
  showLevel?: boolean
  className?: string
}

export default function AbilityCard({
  abilityName,
  size = 'md',
  level,
  showLevel = false,
  className = ''
}: AbilityCardProps) {
  // Generate image URL from ability name
  // Format: "antimage_blink" -> "antimage_blink_hp2.png"
  const getImageUrl = () => {
    if (!abilityName) return null
    
    // Normalize ability name (lowercase, replace spaces with underscores)
    let imageName = abilityName.toLowerCase().trim().replace(/\s+/g, '_')
    
    // Clean up any invalid characters (keep only alphanumeric and underscores)
    imageName = imageName.replace(/[^a-z0-9_]/g, '')
    
    if (!imageName) return null
    
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/abilities/${imageName}_hp2.png`
  }

  const imageUrl = getImageUrl()
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const levelSizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base'
  }

  // Extract display name (clean ability name)
  const displayName = abilityName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div
      className={`relative group ${className}`}
      title={displayName + (level ? ` (Level ${level})` : '')}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Ability Image */}
        <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-gray-800 rounded border border-gray-600 overflow-hidden`}>
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                className="object-contain p-1"
                unoptimized
                onError={(e) => {
                  // Fallback: hide image and show placeholder
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent && !parent.querySelector('.ability-placeholder')) {
                    const placeholder = document.createElement('div')
                    placeholder.className = 'ability-placeholder text-gray-500 text-xs text-center px-1 absolute inset-0 flex items-center justify-center'
                    placeholder.textContent = displayName.substring(0, 3).toUpperCase()
                    parent.appendChild(placeholder)
                  }
                }}
                onLoad={() => {
                  // Remove placeholder if image loads successfully
                  const placeholder = document.querySelector('.ability-placeholder')
                  if (placeholder) {
                    placeholder.remove()
                  }
                }}
              />
              {/* Level badge overlay */}
              {level !== undefined && level > 0 && (
                <div className="absolute bottom-0 right-0 bg-gray-900/90 border border-gray-600 rounded-tl text-white font-bold flex items-center justify-center"
                  style={{ width: '40%', height: '40%', fontSize: size === 'sm' ? '0.6rem' : size === 'md' ? '0.75rem' : '0.875rem' }}>
                  {level}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-xs text-center px-1 absolute inset-0 flex items-center justify-center">
              {displayName.substring(0, 3).toUpperCase()}
              {level !== undefined && level > 0 && (
                <span className="ml-1 text-gray-400">{level}</span>
              )}
            </div>
          )}
        </div>

        {/* Ability Name (optional) */}
        {showLevel && level !== undefined && (
          <div className="text-xs text-gray-400 font-medium">
            Lv.{level}
          </div>
        )}
      </div>
    </div>
  )
}

