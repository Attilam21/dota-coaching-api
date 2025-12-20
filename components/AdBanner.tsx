'use client'

import AdSense from './AdSense'

interface AdBannerProps {
  position: 'top' | 'sidebar' | 'bottom' | 'in-content'
  className?: string
}

/**
 * Pre-configured AdSense Banner Components
 * Different positions with optimized formats
 */
export default function AdBanner({ position, className = '' }: AdBannerProps) {
  // Get ad slot from environment (you'll configure these in Google AdSense)
  // For now, using placeholder - replace with actual ad slots after AdSense approval
  const adSlots: Record<string, string> = {
    top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP || '',
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '',
    bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM || '',
    'in-content': process.env.NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT || '',
  }

  const adSlot = adSlots[position]

  if (!adSlot) {
    // Don't render if ad slot is not configured
    return null
  }

  // Different formats for different positions
  const formatMap: Record<string, 'auto' | 'horizontal' | 'vertical' | 'rectangle'> = {
    top: 'horizontal',
    sidebar: 'vertical',
    bottom: 'horizontal',
    'in-content': 'auto',
  }

  const defaultStyles: Record<string, React.CSSProperties> = {
    top: { minHeight: '90px', marginBottom: '1rem' },
    sidebar: { minHeight: '250px', marginBottom: '1rem' },
    bottom: { minHeight: '90px', marginTop: '2rem' },
    'in-content': { minHeight: '250px', margin: '1.5rem 0' },
  }

  return (
    <div className={`ad-container ad-${position} ${className}`}>
      <AdSense
        adSlot={adSlot}
        adFormat={formatMap[position] || 'auto'}
        style={defaultStyles[position]}
        className="w-full"
        fullWidthResponsive={true}
      />
    </div>
  )
}

