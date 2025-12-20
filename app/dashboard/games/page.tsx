'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Zap, Target, Trophy, ArrowLeft } from 'lucide-react'
import SmashGame from '@/components/games/SmashGame'
import HelpButton from '@/components/HelpButton'

type GameType = 'smash' | null

export default function GamesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [selectedGame, setSelectedGame] = useState<GameType>(null)

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

  const games = [
    {
      id: 'smash' as GameType,
      name: 'Smash The Ancient',
      description: 'Distruggi l\'Ancient nemico! Click il più velocemente possibile e crea combo incredibili.',
      icon: Target,
      color: 'from-red-600 to-orange-600',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700',
    },
  ]

  if (selectedGame) {
    return (
      <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900">
        <HelpButton />
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setSelectedGame(null)}
          className="absolute top-4 left-4 z-20 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna ai Giochi</span>
        </motion.button>
        <SmashGame />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <HelpButton />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <Gamepad2 className="w-16 h-16 text-red-500" />
          </motion.div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent">
            GIOCHI
          </h1>
          <p className="text-gray-400 text-lg">
            Divertiti e sfogati con i nostri mini-giochi!
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {games.map((game, index) => {
              const Icon = game.icon
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedGame(game.id)}
                  className={`relative ${game.bgColor} border-2 ${game.borderColor} rounded-xl p-6 cursor-pointer overflow-hidden group`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="mb-4"
                    >
                      <Icon className={`w-16 h-16 mx-auto text-transparent bg-gradient-to-br ${game.color} bg-clip-text`} />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                      {game.name}
                    </h2>
                    
                    <p className="text-gray-400 text-sm text-center mb-4">
                      {game.description}
                    </p>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`inline-flex items-center gap-2 mx-auto bg-gradient-to-r ${game.color} text-white px-6 py-3 rounded-lg font-semibold shadow-lg`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>GIOCA</span>
                    </motion.div>
                  </div>

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-block bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-3">
            <p className="text-gray-400 text-sm">
              Altri giochi in arrivo... 🎮
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

