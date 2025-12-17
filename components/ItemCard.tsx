'use client'

import Image from 'next/image'

interface ItemCardProps {
  itemId: number
  itemName: string
  itemInternalName?: string // e.g., "item_blink"
  frequency?: number
  winrate?: number
  cost?: number
  size?: 'sm' | 'md' | 'lg'
  showStats?: boolean
  className?: string
}

export default function ItemCard({
  itemId,
  itemName,
  itemInternalName,
  frequency,
  winrate,
  cost,
  size = 'md',
  showStats = false,
  className = ''
}: ItemCardProps) {
  // Generate image URL from internal name (e.g., "item_blink" -> "blink")
  const getImageUrl = () => {
    if (!itemInternalName) {
      // Try to generate from item name if internal name is missing
      if (itemName && !itemName.startsWith('Item ')) {
        const fallbackName = itemName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        if (fallbackName) {
          return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/${fallbackName}_lg.png`
        }
      }
      return null
    }
    // Remove "item_" prefix and convert to lowercase
    const imageName = itemInternalName.replace(/^item_/, '').toLowerCase()
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/${imageName}_lg.png`
  }

  const imageUrl = getImageUrl()
  
  // Log missing internal name for debugging (only in development)
  if (process.env.NODE_ENV === 'development' && !itemInternalName && itemId) {
    console.warn(`ItemCard: Missing internal_name for item ${itemId} (${itemName})`)
  }
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div
      className={`relative group bg-gray-700/50 rounded-lg border border-gray-600 hover:border-red-500/50 transition-all cursor-pointer ${className}`}
      title={itemName}
    >
      <div className="p-2 flex flex-col items-center gap-1">
        {/* Item Image */}
        <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-gray-800 rounded border border-gray-600 overflow-hidden`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={itemName}
              fill
              className="object-contain p-1"
              unoptimized
              onError={(e) => {
                // Fallback: hide image and show placeholder on error
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                // Show placeholder text
                const parent = target.parentElement
                if (parent && !parent.querySelector('.item-placeholder')) {
                  const placeholder = document.createElement('div')
                  placeholder.className = 'item-placeholder text-gray-500 text-xs text-center px-1 absolute inset-0 flex items-center justify-center'
                  placeholder.textContent = itemName.substring(0, 3).toUpperCase()
                  parent.appendChild(placeholder)
                }
              }}
              onLoad={() => {
                // Remove placeholder if image loads successfully
                const placeholder = document.querySelector('.item-placeholder')
                if (placeholder) {
                  placeholder.remove()
                }
              }}
            />
          ) : (
            <div className="text-gray-500 text-xs text-center px-1 absolute inset-0 flex items-center justify-center">
              {itemName.substring(0, 3).toUpperCase()}
            </div>
          )}
        </div>

        {/* Item Name */}
        <div className={`${textSizeClasses[size]} text-center text-gray-300 font-medium w-full px-1`} style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: '100%'
        }} title={itemName}>
          {itemName}
        </div>

        {/* Stats (if shown) */}
        {showStats && (frequency !== undefined || winrate !== undefined || cost !== undefined) && (
          <div className="text-xs text-gray-400 space-y-0.5">
            {frequency !== undefined && (
              <div>Uso: {frequency}</div>
            )}
            {winrate !== undefined && (
              <div className={winrate >= 50 ? 'text-green-400' : 'text-red-400'}>
                WR: {winrate.toFixed(1)}%
              </div>
            )}
            {cost !== undefined && cost > 0 && (
              <div className="text-yellow-400">{cost}g</div>
            )}
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-gray-700 whitespace-nowrap">
          <div className="font-semibold">{itemName}</div>
          {frequency !== undefined && <div>Frequenza: {frequency}</div>}
          {winrate !== undefined && <div>Winrate: {winrate.toFixed(1)}%</div>}
          {cost !== undefined && cost > 0 && <div>Costo: {cost} gold</div>}
        </div>
      </div>
    </div>
  )
}

