'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { usePlayerIdContext } from '@/lib/playerIdContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import PlayerIdInput from '@/components/PlayerIdInput'
import HelpButton from '@/components/HelpButton'
import InsightBadge from '@/components/InsightBadge'

interface BuildData {
  overall: {
    totalMatches: number
    totalItems: number
    avgItemsPerMatch: string
  }
  topItems: Array<{
    item_id: number
    item_name: string
    frequency: number
    winrate: number
    avgGold: number
    usageRate: number
  }>
  buildPatterns: Array<{
    items: number[]
    itemNames: string[]
    frequency: number
    winrate: number
    usageRate: number
  }>
}

interface HeroBuildData {
  hero_id: number
  hero_name: string
  totalMatches: number
  topBuilds: Array<{
    items: number[]
    itemNames: string[]
    frequency: number
    winrate: number
    usageRate: number
  }>
  topItems: Array<{
    item_id: number
    item_name: string
    frequency: number
    winrate: number
    usageRate: number
  }>
  buildWinrates: Array<{
    items: number[]
    itemNames: string[]
    frequency: number
    winrate: number
    usageRate: number
  }>
}

interface ItemStats {
  topItems: Array<{
    item_id: number
    item_name: string
    frequency: number
    winrate: number
    usageRate: number
    avgGold: number
    avgGoldSpent: number
    avgNetWorth: number
  }>
  underutilizedItems: Array<{
    item_id: number
    item_name: string
    frequency: number
    winrate: number
    usageRate: number
  }>
  overpurchasedItems: Array<{
    item_id: number
    item_name: string
    frequency: number
    winrate: number
    usageRate: number
  }>
  itemEfficiency: Array<{
    item_id: number
    item_name: string
    frequency: number
    winrate: number
    efficiency: number
  }>
}

interface Hero {
  id: number
  localized_name: string
}

