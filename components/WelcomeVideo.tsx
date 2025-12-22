'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface WelcomeVideoProps {
  videoSrc: string // Path to video file (e.g., '/videos/welcome.mp4')
  title?: string
  autoPlay?: boolean
  showControls?: boolean
  onClose?: () => void
  className?: string
}

export default function WelcomeVideo({
  videoSrc,
  title = 'Video di Benvenuto',
  autoPlay = false,
  showControls = true,
  onClose,
  className = ''
}: WelcomeVideoProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [showVideo, setShowVideo] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch((err) => {
        console.error('Auto-play failed:', err)
        // Most browsers block auto-play with sound, so we mute it
        if (videoRef.current) {
          videoRef.current.muted = true
          setIsMuted(true)
        }
      })
    }
  }, [autoPlay])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      videoRef.current.src = ''
    }
    setShowVideo(false)
    if (onClose) {
      onClose()
    }
  }

  if (!showVideo) return null

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl ${className}`}>
      {/* Header with title and close button */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        {onClose && (
          <button
            onClick={handleClose}
            className="text-white hover:text-red-400 transition-colors p-2 hover:bg-white/10 rounded-full z-30"
            aria-label="Chiudi video"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Video element */}
      <div className="w-full" style={{ maxHeight: '90vh' }}>
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          controls={showControls}
          muted={isMuted}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false)
            if (onClose) {
              handleClose()
            }
          }}
        />
      </div>

      {/* Custom controls overlay (if showControls is false) */}
      {!showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePlay}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
              aria-label={isPlaying ? 'Pausa' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="bg-gray-800/80 hover:bg-gray-700/80 text-white p-3 rounded-full transition-colors"
              aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

