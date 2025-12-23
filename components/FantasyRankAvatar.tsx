'use client'

import React from 'react'

interface FantasyRankAvatarProps {
  icon: string
  color: string
  size?: number
}

/**
 * Avatar fantasy 2D per rank gamification
 * 6 icone SVG premium: rune, scroll, crystal, shield, helm, crown
 */
export default function FantasyRankAvatar({ icon, color, size = 64 }: FantasyRankAvatarProps) {
  const renderIcon = () => {
    const iconSize = size
    const strokeWidth = size / 32

    switch (icon) {
      case 'rune':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" stroke={color} strokeWidth={strokeWidth} fill="none" opacity="0.3" />
            <path d="M32 8 L40 24 L56 24 L44 36 L48 52 L32 44 L16 52 L20 36 L8 24 L24 24 Z" 
                  fill={color} opacity="0.6" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="32" cy="32" r="4" fill={color} />
          </svg>
        )
      
      case 'scroll':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 12 L48 12 L48 52 L16 52 Z" fill={color} opacity="0.2" stroke={color} strokeWidth={strokeWidth} />
            <path d="M20 20 L44 20 M20 28 L40 28 M20 36 L44 36" stroke={color} strokeWidth={strokeWidth * 0.8} />
            <path d="M16 12 L16 8 L20 8 L20 12" fill={color} opacity="0.4" />
            <path d="M48 12 L48 8 L52 8 L52 12" fill={color} opacity="0.4" />
          </svg>
        )
      
      case 'crystal':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 8 L44 24 L56 32 L44 40 L32 56 L20 40 L8 32 L20 24 Z" 
                  fill={color} opacity="0.5" stroke={color} strokeWidth={strokeWidth} />
            <path d="M32 8 L32 56 M20 24 L44 40 M44 24 L20 40" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.8" />
          </svg>
        )
      
      case 'shield':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 8 L48 16 L48 32 C48 44 40 52 32 56 C24 52 16 44 16 32 L16 16 Z" 
                  fill={color} opacity="0.4" stroke={color} strokeWidth={strokeWidth} />
            <path d="M32 20 L40 24 L40 32 C40 38 36 42 32 44 C28 42 24 38 24 32 L24 24 Z" 
                  fill={color} opacity="0.6" />
            <path d="M32 28 L36 30 L36 34 L32 36 L28 34 L28 30 Z" fill={color} />
          </svg>
        )
      
      case 'helm':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 8 L48 16 L48 28 C48 36 44 42 32 48 C20 42 16 36 16 28 L16 16 Z" 
                  fill={color} opacity="0.4" stroke={color} strokeWidth={strokeWidth} />
            <path d="M32 20 L40 24 L40 32 C40 38 36 42 32 44 C28 42 24 38 24 32 L24 24 Z" 
                  fill={color} opacity="0.5" />
            <circle cx="32" cy="32" r="6" fill={color} opacity="0.8" />
            <path d="M32 12 L36 16 L32 20 L28 16 Z" fill={color} />
          </svg>
        )
      
      case 'crown':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 40 L48 40 L44 52 L20 52 Z" fill={color} opacity="0.3" stroke={color} strokeWidth={strokeWidth} />
            <path d="M20 40 L24 20 L28 32 L32 16 L36 32 L40 20 L44 40" 
                  fill={color} opacity="0.6" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="24" cy="20" r="3" fill={color} />
            <circle cx="32" cy="16" r="4" fill={color} />
            <circle cx="40" cy="20" r="3" fill={color} />
          </svg>
        )
      
      default:
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="24" stroke={color} strokeWidth={strokeWidth} fill="none" />
          </svg>
        )
    }
  }

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {renderIcon()}
    </div>
  )
}

