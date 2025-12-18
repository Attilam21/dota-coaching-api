'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
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
  Sun,
  Moon
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
  const { theme, toggleTheme } = useTheme()

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
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">FZTH Dashboard</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {section.title}
              </h2>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive(item.href)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'dark' ? 'Passa a modalità chiara' : 'Passa a modalità scura'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm p-1 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        {children}
      </main>
    </div>
  )
}

