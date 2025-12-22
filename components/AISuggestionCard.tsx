'use client'

import { Lightbulb } from 'lucide-react'
import { AISuggestion } from '@/lib/insight-utils'

interface AISuggestionCardProps {
  suggestion: AISuggestion | null
  isLoading?: boolean
}

export default function AISuggestionCard({ suggestion, isLoading }: AISuggestionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-700/50 rounded w-full mb-3" />
        <div className="h-4 bg-gray-700/50 rounded w-2/3" />
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
        <p className="text-sm text-gray-400">Dati insufficienti per suggerimento IA affidabile</p>
      </div>
    )
  }

  const getConfidenzaColor = (confidenza: string) => {
    switch (confidenza) {
      case 'alta':
        return 'text-green-400'
      case 'media':
        return 'text-yellow-400'
      case 'bassa':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-200">Suggerimento IA</h3>
        <span className={`text-xs ${getConfidenzaColor(suggestion.confidenza)} ml-auto`}>
          Confidenza: {suggestion.confidenza}
        </span>
      </div>
      
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-semibold text-gray-300">PROBLEMA: </span>
          <span className="text-gray-200">{suggestion.problema}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-300">AZIONE: </span>
          <span className="text-gray-200">{suggestion.azione}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-300">IMPATTO: </span>
          <span className="text-gray-200">{suggestion.impatto}</span>
        </div>
      </div>
    </div>
  )
}

