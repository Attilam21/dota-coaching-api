'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  LogOut
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

  const navigation: Array<{ title: string; colorClass: string; items: NavItem[] }> = [
    {
      title: 'STATISTICHE GIOCATORE',
      colorClass: 'text-blue-400',
      items: [
        { name: 'Panoramica', href: '/dashboard', icon: BarChart },
        { name: 'Performance & Stile', href: '/dashboard/performance', icon: Zap },
        { name: 'Hero Pool', href: '/dashboard/heroes', icon: Theater },
        { name: 'Analisi Eroi', href: '/dashboard/hero-analysis', icon: Search },
        { name: 'Analisi Ruolo', href: '/dashboard/role-analysis', icon: Target },
      ],
    },
    {
      title: 'TEAM & PARTITE',
      colorClass: 'text-green-400',
      items: [
        { name: 'I Tuoi Compagni', href: '/dashboard/teammates', icon: Users },
        { name: 'Storico Partite', href: '/dashboard/matches', icon: Gamepad2 },
      ],
    },
    {
      title: 'ANALISI PARTITA',
      colorClass: 'text-yellow-400',
      items: [
        { name: 'Seleziona Partita', href: '/dashboard/match-analysis', icon: Search },
      ],
    },
    {
      title: 'COACHING & PROFILO',
      colorClass: 'text-purple-400',
      items: [
        { name: 'Coaching & Meta', href: '/dashboard/coaching', icon: BookOpen },
        { name: 'Profilo AttilaLAB', href: '/dashboard/profiling', icon: Target },
        { name: 'Riassunto IA', href: '/dashboard/ai-summary', icon: Bot },
      ],
    },
    {
      title: 'ANALISI TECNICHE',
      colorClass: 'text-orange-400',
      items: [
        { name: 'Analisi Avanzate', href: '/dashboard/advanced', icon: FlaskConical },
        { name: 'Build & Items', href: '/dashboard/builds', icon: Shield },
      ],
    },
    {
      title: 'IMPOSTAZIONI',
      colorClass: 'text-gray-400',
      items: [
        { name: 'Impostazioni Account', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">AttilaLAB Dashboard</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigation.map((section, index) => (
            <div key={section.title}>
              <h2 className={`text-xs font-semibold ${section.colorClass} uppercase tracking-wider mb-3 ${index === 0 ? 'mt-0' : 'mt-6'}`}>
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
      <main className="flex-1 overflow-y-auto bg-gray-900 relative">
        {/* Background Image - Fixed position, behind content (only in main area) */}
        {/* 
          PER CARICARE LO SFONDO:
          1. Salva la tua immagine in: public/dashboard-bg.jpg
          2. Formato: JPG, PNG o WebP
          3. L'immagine apparirà automaticamente qui
          
          Se l'immagine non esiste, lo sfondo sarà semplicemente grigio scuro
        */}
        <div className="fixed top-0 right-0 bottom-0 left-64 z-0 pointer-events-none">
          <div className="relative w-full h-full">
            <Image
              src="/dashboard-bg.jpg"
              alt="Dashboard Background"
              fill
              className="object-cover opacity-20"
              priority={false}
              quality={75}
              sizes="(max-width: 768px) 100vw, calc(100vw - 16rem)"
              onError={(e) => {
                // Se l'immagine non esiste, nascondi il div
                const target = e.target as HTMLImageElement
                if (target.parentElement) {
                  target.parentElement.style.display = 'none'
                }
              }}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gray-900/60" />
          </div>
        </div>
        
        {/* Content - Above background */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}

