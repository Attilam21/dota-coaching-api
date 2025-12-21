'use client'

import { Lightbulb } from 'lucide-react'

interface InsightBulbProps {
  title: string
  reason: string
  suggestion?: string
  className?: string
}

/**
 * Micro-coach lampadina seguendo regole ferree:
 * - max 3 righe totali
 * - formato fisso: Titolo, Motivo, Suggerimento
 * - stile discreto (no giallo acceso, no box gigante)
 */
export default function InsightBulb({
  title,
  reason,
  suggestion,
  className = ''
}: InsightBulbProps) {
  return (
    <div className={`bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-500/70 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-gray-400">{reason}</p>
          {suggestion && <p className="text-xs text-gray-300">{suggestion}</p>}
        </div>
      </div>
    </div>
  )
}

