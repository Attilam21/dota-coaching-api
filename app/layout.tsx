import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { PlayerIdProvider } from '@/lib/playerIdContext'
import { ModalProvider } from '@/lib/modal-context'
import ConditionalLayout from '@/components/ConditionalLayout'

export const metadata: Metadata = {
  title: 'PRO DOTA ANALISI - AttilaLAB',
  description: 'Analisi avanzate Dota 2 con AI-powered match analysis e statistiche dettagliate',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <AuthProvider>
          <PlayerIdProvider>
            <ModalProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </ModalProvider>
          </PlayerIdProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
