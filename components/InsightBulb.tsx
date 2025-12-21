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
  const isCompact = className.includes('p-2')
  
  return (
    <div className={`bg-gray-800/50 border border-gray-700/50 rounded-lg ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
      <div className={`flex items-start ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
        <Lightbulb className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-yellow-500/70 flex-shrink-0 mt-0.5`} />
        <div className={`flex-1 ${isCompact ? 'space-y-0.5' : 'space-y-1'}`}>
          <p className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-white`}>{title}</p>
          <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-400`}>{reason}</p>
          {suggestion && <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-300`}>{suggestion}</p>}
        </div>
      </div>
    </div>
  )
}

