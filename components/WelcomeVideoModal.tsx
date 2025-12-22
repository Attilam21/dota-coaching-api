'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import WelcomeVideo from './WelcomeVideo'

interface WelcomeVideoModalProps {
  videoSrc: string
  title?: string
  showOnFirstVisit?: boolean
  storageKey?: string // Key for localStorage to track if user has seen the video
}

export default function WelcomeVideoModal({
  videoSrc,
  title = 'Video di Benvenuto',
  showOnFirstVisit = true,
  storageKey = 'welcome-video-seen'
}: WelcomeVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeenVideo, setHasSeenVideo] = useState(false)

  useEffect(() => {
    if (showOnFirstVisit) {
      // Check if user has seen the video before
      const seen = localStorage.getItem(storageKey)
      if (!seen) {
        // Show video after a short delay for better UX
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 1000)
        return () => clearTimeout(timer)
      } else {
        setHasSeenVideo(true)
      }
    }
  }, [showOnFirstVisit, storageKey])

  const handleClose = () => {
    setIsOpen(false)
    if (showOnFirstVisit) {
      // Mark video as seen
      localStorage.setItem(storageKey, 'true')
      setHasSeenVideo(true)
    }
  }

  if (!isOpen || hasSeenVideo) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4">
        <WelcomeVideo
          videoSrc={videoSrc}
          title={title}
          autoPlay={true}
          showControls={true}
          onClose={handleClose}
          className="max-h-[90vh]"
        />
      </div>
    </div>
  )
}

