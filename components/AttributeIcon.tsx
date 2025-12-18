'use client'

import { Sword, Zap, Brain } from 'lucide-react'

interface AttributeIconProps {
  attribute: 'str' | 'agi' | 'int'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function AttributeIcon({
  attribute,
  size = 'md',
  showLabel = false,
  className = ''
}: AttributeIconProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const labelText = {
    str: 'STR',
    agi: 'AGI',
    int: 'INT'
  }

  const labelColors = {
    str: 'text-red-400',
    agi: 'text-green-400',
    int: 'text-blue-400'
  }

  const iconComponents = {
    str: Sword,
    agi: Zap,
    int: Brain
  }

  const IconComponent = iconComponents[attribute]

  return (
    <div className={`flex items-center gap-1 ${className}`} title={attribute.toUpperCase()}>
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <IconComponent className={`${sizeClasses[size]} ${labelColors[attribute]}`} />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold ${labelColors[attribute]}`}>
          {labelText[attribute]}
        </span>
      )}
    </div>
  )
}

