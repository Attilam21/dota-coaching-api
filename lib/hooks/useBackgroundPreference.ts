'use client'

import { useState, useEffect } from 'react'

export type BackgroundType = 'dashboard-bg.jpg' | 'dashboard-bg.png' | 'profile-bg.jpg' | 'profile-bg.png' | 'none'

const STORAGE_KEY = 'dashboard_background_preference'

export function useBackgroundPreference() {
  const [background, setBackground] = useState<BackgroundType>('dashboard-bg.jpg')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && (saved.endsWith('.jpg') || saved.endsWith('.png') || saved === 'none')) {
        setBackground(saved as BackgroundType)
      }
    } catch (err) {
      console.error('Failed to load background preference:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateBackground = (newBackground: BackgroundType) => {
    try {
      localStorage.setItem(STORAGE_KEY, newBackground)
      setBackground(newBackground)
    } catch (err) {
      console.error('Failed to save background preference:', err)
    }
  }

  const getBackgroundUrl = (): string | null => {
    if (background === 'none') return null
    return `/${background}`
  }

  return {
    background,
    backgroundUrl: getBackgroundUrl(),
    updateBackground,
    isLoading
  }
}

