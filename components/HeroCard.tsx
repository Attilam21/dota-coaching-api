'use client'

import Image from 'next/image'

interface HeroCardProps {
  heroId: number
  heroName: string // e.g., "npc_dota_hero_antimage" or just "antimage"
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export default function HeroCard({
  heroId,
  heroName,
  size = 'md',
  showName = false,
  className = ''
}: HeroCardProps) {
  // Generate image URL from hero name
  // OpenDota format: "npc_dota_hero_antimage" -> "antimage"
  // Use _sb.png for small size (more efficient), _lg.png for medium/large
  const getImageUrl = () => {
    if (!heroName) return null
    
    // Remove "npc_dota_hero_" prefix if present
    let imageName = heroName.toLowerCase().replace(/^npc_dota_hero_/, '')
    
    // Clean up any remaining invalid characters
    imageName = imageName.replace(/[^a-z0-9_]/g, '')
    
    if (!imageName) return null
    
    // Use _sb.png for small icons (more efficient), _lg.png for larger ones
    const imageFormat = size === 'sm' ? '_sb.png' : '_lg.png'
    // Use cdn.dota2.com for hero images (works with next/image)
    const cdn = 'cdn.dota2.com'
    
    return {
      url: `https://${cdn}/apps/dota2/images/heroes/${imageName}${imageFormat}`
    }
  }

  const imageData = getImageUrl()
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Extract display name (localized name or clean hero name)
  const displayName = heroName
    .replace(/^npc_dota_hero_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div
      className={`relative group ${className}`}
      title={displayName}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Hero Image */}
        <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-gray-800 rounded border border-gray-600 overflow-hidden`}>
          {imageData ? (
            <Image
              src={imageData.url}
              alt={displayName}
              fill
              className="object-contain p-1"
              unoptimized
              onError={(e) => {
                // Fallback: hide image and show hero ID number
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent && !parent.querySelector('.hero-placeholder')) {
                  const placeholder = document.createElement('span')
                  placeholder.className = 'text-xs text-gray-400 font-bold absolute inset-0 flex items-center justify-center hero-placeholder'
                  placeholder.textContent = heroId.toString()
                  parent.appendChild(placeholder)
                }
              }}
              onLoad={(e) => {
                // Remove placeholder if image loads successfully
                const target = e.currentTarget as HTMLImageElement
                const placeholder = target.parentElement?.querySelector('.hero-placeholder')
                if (placeholder) {
                  placeholder.remove()
                }
              }}
            />
          ) : (
            <span className="text-xs text-gray-400 font-bold absolute inset-0 flex items-center justify-center">
              {heroId}
            </span>
          )}
        </div>

        {/* Hero Name (optional) */}
        {showName && (
          <div className={`${textSizeClasses[size]} text-center text-gray-300 font-medium w-full px-1`} style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }} title={displayName}>
            {displayName}
          </div>
        )}
      </div>
    </div>
  )
}
