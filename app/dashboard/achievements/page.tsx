'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Trophy, Filter, Search } from 'lucide-react'
import AchievementCard from '@/components/gamification/AchievementCard'
import AchievementNotification from '@/components/gamification/AchievementNotification'
import HelpButton from '@/components/HelpButton'

interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
  xpReward: number
  category: string
  unlocked: boolean
  unlockedAt?: string | null
}

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [grouped, setGrouped] = useState<Record<string, Achievement[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/user/achievements', {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error('Failed to fetch achievements')
        }

        const data = await response.json()
        setAchievements(data.achievements || [])
        setGrouped(data.grouped || {})
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load achievements')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAchievements()
    }
  }, [user])

  const categories = Object.keys(grouped)
  const totalUnlocked = achievements.filter(a => a.unlocked).length
  const totalAchievements = achievements.length
  const completionPercentage = totalAchievements > 0 
    ? Math.round((totalUnlocked / totalAchievements) * 100) 
    : 0

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = !selectedCategory || achievement.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleUnlockAchievement = async (achievementId: string) => {
    try {
      const response = await fetch('/api/user/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ achievementId }),
      })

      if (!response.ok) {
        throw new Error('Failed to unlock achievement')
      }

      const data = await response.json()
      
      // Update local state
      setAchievements(prev => 
        prev.map(a => 
          a.id === achievementId 
            ? { ...a, unlocked: true, unlockedAt: data.achievement.unlockedAt }
            : a
        )
      )

      // Show notification
      setNewAchievement(data.achievement)
      setShowNotification(true)

      // Refresh achievements to get updated data
      const refreshResponse = await fetch('/api/user/achievements', {
        credentials: 'include'
      })
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setAchievements(refreshData.achievements || [])
        setGrouped(refreshData.grouped || {})
      }
    } catch (err) {
      console.error('Error unlocking achievement:', err)
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
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Achievements</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">
              {totalUnlocked} / {totalAchievements}
            </div>
            <div className="text-sm text-gray-400">
              {completionPercentage}% Completati
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 transition-all duration-1000"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-400" />
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              selectedCategory === null
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Tutti
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca achievement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento achievements...</p>
        </div>
      ) : (
        <>
          {/* Achievements Grid */}
          {filteredAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  id={achievement.id}
                  name={achievement.name}
                  description={achievement.description}
                  icon={achievement.icon}
                  xpReward={achievement.xpReward}
                  category={achievement.category}
                  unlocked={achievement.unlocked}
                  unlockedAt={achievement.unlockedAt || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                Nessun achievement trovato
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mt-4 text-red-400 hover:text-red-300"
                >
                  Rimuovi filtro categoria
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-red-400 hover:text-red-300"
                >
                  Rimuovi ricerca
                </button>
              )}
            </div>
          )}

          {/* Grouped view (alternative) */}
          {!selectedCategory && !searchQuery && Object.keys(grouped).length > 0 && (
            <div className="mt-12 space-y-8">
              {Object.entries(grouped).map(([category, categoryAchievements]) => (
                <div key={category}>
                  <h2 className="text-2xl font-semibold mb-4 capitalize flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    {category}
                    <span className="text-sm text-gray-400 font-normal">
                      ({categoryAchievements.filter(a => a.unlocked).length} / {categoryAchievements.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryAchievements.map(achievement => (
                      <AchievementCard
                        key={achievement.id}
                        id={achievement.id}
                        name={achievement.name}
                        description={achievement.description}
                        icon={achievement.icon}
                        xpReward={achievement.xpReward}
                        category={achievement.category}
                        unlocked={achievement.unlocked}
                        unlockedAt={achievement.unlockedAt || undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Achievement Notification */}
      {showNotification && newAchievement && (
        <AchievementNotification
          achievement={{
            name: newAchievement.name,
            description: newAchievement.description,
            icon: newAchievement.icon,
            xpReward: newAchievement.xpReward,
            category: newAchievement.category
          }}
          show={showNotification}
          onClose={() => {
            setShowNotification(false)
            setNewAchievement(null)
          }}
        />
      )}
    </div>
  )
}

