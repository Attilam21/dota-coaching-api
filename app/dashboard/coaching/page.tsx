'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

export default function CoachingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    // Load sample tasks (in real app, these would come from database)
    setTasks([
      {
        id: '1',
        title: 'Migliora il farm rate',
        description: 'Aumenta il tuo GPM medio a 550+ nelle prossime 5 partite',
        completed: false,
        priority: 'high',
      },
      {
        id: '2',
        title: 'Riduci le morti',
        description: 'Mantieni le morti sotto 5 per partita nelle prossime 3 partite',
        completed: false,
        priority: 'high',
      },
      {
        id: '3',
        title: 'Esplora nuovi heroes',
        description: 'Prova almeno 3 heroes diversi nella tua role principale',
        completed: false,
        priority: 'medium',
      },
    ])
  }, [user, authLoading, router])

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  if (authLoading) {
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

  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Coaching & Task</h1>
      <p className="text-gray-400 mb-6">I tuoi obiettivi e task personalizzati per migliorare</p>

      {/* Progress Summary */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Progresso Task</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Completati</span>
              <span className="font-semibold">{completedTasks} / {totalTasks}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-red-600 h-4 rounded-full transition-all"
                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="text-2xl font-bold">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </div>
        </div>
      </div>

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
                </div>
                <p className="text-gray-400">{task.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nessun task disponibile al momento</p>
        </div>
      )}
    </div>
  )
}

