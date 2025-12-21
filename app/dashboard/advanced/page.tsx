'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'
import { Target, Coins, Sword, Map } from 'lucide-react'
import AnimatedCard from '@/components/AnimatedCard'
import AnimatedPage from '@/components/AnimatedPage'
import AnimatedButton from '@/components/AnimatedButton'
import { motion } from 'framer-motion'

export default function AdvancedPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

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

  const analysisCards = [
    {
      title: 'Lane & Early Game',
      icon: Target,
      description: 'Analisi della fase di lane e early game: CS, XP, lane winrate, first blood involvement.',
      href: '/dashboard/advanced/lane-early',
      color: 'border-green-700',
    },
    {
      title: 'Farm & Economy',
      icon: Coins,
      description: 'Efficienza di farm e economy: GPM, XPM, dead gold, item timing, gold lead.',
      href: '/dashboard/advanced/farm-economy',
      color: 'border-yellow-700',
    },
    {
      title: 'Fights & Damage',
      icon: Sword,
      description: 'Contributo ai fight e damage output: kill participation, damage share, teamfight impact.',
      href: '/dashboard/advanced/fights-damage',
      color: 'border-red-700',
    },
    {
      title: 'Vision & Map Control',
      icon: Map,
      description: 'Controllo mappa e visione: wards piazzate/rimosse, heatmap posizioni, map control.',
      href: '/dashboard/advanced/vision-control',
      color: 'border-blue-700',
    },
  ]

  return (
    <AnimatedPage>
      <div className="p-4 md:p-6">
        <HelpButton />
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analisi Avanzate</h1>
          <AnimatedCard delay={0.1} className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
          <p className="text-green-200">
            Analisi basate sul tuo storico recente (fino a 20 partite) – Valori medi/aggregati
          </p>
          <p className="text-green-300 text-sm mt-2">
            Questa sezione mostra valori medi e aggregati sulle ultime N partite. Per analizzare una singola partita in dettaglio, vai alla sezione 'Analisi partita (singola)'.
          </p>
          </AnimatedCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysisCards.map((card, index) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (index * 0.1), duration: 0.4 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <Link
                href={card.href}
                className={`block bg-gray-800 border ${card.color} rounded-lg p-6 hover:bg-gray-700/50 transition cursor-pointer`}
              >
            <div className="flex items-start gap-4">
              <div className="text-red-400">
                <card.icon className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2">{card.title}</h3>
                <p className="text-gray-400 text-sm">{card.description}</p>
              </div>
            </div>
            </Link>
          </motion.div>
        ))}
        </div>

        <AnimatedCard delay={0.6} className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Analisi Approfondite</h2>
          <p className="text-gray-400 mb-4">
            Le analisi avanzate forniscono metriche dettagliate e visualizzazioni approfondite delle tue performance di gioco.
          </p>
          <div className="flex gap-4">
            <AnimatedButton
              variant="primary"
              onClick={() => window.location.href = '/dashboard/matches'}
            >
              Visualizza Partite
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              onClick={() => window.location.href = '/dashboard'}
            >
              Torna alla Panoramica
            </AnimatedButton>
          </div>
        </AnimatedCard>
      </div>
    </AnimatedPage>
  )
}

