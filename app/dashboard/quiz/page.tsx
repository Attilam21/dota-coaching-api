'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Play, Clock, Target, TrendingUp, Award, X } from 'lucide-react'
import QuizGame from '@/components/quiz/QuizGame'
import HelpButton from '@/components/HelpButton'

interface Question {
  id: string
  question: string
  category: string
  difficulty: string
  answers: string[]
  correct_answer: string
  explanation?: string
  points: number
}

interface QuizResults {
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number
  questions_answered: Array<{
    question_id: string
    answer: string
    correct: boolean
    time_taken: number
  }>
}

interface LeaderboardEntry {
  user_id: string
  email: string
  total_score: number
  games_played: number
  best_score: number
  average_score: number
  perfect_games: number
  streak_days: number
}

export default function QuizPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'results'>('menu')
  const [results, setResults] = useState<QuizResults | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null)
  const [newAchievements, setNewAchievements] = useState<any[]>([])
  const [category, setCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchLeaderboard()
    if (user) {
      fetchUserStats()
    }
  }, [user])

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (category !== 'all') params.append('category', category)
      if (difficulty !== 'all') params.append('difficulty', difficulty)
      params.append('limit', '10')

      const response = await fetch(`/api/quiz/questions?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch questions')

      const data = await response.json()
      setQuestions(data.questions)
      setGameState('playing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [category, difficulty])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/quiz/leaderboard?limit=10')
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  }

  const fetchUserStats = async () => {
    if (!user) return
    try {
      const response = await fetch('/api/quiz/leaderboard?limit=100')
      if (response.ok) {
        const data = await response.json()
        const userEntry = data.leaderboard?.find((entry: LeaderboardEntry) => entry.user_id === user.id)
        setUserStats(userEntry || null)
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err)
    }
  }

  const handleQuizComplete = async (quizResults: QuizResults) => {
    if (!user) {
      setError('Devi essere loggato per salvare i risultati')
      return
    }

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quizResults,
          user_id: user.id, // Pass user ID from authenticated context
        }),
      })

      if (!response.ok) throw new Error('Failed to submit results')

      const data = await response.json()
      setResults(quizResults)
      setNewAchievements(data.new_achievements || [])
      setGameState('results')
      
      // Refresh stats
      fetchLeaderboard()
      fetchUserStats()
    } catch (err) {
      console.error('Failed to submit quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to save results')
    }
  }

  if (authLoading) {
    return (
      <div className="p-4 md:p-6">
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
    <div className="p-4 md:p-6">
      <HelpButton />
      
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                DOTA QUIZ CHALLENGE
              </h1>
              <p className="text-gray-400">Metti alla prova le tue conoscenze su Dota 2!</p>
            </div>

            {/* User Stats */}
            {userStats && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Le Tue Statistiche
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Punteggio Totale</div>
                    <div className="text-2xl font-bold text-yellow-400">{userStats.total_score}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Partite Giocate</div>
                    <div className="text-2xl font-bold text-white">{userStats.games_played}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Miglior Punteggio</div>
                    <div className="text-2xl font-bold text-green-400">{userStats.best_score}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Streak Giorni</div>
                    <div className="text-2xl font-bold text-orange-400">{userStats.streak_days}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quiz Settings */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Impostazioni Quiz</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="all">Tutte le categorie</option>
                    <option value="heroes">Eroi</option>
                    <option value="items">Items</option>
                    <option value="mechanics">Meccaniche</option>
                    <option value="strategy">Strategia</option>
                    <option value="meta">Meta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficoltà</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="all">Tutte le difficoltà</option>
                    <option value="easy">Facile</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difficile</option>
                  </select>
                </div>
              </div>

              <button
                onClick={fetchQuestions}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Caricamento...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Inizia Quiz</span>
                  </>
                )}
              </button>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Leaderboard
                </h2>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.user_id === user.id
                          ? 'bg-red-900/30 border border-red-700'
                          : 'bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 w-6">#{index + 1}</span>
                        <span className="text-white">{entry.email}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-yellow-400 font-bold">{entry.total_score}</span>
                        <span className="text-gray-400 text-sm">{entry.games_played} partite</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </motion.div>
        )}

        {gameState === 'playing' && questions.length > 0 && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuizGame
              questions={questions}
              onComplete={handleQuizComplete}
              onCancel={() => {
                if (confirm('Sei sicuro di voler uscire? Il progresso verrà perso.')) {
                  setGameState('menu')
                  setQuestions([])
                }
              }}
            />
          </motion.div>
        )}

        {gameState === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-2">Quiz Completato!</h2>
              
              <div className="grid grid-cols-3 gap-4 my-6">
                <div>
                  <div className="text-sm text-gray-400">Punteggio</div>
                  <div className="text-3xl font-bold text-yellow-400">{results.score}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Risposte Corrette</div>
                  <div className="text-3xl font-bold text-green-400">
                    {results.correct_answers}/{results.total_questions}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Tempo</div>
                  <div className="text-3xl font-bold text-blue-400">{results.time_taken}s</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-2">Percentuale Corrette</div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-green-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(results.correct_answers / results.total_questions) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="text-2xl font-bold text-green-400 mt-2">
                  {Math.round((results.correct_answers / results.total_questions) * 100)}%
                </div>
              </div>

              {/* New Achievements */}
              {newAchievements.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 justify-center">
                    <Award className="w-5 h-5 text-yellow-400" />
                    Nuovi Achievement Sbloccati!
                  </h3>
                  <div className="space-y-2">
                    {newAchievements.map((achievement, index) => (
                      <div key={index} className="text-yellow-300">
                        🏆 {achievement.achievement_type.replace(/_/g, ' ').toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setGameState('menu')
                    setResults(null)
                    setQuestions([])
                    setNewAchievements([])
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Torna al Menu
                </button>
                <button
                  onClick={() => {
                    setGameState('menu')
                    setResults(null)
                    setQuestions([])
                    setNewAchievements([])
                    fetchQuestions()
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Gioca Ancora
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

