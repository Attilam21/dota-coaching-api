'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Rimossi display_name e avatar_url - usiamo solo email da auth context

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-700 bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-red-500">
              PRO DOTA ANALISI
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-gray-300 hover:text-red-500 px-3 py-2 transition-colors">
              Home
            </Link>
            {loading ? (
              <div className="px-3 py-2 text-gray-500">Caricamento...</div>
            ) : user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-300 hover:text-red-500 px-3 py-2 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 text-gray-300 hover:text-red-500 px-3 py-2 transition-colors"
                  >
                    <span>{user.email}</span>
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Esci
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-red-500 px-3 py-2 transition-colors"
                >
                  Accedi
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Registrati
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-red-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-700">
            <Link
              href="/"
              className="block text-gray-300 hover:text-red-500 px-3 py-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-gray-300 hover:text-red-500 px-3 py-2 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left text-gray-300 hover:text-red-500 px-3 py-2 transition-colors"
                >
                  Esci
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block text-gray-300 hover:text-red-500 px-3 py-2 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Accedi
                </Link>
                <Link
                  href="/auth/signup"
                  className="block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrati
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}