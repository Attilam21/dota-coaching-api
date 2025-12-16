'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VisionControlPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Vision & Map Control</h1>
      <p className="text-gray-400 mb-6">
        Controllo mappa e visione: wards piazzate/rimosse, heatmap posizioni, map control.
      </p>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 mb-4">Questa funzionalità è in sviluppo</p>
        <Link
          href="/dashboard/advanced"
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Torna alle Analisi Avanzate
        </Link>
      </div>
    </div>
  )
}

