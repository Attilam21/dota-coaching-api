'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Trophy, Zap, ArrowRight } from 'lucide-react'

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

interface QuizGameProps {
  questions: Question[]
  onComplete: (results: {
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
  }) => void
  onCancel?: () => void
}

export default function QuizGame({ questions, onComplete, onCancel }: QuizGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30) // 30 secondi per domanda
  const [totalTime, setTotalTime] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState<Array<{
    question_id: string
    answer: string
    correct: boolean
    time_taken: number
  }>>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  const currentQuestion = questions[currentQuestionIndex]

  // Timer countdown
  useEffect(() => {
    if (showResult || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAnswer(null, true) // Timeout - risposta sbagliata
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestionIndex, showResult, currentQuestion])

  // Reset timer when new question
  useEffect(() => {
    if (currentQuestion) {
      setTimeRemaining(30)
      setQuestionStartTime(Date.now())
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }, [currentQuestionIndex, currentQuestion])

  const handleAnswer = useCallback((answer: string | null, isTimeout: boolean = false) => {
    if (showResult) return

    const answerTime = Math.floor((Date.now() - questionStartTime) / 1000)
    const correct = answer === currentQuestion.correct_answer
    const pointsEarned = correct ? currentQuestion.points : 0
    const timeBonus = correct && answerTime < 10 ? Math.floor((10 - answerTime) * 2) : 0 // Bonus per velocità
    const totalPoints = pointsEarned + timeBonus

    setSelectedAnswer(answer || '')
    setIsCorrect(correct)
    setShowResult(true)
    setScore((prev) => prev + totalPoints)

    setQuestionsAnswered((prev) => [
      ...prev,
      {
        question_id: currentQuestion.id,
        answer: answer || '',
        correct,
        time_taken: answerTime,
      },
    ])

    // Auto-advance dopo 2 secondi
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
      } else {
        // Quiz completato
        onComplete({
          score: score + totalPoints,
          total_questions: questions.length,
          correct_answers: questionsAnswered.filter((q) => q.correct).length + (correct ? 1 : 0),
          time_taken: totalTime + answerTime,
          questions_answered: [
            ...questionsAnswered,
            {
              question_id: currentQuestion.id,
              answer: answer || '',
              correct,
              time_taken: answerTime,
            },
          ],
        })
      }
    }, 2000)
  }, [currentQuestion, showResult, currentQuestionIndex, questions.length, score, questionsAnswered, totalTime, questionStartTime, onComplete])

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento domande...</p>
        </div>
      </div>
    )
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500',
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Domanda {currentQuestionIndex + 1} di {questions.length}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${difficultyColors[currentQuestion.difficulty as keyof typeof difficultyColors] || 'bg-gray-500'} text-white`}>
              {currentQuestion.difficulty.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{currentQuestion.category}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-yellow-400">{score}</span>
            <span className="text-gray-400">punti</span>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-red-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6"
        >
          {/* Timer */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
              <span className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-red-400' : 'text-gray-300'}`}>
                {timeRemaining}s
              </span>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Esci
              </button>
            )}
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-white mb-6">{currentQuestion.question}</h2>

          {/* Answers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = selectedAnswer === answer
              const isCorrectAnswer = answer === currentQuestion.correct_answer
              const showCorrect = showResult && isCorrectAnswer
              const showWrong = showResult && isSelected && !isCorrect

              return (
                <motion.button
                  key={index}
                  onClick={() => !showResult && handleAnswer(answer)}
                  disabled={showResult}
                  className={`
                    relative p-4 rounded-lg text-left transition-all
                    ${showResult
                      ? showCorrect
                        ? 'bg-green-600 border-2 border-green-400'
                        : showWrong
                        ? 'bg-red-600 border-2 border-red-400'
                        : isSelected
                        ? 'bg-gray-700 border-2 border-gray-500'
                        : 'bg-gray-700 border border-gray-600'
                      : isSelected
                      ? 'bg-red-600 border-2 border-red-400'
                      : 'bg-gray-700 border border-gray-600 hover:border-red-500 hover:bg-gray-750'
                    }
                    ${!showResult && 'cursor-pointer'}
                  `}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{answer}</span>
                    {showResult && (
                      <AnimatePresence>
                        {showCorrect && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                          >
                            <CheckCircle2 className="w-6 h-6 text-green-300" />
                          </motion.div>
                        )}
                        {showWrong && (
                          <motion.div
                            initial={{ scale: 0, rotate: 180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                          >
                            <XCircle className="w-6 h-6 text-red-300" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Explanation */}
          {showResult && currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg"
            >
              <p className="text-sm text-blue-200">
                <strong>Spiegazione:</strong> {currentQuestion.explanation}
              </p>
            </motion.div>
          )}

          {/* Result Feedback */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                isCorrect ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
              }`}
            >
              {isCorrect ? (
                <>
                  <Zap className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-green-300 font-semibold">Corretto! +{currentQuestion.points} punti</p>
                    {timeRemaining > 20 && (
                      <p className="text-green-400 text-xs">Bonus velocità: +{Math.floor((30 - (30 - timeRemaining)) * 2)} punti</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  <p className="text-red-300 font-semibold">Sbagliato! La risposta corretta era: {currentQuestion.correct_answer}</p>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

