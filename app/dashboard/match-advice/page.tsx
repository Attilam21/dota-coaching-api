'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import Link from 'next/link'
import HelpButton from '@/components/HelpButton'
import { Target, ArrowRight, Gamepad2, ExternalLink } from 'lucide-react'

export default function MatchAdvicePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [matchId, setMatchId] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!matchId.trim()) {
      setError('Inserisci un Match ID valido')
      return
    }

    if (!playerId) {
      setError('Player ID non disponibile. Assicurati di aver selezionato un profilo.')
      return
    }

    router.push(`/dashboard/match-advice/${matchId.trim()}`)
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Analisi Partita</h1>
        <HelpButton />
      </div>

      {playerId && (
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-semibold mb-1">💡 Accesso Rapido</p>
              <p className="text-sm text-gray-300">
                Vai alla pagina <strong>Storico Partite</strong> per selezionare una partita e accedere direttamente all'Analisi Tommaso senza inserire l'ID manualmente.
              </p>
            </div>
            <Link
              href="/dashboard/matches"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap ml-4"
            >
              <Gamepad2 className="w-4 h-4" />
              Vai a Storico Partite
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold">Consigli Specifici per Partita</h2>
        </div>
        
        <p className="text-gray-300 mb-6">
          {playerId 
            ? "Inserisci il Match ID manualmente oppure usa il link sopra per selezionare una partita:"
            : "Inserisci il Match ID per ricevere consigli personalizzati su:"
          }
        </p>

        <ul className="space-y-2 mb-6 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span><strong>Azioni fatte bene/male:</strong> Analisi delle tue performance specifiche</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span><strong>Composizione team:</strong> Analisi sinergie, gap e consigli draft</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span><strong>Consigli macro:</strong> Decisioni strategiche e timing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span><strong>Consigli micro:</strong> Meccaniche di gioco e item timing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">•</span>
            <span><strong>Teamplay:</strong> Come giocare meglio con il team</span>
          </li>
        </ul>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="matchId" className="block text-sm font-medium text-gray-300 mb-2">
              Match ID
            </label>
            <input
              type="text"
              id="matchId"
              value={matchId}
              onChange={(e) => {
                setMatchId(e.target.value)
                setError(null)
              }}
              placeholder="Inserisci il Match ID (es. 1234567890)"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold"
            >
              Analizza Partita
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <Link
              href="/dashboard/matches"
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Gamepad2 className="w-5 h-5" />
              Vedi Storico Partite
            </Link>
          </div>
        </form>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>💡 Suggerimento:</strong> Puoi trovare il Match ID nella pagina "Storico Partite" o direttamente dal replay di Dota 2.
        </p>
      </div>
    </div>
  )
}

