'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { useModal } from '@/lib/modal-context'

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
  // Create unique modal ID from elementType and elementId
  const modalId = `insight-${elementType}-${elementId}`
  const { openModalId, setOpenModalId } = useModal()
  const isOpen = openModalId === modalId
  
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Close modal when another one opens
  useEffect(() => {
    if (openModalId && openModalId !== modalId) {
      // Another modal opened, reset our state
      setInsight(null)
      setError(null)
      setLoading(false)
    }
  }, [openModalId, modalId])

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  }

  const fetchInsight = async () => {
    // If we already have a valid insight, just open the modal
    if (insight) {
      setOpenModalId(modalId)
      return
    }
    
    // If modal is already open (showing error or loading), don't refetch
    if (isOpen) {
      return
    }

    // Close any other open modal first
    setOpenModalId(modalId)

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

      const data = await response.json()

      // Handle API errors gracefully
      if (!response.ok) {
        // Use user-friendly message from API if available
        const errorMessage = data.message || data.error || 'Errore nel generare il suggerimento'
        const errorCode = data.code || 'UNKNOWN_ERROR'
        
        // Special handling for API keys missing (503 Service Unavailable)
        if (response.status === 503 && (errorCode === 'API_KEYS_MISSING' || errorCode === 'AI_SERVICE_ERROR')) {
          throw new Error('SERVICE_UNAVAILABLE')
        }
        
        throw new Error(errorMessage)
      }
      
      // Check if insight exists and is not empty
      if (!data.insight || typeof data.insight !== 'string' || data.insight.trim() === '') {
        throw new Error('Il suggerimento generato è vuoto o non valido')
      }
      
      setInsight(data.insight)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load insight'
      
      // Provide user-friendly error messages
      if (errorMessage === 'SERVICE_UNAVAILABLE') {
        setError('Il servizio AI non è disponibile al momento. La funzionalità di suggerimenti richiede la configurazione delle chiavi API.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpenModalId(null)
    // Reset error when closing modal to allow retry
    if (error) {
      setError(null)
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
          <Lightbulb className="w-3.5 h-3.5" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-xl w-full max-h-[70vh] overflow-hidden flex flex-col shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Suggerimento AI</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-4 flex-1">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-400">Generazione suggerimento...</p>
                  </div>
                ) : error ? (
                  <div className="space-y-3">
                    <div className={`${error.includes('non è disponibile') ? 'bg-yellow-900/50 border-yellow-700 text-yellow-200' : 'bg-red-900/50 border-red-700 text-red-200'} border px-4 py-3 rounded-lg`}>
                      <p className="font-semibold mb-2">
                        {error.includes('non è disponibile') ? 'Servizio non disponibile' : 'Errore nel generare il suggerimento'}
                      </p>
                      <p className="text-sm">{error}</p>
                    </div>
                    {error.includes('non è disponibile') && (
                      <div className="bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-lg">
                        <p className="text-xs text-gray-400">
                          💡 Questa funzionalità richiede la configurazione delle chiavi API (GEMINI_API_KEY o OPENAI_API_KEY) nel server.
                        </p>
                      </div>
                    )}
                  </div>
                ) : insight ? (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {insight}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg">
                    <p className="text-sm">Nessun suggerimento disponibile. Riprova più tardi.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-900/50 border-t border-gray-700 p-3 flex justify-end flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
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

