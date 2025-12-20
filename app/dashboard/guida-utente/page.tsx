'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import OnboardingTour from '@/components/OnboardingTour'
import { 
  BookOpen, 
  Play, 
  HelpCircle, 
  Target, 
  Zap, 
  BarChart,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function GuidaUtentePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const quickGuides = [
    {
      title: 'Inizia da qui',
      description: 'Configura il tuo Dota 2 Account ID nelle Impostazioni per iniziare a vedere le tue statistiche.',
      icon: Target,
      href: '/dashboard/settings',
      color: 'bg-blue-900/30 border-blue-700',
    },
    {
      title: 'Panoramica Dashboard',
      description: 'La pagina principale mostra le tue statistiche aggregate: winrate, KDA, GPM/XPM e trend.',
      icon: BarChart,
      href: '/dashboard',
      color: 'bg-green-900/30 border-green-700',
    },
    {
      title: 'Analisi Partite',
      description: 'Analizza singole partite in dettaglio con tabs per Overview, Fasi, Item Timing e Teamfight.',
      icon: Zap,
      href: '/dashboard/match-analysis',
      color: 'bg-yellow-900/30 border-yellow-700',
    },
    {
      title: 'Help in ogni pagina',
      description: 'Clicca il pulsante Help in alto a destra in qualsiasi pagina per vedere una guida specifica.',
      icon: HelpCircle,
      href: null,
      color: 'bg-purple-900/30 border-purple-700',
    },
  ]

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <BookOpen className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Guida Utente</h1>
            <p className="text-gray-400 mt-1">Scopri come usare PRO DOTA ANALISI - AttilaLAB</p>
          </div>
        </div>
      </div>

      {/* Tour Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-gradient-to-r from-red-900/30 to-purple-900/30 border border-red-700 rounded-lg p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-red-400" />
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Tour Guidato Interattivo</h2>
              <p className="text-gray-300 text-sm">
                Fai un tour completo della piattaforma con una guida passo-passo che ti mostra tutte le funzionalità principali.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Play className="w-5 h-5" />
            Avvia Tour
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4" />
            <span>Disponibile sempre</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Guides */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Guide Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickGuides.map((guide, index) => (
            <motion.div
              key={guide.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${guide.color} border rounded-lg p-5`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-800/50 rounded-lg">
                  <guide.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{guide.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{guide.description}</p>
                  {guide.href && (
                    <a
                      href={guide.href}
                      className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Vai alla sezione
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Sezioni Principali</h2>
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">📊 Statistiche Giocatore</h3>
            <p className="text-gray-300 text-sm mb-2">
              Panoramica, Performance & Stile, Hero Pool, Analisi Eroi e Analisi Ruolo. 
              Queste sezioni ti mostrano le tue statistiche aggregate e ti aiutano a capire il tuo stile di gioco.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-green-400 mb-2">👥 Team & Partite</h3>
            <p className="text-gray-300 text-sm mb-2">
              I Tuoi Compagni e Storico Partite. Analizza le sinergie con i tuoi compagni di squadra 
              e visualizza tutte le tue partite recenti.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">🎮 Analisi Partita</h3>
            <p className="text-gray-300 text-sm mb-2">
              Seleziona una partita e analizzala in dettaglio con tabs per Overview, Fasi di Gioco, 
              Item Timing e Teamfight. Confronta le tue performance con la tua media.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">📚 Coaching & Profilo</h3>
            <p className="text-gray-300 text-sm mb-2">
              Coaching & Meta, Profilo AttilaLAB, Riassunto IA e Anti-Tilt. 
              Ricevi task personalizzati e insights AI per migliorare le tue performance.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-orange-400 mb-2">🔬 Analisi Tecniche</h3>
            <p className="text-gray-300 text-sm mb-2">
              Analisi Avanzate (Lane, Farm, Fights, Vision) e Build & Items. 
              Metriche dettagliate per analizzare aspetti specifici del tuo gameplay.
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">💡 Consigli Utili</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Usa il pulsante <strong>Help</strong> in ogni pagina per vedere una guida specifica</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Configura il tuo Dota 2 Account ID nelle Impostazioni prima di iniziare</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Le analisi sono basate sulle tue ultime 10-20 partite</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Puoi riprendere questo tour in qualsiasi momento</span>
          </li>
        </ul>
      </div>

      {/* Tour Component */}
      {showTour && (
        <OnboardingTour
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  )
}

