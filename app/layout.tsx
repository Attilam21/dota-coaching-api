import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'

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
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-50">{children}</main>
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500 text-sm">
                © 2025 Dota 2 Coaching Platform. Powered by OpenDota API.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
