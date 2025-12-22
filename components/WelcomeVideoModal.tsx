'use client'

import { useState, useEffect } from 'react'
import WelcomeVideo from './WelcomeVideo'

interface WelcomeVideoModalProps {
  videoSrc: string
  title?: string
}

export default function WelcomeVideoModal({
  videoSrc,
  title = 'Video di Benvenuto'
}: WelcomeVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Show video every time the component mounts (every dashboard access)
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl mx-4">
        <WelcomeVideo
          videoSrc={videoSrc}
          title={title}
          autoPlay={true}
          showControls={true}
          onClose={handleClose}
          className="w-full"
        />
      </div>
    </div>
  )
}

