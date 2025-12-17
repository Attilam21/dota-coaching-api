/**
 * Componente Skeleton Loader riutilizzabile
 * Fornisce placeholder animati durante il caricamento dei dati
 */

interface SkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'chart' | 'list' | 'avatar'
  lines?: number
  className?: string
  width?: string
  height?: string
}

export default function SkeletonLoader({ 
  variant = 'text', 
  lines = 1, 
  className = '',
  width,
  height 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-700 rounded'
  
  switch (variant) {
    case 'text':
      return (
        <div className={className}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseClasses} h-4 mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
              style={width ? { width } : undefined}
            />
          ))}
        </div>
      )
    
    case 'card':
      return (
        <div className={`${baseClasses} ${className}`} style={{ width, height: height || '200px' }}>
          <div className="p-6 space-y-4">
            <div className={`${baseClasses} h-6 w-3/4`} />
            <div className={`${baseClasses} h-4 w-full`} />
            <div className={`${baseClasses} h-4 w-5/6`} />
            <div className="flex gap-4 mt-4">
              <div className={`${baseClasses} h-8 w-20`} />
              <div className={`${baseClasses} h-8 w-20`} />
            </div>
          </div>
        </div>
      )
    
    case 'table':
      return (
        <div className={className}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b border-gray-700">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`${baseClasses} h-4 flex-1`} />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: lines }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex gap-4 py-2">
                {Array.from({ length: 5 }).map((_, colIdx) => (
                  <div key={colIdx} className={`${baseClasses} h-4 flex-1`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'chart':
      return (
        <div className={`${baseClasses} ${className}`} style={{ width, height: height || '300px' }}>
          <div className="p-6 space-y-4">
            <div className={`${baseClasses} h-6 w-1/2 mb-6`} />
            {/* Chart area with bars/lines simulation */}
            <div className="flex items-end justify-between h-48 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`${baseClasses} flex-1`}
                  style={{ height: `${Math.random() * 60 + 30}%` }}
                />
              ))}
            </div>
            <div className="flex gap-4 mt-4">
              <div className={`${baseClasses} h-4 w-20`} />
              <div className={`${baseClasses} h-4 w-20`} />
            </div>
          </div>
        </div>
      )
    
    case 'list':
      return (
        <div className={className}>
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-700">
              <div className={`${baseClasses} h-10 w-10 rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${baseClasses} h-4 w-3/4`} />
                <div className={`${baseClasses} h-3 w-1/2`} />
              </div>
              <div className={`${baseClasses} h-6 w-16`} />
            </div>
          ))}
        </div>
      )
    
    case 'avatar':
      return (
        <div className={`${baseClasses} rounded-full ${className}`} style={{ width, height: height || width || '40px' }} />
      )
    
    default:
      return <div className={`${baseClasses} ${className}`} style={{ width, height }} />
  }
}

/**
 * Skeleton specifici per sezioni comuni
 */

export function MatchCardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-700 rounded w-1/3" />
        <div className="h-6 bg-gray-700 rounded w-20" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-700 rounded w-5/6" />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="h-8 bg-gray-700 rounded" />
          <div className="h-8 bg-gray-700 rounded" />
          <div className="h-8 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-4" />
      <div className="h-10 bg-gray-700 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-700 rounded w-1/4" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-1/3 mb-6" />
      <div className="h-64 bg-gray-700/50 rounded flex items-end justify-between gap-2 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-700 rounded-t flex-1"
            style={{ height: `${Math.random() * 70 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-4">
        <div className="h-4 bg-gray-700 rounded w-20" />
        <div className="h-4 bg-gray-700 rounded w-20" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
      {/* Header */}
      <div className="flex gap-4 pb-3 mb-3 border-b border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-700 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div key={colIdx} className="h-4 bg-gray-700 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PlayerStatsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-700 rounded w-1/4" />
        <div className="h-6 bg-gray-700 rounded w-24" />
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="h-3 bg-gray-700 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-700 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-1/3" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-6" />
        <div className="h-64 bg-gray-700/50 rounded" />
      </div>
    </div>
  )
}

