'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import HelpButton from '@/components/HelpButton'
import HeroCard from '@/components/HeroCard'
import ItemCard from '@/components/ItemCard'
import AttributeIcon from '@/components/AttributeIcon'
import PlayerAvatar from '@/components/PlayerAvatar'
import AbilityCard from '@/components/AbilityCard'
import TalentIcon from '@/components/TalentIcon'
import RuneIcon from '@/components/RuneIcon'

export default function GraphicsDemoPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <HelpButton />
      <h1 className="text-3xl font-bold mb-6">Componenti Grafici - Demo</h1>
      <p className="text-gray-400 mb-8">
        Questa pagina mostra tutti i componenti grafici disponibili e dove vengono usati nell'applicazione.
      </p>

      {/* HeroCard */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">1.</span>
          HeroCard - Icone Eroi
        </h2>
        <p className="text-gray-400 mb-4">
          <strong>Dove si usa:</strong> Tabelle heroes, match analysis, hero cards, matchup analysis
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center gap-2">
            <HeroCard heroId={1} heroName="npc_dota_hero_antimage" size="sm" />
            <span className="text-xs text-gray-400">Size: sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HeroCard heroId={2} heroName="npc_dota_hero_axe" size="md" />
            <span className="text-xs text-gray-400">Size: md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HeroCard heroId={3} heroName="npc_dota_hero_bane" size="lg" />
            <span className="text-xs text-gray-400">Size: lg</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HeroCard heroId={1} heroName="npc_dota_hero_antimage" size="md" showName={true} />
            <span className="text-xs text-gray-400">With name</span>
          </div>
        </div>
      </div>

      {/* ItemCard */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">2.</span>
          ItemCard - Icone Item
        </h2>
        <p className="text-gray-400 mb-4">
          <strong>Dove si usa:</strong> Builds page, item analysis, build patterns
        </p>
        <div className="flex flex-wrap gap-4">
          <ItemCard itemId={1} itemName="Blink Dagger" itemInternalName="item_blink" size="sm" />
          <ItemCard itemId={2} itemName="Boots of Travel" itemInternalName="item_travel_boots" size="md" showStats={true} frequency={50} winrate={65} cost={2500} />
          <ItemCard itemId={3} itemName="Aghanim's Scepter" itemInternalName="item_ultimate_scepter" size="lg" />
        </div>
      </div>

      {/* AttributeIcon */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">3.</span>
          AttributeIcon - Attributi Eroi (STR/AGI/INT)
        </h2>
        <p className="text-gray-400 mb-4">
          <strong>Dove si usa:</strong> Hero analysis page (tabella heroes) - <span className="text-green-400">✅ GIÀ INTEGRATO</span>
        </p>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <AttributeIcon attribute="str" size="xs" />
            <span className="text-xs text-gray-400">Size: xs</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AttributeIcon attribute="agi" size="sm" />
            <span className="text-xs text-gray-400">Size: sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AttributeIcon attribute="int" size="md" showLabel={true} />
            <span className="text-xs text-gray-400">Size: md + label</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AttributeIcon attribute="str" size="lg" showLabel={true} />
            <span className="text-xs text-gray-400">Size: lg + label</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded">
          <p className="text-sm text-green-300">
            ✅ <strong>Visibile in:</strong> <code>/dashboard/hero-analysis</code> - Tabella "Tutti i Heroes"
          </p>
        </div>
      </div>

      {/* PlayerAvatar */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">4.</span>
          PlayerAvatar - Avatar Giocatori
        </h2>
        <p className="text-gray-400 mb-4">
          <strong>Dove si usa:</strong> Teammates page, match analysis tables, player profiles - <span className="text-green-400">✅ GIÀ INTEGRATO</span>
        </p>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar accountId={123456} playerName="Player Name" size="sm" />
            <span className="text-xs text-gray-400">Size: sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar accountId={123456} playerName="Player Name" size="md" />
            <span className="text-xs text-gray-400">Size: md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar accountId={123456} playerName="Player Name" size="lg" />
            <span className="text-xs text-gray-400">Size: lg</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar accountId={123456} playerName="Player Name" size="md" showName={true} />
            <span className="text-xs text-gray-400">With name</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded">
          <p className="text-sm text-green-300">
            ✅ <strong>Visibile in:</strong> <code>/dashboard/teammates</code> - Lista compagni
          </p>
        </div>
      </div>

      {/* AbilityCard */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">5.</span>
          AbilityCard - Icone Abilità
        </h2>
        <p className="text-gray-400 mb-4">
          <strong>Dove si usa:</strong> Build analysis (skill builds), match analysis detail (skill progression), hero guides
        </p>
        <p className="text-yellow-400 text-sm mb-4">
          ⚠️ Componente pronto - In attesa di dati da API (ability_upgrades)
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center gap-2">
            <AbilityCard abilityName="antimage_blink" size="sm" />
            <span className="text-xs text-gray-400">Size: sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AbilityCard abilityName="pudge_meat_hook" size="md" level={4} />
            <span className="text-xs text-gray-400">Size: md + Level 4</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AbilityCard abilityName="invoker_sun_strike" size="lg" level={3} showLevel={true} />
            <span className="text-xs text-gray-400">Size: lg + Level badge</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
          <p className="text-sm text-blue-300">
            📋 <strong>Esempio uso:</strong> Skill build timeline mostrando quando ogni abilità è stata livellata
          </p>
        </div>
      </div>

      {/* TalentIcon */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">6.</span>
          TalentIcon - Icone Talenti
        </h2>
        <p className="text-gray-400 mb-4">
          <strong>Dove si usa:</strong> Match analysis detail (talenti scelti), hero analysis (talenti popolari)
        </p>
        <p className="text-yellow-400 text-sm mb-4">
          ⚠️ Componente pronto - In attesa di dati da API (ability_upgrades livelli 10/15/20/25)
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center gap-2">
            <TalentIcon talentName="special_bonus_attack_speed" level={10} size="sm" />
            <span className="text-xs text-gray-400">Level 10 (blu)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TalentIcon talentName="special_bonus_movement_speed" level={15} size="md" />
            <span className="text-xs text-gray-400">Level 15 (viola)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TalentIcon talentName="special_bonus_strength" level={20} size="lg" showLevel={true} />
            <span className="text-xs text-gray-400">Level 20 (giallo)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TalentIcon talentName="special_bonus_unique" level={25} size="md" showLevel={true} />
            <span className="text-xs text-gray-400">Level 25 (rosso)</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
          <p className="text-sm text-blue-300">
            📋 <strong>Esempio uso:</strong> Mostrare i 4 talenti scelti in una match (10, 15, 20, 25)
          </p>
        </div>
      </div>

      {/* RuneIcon */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-red-400">7.</span>
          RuneIcon - Icone Rune
        </h2>
        <p className="text-gray-400 mb-4">
          <strong>Dove si usa:</strong> Match timeline (eventi rune pickup), match analysis (rune raccolte), vision control (rune spots)
        </p>
        <p className="text-yellow-400 text-sm mb-4">
          ⚠️ Componente pronto - In attesa di dati da API (match.objectives rune events)
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center gap-2">
            <RuneIcon runeName="bounty" size="sm" />
            <span className="text-xs text-gray-400">Bounty (sm)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RuneIcon runeName="double_damage" size="md" />
            <span className="text-xs text-gray-400">Double Damage (md)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RuneIcon runeName="haste" size="lg" showLabel={true} />
            <span className="text-xs text-gray-400">Haste (lg + label)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RuneIcon runeName="illusion" size="md" count={3} showLabel={true} />
            <span className="text-xs text-gray-400">Illusion (count: 3)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RuneIcon runeName="invisibility" size="md" />
            <span className="text-xs text-gray-400">Invisibility</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RuneIcon runeName="regeneration" size="md" />
            <span className="text-xs text-gray-400">Regeneration</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RuneIcon runeName="arcane" size="md" />
            <span className="text-xs text-gray-400">Arcane</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
          <p className="text-sm text-blue-300">
            📋 <strong>Esempio uso:</strong> Timeline eventi mostrando rune raccolte durante la partita
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Riepilogo Componenti</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-green-400 mb-2">✅ Integrati e Visibili</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li><strong>HeroCard:</strong> Ovunque (tabelle, card, match analysis)</li>
              <li><strong>ItemCard:</strong> Builds page</li>
              <li><strong>AttributeIcon:</strong> Hero Analysis page</li>
              <li><strong>PlayerAvatar:</strong> Teammates page</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-400 mb-2">📦 Pronti (in attesa dati API)</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li><strong>AbilityCard:</strong> Build analysis, skill builds</li>
              <li><strong>TalentIcon:</strong> Match detail, hero analysis</li>
              <li><strong>RuneIcon:</strong> Timeline events, match analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

