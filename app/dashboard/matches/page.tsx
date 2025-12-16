'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MatchData {
  duration: number
  radiant_win: boolean
  [key: string]: unknown
}

interface AnalysisData {
  [key: string]: unknown
}

interface SavedMatch {
  id: string
  match_id: number
  analysis_data: {
    match: MatchData
    analysis: AnalysisData
    saved_at: string
  }
  created_at: string
}

export default function MatchesPage() {
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
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Partite</h1>
      <p className="text-gray-400 mb-8">Le tue partite analizzate e salvate</p>

      {savedMatches.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">Non hai ancora salvato alcuna analisi di partita.</p>
          <Link
            href="/dashboard/match-analysis"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Analizza la Prima Partita
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedMatches.map((savedMatch) => (
            <div
              key={savedMatch.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    href={`/analysis/match/${savedMatch.match_id}`}
                    className="text-xl font-semibold text-red-400 hover:text-red-300"
                  >
                    Match #{savedMatch.match_id}
                  </Link>
                  <p className="text-sm text-gray-400 mt-1">
                    Salvato il {new Date(savedMatch.created_at).toLocaleString('it-IT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {savedMatch.analysis_data?.match && (
                    <div className="mt-3 flex gap-6 text-sm">
                      <span className="text-gray-300">
                        Durata: {Math.floor(savedMatch.analysis_data.match.duration / 60)}:
                        {(savedMatch.analysis_data.match.duration % 60).toString().padStart(2, '0')}
                      </span>
                      <span className={`font-semibold ${
                        savedMatch.analysis_data.match.radiant_win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {savedMatch.analysis_data.match.radiant_win ? 'Vittoria Radiant' : 'Vittoria Dire'}
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/analysis/match/${savedMatch.match_id}`}
                  className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Vedi Analisi
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

