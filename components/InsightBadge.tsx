'use client'

import { useState } from 'react'

interface InsightBadgeProps {
  elementType: string
  elementId: string
  contextData: any
  playerId: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export default function InsightBadge({ 
  elementType, 
  elementId, 
  contextData, 
  playerId,
  position = 'top-right'
}: InsightBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  }

  const fetchInsight = async () => {
    // If we already have a valid insight, just open the modal
    if (insight) {
      setIsOpen(true)
      return
    }
    
    // If modal is already open (showing error or loading), don't refetch
    if (isOpen) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/insights/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          elementType,
          elementId,
          contextData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insight')
      }

      const data = await response.json()
      
      // Check if insight exists and is not empty
      if (!data.insight || typeof data.insight !== 'string' || data.insight.trim() === '') {
        throw new Error('Il suggerimento generato è vuoto o non valido')
      }
      
      setInsight(data.insight)
      setIsOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insight')
      setIsOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={fetchInsight}
        disabled={loading}
        className={`absolute ${positionClasses[position]} z-20 w-7 h-7 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-full flex items-center justify-center text-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Ottieni suggerimento AI"
        aria-label="Mostra suggerimento AI"
      >
        {loading ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-xs font-bold">💡</span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-gray-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <h2 className="text-xl font-bold text-white">Suggerimento AI</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                  aria-label="Chiudi"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-400">Generazione suggerimento...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                    <p className="font-semibold mb-2">Errore nel generare il suggerimento</p>
                    <p>{error}</p>
                  </div>
                ) : insight ? (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                      {insight}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg">
                    <p>Nessun suggerimento disponibile. Riprova più tardi.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-900/50 border-t border-gray-700 p-4 flex justify-end">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // Reset error when closing modal to allow retry
                    if (error) {
                      setError(null)
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

