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
 * Due pannelli side-by-side: Observer a sinistra, Sentry a destra
 * Heatmap con gradiente colori basato sull'intensità (blu → verde → giallo → rosso)
 */
export default function WardMap({ 
  observerWards, 
  sentryWards, 
  width = 800, 
  height = 800 
}: WardMapProps) {
  const observerCanvasRef = useRef<HTMLCanvasElement>(null)
  const sentryCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 })

  // Dota 2 map structure - simplified and darker for better heatmap visibility
  const drawMinimapBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Darker background for better heatmap contrast
    const padding = Math.min(width, height) * 0.05
    const mapWidth = width - (padding * 2)
    const mapHeight = height - (padding * 2)
    const offsetX = padding
    const offsetY = padding
    
    // Darker base gradient
    const gradient = ctx.createLinearGradient(
      offsetX, offsetY, 
      offsetX + mapWidth, offsetY + mapHeight
    )
    gradient.addColorStop(0, '#0a1a0f') // Very dark green (Radiant)
    gradient.addColorStop(0.5, '#1a1a1a') // Dark gray (River)
    gradient.addColorStop(1, '#1a0a0a') // Very dark red (Dire)
    ctx.fillStyle = gradient
    ctx.fillRect(offsetX, offsetY, mapWidth, mapHeight)

    // River - subtle
    ctx.strokeStyle = '#1a3a4a'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(offsetX + mapWidth * 0.05, offsetY + mapHeight * 0.05)
    ctx.lineTo(offsetX + mapWidth * 0.95, offsetY + mapHeight * 0.95)
    ctx.stroke()

    // Roshan Pit - subtle
    const roshanX = offsetX + mapWidth * 0.48
    const roshanY = offsetY + mapHeight * 0.52
    ctx.fillStyle = '#2a1a1a'
    ctx.strokeStyle = '#4a2a2a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(roshanX, roshanY, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Return offset values
    return { offsetX, offsetY, mapWidth, mapHeight }
  }

  // Get color based on intensity (0-1) - OpenDota style gradient
  const getHeatmapColor = (intensity: number): string => {
    // Blue (low) → Green (medium-low) → Yellow (medium) → Orange (high) → Red (very high)
    if (intensity < 0.2) {
      // Blue (low intensity)
      const alpha = Math.floor(30 + intensity * 50).toString(16).padStart(2, '0')
      return `#1e3a8a${alpha}` // Dark blue
    } else if (intensity < 0.4) {
      // Green (medium-low)
      const alpha = Math.floor(60 + (intensity - 0.2) * 100).toString(16).padStart(2, '0')
      return `#059669${alpha}` // Green
    } else if (intensity < 0.6) {
      // Yellow (medium)
      const alpha = Math.floor(100 + (intensity - 0.4) * 80).toString(16).padStart(2, '0')
      return `#eab308${alpha}` // Yellow
    } else if (intensity < 0.8) {
      // Orange (high)
      const alpha = Math.floor(140 + (intensity - 0.6) * 60).toString(16).padStart(2, '0')
      return `#f97316${alpha}` // Orange
    } else {
      // Red (very high)
      const alpha = Math.floor(180 + (intensity - 0.8) * 75).toString(16).padStart(2, '0')
      return `#dc2626${alpha}` // Red
    }
  }

  // Create heatmap with color gradient based on intensity
  const createHeatmap = (
    ctx: CanvasRenderingContext2D,
    wards: WardPosition[],
    canvasWidth: number,
    canvasHeight: number,
    mapOffsets: { offsetX: number; offsetY: number; mapWidth: number; mapHeight: number }
  ) => {
    if (wards.length === 0) return

    const mapMin = -8000
    const mapMax = 8000
    const mapRange = mapMax - mapMin

    // Convert world coordinates to minimap coordinates
    const worldToMinimap = (x: number, y: number) => {
      const minimapX = mapOffsets.offsetX + ((x - mapMin) / mapRange) * mapOffsets.mapWidth
      const minimapY = mapOffsets.offsetY + mapOffsets.mapHeight - ((y - mapMin) / mapRange) * mapOffsets.mapHeight
      return { x: minimapX, y: minimapY }
    }

    // Grid-based heatmap
    const gridSize = 20
    const grid: { [key: string]: number } = {}

    // Build grid
    wards.forEach(ward => {
      const { x, y } = worldToMinimap(ward.x, ward.y)
      const gridX = Math.floor(x / gridSize)
      const gridY = Math.floor(y / gridSize)
      const key = `${gridX},${gridY}`
      grid[key] = (grid[key] || 0) + 1
    })

    // Find max count for normalization
    const maxCount = Math.max(...Object.values(grid), 1)

    // Draw heatmap with gradient colors
    Object.entries(grid).forEach(([key, count]) => {
      if (count === 0) return
      
      const [gridX, gridY] = key.split(',').map(Number)
      const intensity = Math.min(count / maxCount, 1)
      const centerX = gridX * gridSize + gridSize / 2
      const centerY = gridY * gridSize + gridSize / 2
      const radius = gridSize * (1.2 + intensity * 2.0) // Larger radius for better visibility

      // Get color based on intensity
      const color = getHeatmapColor(intensity)

      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      )
      
      // Extract RGB from hex color
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      const alpha = parseInt(color.slice(7, 9), 16) / 255

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`)
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`)
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  // Calculate responsive canvas size
  useEffect(() => {
    if (!containerRef.current) return
    
    const updateCanvasSize = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth - 64 // Account for padding and gap
      // Each canvas takes ~48% of width (side-by-side with gap)
      const maxSize = Math.min(Math.floor(containerWidth * 0.48), 500)
      setCanvasSize({ width: maxSize, height: maxSize })
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Draw Observer canvas
  useEffect(() => {
    const canvas = observerCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const canvasWidth = canvasSize.width
    const canvasHeight = canvasSize.height
    
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    const mapOffsets = drawMinimapBackground(ctx, canvasWidth, canvasHeight)
    createHeatmap(ctx, observerWards, canvasWidth, canvasHeight, mapOffsets)
  }, [observerWards, canvasSize])

  // Draw Sentry canvas
  useEffect(() => {
    const canvas = sentryCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const canvasWidth = canvasSize.width
    const canvasHeight = canvasSize.height
    
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    const mapOffsets = drawMinimapBackground(ctx, canvasWidth, canvasHeight)
    createHeatmap(ctx, sentryWards, canvasWidth, canvasHeight, mapOffsets)
  }, [sentryWards, canvasSize])

  return (
    <div className="space-y-6">
      {/* Two Panels Side-by-Side */}
      <div 
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Observer Panel */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-blue-400 mb-2">Observer Wards</h3>
            <p className="text-sm text-gray-400">
              Posizioni delle Observer Wards piazzate
            </p>
            <div className="mt-2">
              <span className="text-lg font-semibold text-white">
                Totale: <span className="text-blue-400">{observerWards.length}</span>
              </span>
            </div>
          </div>
          <div className="flex justify-center">
            <canvas
              ref={observerCanvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="max-w-full h-auto border border-gray-600 rounded shadow-xl"
              style={{ 
                width: '100%', 
                height: 'auto',
                maxWidth: '500px'
              }}
            />
          </div>
        </div>

        {/* Sentry Panel */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-green-400 mb-2">Sentry Wards</h3>
            <p className="text-sm text-gray-400">
              Posizioni delle Sentry Wards piazzate
            </p>
            <div className="mt-2">
              <span className="text-lg font-semibold text-white">
                Totale: <span className="text-green-400">{sentryWards.length}</span>
              </span>
            </div>
          </div>
          <div className="flex justify-center">
            <canvas
              ref={sentryCanvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="max-w-full h-auto border border-gray-600 rounded shadow-xl"
              style={{ 
                width: '100%', 
                height: 'auto',
                maxWidth: '500px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-4 text-center">
          Legenda Intensità Heatmap
        </h4>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(to right, #1e3a8a80, #1e3a8a00)' }}></div>
            <span className="text-xs text-gray-400">Bassa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(to right, #05966980, #05966900)' }}></div>
            <span className="text-xs text-gray-400">Media-Bassa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(to right, #eab30880, #eab30800)' }}></div>
            <span className="text-xs text-gray-400">Media</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(to right, #f9731680, #f9731600)' }}></div>
            <span className="text-xs text-gray-400">Alta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(to right, #dc262680, #dc262600)' }}></div>
            <span className="text-xs text-gray-400">Molto Alta</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          I colori indicano la frequenza di ward placement in ogni area. Rosso = area molto frequentata.
        </p>
      </div>

      {/* Info message when no data */}
      {observerWards.length === 0 && sentryWards.length === 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
          <div className="text-yellow-200 text-sm flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            <span>Nessuna ward trovata. La partita potrebbe non avere replay disponibili o dati wardmap.</span>
          </div>
        </div>
      )}
    </div>
  )
}
