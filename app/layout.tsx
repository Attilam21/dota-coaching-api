import './globals.css'
import type { Metadata } from 'next'

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
        <nav className="border-b bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-red-600">Dota 2 Coach</h1>
              </div>
              <div className="flex space-x-4">
                <a href="/" className="text-gray-700 hover:text-red-600 px-3 py-2">Home</a>
                <a href="/analysis" className="text-gray-700 hover:text-red-600 px-3 py-2">Analysis</a>
                <a href="/learning" className="text-gray-700 hover:text-red-600 px-3 py-2">Learning</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">{children}</main>
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              © 2025 Dota 2 Coaching Platform. Powered by OpenDota API.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
