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
    // Verifica che il file esista prima di restituire l'URL
    // Se il file non esiste, fallback a dashboard-bg.jpg o null
    return `/${background}`
  }

  // Verifica se il background corrente è valido
  const isValidBackground = async (bg: BackgroundType): Promise<boolean> => {
    if (bg === 'none') return true
    try {
      const response = await fetch(`/${bg}`, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  return {
    background,
    backgroundUrl: getBackgroundUrl(),
    updateBackground,
    isLoading
  }
}

