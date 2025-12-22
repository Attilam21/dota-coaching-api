'use client'

import { useState } from 'react'
import { BulbInsight } from '@/lib/insight-utils'
import { Lightbulb, X } from 'lucide-react'
import { useModal } from '@/lib/modal-context'

interface InsightBulbsProps {
  insights: BulbInsight[]
  isLoading?: boolean
}

export default function InsightBulbs({ insights, isLoading }: InsightBulbsProps) {
  const { openModalId, setOpenModalId } = useModal()
  const [selectedInsight, setSelectedInsight] = useState<BulbInsight | null>(null)

  if (isLoading) {
    return (
      <div className="flex gap-4 flex-wrap">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-14 w-14 bg-gray-700/50 rounded-full animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-400">Dati insufficienti per insight affidabili</p>
      </div>
    )
  }

  const getBulbColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'bg-red-600 hover:bg-red-500 border-red-500 text-white'
      case 'bottleneck':
        return 'bg-yellow-600 hover:bg-yellow-500 border-yellow-500 text-white'
      case 'strength':
        return 'bg-green-600 hover:bg-green-500 border-green-500 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'risk':
        return 'Rischio'
      case 'bottleneck':
        return 'Collo di Bottiglia'
      case 'strength':
        return 'Forza'
      default:
        return 'Insight'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'from-red-900/50 to-red-800/50 border-red-700 text-red-200'
      case 'bottleneck':
        return 'from-yellow-900/50 to-yellow-800/50 border-yellow-700 text-yellow-200'
      case 'strength':
        return 'from-green-900/50 to-green-800/50 border-green-700 text-green-200'
      default:
        return 'from-blue-900/50 to-blue-800/50 border-blue-700 text-blue-200'
    }
  }

  const handleBulbClick = (insight: BulbInsight) => {
    setSelectedInsight(insight)
    setOpenModalId(`insight-bulb-${insight.type}-${insight.text}`)
  }

  const handleClose = () => {
    setOpenModalId(null)
    setSelectedInsight(null)
  }

  const modalId = selectedInsight ? `insight-bulb-${selectedInsight.type}-${selectedInsight.text}` : null
  const isOpen = openModalId === modalId

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        {insights.map((insight, idx) => (
          <button
            key={idx}
            onClick={() => handleBulbClick(insight)}
            className={`${getBulbColor(insight.type)} border-2 rounded-full h-14 w-14 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            title={`Clicca per dettagli: ${insight.text}`}
            aria-label={`Mostra dettagli insight: ${insight.text}`}
          >
            <Lightbulb className="w-6 h-6" />
          </button>
        ))}
      </div>

      {/* Modal */}
      {isOpen && selectedInsight && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-lg w-full max-h-[70vh] overflow-hidden flex flex-col shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className={`bg-gradient-to-r ${getTypeColor(selectedInsight.type)} border-b border-gray-700 p-4 flex items-center justify-between flex-shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className={`${getBulbColor(selectedInsight.type)} rounded-full h-10 w-10 flex items-center justify-center`}>
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{getTypeLabel(selectedInsight.type)}</h2>
                    <p className="text-xs opacity-80">Insight Deterministico</p>
                  </div>
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
              <div className="overflow-y-auto p-6 flex-1">
                <div className="space-y-4">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 text-base leading-relaxed font-medium">
                      {selectedInsight.text}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>
                      <strong className="text-gray-300">Tipo:</strong> {getTypeLabel(selectedInsight.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Questo insight è generato automaticamente basandosi sui tuoi dati statistici e confronti con la meta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-900/50 border-t border-gray-700 p-4 flex justify-end flex-shrink-0">
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

