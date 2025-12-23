'use client'

import React from 'react'
import Image from 'next/image'

interface FantasyRankAvatarProps {
  icon: string
  color: string
  size?: number
}

/**
 * Avatar fantasy 2D per rank gamification
 * Usa immagini salvate in public/avatars/
 * Mapping: rune -> scout, scroll -> analyst, crystal -> strategist, shield -> captain, helm -> commander, crown -> legend
 */
export default function FantasyRankAvatar({ icon, color, size = 64 }: FantasyRankAvatarProps) {
  // Mapping icon -> nome file immagine
  const getImagePath = (icon: string): string => {
    const iconMap: Record<string, string> = {
      'rune': '/avatars/scout.png',
      'scroll': '/avatars/analyst.png',
      'crystal': '/avatars/strategist.png',
      'shield': '/avatars/captain.png',
      'helm': '/avatars/commander.png',
      'crown': '/avatars/legend.png'
    }
    
    return iconMap[icon] || '/avatars/scout.png' // fallback
  }

  const imagePath = getImagePath(icon)

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <Image
        src={imagePath}
        alt={icon}
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  )
}

