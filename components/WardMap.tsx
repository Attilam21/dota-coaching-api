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
 * Mappa accurata e riconoscibile con riferimenti geografici reali
 */
export default function WardMap({ 
  observerWards, 
  sentryWards, 
  width = 800, 
  height = 800 
}: WardMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedType, setSelectedType] = useState<'observer' | 'sentry' | 'both'>('both')

  // Dota 2 map structure with accurate proportions
  const drawMinimapBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Base gradient: Radiant (green) to Dire (red)
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#0d2818') // Radiant green
    gradient.addColorStop(0.3, '#1a3a1a')
    gradient.addColorStop(0.5, '#1e3a2e') // River
    gradient.addColorStop(0.7, '#3a1a1a')
    gradient.addColorStop(1, '#2a0d0d') // Dire red
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // River (diagonal, more accurate to Dota 2)
    ctx.strokeStyle = '#2d5a87'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(width * 0.05, height * 0.05)
    ctx.lineTo(width * 0.95, height * 0.95)
    ctx.stroke()
    
    ctx.strokeStyle = '#3a6a9a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(width * 0.1, height * 0.1)
    ctx.lineTo(width * 0.9, height * 0.9)
    ctx.stroke()

    // Helper function to draw towers
    const drawTower = (x: number, y: number, isRadiant: boolean) => {
      ctx.fillStyle = isRadiant ? '#4ade80' : '#f87171'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // Tower center
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Radiant Towers (Top-Left area)
    // T1 Top
    drawTower(width * 0.25, height * 0.15, true)
    // T2 Top
    drawTower(width * 0.35, height * 0.25, true)
    // T3 Top
    drawTower(width * 0.20, height * 0.10, true)
    // T1 Mid
    drawTower(width * 0.20, height * 0.30, true)
    // T2 Mid
    drawTower(width * 0.30, height * 0.40, true)
    // T3 Mid (Ancient)
    drawTower(width * 0.10, height * 0.15, true)

    // Dire Towers (Bottom-Right area)
    // T1 Bot
    drawTower(width * 0.75, height * 0.85, false)
    // T2 Bot
    drawTower(width * 0.65, height * 0.75, false)
    // T3 Bot
    drawTower(width * 0.80, height * 0.90, false)
    // T1 Mid
    drawTower(width * 0.80, height * 0.70, false)
    // T2 Mid
    drawTower(width * 0.70, height * 0.60, false)
    // T3 Mid (Ancient)
    drawTower(width * 0.90, height * 0.85, false)

    // Roshan Pit (center, more prominent)
    const roshanX = width * 0.48
    const roshanY = height * 0.52
    ctx.fillStyle = '#4a1a1a'
    ctx.strokeStyle = '#8b0000'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(roshanX, roshanY, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Roshan icon (skull)
    ctx.fillStyle = '#6a2a2a'
    ctx.beginPath()
    ctx.arc(roshanX, roshanY, 25, 0, Math.PI * 2)
    ctx.fill()

    // Rune spots (Powerup runes every 2 minutes)
    const drawRuneSpot = (x: number, y: number) => {
      ctx.strokeStyle = '#fbbf24'
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // Rune icon (star)
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(x, y - 6)
      ctx.lineTo(x + 2, y + 2)
      ctx.lineTo(x - 2, y + 2)
      ctx.closePath()
      ctx.fill()
    }

    // Top rune spot (Radiant side)
    drawRuneSpot(width * 0.25, height * 0.45)
    // Bot rune spot (Dire side)
    drawRuneSpot(width * 0.75, height * 0.55)

    // Lanes (more accurate paths)
    ctx.strokeStyle = 'rgba(42, 74, 58, 0.5)'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5])
    
    // Top lane (Radiant)
    ctx.beginPath()
    ctx.moveTo(width * 0.15, height * 0.12)
    ctx.lineTo(width * 0.80, height * 0.30)
    ctx.stroke()
    
    // Mid lane
    ctx.beginPath()
    ctx.moveTo(width * 0.12, height * 0.20)
    ctx.lineTo(width * 0.88, height * 0.80)
    ctx.stroke()
    
    // Bot lane (Dire)
    ctx.beginPath()
    ctx.moveTo(width * 0.20, height * 0.70)
    ctx.lineTo(width * 0.85, height * 0.88)
    ctx.stroke()
    
    ctx.setLineDash([])

    // Base areas (Ancient locations)
    // Radiant Ancient (top-left corner area)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.4)'
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(width * 0.08, height * 0.10, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Ancient structure
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(width * 0.04, height * 0.06, 20, 20)

    // Dire Ancient (bottom-right corner area)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(width * 0.92, height * 0.90, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Ancient structure
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(width * 0.90, height * 0.86, 20, 20)

    // Jungle camp indicators (small dots for key farming spots)
    const drawCamp = (x: number, y: number) => {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Key jungle camps (approximate positions)
    // Radiant jungle
    drawCamp(width * 0.30, height * 0.25)
    drawCamp(width * 0.40, height * 0.35)
    drawCamp(width * 0.35, height * 0.50)
    // Dire jungle
    drawCamp(width * 0.70, height * 0.65)
    drawCamp(width * 0.60, height * 0.55)
    drawCamp(width * 0.65, height * 0.45)
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

    // Draw minimap background with all landmarks
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

      // Intelligent jitter system: prevent overlapping while maintaining precision
      const MIN_DISTANCE = 16 // Minimum distance between ward points (px)
      const jitteredPositions: Array<{ x: number; y: number; originalIndex: number }> = []
      
      wardPositions.forEach((pos, index) => {
        // Find nearby points that would overlap
        const nearbyPoints = jitteredPositions.filter(p => {
          const dx = p.x - pos.x
          const dy = p.y - pos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          return distance < MIN_DISTANCE
        })
        
        if (nearbyPoints.length === 0) {
          // No overlap: use exact position
          jitteredPositions.push({ ...pos, originalIndex: index })
        } else {
          // Overlap detected: distribute in circular pattern
          const centerX = nearbyPoints.reduce((sum, p) => sum + p.x, pos.x) / (nearbyPoints.length + 1)
          const centerY = nearbyPoints.reduce((sum, p) => sum + p.y, pos.y) / (nearbyPoints.length + 1)
          
          // Calculate angle and radius for circular distribution
          const angleStep = (Math.PI * 2) / (nearbyPoints.length + 2)
          const baseAngle = Math.atan2(pos.y - centerY, pos.x - centerX)
          
          // Distribute in a spiral pattern around the center
          const spiralRadius = MIN_DISTANCE * 0.6 * (nearbyPoints.length + 1)
          const angle = baseAngle + (nearbyPoints.length * angleStep)
          
          const jitteredX = centerX + Math.cos(angle) * spiralRadius
          const jitteredY = centerY + Math.sin(angle) * spiralRadius
          
          // Ensure position is within canvas bounds
          const finalX = Math.max(0, Math.min(width, jitteredX))
          const finalY = Math.max(0, Math.min(height, jitteredY))
          
          jitteredPositions.push({ x: finalX, y: finalY, originalIndex: index })
        }
      })

      // Draw individual ward points on top (OpenDota style: larger, more visible)
      const isObserver = pointColor === '#3B82F6'
      
      jitteredPositions.forEach(({ x, y }) => {
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

      {/* Legend with map references */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="space-y-3">
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
                Totale: <span className="text-white font-semibold">{observerWards.length + sentryWards.length}</span> wards
              </span>
            </div>
          </div>
          
          {/* Map legend */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="text-xs text-gray-400 text-center mb-2">Riferimenti Mappa:</p>
            <div className="flex gap-4 justify-center text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>Torri Radiant</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span>Torri Dire</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>Rune Spots</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span>Jungle Camps</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded bg-red-700"></div>
                <span>Roshan Pit</span>
              </div>
            </div>
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
