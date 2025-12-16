'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SavedMatch {
  id: string
  match_id: number
  analysis_data: {
    match: any
    analysis: any
    saved_at: string
  }
  created_at: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchSavedMatches()
    }
  }, [user, authLoading, router])

  const fetchSavedMatches = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('match_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setSavedMatches(data || [])
    } catch (err) {
      console.error('Failed to fetch saved matches:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.email}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Saved Match Analyses</h2>
        
        {savedMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't saved any match analyses yet.</p>
            <Link
              href="/"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Analyze Your First Match
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedMatches.map((savedMatch) => (
              <div
                key={savedMatch.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/analysis/match/${savedMatch.match_id}`}
                      className="text-lg font-semibold text-red-600 hover:text-red-700"
                    >
                      Match #{savedMatch.match_id}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Saved on {new Date(savedMatch.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {savedMatch.analysis_data?.match && (
                      <div className="mt-2 flex gap-4 text-sm text-gray-600">
                        <span>
                          Duration: {Math.floor(savedMatch.analysis_data.match.duration / 60)}:
                          {(savedMatch.analysis_data.match.duration % 60).toString().padStart(2, '0')}
                        </span>
                        <span>
                          Winner: {savedMatch.analysis_data.match.radiant_win ? 'Radiant' : 'Dire'}
                        </span>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/analysis/match/${savedMatch.match_id}`}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    View Analysis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

