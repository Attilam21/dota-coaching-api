'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load user profile when user is available
  useEffect(() => {
    if (user) {
      loadUserProfile()
    } else {
      setUserProfile(null)
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('users')
        .select('display_name, avatar_url')
        .eq('auth_id', user.id)
        .single()

      if (data) {
        setUserProfile(data as { display_name: string | null; avatar_url: string | null })
      }
    } catch (err) {
      console.error('Failed to load user profile:', err)
    }
  }

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
              Dota 2 Coach
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
                    {userProfile?.avatar_url && (
                      <img
                        src={userProfile.avatar_url}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full border border-gray-600 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <span>{userProfile?.display_name || user.email}</span>
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