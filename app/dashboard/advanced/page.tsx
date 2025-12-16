'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdvancedPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [playerId, setPlayerId] = useState<string>('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="p-8">
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
      icon: '🎯',
      description: 'Analisi della fase di lane e early game: CS, XP, lane winrate, first blood involvement.',
      href: '/dashboard/advanced/lane-early',
      color: 'border-green-700',
    },
    {
      title: 'Farm & Economy',
      icon: '💰',
      description: 'Efficienza di farm e economy: GPM, XPM, dead gold, item timing, gold lead.',
      href: '/dashboard/advanced/farm-economy',
      color: 'border-yellow-700',
    },
    {
      title: 'Fights & Damage',
      icon: '⚔️',
      description: 'Contributo ai fight e damage output: kill participation, damage share, teamfight impact.',
      href: '/dashboard/advanced/fights-damage',
      color: 'border-red-700',
    },
    {
      title: 'Vision & Map Control',
      icon: '🗺️',
      description: 'Controllo mappa e visione: wards piazzate/rimosse, heatmap posizioni, map control.',
      href: '/dashboard/advanced/vision-control',
      color: 'border-blue-700',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analisi Avanzate</h1>
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
          <p className="text-green-200">
            Analisi basate sul tuo storico recente (fino a 20 partite) – Valori medi/aggregati
          </p>
          <p className="text-green-300 text-sm mt-2">
            Questa sezione mostra valori medi e aggregati sulle ultime N partite. Per analizzare una singola partita in dettaglio, vai alla sezione 'Analisi partita (singola)'.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {analysisCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`bg-gray-800 border ${card.color} rounded-lg p-6 hover:bg-gray-750 transition cursor-pointer`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{card.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-gray-400 text-sm">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Analisi Approfondite</h2>
        <p className="text-gray-400 mb-4">
          Le analisi avanzate forniscono metriche dettagliate e visualizzazioni approfondite delle tue performance di gioco.
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard/match-analysis"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
          >
            Analisi Partita Singola
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            Torna alla Panoramica
          </Link>
        </div>
      </div>
    </div>
  )
}

