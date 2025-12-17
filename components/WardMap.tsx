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
 * Usa Canvas per disegnare le heatmap delle wards
 */
export default function WardMap({ 
  observerWards, 
  sentryWards, 
  width = 800, 
  height = 800 
}: WardMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedType, setSelectedType] = useState<'observer' | 'sentry' | 'both'>('both')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Dota 2 map coordinates are typically in range -8000 to 8000
    // We need to map them to canvas coordinates
    const mapMin = -8000
    const mapMax = 8000
    const mapRange = mapMax - mapMin

    const mapToCanvas = (x: number, y: number) => {
      // Flip Y axis (Dota 2 uses bottom-left origin, canvas uses top-left)
      const canvasX = ((x - mapMin) / mapRange) * width
      const canvasY = height - ((y - mapMin) / mapRange) * height
      return { x: canvasX, y: canvasY }
    }

    // Draw background (dark gray)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines for reference
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const pos = (i / 10) * width
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(width, pos)
      ctx.stroke()
    }

    // Create heatmap data
    const createHeatmap = (wards: WardPosition[], color: string, alpha: number = 0.6) => {
      if (wards.length === 0) return

      // Create a grid for heatmap
      const gridSize = 50
      const grid: { [key: string]: number } = {}

      wards.forEach(ward => {
        const { x, y } = mapToCanvas(ward.x, ward.y)
        const gridX = Math.floor(x / gridSize)
        const gridY = Math.floor(y / gridSize)
        const key = `${gridX},${gridY}`
        grid[key] = (grid[key] || 0) + 1
      })

      // Find max count for normalization
      const maxCount = Math.max(...Object.values(grid))

      // Draw heatmap
      Object.entries(grid).forEach(([key, count]) => {
        const [gridX, gridY] = key.split(',').map(Number)
        const intensity = count / maxCount
        const radius = gridSize * (0.5 + intensity * 0.5)

        const gradient = ctx.createRadialGradient(
          gridX * gridSize + gridSize / 2,
          gridY * gridSize + gridSize / 2,
          0,
          gridX * gridSize + gridSize / 2,
          gridY * gridSize + gridSize / 2,
          radius
        )
        
        gradient.addColorStop(0, `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `${color}00`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(
          gridX * gridSize + gridSize / 2,
          gridY * gridSize + gridSize / 2,
          radius,
          0,
          Math.PI * 2
        )
        ctx.fill()
      })

      // Draw individual ward points
      ctx.fillStyle = color
      wards.forEach(ward => {
        const { x, y } = mapToCanvas(ward.x, ward.y)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw wards based on selection
    if (selectedType === 'observer' || selectedType === 'both') {
      createHeatmap(observerWards, '#3B82F6', 0.7) // Blue for observer
    }
    
    if (selectedType === 'sentry' || selectedType === 'both') {
      createHeatmap(sentryWards, '#10B981', 0.7) // Green for sentry
    }

    // Draw center lines (river)
    ctx.strokeStyle = '#4a90e2'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

  }, [observerWards, sentryWards, selectedType, width, height])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-center justify-center">
        <button
          onClick={() => setSelectedType('observer')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedType === 'observer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Observer Only
        </button>
        <button
          onClick={() => setSelectedType('sentry')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedType === 'sentry'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Sentry Only
        </button>
        <button
          onClick={() => setSelectedType('both')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedType === 'both'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Both
        </button>
      </div>

      {/* Canvas */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="max-w-full h-auto border border-gray-600 rounded"
        />
      </div>

      {/* Legend */}
      <div className="flex gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-gray-300">Observer Wards ({observerWards.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-gray-300">Sentry Wards ({sentryWards.length})</span>
        </div>
      </div>
    </div>
  )
}

