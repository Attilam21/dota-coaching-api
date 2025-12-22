'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import { useBackgroundPreference } from '@/lib/hooks/useBackgroundPreference'
import WelcomeVideoModal from '@/components/WelcomeVideoModal'
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
  GraduationCap,
  TrendingUp,
  Route,
  Sparkles,
  PlayCircle
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
  const { backgroundUrl } = useBackgroundPreference()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const navigation: Array<{ title: string; colorClass: string; items: NavItem[]; highlight?: boolean }> = [
    {
      title: 'PANORAMICA',
      colorClass: 'text-blue-400',
      items: [
        { name: 'Panoramica', href: '/dashboard', icon: BarChart },
      ],
    },
    {
      title: 'ANALISI',
      colorClass: 'text-green-400',
      items: [
        { name: 'Performance & Stile', href: '/dashboard/performance', icon: Zap },
        { name: 'Il Mio Pool', href: '/dashboard/heroes', icon: Theater },
        { name: 'Matchup & Counter', href: '/dashboard/hero-analysis', icon: Search },
        { name: 'Analisi Ruolo', href: '/dashboard/role-analysis', icon: Target },
        { name: 'I Tuoi Compagni', href: '/dashboard/teammates', icon: Users },
        { name: 'Storico Partite', href: '/dashboard/matches', icon: Gamepad2 },
        { name: 'Analisi Avanzate', href: '/dashboard/advanced', icon: FlaskConical },
        { name: 'Build & Items', href: '/dashboard/builds', icon: Shield },
      ],
    },
    {
      title: 'ANALISI PREDITTIVE',
      colorClass: 'text-cyan-400',
      items: [
        { name: 'Overview Predittivo', href: '/dashboard/predictions', icon: Sparkles },
        { name: 'Path to Improvement', href: '/dashboard/predictions/improvement-path', icon: Route },
        { name: 'What-If Analysis', href: '/dashboard/predictions/what-if', icon: TrendingUp },
      ],
    },
    {
      title: 'COACHING',
      colorClass: 'text-purple-400',
      items: [
        { name: 'Coaching & Insights', href: '/dashboard/coaching-insights', icon: BookOpen },
        { name: 'Anti-Tilt', href: '/dashboard/anti-tilt', icon: Shield },
      ],
    },
    {
      title: 'CONFIGURAZIONE',
      colorClass: 'text-gray-400',
      items: [
        { name: 'Impostazioni Account', href: '/dashboard/settings', icon: Settings },
      ],
    },
    // Accessori in fondo
    {
      title: 'ACCESSORI',
      colorClass: 'text-gray-500',
      items: [
        { name: 'Giochi Anti-Tilt', href: '/dashboard/games', icon: Gamepad2 },
      ],
    },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Welcome Video Modal - available from all dashboard pages */}
      <WelcomeVideoModal 
        videoSrc="/videos/welcome.mp4"
        title="Benvenuto in PRO DOTA ANALISI"
        showOnFirstVisit={true}
        storageKey="welcome-video-seen"
      />
      
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <Logo href="/dashboard" size="md" />
        </div>
        
        {/* Guida Utente e Video Benvenuto - In alto con colore evidenziato */}
        <div className="p-4 border-b border-gray-700 space-y-2">
          <Link
            href="/dashboard/guida-utente"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 text-yellow-300 hover:from-yellow-600/30 hover:to-orange-600/30 hover:border-yellow-400 hover:text-yellow-200 hover:shadow-lg hover:shadow-yellow-500/20"
          >
            <GraduationCap className="w-5 h-5 flex-shrink-0" />
            <span>Guida Utente</span>
          </Link>
          <button
            onClick={() => {
              // Trigger event per aprire il video
              try {
                if (typeof window !== 'undefined') {
                  // Prova prima con la funzione diretta
                  if ((window as any).openWelcomeVideo) {
                    (window as any).openWelcomeVideo()
                  } else {
                    // Altrimenti usa l'evento custom
                    window.dispatchEvent(new Event('openWelcomeVideoEvent'))
                  }
                }
              } catch (err) {
                console.error('Failed to open video:', err)
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/50 text-red-300 hover:from-red-600/30 hover:to-pink-600/30 hover:border-red-400 hover:text-red-200 hover:shadow-lg hover:shadow-red-500/20"
          >
            <PlayCircle className="w-5 h-5 flex-shrink-0" />
            <span>Video Benvenuto</span>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6" data-tour="sidebar">
          {navigation.map((section, index) => (
            <div key={section.title}>
              <h2 className={`text-xs font-semibold ${section.colorClass} uppercase tracking-wider mb-3 ${index === 0 ? 'mt-0' : 'mt-6'} ${section.highlight ? 'bg-red-900/30 px-2 py-1 rounded border border-red-700/50' : ''}`}>
                {section.title}
              </h2>
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index * 0.05) + (itemIndex * 0.03), duration: 0.3 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
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
                    </motion.div>
                  </motion.li>
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
            <motion.button
              onClick={() => signOut()}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-white text-sm p-1"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-900 relative">
        {/* Background Image - Fixed position, behind content (only in main area) */}
        {backgroundUrl && (
          <div 
            key={backgroundUrl}
            className="fixed top-0 right-0 bottom-0 left-64 z-0 pointer-events-none bg-cover bg-center bg-no-repeat transition-opacity duration-500"
            style={{
              backgroundImage: `url('${backgroundUrl}')`,
              backgroundColor: '#111827' // fallback color
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gray-900/60" />
          </div>
        )}
        
        {/* Content - Above background */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}