export default function BuildsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playerId } = usePlayerIdContext()
  const [activeTab, setActiveTab] = useState<'overview' | 'hero' | 'items' | 'comparison'>('overview')
  const [buildData, setBuildData] = useState<BuildData | null>(null)
  const [itemStats, setItemStats] = useState<ItemStats | null>(null)
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [selectedHero, setSelectedHero] = useState<number | null>(null)
  const [heroBuildData, setHeroBuildData] = useState<HeroBuildData | null>(null)
  const [heroLoading, setHeroLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!playerId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch builds overview
        const buildsResponse = await fetch(`/api/player/${playerId}/builds`)
        if (buildsResponse.ok) {
          const data = await buildsResponse.json()
          setBuildData(data)
        }

        // Fetch item stats
        const itemsResponse = await fetch(`/api/player/${playerId}/items/stats`)
        if (itemsResponse.ok) {
          const data = await itemsResponse.json()
          setItemStats(data)
        }

        // Fetch heroes list
        const heroesResponse = await fetch('/api/opendota/heroes')
        if (heroesResponse.ok) {
          const heroesData = await heroesResponse.json()
          setHeroes(heroesData)
        }
      } catch (error) {
        console.error('Error fetching build data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, playerId, router, authLoading])

  useEffect(() => {
    if (selectedHero && playerId) {
      const fetchHeroBuilds = async () => {
        try {
          setHeroLoading(true)
          setHeroBuildData(null) // Reset previous data
          const response = await fetch(`/api/player/${playerId}/builds/hero/${selectedHero}`)
          if (response.ok) {
            const data = await response.json()
            console.log('Hero build data received:', data)
            setHeroBuildData(data)
          } else {
            console.error('Failed to fetch hero builds:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Error fetching hero builds:', error)
        } finally {
          setHeroLoading(false)
        }
      }
      fetchHeroBuilds()
    } else {
      setHeroBuildData(null)
    }
  }, [selectedHero, playerId])

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Caricamento dati build...</p>
        </div>
      </div>
    )
  }

  if (!playerId) {
    return (
      <div className="p-8">
        <PlayerIdInput
          pageTitle="Build & Items"
          title="Inserisci Player ID"
          description="Inserisci il tuo Dota 2 Account ID per visualizzare le analisi delle build e degli item"
        />
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Build & Items</h1>
            <p className="text-gray-400">Analisi delle tue build e degli item utilizzati</p>
          </div>
          <HelpButton />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex space-x-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'hero', label: 'Per Hero' },
              { id: 'items', label: 'Analisi Item' },
              { id: 'comparison', label: 'Build Comparison' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-red-600 text-red-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && buildData && (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Partite Analizzate</div>
                <div className="text-2xl font-bold">{buildData.overall.totalMatches}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Item Totali</div>
                <div className="text-2xl font-bold">{buildData.overall.totalItems}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Item per Partita</div>
                <div className="text-2xl font-bold">{buildData.overall.avgItemsPerMatch}</div>
              </div>
            </div>

            {/* Top Items */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Item Più Utilizzati</h2>
                <InsightBadge
                  elementType="builds"
                  elementId="top-items"
                  contextData={{ topItems: buildData.topItems.slice(0, 10) }}
                  playerId={playerId}
                />
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={buildData.topItems.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="item_name" angle={-45} textAnchor="end" height={100} stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="frequency" fill="#3b82f6" name="Frequenza" />
                  <Bar dataKey="winrate" fill="#10b981" name="Winrate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Build Patterns */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Build Più Comuni</h2>
                <InsightBadge
                  elementType="builds"
                  elementId="build-patterns"
                  contextData={{ patterns: buildData.buildPatterns.slice(0, 5) }}
                  playerId={playerId}
                />
              </div>
              <div className="space-y-3">
                {buildData.buildPatterns.slice(0, 10).map((build, idx) => (
                  <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {build.itemNames.map((name, i) => (
                          <span key={i} className="bg-gray-600 px-2 py-1 rounded text-sm">
                            {name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-semibold ${build.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {build.winrate}% WR
                        </span>
                        <span className="text-gray-400 text-sm">{build.frequency}x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero Tab */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            {/* Hero Selection */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Seleziona Hero</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {heroes.slice(0, 50).map((hero) => (
                  <button
                    key={hero.id}
                    onClick={() => setSelectedHero(hero.id)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedHero === hero.id
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {hero.localized_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Build Data */}
            {heroLoading && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <p className="mt-4 text-gray-400">Caricamento analisi eroe...</p>
                </div>
              </div>
            )}
            {!heroLoading && heroBuildData && heroBuildData.totalMatches === 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg">
                    Nessuna partita trovata per questo eroe nelle ultime 20 partite.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Prova a selezionare un altro eroe o gioca più partite con questo eroe.
                  </p>
                </div>
              </div>
            )}
            {!heroLoading && heroBuildData && heroBuildData.totalMatches > 0 && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">
                    Build per {heroBuildData.hero_name} ({heroBuildData.totalMatches} partite)
                  </h2>

                  {/* Top Items for Hero */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Item Più Utilizzati</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {heroBuildData.topItems.slice(0, 8).map((item) => (
                        <div key={item.item_id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                          <div className="font-medium text-sm mb-1">{item.item_name}</div>
                          <div className="text-xs text-gray-400">
                            {item.frequency}x • {item.winrate}% WR
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Builds by Winrate */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Build Più Efficaci (Winrate)</h3>
                    <div className="space-y-3">
                      {heroBuildData.buildWinrates.slice(0, 5).map((build, idx) => (
                        <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {build.itemNames.map((name, i) => (
                                <span key={i} className="bg-gray-600 px-2 py-1 rounded text-sm">
                                  {name}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`font-semibold ${build.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                {build.winrate}% WR
                              </span>
                              <span className="text-gray-400 text-sm">{build.frequency}x</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && itemStats && (
          <div className="space-y-6">
            {/* Underutilized Items */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Item Sottoutilizzati</h2>
                <InsightBadge
                  elementType="builds"
                  elementId="underutilized"
                  contextData={{ items: itemStats.underutilizedItems }}
                  playerId={playerId}
                />
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Item con winrate alto ma bassa frequenza d'uso - considera di usarli più spesso
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {itemStats.underutilizedItems.map((item) => (
                  <div key={item.item_id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="font-medium mb-1">{item.item_name}</div>
                    <div className="text-sm text-green-400 font-semibold">{item.winrate}% WR</div>
                    <div className="text-xs text-gray-400 mt-1">Usato {item.frequency}x ({item.usageRate.toFixed(1)}%)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overpurchased Items */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Item Overpurchased</h2>
                <InsightBadge
                  elementType="builds"
                  elementId="overpurchased"
                  contextData={{ items: itemStats.overpurchasedItems }}
                  playerId={playerId}
                />
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Item acquistati spesso ma con winrate basso - valuta alternative
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {itemStats.overpurchasedItems.map((item) => (
                  <div key={item.item_id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="font-medium mb-1">{item.item_name}</div>
                    <div className="text-sm text-red-400 font-semibold">{item.winrate}% WR</div>
                    <div className="text-xs text-gray-400 mt-1">Usato {item.frequency}x ({item.usageRate.toFixed(1)}%)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Item Efficiency */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Efficienza Item</h2>
                <InsightBadge
                  elementType="builds"
                  elementId="efficiency"
                  contextData={{ items: itemStats.itemEfficiency }}
                  playerId={playerId}
                />
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={itemStats.itemEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="item_name" angle={-45} textAnchor="end" height={100} stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="winrate" fill="#10b981" name="Winrate %" />
                  <Bar dataKey="efficiency" fill="#3b82f6" name="Efficienza" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && buildData && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Confronto Build</h2>
                <InsightBadge
                  elementType="builds"
                  elementId="comparison"
                  contextData={{ patterns: buildData.buildPatterns }}
                  playerId={playerId}
                />
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Confronto tra build più comuni e loro efficacia
              </p>
              <div className="space-y-4">
                {buildData.buildPatterns.slice(0, 10).map((build, idx) => (
                  <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {build.itemNames.map((name, i) => (
                            <span key={i} className="bg-gray-600 px-2 py-1 rounded text-sm">
                              {name}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-400">
                          Utilizzata {build.frequency} volte ({build.usageRate.toFixed(1)}% delle partite)
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`text-2xl font-bold ${build.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {build.winrate}%
                        </div>
                        <div className="text-xs text-gray-400">Winrate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

