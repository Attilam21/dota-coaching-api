'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function LearningPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Learning Paths</h1>
          <p className="text-gray-400">Percorsi di apprendimento personalizzati per migliorare le tue skills</p>
        </div>
        
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-200">Learning Paths in Arrivo</h2>
            <p className="text-blue-300 mb-6">
              Stiamo lavorando su percorsi di apprendimento interattivi e moduli di training personalizzati.
            </p>
            <p className="text-blue-400 text-sm mb-6">
              Questa funzionalità ti permetterà di seguire tutorial guidati, completare esercizi pratici e tracciare il tuo progresso di apprendimento.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/dashboard"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Torna al Dashboard
              </Link>
              <Link
                href="/dashboard/coaching-insights"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Vai a Coaching & Insights
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

