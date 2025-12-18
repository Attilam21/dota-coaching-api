'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'

interface TalentIconProps {
  talentName: string // e.g., talent name from ability_upgrades
  level?: number // Livello talent (10, 15, 20, 25)
  size?: 'sm' | 'md' | 'lg'
  showLevel?: boolean
  className?: string
}

export default function TalentIcon({
  talentName,
  level,
  size = 'md',
  showLevel = false,
  className = ''
}: TalentIconProps) {
  // Generate image URL from talent name
  // Format: talent name -> "talent_name_png.png"
  const getImageUrl = () => {
    if (!talentName) return null
    
    // Normalize talent name (lowercase, replace spaces with underscores)
    let imageName = talentName.toLowerCase().trim().replace(/\s+/g, '_')
    
    // Clean up any invalid characters
    imageName = imageName.replace(/[^a-z0-9_]/g, '')
    
    if (!imageName) return null
    
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/talents/${imageName}_png.png`
  }

  const imageUrl = getImageUrl()
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  // Extract display name (clean talent name)
  const displayName = talentName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  const levelColors: Record<number, string> = {
    10: 'border-blue-500',
    15: 'border-purple-500',
    20: 'border-yellow-500',
    25: 'border-red-500'
  }

  const borderColor = level ? levelColors[level] || 'border-gray-600' : 'border-gray-600'

  return (
    <div
      className={`relative group ${className}`}
      title={displayName + (level ? ` (Level ${level})` : '')}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Talent Image */}
        <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-gray-800 rounded border-2 ${borderColor} overflow-hidden`}>
          {imageUrl ? (
            <>
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
                  if (parent && !parent.querySelector('.talent-fallback-icon')) {
                    const iconWrapper = document.createElement('div')
                    iconWrapper.className = 'talent-fallback-icon absolute inset-0 flex items-center justify-center'
                    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                    icon.setAttribute('class', `${sizeClasses[size]} text-yellow-400`)
                    icon.setAttribute('fill', 'none')
                    icon.setAttribute('viewBox', '0 0 24 24')
                    icon.setAttribute('stroke', 'currentColor')
                    icon.setAttribute('stroke-width', '2')
                    icon.innerHTML = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
                    iconWrapper.appendChild(icon)
                    parent.appendChild(iconWrapper)
                  }
                }}
                onLoad={() => {
                  // Remove placeholder if image loads successfully
                  const placeholder = document.querySelector('.talent-fallback-icon')
                  if (placeholder) {
                    placeholder.remove()
                  }
                }}
              />
              {/* Level badge overlay */}
              {level !== undefined && (
                <div className="absolute top-0 right-0 bg-gray-900/90 border border-gray-600 rounded-bl text-white font-bold flex items-center justify-center"
                  style={{ width: '35%', height: '35%', fontSize: size === 'sm' ? '0.5rem' : size === 'md' ? '0.65rem' : '0.75rem' }}>
                  {level}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Star className={`${sizeClasses[size]} text-yellow-400`} />
              {level !== undefined && (
                <div className="absolute top-0 right-0 bg-gray-900/90 border border-gray-600 rounded-bl text-white font-bold flex items-center justify-center"
                  style={{ width: '35%', height: '35%', fontSize: size === 'sm' ? '0.5rem' : size === 'md' ? '0.65rem' : '0.75rem' }}>
                  {level}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Talent Level (optional) */}
        {showLevel && level !== undefined && (
          <div className="text-xs text-gray-400 font-medium">
            L{level}
          </div>
        )}
      </div>
    </div>
  )
}

