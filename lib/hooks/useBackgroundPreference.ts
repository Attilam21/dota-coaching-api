'use client'

import { useState, useEffect } from 'react'

export type BackgroundType = 'dashboard-bg.jpg' | 'dashboard-bg.png' | 'profile-bg.jpg' | 'profile-bg.png' | 'none'

const STORAGE_KEY = 'dashboard_background_preference'

export function useBackgroundPreference() {
  const [background, setBackground] = useState<BackgroundType>('dashboard-bg.jpg')
  const [isLoading, setIsLoading] = useState(true)

  // Funzione per leggere da localStorage
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && (saved.endsWith('.jpg') || saved.endsWith('.png') || saved === 'none')) {
        return saved as BackgroundType
      }
    } catch (err) {
      console.error('Failed to load background preference:', err)
    }
    return 'dashboard-bg.jpg' as BackgroundType
  }

  useEffect(() => {
    // Load from localStorage on mount
    const saved = loadFromStorage()
    setBackground(saved)
    setIsLoading(false)

    // Listener per cambiamenti di localStorage (da altre tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue.endsWith('.jpg') || e.newValue.endsWith('.png') || e.newValue === 'none') {
          setBackground(e.newValue as BackgroundType)
        }
      }
    }

    // Listener per cambiamenti nella stessa tab (custom event)
    const handleCustomStorageChange = () => {
      const saved = loadFromStorage()
      setBackground(saved)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('backgroundPreferenceChanged', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('backgroundPreferenceChanged', handleCustomStorageChange)
    }
  }, [])

  const updateBackground = (newBackground: BackgroundType) => {
    try {
      localStorage.setItem(STORAGE_KEY, newBackground)
      setBackground(newBackground)
      // Trigger custom event per aggiornare altri componenti nella stessa tab
      window.dispatchEvent(new Event('backgroundPreferenceChanged'))
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

