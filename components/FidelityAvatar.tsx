'use client'

import React from 'react'

interface FidelityAvatarProps {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Avatar SVG minimal a tema Dota/tech per rank fidelizzazione
 */
export default function FidelityAvatar({ icon, color, size = 'md' }: FidelityAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 24 : 32

  const renderIcon = () => {
    switch (icon) {
      case 'compass':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8 L16 12 L12 16 L8 12 Z" fill="currentColor" opacity="0.6" />
          </svg>
        )
      case 'scroll':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M6 2 C4 2 4 4 4 6 L4 18 C4 20 4 22 6 22 L18 22 C20 22 20 20 20 18 L20 6 C20 4 20 2 18 2 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 6 L16 6 M8 10 L16 10 M8 14 L12 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )
      case 'crystal':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M12 2 L16 8 L22 10 L16 12 L12 18 L8 12 L2 10 L8 8 Z" fill="currentColor" opacity="0.8" />
            <path d="M12 2 L16 8 L22 10 L16 12 L12 18 L8 12 L2 10 L8 8 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        )
      case 'shield':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M12 2 L4 5 L4 11 C4 16 8 20 12 22 C16 20 20 16 20 11 L20 5 Z" fill="currentColor" opacity="0.8" />
            <path d="M12 2 L4 5 L4 11 C4 16 8 20 12 22 C16 20 20 16 20 11 L20 5 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M9 12 L11 14 L15 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        )
      case 'helm':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M12 2 C8 2 5 5 5 9 L5 12 C5 14 6 16 8 17 L8 20 C8 21 9 22 10 22 L14 22 C15 22 16 21 16 20 L16 17 C18 16 19 14 19 12 L19 9 C19 5 16 2 12 2 Z" fill="currentColor" opacity="0.8" />
            <path d="M12 2 C8 2 5 5 5 9 L5 12 C5 14 6 16 8 17 L8 20 C8 21 9 22 10 22 L14 22 C15 22 16 21 16 20 L16 17 C18 16 19 14 19 12 L19 9 C19 5 16 2 12 2 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="10" r="2" fill="currentColor" opacity="0.6" />
          </svg>
        )
      case 'crown':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M5 16 L7 8 L12 10 L17 8 L19 16 L5 16 Z" fill="currentColor" opacity="0.8" />
            <path d="M5 16 L7 8 L12 10 L17 8 L19 16 L5 16 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M7 8 L9 4 L12 6 L15 4 L17 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="15" cy="12" r="1" fill="currentColor" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.6" />
          </svg>
        )
    }
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${color} p-2 flex items-center justify-center text-white`}>
      {renderIcon()}
    </div>
  )
}

