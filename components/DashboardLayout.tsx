'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  BarChart, 
  Zap, 
  Theater, 
  Search, 
  Target, 
  Users, 
  Gamepad2, 
  BookOpen, 
  Bot, 
  Shield, 
  FlaskConical,
  Settings,
  LogOut,
  Trophy
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const navigation: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'ANALISI PLAYER',
      items: [
        { name: 'Panoramica', href: '/dashboard', icon: BarChart },
        { name: 'Performance & Stile di Gioco', href: '/dashboard/performance', icon: Zap },
        { name: 'Hero Pool', href: '/dashboard/heroes', icon: Theater },
        { name: 'Hero Analysis', href: '/dashboard/hero-analysis', icon: Search },
        { name: 'Analisi Ruolo', href: '/dashboard/role-analysis', icon: Target },
      ],
    },
    {
      title: 'ANALISI TEAM & MATCH',
      items: [
        { name: 'Team & Compagni', href: '/dashboard/teammates', icon: Users },
        { name: 'Partite', href: '/dashboard/matches', icon: Gamepad2 },
      ],
    },
    {
      title: 'ANALISI PARTITA SINGOLA',
      items: [
        { name: 'Seleziona Partita', href: '/dashboard/match-analysis', icon: Search },
      ],
    },
    {
      title: 'COACHING & PROFILAZIONE',
      items: [
        { name: 'Coaching & Task', href: '/dashboard/coaching', icon: BookOpen },
        { name: 'Profilazione FZTH', href: '/dashboard/profiling', icon: Target },
        { name: 'Riassunto IA', href: '/dashboard/ai-summary', icon: Bot },
        { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
      ],
    },
    {
      title: 'ANALISI AVANZATE',
      items: [
        { name: 'Analisi avanzate', href: '/dashboard/advanced', icon: FlaskConical },
        { name: 'Build & Items', href: '/dashboard/builds', icon: Shield },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { name: 'Profilo Utente', href: '/dashboard/settings', icon: Settings },
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
                      <item.icon className="w-5 h-5 flex-shrink-0" />
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
              className="text-gray-400 hover:text-white text-sm p-1"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
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

