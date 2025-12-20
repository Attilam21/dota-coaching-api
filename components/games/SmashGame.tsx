'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Trophy, RotateCcw, Sparkles } from 'lucide-react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
}

export default function SmashGame() {
  const [clicks, setClicks] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [isExploding, setIsExploding] = useState(false)

  // Timer countdown
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

  // Reset combo after 1 second of no clicks
  useEffect(() => {
    if (!isPlaying) return

    const comboTimeout = setTimeout(() => {
      if (combo > maxCombo) {
        setMaxCombo(combo)
      }
      setCombo(0)
    }, 1000)

    return () => clearTimeout(comboTimeout)
  }, [clicks, combo, maxCombo, isPlaying])

  const createParticles = useCallback((x: number, y: number, count: number = 15) => {
    const newParticles: Particle[] = []
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#3b82f6']
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 8 + Math.random() * 4
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
      })
    }
    
    setParticles((prev) => [...prev, ...newParticles])
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setClicks((prev) => prev + 1)
    
    // Combo system
    const now = Date.now()
    if (now - lastClickTime < 500) {
      setCombo((prev) => prev + 1)
    } else {
      setCombo(1)
    }
    setLastClickTime(now)

    // Create particles
    createParticles(x, y, combo > 5 ? 25 : 15)

    // Explosion effect for high combos
    if (combo > 10 && !isExploding) {
      setIsExploding(true)
      setTimeout(() => setIsExploding(false), 400)
      // Extra particles for mega combo
      if (combo > 15) {
        createParticles(x, y, 40)
      }
    }
  }, [isPlaying, lastClickTime, combo, createParticles, isExploding])

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.3, // gravity
            size: p.size * 0.98,
          }))
          .filter((p) => p.size > 0.5 && p.y < window.innerHeight)
      )
    }, 16)

    return () => clearInterval(interval)
  }, [particles.length])

  const startGame = () => {
    setClicks(0)
    setTimeLeft(30)
    setCombo(0)
    setMaxCombo(0)
    setParticles([])
    setIsPlaying(true)
  }

  const resetGame = () => {
    setIsPlaying(false)
    setClicks(0)
    setTimeLeft(30)
    setCombo(0)
    setMaxCombo(0)
    setParticles([])
  }

  const cps = timeLeft > 0 && isPlaying ? (clicks / (30 - timeLeft)) : 0
  const score = clicks * 10 + (maxCombo * 50)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{
                left: 0,
                top: 0,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Stats Panel */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Clicks</div>
            <div className="text-2xl font-bold text-red-400">{clicks.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">CPS</div>
            <div className="text-2xl font-bold text-yellow-400">{cps.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Combo</div>
            <div className={`text-2xl font-bold ${combo > 10 ? 'text-purple-400 animate-pulse' : 'text-blue-400'}`}>
              {combo}x
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
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8"
          >
            <div className="text-8xl mb-4">⚔️</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent mb-4">
              SMASH THE ANCIENT
            </h1>
            <p className="text-gray-400 text-lg mb-2">Distruggi l'Ancient nemico!</p>
            <p className="text-gray-500 text-sm">Click il più velocemente possibile per 30 secondi</p>
          </motion.div>

          {clicks > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 bg-gray-800/90 border border-gray-700 rounded-lg"
            >
              <div className="text-3xl font-bold text-yellow-400 mb-2">Score: {score.toLocaleString()}</div>
              <div className="text-gray-400">
                Clicks: {clicks.toLocaleString()} • Max Combo: {maxCombo}x • CPS: {cps.toFixed(1)}
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Zap className="w-6 h-6" />
            {clicks > 0 ? 'RIGIOCA' : 'INIZIA'}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full flex items-center justify-center z-10"
        >
          <div
            onClick={handleClick}
            className="relative cursor-crosshair select-none w-full max-w-4xl aspect-square flex items-center justify-center"
          >
            {/* Explosion overlay for high combos */}
            <AnimatePresence>
              {isExploding && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 2 }}
                  exit={{ opacity: 0, scale: 3 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Ancient Target */}
            <motion.div
              animate={{
                scale: isExploding ? [1, 1.3, 1] : [1, 1.05, 1],
                rotate: isExploding ? [0, 10, -10, 0] : [0, 2, -2, 0],
              }}
              transition={{
                duration: isExploding ? 0.3 : 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 blur-3xl bg-red-500/30 rounded-full animate-pulse" />
              
              {/* Main target */}
              <motion.div 
                className="relative bg-gradient-to-br from-red-900 via-red-800 to-orange-900 rounded-full border-4 border-red-600 shadow-2xl"
                style={{
                  width: '300px',
                  height: '300px',
                  boxShadow: '0 0 60px rgba(239, 68, 68, 0.6), inset 0 0 60px rgba(0, 0, 0, 0.5)',
                }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* Pulsing glow rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-500/50"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-orange-500/30"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />

                {/* Ancient structure details */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="text-8xl"
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🏛️
                  </motion.div>
                </div>
                
                {/* Cracks effect on click */}
                <AnimatePresence>
                  {isExploding && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        exit={{ opacity: 0, scale: 2 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="text-9xl text-red-600/70 drop-shadow-2xl">💥</div>
                      </motion.div>
                      {/* Shockwave */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-full border-4 border-yellow-400"
                      />
                    </>
                  )}
                </AnimatePresence>

                {/* Combo indicator */}
                {combo > 5 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2"
                  >
                    <div className={`text-4xl font-bold ${combo > 10 ? 'text-purple-400' : 'text-yellow-400'} drop-shadow-lg`}>
                      {combo}x COMBO!
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Click hint */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm"
            >
              👆 CLICCA QUI!
            </motion.div>
          </div>
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

      {/* Combo multiplier effect */}
      {combo > 10 && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ 
            scale: [1.2, 1.5, 1.2],
            opacity: [1, 0.8, 1],
            rotate: 0
          }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{
            scale: { duration: 0.5, repeat: Infinity },
            opacity: { duration: 0.5, repeat: Infinity }
          }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
        >
          <div className="text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
            MEGA COMBO!
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-3xl" />
        </motion.div>
      )}
    </div>
  )
}

