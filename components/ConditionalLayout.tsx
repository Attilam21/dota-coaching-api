'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isDashboard, setIsDashboard] = useState<boolean | null>(null)

  useEffect(() => {
    // Only determine dashboard status after client-side mount to avoid hydration mismatch
    setIsDashboard(pathname?.startsWith('/dashboard') ?? false)
  }, [pathname])

  // During SSR and initial client render, render both layouts but hide navbar with CSS
  // This ensures consistent HTML between server and client
  if (isDashboard === null) {
    return (
      <>
        <div style={{ display: 'none' }}>
          <Navbar />
        </div>
        {children}
        <div style={{ display: 'none' }}>
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500 text-sm">
                © 2025 Dota 2 Coaching Platform. Powered by OpenDota API.
              </p>
            </div>
          </footer>
        </div>
      </>
    )
  }

  if (isDashboard) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">{children}</main>
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 Dota 2 Coaching Platform. Powered by OpenDota API.
          </p>
        </div>
      </footer>
    </>
  )
}
