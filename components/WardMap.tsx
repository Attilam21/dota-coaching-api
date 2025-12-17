'use client'

import { useEffect, useRef, useState } from 'react'

interface WardPosition {
  x: number
  y: number
  match_id: number
}

interface WardMapProps {
  observerWards: WardPosition[]
  sentryWards: WardPosition[]
  width?: number
  height?: number
}

/**
 * Componente per visualizzare la wardmap su una mappa di Dota 2
 * Usa Canvas con immagine di background della mappa reale
 */
export default function WardMap({ 
  observerWards, 
  sentryWards, 
  width = 800, 
  height = 800 
}: WardMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapImageRef = useRef<HTMLImageElement | null>(null)
  const [selectedType, setSelectedType] = useState<'observer' | 'sentry' | 'both'>('both')
  const [imageLoaded, setImageLoaded] = useState(false)

  // Load Dota 2 minimap image
  useEffect(() => {
    const img = new Image()
    // Using a public Dota 2 minimap image
    // OpenDota uses similar approach with minimap background
    img.crossOrigin = 'anonymous'
    // Try multiple sources for the minimap image
    img.src = 'https://raw.githubusercontent.com/odota/web/master/public/images/dota2_minimap.jpg'
    
    img.onload = () => {
      mapImageRef.current = img
      setImageLoaded(true)
    }
    
    img.onerror = () => {
      // Fallback: try alternative source or use gradient
      const fallbackImg = new Image()
      fallbackImg.crossOrigin = 'anonymous'
      fallbackImg.src = 'https://cdn.opendota.com/app/images/dota2/minimap.jpg'
      
      fallbackImg.onload = () => {
        mapImageRef.current = fallbackImg
        setImageLoaded(true)
      }
      
      fallbackImg.onerror = () => {
        // Final fallback: use gradient background
        console.warn('Failed to load minimap image, using fallback gradient')
        setImageLoaded(true)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Dota 2 map coordinates: world coordinates range from approximately -8000 to 8000
    const mapMin = -8000
    const mapMax = 8000
    const mapRange = mapMax - mapMin

    // Convert Dota 2 world coordinates to minimap coordinates
    // This is the standard transformation used by OpenDota
    const worldToMinimap = (x: number, y: number) => {
      // X: -8000 (left) to 8000 (right) -> 0 to width
      // Y: -8000 (bottom) to 8000 (top) -> height to 0 (flipped for canvas)
      const minimapX = ((x - mapMin) / mapRange) * width
      const minimapY = height - ((y - mapMin) / mapRange) * height
      return { x: minimapX, y: minimapY }
    }

    // Draw minimap background image
    if (mapImageRef.current) {
      ctx.drawImage(mapImageRef.current, 0, 0, width, height)
    } else {
      // Fallback: draw gradient background similar to Dota 2 map
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#1a3a1a') // Dark green (Radiant side)
      gradient.addColorStop(0.5, '#2a4a3a') // River/middle
      gradient.addColorStop(1, '#3a1a1a') // Dark red (Dire side)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      
      // Draw river lines
      ctx.strokeStyle = '#4a90e2'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width / 2, height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
    }

    // Create heatmap with better visualization
    const createHeatmap = (wards: WardPosition[], color: string, alpha: number = 0.6) => {
      if (wards.length === 0) return

      // Create a grid for heatmap (smaller grid for better detail)
      const gridSize = 40
      const grid: { [key: string]: number } = {}

      wards.forEach(ward => {
        const { x, y } = worldToMinimap(ward.x, ward.y)
        const gridX = Math.floor(x / gridSize)
        const gridY = Math.floor(y / gridSize)
        const key = `${gridX},${gridY}`
        grid[key] = (grid[key] || 0) + 1
      })

      // Find max count for normalization
      const maxCount = Math.max(...Object.values(grid), 1)

      // Draw heatmap with smoother gradients
      Object.entries(grid).forEach(([key, count]) => {
        const [gridX, gridY] = key.split(',').map(Number)
        const intensity = count / maxCount
        const centerX = gridX * gridSize + gridSize / 2
        const centerY = gridY * gridSize + gridSize / 2
        const radius = gridSize * (0.6 + intensity * 0.8)

        // Create radial gradient for heat effect
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        )
        
        const alphaHex = Math.floor(alpha * intensity * 255).toString(16).padStart(2, '0')
        gradient.addColorStop(0, `${color}${alphaHex}`)
        gradient.addColorStop(0.5, `${color}${Math.floor(alpha * intensity * 180).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `${color}00`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw individual ward points with better visibility
      ctx.fillStyle = color
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      wards.forEach(ward => {
        const { x, y } = worldToMinimap(ward.x, ward.y)
        // Draw outer circle (ward icon)
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
        // Draw inner highlight for visibility
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.stroke()
        // Draw small center dot
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
      })
    }

    // Draw wards based on selection
    if (selectedType === 'observer' || selectedType === 'both') {
      createHeatmap(observerWards, '#3B82F6', 0.65) // Blue for observer
    }
    
    if (selectedType === 'sentry' || selectedType === 'both') {
      createHeatmap(sentryWards, '#10B981', 0.65) // Green for sentry
    }

  }, [observerWards, sentryWards, selectedType, width, height, imageLoaded])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-center justify-center flex-wrap">
        <button
          onClick={() => setSelectedType('observer')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            selectedType === 'observer'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Observer Only
        </button>
        <button
          onClick={() => setSelectedType('sentry')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            selectedType === 'sentry'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Sentry Only
        </button>
        <button
          onClick={() => setSelectedType('both')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            selectedType === 'both'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Both
        </button>
      </div>

      {/* Canvas */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex justify-center overflow-auto">
        {!imageLoaded && (
          <div className="flex items-center justify-center h-[800px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-400">Caricamento mappa...</p>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`max-w-full h-auto border border-gray-600 rounded shadow-xl ${!imageLoaded ? 'hidden' : ''}`}
        />
      </div>

      {/* Legend */}
      <div className="flex gap-6 justify-center text-sm flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-md"></div>
          <span className="text-gray-300">Observer Wards ({observerWards.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full shadow-md"></div>
          <span className="text-gray-300">Sentry Wards ({sentryWards.length})</span>
        </div>
      </div>

      {/* Info message when no data */}
      {observerWards.length === 0 && sentryWards.length === 0 && imageLoaded && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
          <p className="text-yellow-200 text-sm">
            ℹ️ Nessuna ward trovata nelle partite analizzate. Le partite potrebbero non avere replay disponibili o dati wardmap.
          </p>
        </div>
      )}
    </div>
  )
}
