'use client'

import { useMemo, useState, useEffect } from 'react'
import AdBanner from './AdBanner'

interface AdPlaceholderProps {
  position: 'top' | 'sidebar' | 'bottom' | 'in-content'
  className?: string
  showLabel?: boolean
}

/**
 * Ad Placeholder Component
 * Shows a visual placeholder when AdSense is not configured
 * Automatically switches to real ads when AdSense is configured
 */
export default function AdPlaceholder({ 
  position, 
  className = '',
  showLabel = true 
}: AdPlaceholderProps) {
  const [mounted, setMounted] = useState(false)
  const adClientId = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID : null

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get dimensions for placeholder
  const dimensions = useMemo(() => {
    switch (position) {
      case 'top':
        return { width: '100%', height: '90px', label: 'Banner Top (728x90)' }
      case 'sidebar':
        return { width: '100%', height: '250px', label: 'Sidebar (300x250)' }
      case 'bottom':
        return { width: '100%', height: '90px', label: 'Banner Bottom (728x90)' }
      case 'in-content':
        return { width: '100%', height: '250px', label: 'In-Content (300x250)' }
      default:
        return { width: '100%', height: '250px', label: 'Ad Space' }
    }
  }, [position])

  // On server, show placeholder skeleton
  if (!mounted) {
    return (
      <div 
        className={`ad-placeholder border-2 border-dashed border-gray-600 bg-gray-800/50 rounded-lg flex items-center justify-center ${className}`}
        style={{ 
          minHeight: dimensions.height,
          width: dimensions.width 
        }}
      >
        <div className="text-center p-4">
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  // On client, check if we should show real ads
  const hasConsent = typeof window !== 'undefined' 
    ? localStorage.getItem('cookie-consent') === 'accepted' 
    : false

  // If AdSense is configured and user has consent, show real ads
  if (adClientId && hasConsent) {
    return <AdBanner position={position} className={className} />
  }

  // Otherwise show placeholder - ALWAYS visible
  return (
    <div 
      className={`ad-placeholder border-2 border-dashed border-gray-600 bg-gray-800/50 rounded-lg flex items-center justify-center ${className}`}
      style={{ 
        minHeight: dimensions.height,
        width: dimensions.width 
      }}
    >
      <div className="text-center p-4">
        {showLabel && (
          <>
            <div className="text-xs text-gray-500 mb-1 font-semibold">
              📢 {dimensions.label}
            </div>
            <div className="text-xs text-gray-600">
              {adClientId ? 'In attesa di consenso cookie' : 'AdSense non configurato'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
