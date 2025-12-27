'use client'

import { useBackgroundPreference } from './useBackgroundPreference'

/**
 * Hook per ottenere classi CSS standardizzate per il dashboard
 * Adatta automaticamente contrasti, trasparenze e backdrop in base al background
 * Usa trasparenze intermedie che funzionano sia per sfondi scuri che vivaci
 */
export function useDashboardStyles() {
  const { backgroundUrl, background } = useBackgroundPreference()
  const hasBackground = !!backgroundUrl

  // Classifica sfondi: quelli vivaci/complessi richiedono trasparenze più alte
  const isVibrantBackground = background === 'landa desolata.jpeg' || 
                               background === 'sfondo pop.jpeg' ||
                               background === 'profile-bg.jpg' ||
                               background === 'profile-bg.png'

  // Trasparenze intermedie: più alte per sfondi vivaci, medie per sfondi scuri
  const cardOpacity = isVibrantBackground ? '85' : '80'
  const cardSubtleOpacity = isVibrantBackground ? '70' : '60'
  const containerOpacity = isVibrantBackground ? '80' : '70'
  const overlayOpacity = isVibrantBackground ? '85' : '80'
  const overlaySubtleOpacity = isVibrantBackground ? '70' : '60'
  
  // Drop-shadow più forte per sfondi vivaci
  const textShadow = isVibrantBackground ? 'drop-shadow-md' : 'drop-shadow-sm'

  return {
    // Card styles - Standard card con bordo e background
    card: hasBackground
      ? `bg-gray-800/${cardOpacity} backdrop-blur-sm border border-gray-700/${cardOpacity} rounded-lg`
      : 'bg-gray-800 border border-gray-700 rounded-lg',
    
    // Card styles - Card con trasparenza maggiore (per nested cards)
    cardSubtle: hasBackground
      ? `bg-gray-800/${cardSubtleOpacity} backdrop-blur-sm border border-gray-700/${cardSubtleOpacity} rounded-lg`
      : 'bg-gray-800/50 border border-gray-700 rounded-lg',
    
    // Container styles - Container principale per tabs e sezioni
    container: hasBackground
      ? `bg-gray-800/${containerOpacity} backdrop-blur-sm border border-gray-700 rounded-lg`
      : 'bg-gray-800 border border-gray-700 rounded-lg',
    
    // Tab container - Container per tab navigation
    tabContainer: hasBackground
      ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg'
      : 'bg-gray-800 border border-gray-700 rounded-lg',
    
    // Text styles - Testo primario (titoli, valori importanti)
    textPrimary: hasBackground
      ? `text-white ${textShadow}`
      : 'text-white',
    
    // Text styles - Testo secondario (descrizioni, labels)
    textSecondary: hasBackground
      ? `text-gray-300 ${textShadow}`
      : 'text-gray-400',
    
    // Text styles - Testo muted (info secondarie)
    textMuted: 'text-gray-500',
    
    // Text styles - Testo per link e hover
    textLink: hasBackground
      ? `text-gray-300 hover:text-white ${textShadow}`
      : 'text-gray-400 hover:text-white',
    
    // Background overlay - Per sezioni speciali (info boxes, alerts)
    overlay: hasBackground
      ? `bg-gray-800/${overlayOpacity} backdrop-blur-sm`
      : 'bg-gray-800',
    
    // Background overlay - Overlay più trasparente
    overlaySubtle: hasBackground
      ? `bg-gray-800/${overlaySubtleOpacity} backdrop-blur-sm`
      : 'bg-gray-800/50',
    
    // Utility - Flag per sapere se c'è background
    hasBackground,
  }
}

