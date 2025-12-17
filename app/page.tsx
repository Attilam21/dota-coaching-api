'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se autenticato, vai al dashboard
        router.push('/dashboard')
      } else {
        // Se non autenticato, vai al login
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  // Mostra loading durante il redirect
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <p className="mt-4 text-gray-400">Caricamento...</p>
      </div>
    </div>
  )
}
