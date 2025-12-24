'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sword, Shield, CheckCircle, XCircle, RotateCcw, Trophy, Zap } from 'lucide-react'

interface Hero {
  id: number
  name: string
  localized_name: string
  primary_attr: string
  roles: string[]
}

export default function HeroMatchupGame() {
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [currentHero, setCurrentHero] = useState<Hero | null>(null)
  const [options, setOptions] = useState<Hero[]>([])
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [showResult, setShowResult] = useState(false)

  // Load heroes on mount
  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await fetch('/api/opendota/heroes')
        if (response.ok) {
          const data = await response.json()
          // Filter out invalid heroes and map the data
          const validHeroes: Hero[] = data
            .filter((h: any) => h.id && h.localized_name && h.primary_attr)
            .map((h: any) => ({
              id: h.id,
              name: h.name,
              localized_name: h.localized_name,
              primary_attr: h.primary_attr || 'all',
              roles: h.roles || [],
            }))
          setHeroes(validHeroes)
        }
      } catch (error) {
        console.error('Error fetching heroes:', error)
      }
    }
    fetchHeroes()
  }, [])

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, timeLeft])

  // Simple matchup logic: returns true if hero1 beats hero2
  const heroBeatsHero = useCallback((hero1: Hero, hero2: Hero): boolean => {
    // Simple logic based on attributes (rock-paper-scissors style)
    const attrMatchup: Record<string, string[]> = {
      'str': ['int'], // Strength beats Intelligence
      'int': ['agi'], // Intelligence beats Agility
      'agi': ['str'], // Agility beats Strength
      'all': [], // Universal heroes are neutral
    }

    // Check attribute advantage
    if (hero1.primary_attr !== 'all' && hero2.primary_attr !== 'all') {
      const hero1Advantages = attrMatchup[hero1.primary_attr] || []
      if (hero1Advantages.includes(hero2.primary_attr)) {
        return true
      }
    }

    // If same attribute, check roles (Carry beats Support, Support beats Nuker, etc.)
    if (hero1.roles.length > 0 && hero2.roles.length > 0) {
      const roleHierarchy: Record<string, string[]> = {
        'Carry': ['Support', 'Nuker'],
        'Support': ['Nuker', 'Durable'],
        'Nuker': ['Durable', 'Escape'],
        'Durable': ['Carry'],
      }

      for (const role of hero1.roles) {
        if (roleHierarchy[role]?.some((beats) => hero2.roles.includes(beats))) {
          return true
        }
      }
    }

    // Fallback: random but consistent (based on ID)
    return hero1.id % 3 > hero2.id % 3
  }, [])

  const generateQuestion = useCallback(() => {
    if (heroes.length < 5) return

    // Pick a random hero to be the target
    const randomIndex = Math.floor(Math.random() * heroes.length)
    const targetHero = heroes[randomIndex]
    setCurrentHero(targetHero)

    // Find heroes that beat the target
    const counters = heroes.filter((h) => h.id !== targetHero.id && heroBeatsHero(h, targetHero))

    // Pick 4 options: 1 correct answer and 3 random incorrect
    const correct = counters.length > 0 
      ? counters[Math.floor(Math.random() * counters.length)]
      : heroes.filter((h) => h.id !== targetHero.id)[Math.floor(Math.random() * (heroes.length - 1))]

    const incorrect = heroes
      .filter((h) => h.id !== targetHero.id && h.id !== correct.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const shuffled = [correct, ...incorrect].sort(() => Math.random() - 0.5)
    setOptions(shuffled)
    setCorrectAnswer(correct.id)
    setSelectedAnswer(null)
    setShowResult(false)
  }, [heroes, heroBeatsHero])

  const handleAnswer = (heroId: number) => {
    if (selectedAnswer !== null || !isPlaying) return

    setSelectedAnswer(heroId)
    setShowResult(true)

    if (heroId === correctAnswer) {
      setScore((prev) => prev + (streak + 1) * 10) // Bonus per streak
      setStreak((prev) => {
        const newStreak = prev + 1
        if (newStreak > maxStreak) {
          setMaxStreak(newStreak)
        }
        return newStreak
      })
    } else {
      setStreak(0)
    }

    // Next question after 1.5 seconds
    setTimeout(() => {
      if (isPlaying) {
        setRound((prev) => prev + 1)
        generateQuestion()
      }
    }, 1500)
  }

  const startGame = () => {
    setScore(0)
    setRound(0)
    setTimeLeft(30)
    setStreak(0)
    setMaxStreak(0)
    setIsPlaying(true)
    generateQuestion()
  }

  const resetGame = () => {
    setIsPlaying(false)
    setScore(0)
    setRound(0)
    setTimeLeft(30)
    setStreak(0)
    setMaxStreak(0)
    setCurrentHero(null)
    setOptions([])
    setSelectedAnswer(null)
    setCorrectAnswer(null)
    setShowResult(false)
  }

  const getHeroImageUrl = (heroName: string) => {
    if (!heroName) return ''
    
    // Remove "npc_dota_hero_" prefix if present and normalize
    let imageName = heroName.toLowerCase().replace(/^npc_dota_hero_/, '')
    
    // Clean up any remaining invalid characters (keep underscores)
    // Note: CDN uses underscores and lowercase letters/numbers only
    imageName = imageName.replace(/[^a-z0-9_]/g, '')
    
    if (!imageName) return ''
    
    // Use _full.png for large hero images in the game
    // Use cdn.cloudflare.steamstatic.com for better SSL support
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${imageName}_full.png`
  }

  const finalScore = score + (maxStreak * 50) + (round * 5)

  if (heroes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-400">Caricamento eroi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Stats Panel */}
      {isPlaying && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Score</div>
              <div className="text-2xl font-bold text-yellow-400">{score.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Round</div>
              <div className="text-2xl font-bold text-blue-400">{round}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Streak</div>
              <div className={`text-2xl font-bold ${streak > 5 ? 'text-purple-400 animate-pulse' : 'text-green-400'}`}>
                {streak}x
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Time</div>
              <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      {!isPlaying ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8"
          >
            <div className="text-8xl mb-4">⚔️</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
              HERO MATCHUP
            </h1>
            <p className="text-gray-400 text-lg mb-2">Indovina quale eroe batte l'avversario!</p>
            <p className="text-gray-500 text-sm">Hai 30 secondi per rispondere correttamente</p>
          </motion.div>

          {score > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 bg-gray-800/90 border border-gray-700 rounded-lg"
            >
              <div className="text-3xl font-bold text-yellow-400 mb-2">Score Finale: {finalScore.toLocaleString()}</div>
              <div className="text-gray-400">
                Round: {round} • Max Streak: {maxStreak}x • Score Base: {score}
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Sword className="w-6 h-6" />
            {score > 0 ? 'RIGIOCA' : 'INIZIA'}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-4xl mx-auto z-10"
        >
          {/* Question Hero */}
          {currentHero && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-300 mb-4">
                Quale eroe batte
              </h2>
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block"
              >
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-xl p-6 inline-block">
                  <img
                    src={getHeroImageUrl(currentHero.name)}
                    alt={currentHero.localized_name}
                    className="w-32 h-32 mx-auto mb-3 rounded-lg"
                    onError={(e) => {
                      // Fallback se l'immagine non carica
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'block'
                      }
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-6xl mb-3">⚔️</div>
                  <h3 className="text-2xl font-bold text-white">{currentHero.localized_name}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {currentHero.primary_attr.toUpperCase()} • {currentHero.roles.slice(0, 2).join(', ')}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Answer Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {options.map((hero, index) => {
                const isSelected = selectedAnswer === hero.id
                const isCorrect = hero.id === correctAnswer
                const showFeedback = showResult && isSelected

                return (
                  <motion.button
                    key={hero.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={!showResult ? { scale: 1.05 } : {}}
                    whileTap={!showResult ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(hero.id)}
                    disabled={showResult}
                    className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 rounded-xl p-4 transition-all ${
                      showResult && isCorrect
                        ? 'border-green-500 bg-green-900/30'
                        : showResult && isSelected && !isCorrect
                        ? 'border-red-500 bg-red-900/30'
                        : 'border-gray-700 hover:border-blue-500'
                    } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {showFeedback && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.5 }}
                        className="absolute -top-3 -right-3 z-20"
                      >
                        {isCorrect ? (
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-400" />
                        )}
                      </motion.div>
                    )}

                    <img
                      src={getHeroImageUrl(hero.name)}
                      alt={hero.localized_name}
                      className="w-20 h-20 mx-auto mb-2 rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'block'
                        }
                      }}
                    />
                    <div style={{ display: 'none' }} className="text-4xl mb-2">🛡️</div>
                    <p className="text-sm font-semibold text-white">{hero.localized_name}</p>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Streak indicator */}
          {streak > 3 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="mt-6 text-center"
            >
              <div className={`text-4xl font-bold ${streak > 7 ? 'text-purple-400' : 'text-yellow-400'} drop-shadow-lg`}>
                🔥 {streak}x STREAK! 🔥
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Reset button (when playing) */}
      {isPlaying && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={resetGame}
          className="absolute bottom-4 right-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white p-3 rounded-lg transition-colors z-20"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  )
}

