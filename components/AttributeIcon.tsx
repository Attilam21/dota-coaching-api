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

  const iconComponents: Record<'str' | 'agi' | 'int', typeof Sword> = {
    str: Sword,
    agi: Zap,
    int: Brain
  }

  // Validate attribute and get icon component with fallback
  const IconComponent = (attribute === 'str' || attribute === 'agi' || attribute === 'int') 
    ? iconComponents[attribute] 
    : Sword // Fallback to Sword if invalid attribute

  // Get color with fallback
  const iconColor = (attribute === 'str' || attribute === 'agi' || attribute === 'int')
    ? labelColors[attribute]
    : 'text-gray-400'

  return (
    <div className={`flex items-center gap-1 ${className}`} title={attribute.toUpperCase()}>
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <IconComponent className={`${sizeClasses[size]} ${iconColor}`} />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold ${iconColor}`}>
          {labelText[attribute]}
        </span>
      )}
    </div>
  )
}

