'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Info, ExternalLink, Settings } from 'lucide-react'

interface PlayerIdInputProps {
  title: string
  description: string
  pageTitle?: string
}

export default function PlayerIdInput({ title, description, pageTitle }: PlayerIdInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      // NOTA: NON salvare nello state globale - l'ID deve essere salvato SOLO nelle settings
      // Questo componente serve solo per mostrare il form, non per salvare l'ID
      // L'utente deve andare in /dashboard/settings per salvare permanentemente l'ID
      window.location.href = `/dashboard/settings?playerId=${encodeURIComponent(inputValue.trim())}`
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {pageTitle && <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>}
        
        {/* Guida rapida per nuovo utente */}
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-green-200 mb-2">Prima volta qui?</h3>
              <p className="text-gray-300 mb-3">
                Per far funzionare la dashboard, hai bisogno del tuo Dota 2 Account ID. Ecco come ottenerlo:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm mb-4">
                <li>
                  Vai su{' '}
                  <a
                    href="https://www.opendota.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 underline inline-flex items-center gap-1"
                  >
                    OpenDota <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  e cerca il tuo nome utente Steam
                </li>
                <li>Copia il numero dell&apos;Account ID dalla pagina del tuo profilo</li>
                <li>Incolla qui sotto e clicca &quot;Carica&quot; per vedere subito le statistiche</li>
                <li>
                  <strong>Consiglio:</strong> Salva l&apos;ID nel{' '}
                  <Link href="/dashboard/settings" className="text-green-400 hover:text-green-300 underline inline-flex items-center gap-1">
                    Profilo <Settings className="w-3 h-3" />
                  </Link>{' '}
                  (menu in basso a sinistra) per non doverlo reinserire ogni volta
                </li>
              </ol>
              <p className="text-sm text-green-200 font-medium">
                Una volta salvato, vedrai popolarsi automaticamente la dashboard con tutte le tue statistiche!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-200">{title}</h2>
          <p className="text-gray-300 mb-6">{description}</p>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="es. 1903287666"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Carica
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-blue-700">
            <Link
              href="/dashboard/settings"
              className="text-blue-300 hover:text-blue-200 text-sm inline-flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Salva l&apos;ID nel profilo per non doverlo reinserire ogni volta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

