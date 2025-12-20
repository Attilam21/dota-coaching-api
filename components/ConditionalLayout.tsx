'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import CookieConsent from './CookieConsent'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isDashboard, setIsDashboard] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Only determine dashboard status after client-side mount to avoid hydration mismatch
    setIsMounted(true)
    // Exclude navbar for dashboard routes and analysis routes (they use DashboardLayout)
    const isDashboard = pathname?.startsWith('/dashboard') ?? false
    const isAnalysis = pathname?.startsWith('/analysis') ?? false
    setIsDashboard(isDashboard || isAnalysis)
  }, [pathname])

  // During SSR and initial render, always show the standard layout
  // This ensures consistent HTML between server and client, avoiding hydration mismatch
  // The layout will be corrected immediately after hydration via useEffect
  if (!isMounted) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-900">{children}</main>
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 text-sm">
            © 2025 PRO DOTA ANALISI - AttilaLAB. Powered by OpenDota API.
          </p>
        </div>
      </footer>
      <CookieConsent />
    </>
  )
}

  if (isDashboard) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-900">{children}</main>
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 text-sm">
            © 2025 Dota 2 Coaching Platform. Powered by OpenDota API.
          </p>
        </div>
      </footer>
      <CookieConsent />
    </>
  )
}
