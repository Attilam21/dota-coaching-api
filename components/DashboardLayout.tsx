'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const navigation = [
    {
      title: 'ANALISI CORE',
      items: [
        { name: 'Panoramica', href: '/dashboard', icon: '📊' },
        { name: 'Performance & Stile di Gioco', href: '/dashboard/performance', icon: '⚡' },
        { name: 'Hero Pool', href: '/dashboard/heroes', icon: '🎭' },
        { name: 'Hero Analysis', href: '/dashboard/hero-analysis', icon: '🔍' },
        { name: 'Analisi Ruolo', href: '/dashboard/role-analysis', icon: '🎯' },
        { name: 'Team & Compagni', href: '/dashboard/teammates', icon: '👥' },
        { name: 'Partite', href: '/dashboard/matches', icon: '🎮' },
      ],
    },
    {
      title: 'COACHING',
      items: [
        { name: 'Coaching & Task', href: '/dashboard/coaching', icon: '📚' },
        { name: 'Profilazione FZTH', href: '/dashboard/profiling', icon: '🎯' },
      ],
    },
    {
      title: 'AVANZATO',
      items: [
        { name: 'Analisi avanzate', href: '/dashboard/advanced', icon: '🔬' },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { name: 'Profilo Utente', href: '/dashboard/settings', icon: '⚙️' },
      ],
    },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">FZTH Dashboard</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {section.title}
              </h2>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive(item.href)
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 truncate max-w-[120px]">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-white text-sm"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-900">
        {children}
      </main>
    </div>
  )
}

