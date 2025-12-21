'use client'

import { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  valueColor?: string
  className?: string
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  valueColor = 'text-white',
  className = ''
}: KpiCardProps) {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <div className="text-gray-400">{icon}</div>}
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          {title}
        </span>
      </div>
      <p className={`text-2xl font-bold ${valueColor} leading-tight mb-1`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  )
}

