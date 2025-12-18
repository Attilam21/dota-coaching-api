'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  category: string
  target: string
  current: string
}

interface CoachingData {
  tasks: Task[]
  recommendations: string[]
  summary: {
    totalTasks: number
    highPriority: number
    mediumPriority: number
    lowPriority: number
  }
}

export default function CoachingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [coachingData, setCoachingData] = useState<CoachingData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  const fetchCoaching = useCallback(async () => {
    if (!playerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/player/${playerId}/coaching`)
      if (!response.ok) throw new Error('Failed to fetch coaching data')

      const data = await response.json()
      
      // Initialize tasks with completed: false
      const tasksWithStatus = (data.tasks || []).map((task: Omit<Task, 'completed'>) => ({
        ...task,
        completed: false
      }))
      
      setCoachingData(data)
      setTasks(tasksWithStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coaching data')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (playerId) {
      fetchCoaching()
    }
  }, [playerId, fetchCoaching])

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
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

  if (!playerId) {
    return (
      <PlayerIdInput
        pageTitle="Coaching & Task"
        title="Inserisci Player ID"
        description="Inserisci il tuo Dota 2 Account ID per visualizzare i task di coaching personalizzati. Puoi anche configurarlo nel profilo per salvarlo permanentemente."
      />
    )
  }

  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-4">Coaching & Task</h1>
      <p className="text-gray-400 mb-6">I tuoi obiettivi e task personalizzati basati sulle tue performance</p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento coaching data...</p>
        </div>
      )}

      {coachingData && !loading && (
        <>
          {/* Progress Summary */}
          <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Progresso Task</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Completati</span>
                  <span className="font-semibold">{completedTasks} / {totalTasks}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-red-600 h-4 rounded-full transition-all"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-2xl font-bold">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </div>
            </div>
            {coachingData.summary && (
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-red-400">Alta: {coachingData.summary.highPriority}</span>
                <span className="text-yellow-400">Media: {coachingData.summary.mediumPriority}</span>
                <span className="text-gray-400">Bassa: {coachingData.summary.lowPriority}</span>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {coachingData.recommendations && coachingData.recommendations.length > 0 && (
            <div className="mb-8 bg-blue-900/30 border border-blue-700 rounded-lg p-6">
              <h3 className="text-2xl font-semibold mb-4 text-blue-200">💡 Raccomandazioni Generali</h3>
              <ul className="space-y-2">
                {coachingData.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-blue-300">
                    <span className="text-blue-400 mt-1">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-gray-800 border rounded-lg p-6 ${
                  task.completed ? 'border-green-700 opacity-75' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          task.priority === 'high'
                            ? 'bg-red-600 text-white'
                            : task.priority === 'medium'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                        {task.category}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">{task.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Attuale:</span>
                      <span className="font-semibold text-gray-300">{task.current}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-gray-500">Obiettivo:</span>
                      <span className="font-semibold text-green-400">{task.target}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun task disponibile al momento</p>
        </div>
      )}
    </div>
  )
}
