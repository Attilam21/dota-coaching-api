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
 * Stile ispirato a OpenDota con heatmap visibile e punti wards chiari
 */
export default function WardMap({ 
  observerWards, 
  sentryWards, 
  width = 800, 
  height = 800 
}: WardMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedType, setSelectedType] = useState<'observer' | 'sentry' | 'both'>('both')

  // Function to draw Dota 2 minimap background (improved for better contrast)
  const drawMinimapBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Darker, more contrasted background for better ward visibility
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#0a1f0f') // Darker green (Radiant top-left)
    gradient.addColorStop(0.25, '#15301a') // Medium green
    gradient.addColorStop(0.5, '#1a2e23') // River area
    gradient.addColorStop(0.75, '#301515') // Medium red
    gradient.addColorStop(1, '#1f0a0a') // Darker red (Dire bottom-right)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw river with better visibility
    ctx.strokeStyle = '#1e4a6b'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(width, height)
    ctx.stroke()

    // Secondary river lines (more visible)
    ctx.strokeStyle = '#2a5a7a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(width * 0.1, 0)
    ctx.lineTo(width * 0.9, height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(width * 0.9, 0)
    ctx.lineTo(width * 0.1, height)
    ctx.stroke()

    // Draw Roshan pit (more visible)
    const roshanX = width / 2
    const roshanY = height / 2
    ctx.fillStyle = '#3a1a1a'
    ctx.beginPath()
    ctx.arc(roshanX, roshanY, 35, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#6a2a2a'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw lane lines (more visible)
    ctx.strokeStyle = 'rgba(42, 74, 58, 0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    
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

    // Draw base areas (more visible)
    ctx.fillStyle = 'rgba(20, 50, 20, 0.4)'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(width * 0.3, 0)
    ctx.lineTo(width * 0.2, height * 0.2)
    ctx.lineTo(0, height * 0.3)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(50, 20, 20, 0.4)'
    ctx.beginPath()
    ctx.moveTo(width, height)
    ctx.lineTo(width * 0.7, height)
    ctx.lineTo(width * 0.8, height * 0.8)
    ctx.lineTo(width, height * 0.7)
    ctx.closePath()
    ctx.fill()
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
      const minimapX = ((x - mapMin) / mapRange) * width
      const minimapY = height - ((y - mapMin) / mapRange) * height
      return { x: minimapX, y: minimapY }
    }

    // Draw minimap background
    drawMinimapBackground(ctx, width, height)

    // OpenDota-style heatmap: more visible and intuitive
    const createHeatmap = (wards: WardPosition[], color: string, pointColor: string) => {
      if (wards.length === 0) return

      // Use a grid-based approach for heatmap (like OpenDota)
      const gridSize = 25 // Finer grid for better resolution
      const grid: { [key: string]: number } = {}
      const wardPositions: Array<{ x: number; y: number }> = []

      // Build grid and collect positions
      wards.forEach(ward => {
        const { x, y } = worldToMinimap(ward.x, ward.y)
        wardPositions.push({ x, y })
        const gridX = Math.floor(x / gridSize)
        const gridY = Math.floor(y / gridSize)
        const key = `${gridX},${gridY}`
        grid[key] = (grid[key] || 0) + 1
      })

      // Find max count for intensity normalization
      const maxCount = Math.max(...Object.values(grid), 1)

      // Draw heatmap first (behind wards) - OpenDota style with more saturation
      Object.entries(grid).forEach(([key, count]) => {
        if (count === 0) return
        
        const [gridX, gridY] = key.split(',').map(Number)
        const intensity = Math.min(count / maxCount, 1)
        const centerX = gridX * gridSize + gridSize / 2
        const centerY = gridY * gridSize + gridSize / 2
        const radius = gridSize * (1.0 + intensity * 1.5) // Larger, more visible heatmap

        // Create radial gradient with higher opacity for better visibility
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        )
        
        // More saturated colors for better visibility (OpenDota style)
        const centerAlpha = Math.floor(intensity * 180 + 50).toString(16).padStart(2, '0') // Min 50 alpha
        const midAlpha = Math.floor(intensity * 100 + 30).toString(16).padStart(2, '0')
        
        gradient.addColorStop(0, `${color}${centerAlpha}`)
        gradient.addColorStop(0.5, `${color}${midAlpha}`)
        gradient.addColorStop(1, `${color}00`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw individual ward points on top (OpenDota style: larger, more visible)
      const isObserver = pointColor === '#3B82F6'
      
      wardPositions.forEach(({ x, y }) => {
        ctx.save()
        ctx.translate(x, y)
        
        // Draw ward icon: OpenDota uses oval shapes, larger and more visible
        // Observer: blue oval with eye icon
        // Sentry: green oval without eye
        
        // Outer glow for better visibility
        if (isObserver) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.3)'
        }
        ctx.beginPath()
        ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // Main ward shape - larger oval (OpenDota style)
        ctx.beginPath()
        ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2) // 12px width, 8px height
        
        // Fill with ward color
        ctx.fillStyle = pointColor
        ctx.fill()
        
        // White border for contrast
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
        
        if (isObserver) {
          // Observer: Draw eye icon (iris) - OpenDota style
          // Outer iris ring
          ctx.beginPath()
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2)
          ctx.fillStyle = '#1e40af' // Dark blue iris
          ctx.fill()
          
          // Inner pupil
          ctx.beginPath()
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = '#000000'
          ctx.fill()
          
          // Highlight on iris (for depth)
          ctx.beginPath()
          ctx.arc(-1.5, -1.5, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = '#60a5fa'
          ctx.fill()
        } else {
          // Sentry: Draw inner shape for distinction
          ctx.beginPath()
          ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2)
          ctx.fillStyle = '#047857' // Darker green
          ctx.fill()
          
          // Small center dot
          ctx.beginPath()
          ctx.arc(0, 0, 2, 0, Math.PI * 2)
          ctx.fillStyle = '#10b981'
          ctx.fill()
        }
        
        ctx.restore()
      })
    }

    // Draw wards based on selection with OpenDota-style colors
    if (selectedType === 'observer' || selectedType === 'both') {
      createHeatmap(observerWards, '#3B82F6', '#3B82F6') // Blue for observer
    }
    
    if (selectedType === 'sentry' || selectedType === 'both') {
      createHeatmap(sentryWards, '#10B981', '#10B981') // Green for sentry
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

      {/* Legend with enhanced visibility */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex gap-6 justify-center text-sm flex-wrap items-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full shadow-lg border-2 border-white/30"></div>
            <span className="text-gray-200 font-medium">
              Observer Wards: <span className="text-blue-400 font-bold">{observerWards.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full shadow-lg border-2 border-white/30"></div>
            <span className="text-gray-200 font-medium">
              Sentry Wards: <span className="text-green-400 font-bold">{sentryWards.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xs">
              Totale: <span className="text-white font-semibold">{observerWards.length + sentryWards.length}</span> wards visualizzate
            </span>
          </div>
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
