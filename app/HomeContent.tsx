'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function HomeContent() {
  const [matchId, setMatchId] = useState('')
  const [accountId, setAccountId] = useState('')
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleMatchAnalysis = (e: React.FormEvent) => {
    e.preventDefault()
    if (matchId) {
      router.push(`/analysis/match/${matchId}`)
    }
  }

  const handlePlayerAnalysis = (e: React.FormEvent) => {
    e.preventDefault()
    if (accountId && accountId.trim()) {
      router.push(`/analysis/player/${accountId.trim()}`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Improve Your Dota 2 Skills
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered match analysis, personalized learning paths, and performance tracking
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => router.push('/auth/signup')}
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Get Started Free
          </button>
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Match Analysis</h3>
          <p className="text-gray-600">
            Deep dive into your matches with AI-powered insights on farm efficiency, positioning, and decision-making.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">Learning Paths</h3>
          <p className="text-gray-600">
            Personalized training modules tailored to your skill level and role preferences.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold mb-2">Gamification</h3>
          <p className="text-gray-600">
            Track your progress with XP, achievements, and compete in community challenges.
          </p>
        </div>
      </div>

      {/* Quick Analysis Forms */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Match Analysis Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Analyze Match</h2>
          <form onSubmit={handleMatchAnalysis} className="space-y-4">
            <div>
              <label htmlFor="matchId" className="block text-sm font-medium text-gray-700 mb-2">
                Match ID
              </label>
              <input
                id="matchId"
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="e.g., 8576841486"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Analyze Match
            </button>
          </form>
        </div>

        {/* Player Analysis Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Player Stats</h2>
          <form onSubmit={handlePlayerAnalysis} className="space-y-4">
            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
                Account ID
              </label>
              <input
                id="accountId"
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g., 123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              View Player Stats
            </button>
          </form>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="mt-16 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Game?</h2>
        <p className="text-xl text-red-100 mb-6">
          Start analyzing your matches and tracking your performance today
        </p>
        <button 
          onClick={() => router.push('/auth/signup')}
          className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Create Free Account
        </button>
      </div>
    </div>
  )
}
