'use client'

import { useState, useEffect } from 'react'
import { X, Cookie } from 'lucide-react'

/**
 * GDPR Compliant Cookie Consent Banner
 * 
 * This component:
 * - Shows cookie consent banner on first visit
 * - Stores consent in localStorage
 * - Only loads AdSense after consent
 * - Complies with GDPR requirements
 */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already given consent
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
    // Reload page to initialize AdSense if consent was given
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
  }

  // Don't render on server
  if (!mounted || !showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">
              Utilizziamo i cookie
            </h3>
            <p className="text-xs text-gray-400">
              Questo sito utilizza cookie tecnici e di terze parti (Google AdSense) per migliorare l&apos;esperienza 
              e mostrare annunci personalizzati. Puoi accettare o rifiutare i cookie di terze parti.{' '}
              <a 
                href="/privacy" 
                className="text-red-400 hover:text-red-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Rifiuta
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Accetta
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

