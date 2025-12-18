import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { PlayerIdProvider } from '@/lib/playerIdContext'
import { ThemeProvider } from '@/lib/theme-context'
import ConditionalLayout from '@/components/ConditionalLayout'

export const metadata: Metadata = {
  title: 'Dota 2 Coaching Platform',
  description: 'AI-powered Dota 2 coaching with match analysis and personalized learning paths',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <ThemeProvider>
          <AuthProvider>
            <PlayerIdProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </PlayerIdProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
