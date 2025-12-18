# 🎨 Risorse Grafiche Disponibili per Dota 2 Coaching Platform

## ✅ Già Implementate

1. **Hero Icons** - `HeroCard.tsx`
   - URL: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/{hero_name}_lg.png`
   - Formati: `_lg.png` (large), `_sb.png` (scoreboard), `_vert.jpg` (vertical)

2. **Item Icons** - `ItemCard.tsx`
   - URL: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/{item_name}_lg.png`
   - Formati: `_lg.png` (large), `_sb.png` (scoreboard)

3. **Lucide React Icons** - Icone SVG già integrate
   - Usate per: navigation, actions, status indicators

4. **Recharts** - Grafici interattivi
   - Bar charts, Line charts, Radar charts

---

## 🆕 Risorse Disponibili da Steam CDN

### 1. **Ability Icons** (Abilità degli Eroi)
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/abilities/{ability_name}_hp2.png
Formati disponibili:
- _hp2.png (high quality)
- _md.png (medium)
- _lg.png (large)
```

**Esempio:**
- Antimage Blink: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/abilities/antimage_blink_hp2.png`
- Pudge Hook: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/abilities/pudge_meat_hook_hp2.png`

**Dove usare:**
- Build analysis page - Mostrare build di abilità
- Match analysis - Skill build per ogni giocatore
- Hero analysis - Abilità più usate/vincenti

**Dati disponibili da OpenDota:**
- `players.ability_upgrades` - Ordine di leveling abilità
- `players.ability_uses` - Utilizzo abilità in match

---

### 2. **Talent Icons** (Talenti)
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/talents/{talent_name}_png.png
```

**Dove usare:**
- Match analysis detail - Talenti scelti
- Hero analysis - Talenti più popolari/vincenti

**Dati disponibili da OpenDota:**
- `players.ability_upgrades` - Include talent choices (livello 10/15/20/25)

---

### 3. **Player Avatars** (Avatar Steam)
```
URL Pattern: https://avatars.steamstatic.com/{steam_id_hash}_full.jpg
Formati: _full.jpg, _medium.jpg, _avatar.jpg
```

**Dove usare:**
- Player profile pages
- Match analysis - Avatar giocatori nelle tabelle
- Teammates page - Avatar compagni

**Dati disponibili:**
- `players.profile` (se account public) - Contiene `avatar` e `avatarfull`

---

### 4. **Attribute Icons** (Forza/Agilità/Intelligenza)
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/attributes/{attribute}_icon.png

Attributes:
- strength
- agility  
- intelligence
```

**Dove usare:**
- Hero cards - Mostrare attribute principale
- Hero analysis - Filtri per attribute
- Match analysis - Indicatore attribute hero

**Dati disponibili:**
- `heroes.primary_attr` - "str", "agi", "int"

---

### 5. **Rune Icons** (Rune del gioco)
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/rune_{rune_name}.png

Rune disponibili:
- bounty
- double_damage
- haste
- illusion
- invisibility
- regeneration
- arcane
```

**Dove usare:**
- Match timeline - Eventi rune pickup
- Match analysis - Rune raccolte per giocatore
- Vision control page - Rune spots sulla mappa

**Dati disponibili:**
- `match.objectives` - Rune pickups

---

### 6. **Damage Type Icons**
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/damage/{type}_damage.png

Types:
- physical
- magical
- pure
```

**Dove usare:**
- Hero analysis - Tipo danno principale
- Damage analysis page

---

### 7. **Game Mode Icons**
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/gamemode/{mode}.png
```

**Dove usare:**
- Match cards - Indicatore tipo partita
- Match filters - Icone per filtri

**Dati disponibili:**
- `match.game_mode` - ID game mode

---

### 8. **Lobby Type Icons** (Ranked/Unranked/Turbo)
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/lobby/{type}.png
```

**Dove usare:**
- Match cards - Badge ranked/unranked/turbo
- Match filters

**Dati disponibili:**
- `match.lobby_type` - ID lobby type

---

### 9. **Team Icons** (Radiant/Dire)
```
URL Pattern: https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/selection/{team}_icon.png

Teams:
- radiant
- dire
```

**Dove usare:**
- Match analysis - Badge team
- Match timeline - Eventi per team

---

### 10. **Role Icons** (Ruoli)
```
Icons disponibili per:
- Carry
- Mid
- Offlane
- Support (pos 4)
- Hard Support (pos 5)

