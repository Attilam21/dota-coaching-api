'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MatchAnalysisRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to matches page (which now shows the list of matches)
    router.replace('/dashboard/matches')
  }, [router])

  return (
    <div className="p-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <p className="mt-4 text-gray-400">Reindirizzamento...</p>
      </div>
    </div>
  )
}
