'use client'

import { useBackgroundPreference } from './useBackgroundPreference'

/**
 * Hook per ottenere classi CSS standardizzate per il dashboard
 * Adatta automaticamente contrasti, trasparenze e backdrop in base al background
 */
export function useDashboardStyles() {
  const { backgroundUrl } = useBackgroundPreference()
  const hasBackground = !!backgroundUrl

  return {
    // Card styles - Standard card con bordo e background
    card: hasBackground
      ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/80 rounded-lg'
      : 'bg-gray-800 border border-gray-700 rounded-lg',
    
    // Card styles - Card con trasparenza maggiore (per nested cards)
    cardSubtle: hasBackground
      ? 'bg-gray-800/60 backdrop-blur-sm border border-gray-700/60 rounded-lg'
      : 'bg-gray-800/50 border border-gray-700 rounded-lg',
    
    // Container styles - Container principale per tabs e sezioni
    container: hasBackground
      ? 'bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg'
      : 'bg-gray-800 border border-gray-700 rounded-lg',
    
    // Tab container - Container per tab navigation
    tabContainer: hasBackground
      ? 'bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-lg'
      : 'bg-gray-800 border border-gray-700 rounded-lg',
    
    // Text styles - Testo primario (titoli, valori importanti)
    textPrimary: hasBackground
      ? 'text-white drop-shadow-sm'
      : 'text-white',
    
    // Text styles - Testo secondario (descrizioni, labels)
    textSecondary: hasBackground
      ? 'text-gray-300 drop-shadow-sm'
      : 'text-gray-400',
    
    // Text styles - Testo muted (info secondarie)
    textMuted: 'text-gray-500',
    
    // Text styles - Testo per link e hover
    textLink: hasBackground
      ? 'text-gray-300 hover:text-white drop-shadow-sm'
      : 'text-gray-400 hover:text-white',
    
    // Background overlay - Per sezioni speciali (info boxes, alerts)
    overlay: hasBackground
      ? 'bg-gray-800/80 backdrop-blur-sm'
      : 'bg-gray-800',
    
    // Background overlay - Overlay più trasparente
    overlaySubtle: hasBackground
      ? 'bg-gray-800/60 backdrop-blur-sm'
      : 'bg-gray-800/50',
    
    // Utility - Flag per sapere se c'è background
    hasBackground,
  }
}

