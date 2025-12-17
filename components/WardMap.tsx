'use client'

import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedType, setSelectedType] = useState<'observer' | 'sentry' | 'both'>('both')
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 })

  // Dota 2 map structure with accurate proportions
  const drawMinimapBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add padding to avoid cutting elements at edges (5% padding)
    const padding = Math.min(width, height) * 0.05
    const mapWidth = width - (padding * 2)
    const mapHeight = height - (padding * 2)
    const offsetX = padding
    const offsetY = padding
    
    // Base gradient: Radiant (green) to Dire (red)
    const gradient = ctx.createLinearGradient(
      offsetX, offsetY, 
      offsetX + mapWidth, offsetY + mapHeight
    )
    gradient.addColorStop(0, '#0d2818') // Radiant green
    gradient.addColorStop(0.3, '#1a3a1a')
    gradient.addColorStop(0.5, '#1e3a2e') // River
    gradient.addColorStop(0.7, '#3a1a1a')
    gradient.addColorStop(1, '#2a0d0d') // Dire red
    ctx.fillStyle = gradient
    ctx.fillRect(offsetX, offsetY, mapWidth, mapHeight)

    // River (diagonal, more accurate to Dota 2) - with padding offset
    ctx.strokeStyle = '#2d5a87'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(offsetX + mapWidth * 0.05, offsetY + mapHeight * 0.05)
    ctx.lineTo(offsetX + mapWidth * 0.95, offsetY + mapHeight * 0.95)
    ctx.stroke()
    
    ctx.strokeStyle = '#3a6a9a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(offsetX + mapWidth * 0.1, offsetY + mapHeight * 0.1)
    ctx.lineTo(offsetX + mapWidth * 0.9, offsetY + mapHeight * 0.9)
    ctx.stroke()

    // Helper function to draw towers (with padding offset)
    const drawTower = (x: number, y: number, isRadiant: boolean) => {
      const towerX = offsetX + mapWidth * x
      const towerY = offsetY + mapHeight * y
      ctx.fillStyle = isRadiant ? '#4ade80' : '#f87171'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(towerX, towerY, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // Tower center
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(towerX, towerY, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Radiant Towers (Top-Left area) - using normalized coordinates
    drawTower(0.25, 0.15, true)  // T1 Top
    drawTower(0.35, 0.25, true)  // T2 Top
    drawTower(0.20, 0.10, true)  // T3 Top
    drawTower(0.20, 0.30, true)  // T1 Mid
    drawTower(0.30, 0.40, true)  // T2 Mid
    drawTower(0.10, 0.15, true)  // T3 Mid (Ancient)

    // Dire Towers (Bottom-Right area)
    drawTower(0.75, 0.85, false) // T1 Bot
    drawTower(0.65, 0.75, false) // T2 Bot
    drawTower(0.80, 0.90, false) // T3 Bot
    drawTower(0.80, 0.70, false) // T1 Mid
    drawTower(0.70, 0.60, false) // T2 Mid
    drawTower(0.90, 0.85, false) // T3 Mid (Ancient)

    // Roshan Pit (center, more prominent) - with padding offset
    const roshanX = offsetX + mapWidth * 0.48
    const roshanY = offsetY + mapHeight * 0.52
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

    // Rune spots (Powerup runes every 2 minutes) - with padding offset
    const drawRuneSpot = (x: number, y: number) => {
      const runeX = offsetX + mapWidth * x
      const runeY = offsetY + mapHeight * y
      ctx.strokeStyle = '#fbbf24'
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(runeX, runeY, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // Rune icon (star)
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(runeX, runeY - 6)
      ctx.lineTo(runeX + 2, runeY + 2)
      ctx.lineTo(runeX - 2, runeY + 2)
      ctx.closePath()
      ctx.fill()
    }

    // Top rune spot (Radiant side)
    drawRuneSpot(0.25, 0.45)
    // Bot rune spot (Dire side)
    drawRuneSpot(0.75, 0.55)

    // Lanes (more accurate paths) - with padding offset
    ctx.strokeStyle = 'rgba(42, 74, 58, 0.5)'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5])
    
    // Top lane (Radiant)
    ctx.beginPath()
    ctx.moveTo(offsetX + mapWidth * 0.15, offsetY + mapHeight * 0.12)
    ctx.lineTo(offsetX + mapWidth * 0.80, offsetY + mapHeight * 0.30)
    ctx.stroke()
    
    // Mid lane
    ctx.beginPath()
    ctx.moveTo(offsetX + mapWidth * 0.12, offsetY + mapHeight * 0.20)
    ctx.lineTo(offsetX + mapWidth * 0.88, offsetY + mapHeight * 0.80)
    ctx.stroke()
    
    // Bot lane (Dire)
    ctx.beginPath()
    ctx.moveTo(offsetX + mapWidth * 0.20, offsetY + mapHeight * 0.70)
    ctx.lineTo(offsetX + mapWidth * 0.85, offsetY + mapHeight * 0.88)
    ctx.stroke()
    
    ctx.setLineDash([])

    // Base areas (Ancient locations) - with padding offset
    // Radiant Ancient (top-left corner area)
    const radiantAncientX = offsetX + mapWidth * 0.08
    const radiantAncientY = offsetY + mapHeight * 0.10
    ctx.fillStyle = 'rgba(34, 197, 94, 0.4)'
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(radiantAncientX, radiantAncientY, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Ancient structure
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(radiantAncientX - 10, radiantAncientY - 10, 20, 20)

    // Dire Ancient (bottom-right corner area)
    const direAncientX = offsetX + mapWidth * 0.92
    const direAncientY = offsetY + mapHeight * 0.90
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(direAncientX, direAncientY, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Ancient structure
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(direAncientX - 10, direAncientY - 10, 20, 20)

    // Jungle camp indicators (small dots for key farming spots) - with padding offset
    const drawCamp = (x: number, y: number) => {
      const campX = offsetX + mapWidth * x
      const campY = offsetY + mapHeight * y
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)'
      ctx.beginPath()
      ctx.arc(campX, campY, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Key jungle camps (approximate positions)
    // Radiant jungle
    drawCamp(0.30, 0.25)
    drawCamp(0.40, 0.35)
    drawCamp(0.35, 0.50)
    // Dire jungle
    drawCamp(0.70, 0.65)
    drawCamp(0.60, 0.55)
    drawCamp(0.65, 0.45)
    
    // Return offset values for use in ward positioning
    return { offsetX, offsetY, mapWidth, mapHeight }
  }

  // Calculate responsive canvas size based on container
  useEffect(() => {
    if (!containerRef.current) return
    
    const updateCanvasSize = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth - 48 // Account for padding
      const maxSize = Math.min(containerWidth, 800) // Max 800px, responsive to container
      setCanvasSize({ width: maxSize, height: maxSize })
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use responsive canvas size
    const canvasWidth = canvasSize.width
    const canvasHeight = canvasSize.height
    
    // Set canvas actual size
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Dota 2 map coordinates: world coordinates range from approximately -8000 to 8000
    const mapMin = -8000
    const mapMax = 8000
    const mapRange = mapMax - mapMin

    // Draw minimap background with all landmarks (returns offset values)
    const mapOffsets = drawMinimapBackground(ctx, canvasWidth, canvasHeight)
    
    // Convert Dota 2 world coordinates to minimap coordinates (accounting for padding)
    const worldToMinimap = (x: number, y: number) => {
      const minimapX = mapOffsets.offsetX + ((x - mapMin) / mapRange) * mapOffsets.mapWidth
      const minimapY = mapOffsets.offsetY + mapOffsets.mapHeight - ((y - mapMin) / mapRange) * mapOffsets.mapHeight
      return { x: minimapX, y: minimapY }
    }

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

  }, [observerWards, sentryWards, selectedType, canvasSize])

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

      {/* Canvas - Responsive container */}
      <div 
        ref={containerRef}
        className="bg-gray-900 rounded-lg border border-gray-700 p-6 flex justify-center"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="max-w-full h-auto border border-gray-600 rounded shadow-xl"
          style={{ 
            width: '100%', 
            height: 'auto',
            maxWidth: '800px'
          }}
        />
      </div>

      {/* Legend with map references - Enhanced */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="space-y-4">
          {/* Wards Count */}
          <div className="flex gap-6 justify-center text-base flex-wrap items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-6 h-6 bg-blue-500 rounded-full shadow-lg border-2 border-white/30"></div>
                <div className="absolute inset-0 w-6 h-6 border-2 border-blue-300 rounded-full" style={{ clipPath: 'ellipse(60% 40% at center)' }}></div>
              </div>
              <span className="text-gray-200 font-semibold">
                Observer Wards: <span className="text-blue-400 font-bold text-lg">{observerWards.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-6 h-6 bg-green-500 rounded-full shadow-lg border-2 border-white/30"></div>
                <div className="absolute inset-0 w-6 h-6 border-2 border-green-300 rounded-full" style={{ clipPath: 'ellipse(60% 40% at center)' }}></div>
              </div>
              <span className="text-gray-200 font-semibold">
                Sentry Wards: <span className="text-green-400 font-bold text-lg">{sentryWards.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-sm font-medium">
                Totale: <span className="text-white font-bold text-base">{observerWards.length + sentryWards.length}</span> wards
              </span>
            </div>
          </div>
          
          {/* Map References Legend - More detailed */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <p className="text-sm text-gray-300 font-semibold text-center mb-4">📍 Riferimenti Mappa Dota 2:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 justify-items-center text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-green-400 border-2 border-white shadow-md"></div>
                  <div className="absolute inset-0 w-5 h-5 border-2 border-white rounded-full" style={{ clip: 'rect(0, 5px, 5px, 2px)' }}></div>
                </div>
                <span className="text-gray-300 text-xs font-medium text-center">Torri Radiant</span>
                <span className="text-gray-500 text-xs text-center">(Verde)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-red-400 border-2 border-white shadow-md"></div>
                  <div className="absolute inset-0 w-5 h-5 border-2 border-white rounded-full" style={{ clip: 'rect(0, 5px, 5px, 2px)' }}></div>
                </div>
                <span className="text-gray-300 text-xs font-medium text-center">Torri Dire</span>
                <span className="text-gray-500 text-xs text-center">(Rosso)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-md"></div>
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-black"></div>
                </div>
                <span className="text-gray-300 text-xs font-medium text-center">Rune Spots</span>
                <span className="text-gray-500 text-xs text-center">(Giallo)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-400 border-2 border-purple-600 shadow-md"></div>
                <span className="text-gray-300 text-xs font-medium text-center">Jungle Camps</span>
                <span className="text-gray-500 text-xs text-center">(Viola)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-700 border-2 border-red-900 shadow-md"></div>
                <span className="text-gray-300 text-xs font-medium text-center">Roshan Pit</span>
                <span className="text-gray-500 text-xs text-center">(Centro)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info message when no data */}
      {observerWards.length === 0 && sentryWards.length === 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
          <div className="text-yellow-200 text-sm flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            <span>Nessuna ward trovata nelle partite analizzate. Le partite potrebbero non avere replay disponibili o dati wardmap.</span>
          </div>
        </div>
      )}
    </div>
  )
}
