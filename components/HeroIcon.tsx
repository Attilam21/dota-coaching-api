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
    
    // Special cases: some heroes have different names in the file system
    // Complete mapping of all hero name variations
    // OpenDota API returns "npc_dota_hero_xxx" format
    // CDN uses different format for some heroes
    const heroNameMap: Record<string, string> = {
      'nevermore': 'shadow_fiend',  // Nevermore is Shadow Fiend (ID 11)
      'skeleton_king': 'wraith_king', // Skeleton King was renamed to Wraith King
      'windrunner': 'windranger', // Windrunner was renamed to Windranger
      'shredder': 'timbersaw', // Shredder is Timbersaw
      'furion': 'natures_prophet', // Furion is Nature's Prophet (CDN uses natures_prophet without apostrophe)
      'magnataur': 'magnus', // Magnataur is Magnus
      'obsidian_destroyer': 'outworld_destroyer', // Obsidian Destroyer renamed
      'rattletrap': 'clockwerk', // Rattletrap is Clockwerk
      'wisp': 'io', // Wisp is Io
      'zuus': 'zeus', // Zuus is Zeus
      'necrophos': 'necrolyte', // Necrophos was Necrolyte
      'doom_bringer': 'doom', // Doom Bringer is Doom
      'treant': 'treant_protector', // Treant is Treant Protector
      'queenofpain': 'queen_of_pain', // QueenOfPain is Queen of Pain
      'vengefulspirit': 'vengeful_spirit', // VengefulSpirit is Vengeful Spirit
      'shadow_shaman': 'rhasta', // Shadow Shaman is Rhasta
      'dragon_knight': 'dragon_knight', // Keep as is
      'drow_ranger': 'drow_ranger', // Keep as is
    }
    
    // Check if we need to map the name
    if (heroNameMap[imageName]) {
      imageName = heroNameMap[imageName]
    }
    
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
