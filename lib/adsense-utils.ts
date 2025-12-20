/**
 * AdSense Utility Functions
 * Helper functions to check consent and manage AdSense
 */

export function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  const consent = localStorage.getItem('cookie-consent')
  return consent === 'accepted'
}

export function shouldLoadAdSense(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  // Check if AdSense ID is configured
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  if (!adClientId) {
    return false
  }
  
  // Check if user has given consent
  return hasCookieConsent()
}

export function getAdSenseClientId(): string | null {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null
}