Pattern: Potrebbero essere custom o da font-awesome/lucide
```

**Dove usare:**
- Role analysis page - Icone ruoli
- Hero cards - Ruolo primario hero
- Match analysis - Posizione giocatore

---

## 📦 Componenti da Creare

### 1. `AbilityCard.tsx`
Simile a `HeroCard` e `ItemCard`, per mostrare icone abilità con tooltip.

```typescript
interface AbilityCardProps {
  abilityName: string // e.g., "antimage_blink"
  size?: 'sm' | 'md' | 'lg'
  level?: number // Livello dell'abilità
  showLevel?: boolean
}
```

### 2. `PlayerAvatar.tsx`
Componente per avatar Steam con fallback.

```typescript
interface PlayerAvatarProps {
  accountId?: number
  avatarUrl?: string // Da profile.avatarfull
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  playerName?: string
}
```

### 3. `AttributeIcon.tsx`
Icona attribute (STR/AGI/INT).

```typescript
interface AttributeIconProps {
  attribute: 'str' | 'agi' | 'int'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

### 4. `RuneIcon.tsx`
Icona rune con tooltip.

```typescript
interface RuneIconProps {
  runeName: string // e.g., "double_damage", "bounty"
  size?: 'sm' | 'md' | 'lg'
  count?: number // Quante volte raccolta
}
```

---

## 🎯 Priorità di Implementazione

### Priorità Alta (Alto impatto visivo, dati già disponibili)
1. **Player Avatars** - Migliora riconoscibilità giocatori
2. **Ability Icons** - Build analysis molto richiesta
3. **Attribute Icons** - Chiarifica hero attributes

### Priorità Media (Utili ma non essenziali)
4. **Talent Icons** - Dettaglio interessante ma nichioso
5. **Rune Icons** - Timeline più visuale
6. **Lobby Type Icons** - Match cards più informative

### Priorità Bassa (Nice to have)
7. **Damage Type Icons** - Analisi avanzata
8. **Role Icons** - Già rappresentato con testo
9. **Game Mode Icons** - Raro uso

---

## 🔧 Modifiche Necessarie a `next.config.mjs`

Le configurazioni attuali dovrebbero già supportare tutte queste risorse, ma possiamo aggiungere pattern più specifici:

```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'cdn.cloudflare.steamstatic.com',
    pathname: '/apps/dota2/images/**', // Già presente
  },
  {
    protocol: 'https',
    hostname: 'avatars.steamstatic.com',
    pathname: '/**', // Già presente
  },
]
```

---

## 📚 Fonti Dati OpenDota

Per implementare queste risorse, verifica questi endpoint/campi:

1. **Abilities:**
   - `GET /api/matches/{match_id}` → `players.ability_upgrades`
   - `GET /api/matches/{match_id}` → `players.ability_uses`

2. **Talents:**
   - `GET /api/matches/{match_id}` → `players.ability_upgrades` (level 10/15/20/25)

3. **Avatars:**
   - `GET /api/matches/{match_id}` → `players.profile.avatarfull` (se public)

4. **Attributes:**
   - `GET /api/heroes` → `heroes.primary_attr`

5. **Rune:**
   - `GET /api/matches/{match_id}` → `objectives` (type: rune)

---

## 💡 Esempi di Utilizzo

### Esempio 1: Build Abilità in Match Analysis
```tsx
{player.ability_upgrades?.map((ability, idx) => (
  <AbilityCard
    key={idx}
    abilityName={ability.name}
    level={ability.level}
    showLevel={true}
    size="sm"
  />
))}
```

### Esempio 2: Avatar Giocatore in Tabella
```tsx
<td>
  <div className="flex items-center gap-2">
    <PlayerAvatar
      avatarUrl={player.profile?.avatarfull}
      accountId={player.account_id}
      size="sm"
    />
    <span>{player.profile?.personaname || `Player ${player.account_id}`}</span>
  </div>
</td>
```

### Esempio 3: Attribute Icon in Hero Card
```tsx
<div className="flex items-center gap-2">
  <HeroCard heroId={hero.id} heroName={hero.name} size="sm" />
  <AttributeIcon attribute={hero.primary_attr} size="xs" />
  <span>{hero.localized_name}</span>
</div>
```

---

## ⚠️ Note Importanti

1. **Caching**: Steam CDN è veloce ma considera caching locale per icone usate frequentemente
2. **Fallback**: Sempre implementare fallback per immagini mancanti
3. **Naming**: Alcuni nomi abilità potrebbero differire tra API e CDN (verifica pattern esatti)
4. **Rate Limiting**: Steam CDN non ha rate limit ma Next.js Image optimization ha limiti
5. **Privacy**: Avatar Steam richiedono profilo pubblico

---

## 🚀 Quick Start

Per iniziare, suggerisco di implementare in ordine:

1. **Player Avatars** (1-2 ore) - Impatto immediato
2. **Ability Icons** (3-4 ore) - Build analysis molto richiesta
3. **Attribute Icons** (1 ora) - Facile, alto impatto visivo

Poi valutare feedback utente per priorità successive.

