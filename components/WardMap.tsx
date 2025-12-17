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
 * Usa Canvas con disegno diretto della mappa (no dipendenze esterne)
 */
export default function WardMap({ 
  observerWards, 
  sentryWards, 
  width = 800, 
  height = 800 
}: WardMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedType, setSelectedType] = useState<'observer' | 'sentry' | 'both'>('both')

  // Function to draw Dota 2 minimap background
  const drawMinimapBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Base gradient: Radiant (green) to Dire (red) with river in middle
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#0d2818') // Dark green (Radiant top-left)
    gradient.addColorStop(0.25, '#1a3a1a') // Medium green
    gradient.addColorStop(0.5, '#1e3a2e') // River area
    gradient.addColorStop(0.75, '#3a1a1a') // Medium red
    gradient.addColorStop(1, '#2a0d0d') // Dark red (Dire bottom-right)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw river (diagonal from top-left to bottom-right)
    ctx.strokeStyle = '#2d5a87'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(width, height)
    ctx.stroke()

    // Draw secondary river lines
    ctx.strokeStyle = '#3a6a9a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width * 0.1, 0)
    ctx.lineTo(width * 0.9, height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(width * 0.9, 0)
    ctx.lineTo(width * 0.1, height)
    ctx.stroke()

    // Draw Roshan pit area (center of map)
    const roshanX = width / 2
    const roshanY = height / 2
    ctx.fillStyle = '#4a1a1a'
    ctx.beginPath()
    ctx.arc(roshanX, roshanY, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#6a2a2a'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw lane lines (approximate)
    ctx.strokeStyle = '#2a4a3a'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 5])
    
    // Top lane (Radiant)
    ctx.beginPath()
    ctx.moveTo(width * 0.15, height * 0.1)
    ctx.lineTo(width * 0.85, height * 0.3)
    ctx.stroke()
    
    // Mid lane
    ctx.beginPath()
    ctx.moveTo(width * 0.1, height * 0.2)
    ctx.lineTo(width * 0.9, height * 0.8)
    ctx.stroke()
    
    // Bottom lane (Dire)
    ctx.beginPath()
    ctx.moveTo(width * 0.15, height * 0.7)
    ctx.lineTo(width * 0.85, height * 0.9)
    ctx.stroke()
    
    ctx.setLineDash([])

    // Draw base areas (approximate)
    // Radiant base (top-left area)
    ctx.fillStyle = 'rgba(26, 58, 26, 0.3)'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(width * 0.3, 0)
    ctx.lineTo(width * 0.2, height * 0.2)
    ctx.lineTo(0, height * 0.3)
    ctx.closePath()
    ctx.fill()

    // Dire base (bottom-right area)
    ctx.fillStyle = 'rgba(58, 26, 26, 0.3)'
    ctx.beginPath()
    ctx.moveTo(width, height)
    ctx.lineTo(width * 0.7, height)
    ctx.lineTo(width * 0.8, height * 0.8)
    ctx.lineTo(width, height * 0.7)
    ctx.closePath()
    ctx.fill()

    // Draw grid lines for better orientation (subtle)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const pos = (width / 10) * i
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(width, pos)
      ctx.stroke()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Dota 2 map coordinates: world coordinates range from approximately -8000 to 8000
    const mapMin = -8000
    const mapMax = 8000
    const mapRange = mapMax - mapMin

    // Convert Dota 2 world coordinates to minimap coordinates
    const worldToMinimap = (x: number, y: number) => {
      // X: -8000 (left) to 8000 (right) -> 0 to width
      // Y: -8000 (bottom) to 8000 (top) -> height to 0 (flipped for canvas)
      const minimapX = ((x - mapMin) / mapRange) * width
      const minimapY = height - ((y - mapMin) / mapRange) * height
      return { x: minimapX, y: minimapY }
    }

    // Draw minimap background
    drawMinimapBackground(ctx, width, height)

    // Create heatmap with better visualization
    const createHeatmap = (wards: WardPosition[], color: string, alpha: number = 0.6) => {
      if (wards.length === 0) return

      // Create a grid for heatmap
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

  }, [observerWards, sentryWards, selectedType, width, height])

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
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="max-w-full h-auto border border-gray-600 rounded shadow-xl"
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
      {observerWards.length === 0 && sentryWards.length === 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
          <p className="text-yellow-200 text-sm">
            ℹ️ Nessuna ward trovata nelle partite analizzate. Le partite potrebbero non avere replay disponibili o dati wardmap.
          </p>
        </div>
      )}
    </div>
  )
}

