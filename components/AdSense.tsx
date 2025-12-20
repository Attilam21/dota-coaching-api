'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { shouldLoadAdSense, hasCookieConsent } from '@/lib/adsense-utils'

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  style?: React.CSSProperties
  className?: string
  fullWidthResponsive?: boolean
}

/**
 * Google AdSense Component
 * Compatible with Next.js 14 and Google AdSense policies
 * Only loads ads if user has given cookie consent (GDPR compliant)
 * 
 * Usage:
 * <AdSense 
 *   adSlot="1234567890" 
 *   adFormat="auto"
 *   className="min-h-[250px]"
 * />
 */
export default function AdSense({
  adSlot,
  adFormat = 'auto',
  style,
  className = '',
  fullWidthResponsive = true,
}: AdSenseProps) {
  const [mounted, setMounted] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  useEffect(() => {
    setMounted(true)
    // Check consent on client side only
    if (typeof window !== 'undefined') {
      setHasConsent(hasCookieConsent())
    }
  }, [])

  // Don't render if AdSense ID is not configured
  if (!adClientId) {
    return null
  }

  // Don't render if user hasn't given consent (GDPR)
  if (mounted && !hasConsent) {
    return null
  }

  // Don't render on server
  if (!mounted) {
    return null
  }

  useEffect(() => {
    // Ensure adsbygoogle is available and push ad
    if (typeof window !== 'undefined') {
      try {
        const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []
        ;(window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = adsbygoogle
        adsbygoogle.push({})
      } catch (err) {
        // Silently fail if AdSense is not ready
        console.error('AdSense error:', err)
      }
    }
  }, [hasConsent, mounted])

  return (
    <>
      {/* AdSense Script - Load only once */}
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`}
        crossOrigin="anonymous"
        onError={(e) => {
          console.error('AdSense script failed to load:', e)
        }}
      />
      
      {/* AdSense Ad Unit */}
      <ins
        className={`adsbygoogle ${className}`}
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client={adClientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </>
  )
}

