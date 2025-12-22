'use client'

import Image from 'next/image'

interface HeroIconProps {
  heroId?: number
  heroName?: string // e.g., "npc_dota_hero_antimage" or just "antimage"
  size?: number // Size in pixels (default: 32)
  className?: string
}

/**
 * Simple hero icon component for inline use in lists and tables.
 * Uses native <img> tag for better performance with small icons.
 */
export default function HeroIcon({
  heroId,
  heroName,
  size = 32,
  className = ''
}: HeroIconProps) {
  // Generate image URL from hero name
  // OpenDota API returns hero.name as "npc_dota_hero_antimage"
  // Dota 2 CDN expects just "antimage" for the image filename
  const getImageUrl = () => {
    if (!heroName) return null
    
    // Remove "npc_dota_hero_" prefix if present
    let imageName = heroName.toLowerCase().replace(/^npc_dota_hero_/, '')
    
    // OpenDota API returns "npc_dota_hero_xxx" format
    // CDN uses the same base name (after removing prefix)
    // No mapping needed - OpenDota names match CDN names
    
    // Clean up any remaining invalid characters (keep underscores)
    // Note: CDN uses underscores and lowercase letters/numbers only
    imageName = imageName.replace(/[^a-z0-9_]/g, '')
    
    if (!imageName) return null
    
    // Use _sb.png for small icons (more efficient)
    // Try cdn.cloudflare.steamstatic.com first (better SSL support with next/image)
    // Fallback to cdn.dota2.com if needed
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${imageName}_sb.png`
  }

  const imageUrl = getImageUrl()
  
  return (
    <div 
      className={`relative flex items-center justify-center bg-gray-700 rounded overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title={heroName ? heroName.replace(/^npc_dota_hero_/, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : `Hero ${heroId || ''}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={heroName ? heroName.replace(/^npc_dota_hero_/, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : `Hero ${heroId || ''}`}
          fill
          className="object-cover"
          unoptimized
          onError={(e) => {
            // Fallback: hide image and show hero ID number
            const target = e.currentTarget as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent && !parent.querySelector('.hero-placeholder')) {
              const placeholder = document.createElement('span')
              placeholder.className = 'text-xs text-gray-400 font-bold hero-placeholder absolute inset-0 flex items-center justify-center'
              placeholder.textContent = heroId?.toString() || '?'
              parent.appendChild(placeholder)
            }
          }}
        />
      ) : (
        <span className="text-xs text-gray-400 font-bold">
          {heroId || '?'}
        </span>
      )}
    </div>
  )
}
