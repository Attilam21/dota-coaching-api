'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-red-600">
              Dota 2 Coach
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-red-600 px-3 py-2">
              Home
            </Link>
            <Link href="/analysis" className="text-gray-700 hover:text-red-600 px-3 py-2">
              Analysis
            </Link>
            <Link href="/learning" className="text-gray-700 hover:text-red-600 px-3 py-2">
              Learning
            </Link>
            
            {loading ? (
              <div className="px-3 py-2 text-gray-500">Loading...</div>
            ) : user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-red-600 px-3 py-2"
                >
                  Dashboard
                </Link>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2"
                  >
                    {user.email}
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-red-600 px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-red-600"
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
          <div className="md:hidden py-4 space-y-2">
            <Link
              href="/"
              className="block text-gray-700 hover:text-red-600 px-3 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/analysis"
              className="block text-gray-700 hover:text-red-600 px-3 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Analysis
            </Link>
            <Link
              href="/learning"
              className="block text-gray-700 hover:text-red-600 px-3 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Learning
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-gray-700 hover:text-red-600 px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left text-gray-700 hover:text-red-600 px-3 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block text-gray-700 hover:text-red-600 px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

