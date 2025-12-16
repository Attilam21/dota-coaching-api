'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePlayerIdContext } from '@/lib/playerIdContext'

interface PlayerIdInputProps {
  title: string
  description: string
  pageTitle?: string
}

export default function PlayerIdInput({ title, description, pageTitle }: PlayerIdInputProps) {
  const { setPlayerId } = usePlayerIdContext()
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setPlayerId(inputValue.trim())
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {pageTitle && <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>}
        
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-200">Inserisci Player ID</h2>
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
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              Carica
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-blue-700">
            <Link
              href="/dashboard/settings"
              className="text-blue-300 hover:text-blue-200 text-sm"
            >
              → Salva l'ID nel profilo per non doverlo reinserire ogni volta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

