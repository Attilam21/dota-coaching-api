'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Play, BookOpen } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector per elemento da evidenziare
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Benvenuto in PRO DOTA ANALISI!',
    description: 'Questa guida ti aiuterà a scoprire tutte le funzionalità della piattaforma. Puoi saltare o riprendere il tour in qualsiasi momento dalla sezione "Guida Utente".',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Dashboard Panoramica',
    description: 'La pagina principale mostra le tue statistiche aggregate delle ultime 20 partite: winrate, KDA, GPM/XPM e trend delle performance. I trend confrontano le ultime 5 e 10 partite. Usa questa pagina come punto di partenza.',
    target: '[data-tour="dashboard-overview"]',
    position: 'bottom',
  },
  {
    id: 'navigation',
    title: 'Navigazione',
    description: 'La sidebar ti permette di accedere a tutte le sezioni: statistiche giocatore, analisi partite, coaching e analisi avanzate. Ogni sezione ha un colore diverso per facilitare la navigazione.',
    target: '[data-tour="sidebar"]',
    position: 'right',
  },
  {
    id: 'help',
    title: 'Pulsante Help',
    description: 'In ogni pagina troverai un pulsante Help in alto a destra. Cliccalo per vedere una guida specifica sulla pagina corrente con spiegazioni dettagliate.',
    target: '[data-tour="help-button"]',
    position: 'bottom',
  },
  {
    id: 'player-id',
    title: 'Configura Player ID',
    description: 'Prima di iniziare, assicurati di aver configurato il tuo Dota 2 Account ID nelle Impostazioni. Questo è necessario per visualizzare le tue statistiche.',
    target: '[data-tour="settings"]',
    position: 'right',
  },
  {
    id: 'match-analysis',
    title: 'Analisi Partite',
    description: 'Puoi analizzare singole partite in dettaglio. Vai su "Seleziona Partita" per scegliere una partita e vedere analisi complete con tabs per Overview, Fasi, Item Timing e Teamfight.',
    target: '[data-tour="match-analysis"]',
    position: 'right',
  },
  {
    id: 'coaching',
    title: 'Coaching & Task',
    description: 'La sezione Coaching ti fornisce task personalizzati e raccomandazioni basate sulle tue performance. Completa i task per migliorare le tue skill.',
    target: '[data-tour="coaching"]',
    position: 'right',
  },
  {
    id: 'advanced',
    title: 'Analisi Avanzate',
    description: 'Le Analisi Avanzate sono divise in 4 categorie: Lane & Early Game, Farm & Economy, Fights & Damage, Vision & Map Control. Ogni categoria offre metriche dettagliate.',
    target: '[data-tour="advanced"]',
    position: 'right',
  },
  {
    id: 'complete',
    title: 'Tour Completato!',
    description: 'Ora conosci le basi della piattaforma. Esplora le diverse sezioni e usa il pulsante Help in ogni pagina per maggiori dettagli. Buon miglioramento!',
    position: 'center',
  },
]

interface OnboardingTourProps {
  onComplete?: () => void
  initialStep?: number
}

export default function OnboardingTour({ onComplete, initialStep = 0 }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isVisible, setIsVisible] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)

  const step = tourSteps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === tourSteps.length - 1

  // Calcola posizione del tooltip basato su target
  useEffect(() => {
    if (step.target && step.position !== 'center') {
      const element = document.querySelector(step.target)
      if (element) {
        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentStep, step.target, step.position])

  const handleNext = () => {
    if (isLast) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsVisible(false)
    if (onComplete) {
      onComplete()
    }
  }

  if (!isVisible) {
    return null
  }

  // Se position è center, mostra modal centrato
  if (step.position === 'center') {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800 border border-gray-700 rounded-lg max-w-lg w-full p-6 relative z-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold text-white">{step.title}</h2>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">{step.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {!isFirst && (
                  <button
                    onClick={handlePrevious}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Indietro
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Salta
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  {isLast ? 'Fine' : 'Avanti'}
                  {!isLast && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 flex gap-1 justify-center">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-red-500 w-8'
                      : index < currentStep
                      ? 'bg-red-500/50 w-2'
                      : 'bg-gray-700 w-2'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  }

  // Tooltip posizionato
  return (
    <AnimatePresence>
      <div ref={overlayRef} className="fixed inset-0 z-[99998] pointer-events-none">
        {/* Highlight overlay */}
        {step.target && (
          <div className="absolute inset-0 bg-black/60">
            {(() => {
              const element = document.querySelector(step.target)
              if (!element) return null

              const rect = element.getBoundingClientRect()
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute border-4 border-red-500 rounded-lg shadow-2xl"
                  style={{
                    left: rect.left - 4,
                    top: rect.top - 4,
                    width: rect.width + 8,
                    height: rect.height + 8,
                    pointerEvents: 'none',
                  }}
                />
              )
            })()}
          </div>
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute z-[99999] pointer-events-auto"
          style={{
            ...(step.target
              ? (() => {
                  const element = document.querySelector(step.target)
                  if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

                  const rect = element.getBoundingClientRect()
                  const tooltipWidth = 320
                  const tooltipHeight = 200
                  const spacing = 20

                  let top = 0
                  let left = 0

                  switch (step.position) {
                    case 'top':
                      top = rect.top - tooltipHeight - spacing
                      left = rect.left + rect.width / 2 - tooltipWidth / 2
                      break
                    case 'bottom':
                      top = rect.bottom + spacing
                      left = rect.left + rect.width / 2 - tooltipWidth / 2
                      break
                    case 'left':
                      top = rect.top + rect.height / 2 - tooltipHeight / 2
                      left = rect.left - tooltipWidth - spacing
                      break
                    case 'right':
                      top = rect.top + rect.height / 2 - tooltipHeight / 2
                      left = rect.right + spacing
                      break
                  }

                  // Boundary checks
                  if (left < 20) left = 20
                  if (left + tooltipWidth > window.innerWidth - 20) {
                    left = window.innerWidth - tooltipWidth - 20
                  }
                  if (top < 20) top = 20
                  if (top + tooltipHeight > window.innerHeight - 20) {
                    top = window.innerHeight - tooltipHeight - 20
                  }

                  return { top: `${top}px`, left: `${left}px` }
                })()
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
          }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-2xl max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">{step.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {!isFirst && (
                  <button
                    onClick={handlePrevious}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Indietro
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Salta
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  {isLast ? 'Fine' : 'Avanti'}
                  {!isLast && <ChevronRight className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-3 flex gap-1 justify-center">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-red-500 w-6'
                      : index < currentStep
                      ? 'bg-red-500/50 w-1.5'
                      : 'bg-gray-700 w-1.5'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

