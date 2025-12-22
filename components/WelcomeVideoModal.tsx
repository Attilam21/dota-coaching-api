'use client'

import { useState, useEffect } from 'react'
import WelcomeVideo from './WelcomeVideo'

interface WelcomeVideoModalProps {
  videoSrc: string
  title?: string
  showOnFirstVisit?: boolean
  storageKey?: string
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
      try {
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
      } catch (err) {
        console.error('Failed to check video status:', err)
      }
    }
  }, [showOnFirstVisit, storageKey])

  const handleClose = () => {
    setIsOpen(false)
    if (showOnFirstVisit) {
      // Mark video as seen
      try {
        localStorage.setItem(storageKey, 'true')
        setHasSeenVideo(true)
      } catch (err) {
        console.error('Failed to save video status:', err)
      }
    }
  }

  // Funzione per aprire manualmente (chiamata da pulsante)
  const openVideo = () => {
    setHasSeenVideo(false) // Reset per permettere la visualizzazione
    setIsOpen(true)
  }

  // Esponi la funzione per aprire manualmente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openWelcomeVideo = openVideo
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).openWelcomeVideo
      }
    }
  }, [])

  // Listener per eventi custom (da pulsante)
  useEffect(() => {
    const handleOpenVideo = () => {
      openVideo()
    }
    
    window.addEventListener('openWelcomeVideoEvent', handleOpenVideo)
    return () => {
      window.removeEventListener('openWelcomeVideoEvent', handleOpenVideo)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4" style={{ height: '90vh', maxHeight: '90vh' }}>
        <WelcomeVideo
          videoSrc={videoSrc}
          title={title}
          autoPlay={true}
          showControls={true}
          onClose={handleClose}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

