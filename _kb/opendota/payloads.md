# 📦 OpenDota Payloads - Campi e Mapping

## Match Object

### Campi Affidabili (Sempre Presenti)
```typescript
{
  match_id: number          // ID match
  duration: number          // Durata in secondi
  radiant_win: boolean      // true se Radiant vince
  start_time: number        // Unix timestamp
  players: Array<Player>    // Array di 10 players (0-4 Radiant, 5-9 Dire)
}
```

### Campi Opzionali (Possono Essere null/undefined)
```typescript
{
  radiant_score?: number
  dire_score?: number
  lobby_type?: number
  game_mode?: number
  patch?: number
  region?: number
}
```

### Player Object (dentro match.players[])
```typescript
{
  account_id: number        // Steam Account ID (può essere null se anonimo)
  hero_id: number           // ID eroe
  player_slot: number        // 0-4 = Radiant, 5-9 = Dire
  
  // Stats base (sempre presenti)
  kills: number
  deaths: number
  assists: number
  last_hits: number
  denies: number
  gold_per_min: number      // GPM
  xp_per_min: number        // XPM
  
  // Stats avanzate (opzionali)
  net_worth?: number
  hero_damage?: number
  tower_damage?: number
  hero_healing?: number
  gold_spent?: number
  observer_uses?: number    // Observer wards placed
  sentry_uses?: number       // Sentry wards placed
  observer_kills?: number
  sentry_kills?: number
  buyback_count?: number
  stuns?: number
  rune_pickups?: number
  camps_stacked?: number
  courier_kills?: number
  roshans_killed?: number
  firstblood_claimed?: number
  teamfight_participations?: number
  towers_killed?: number
  lane_role?: number        // 1=safe, 2=mid, 3=offlane, 4=soft support, 5=hard support
}
```

### Naming Convention nel Progetto

**Da OpenDota → Dashboard**:
- `gold_per_min` → `gpm` (abbreviato)
- `xp_per_min` → `xpm` (abbreviato)
- `radiant_win` → `radiantWin` (camelCase)
- `player_slot` → `playerSlot` (camelCase)
- `account_id` → `accountId` (camelCase)
- `hero_id` → `heroId` (camelCase)

**Calcoli Comuni**:
```typescript
// KDA
const kda = (kills + assists) / Math.max(deaths, 1)

// Win/Loss per player
const win = (player_slot < 128 && radiant_win) || 
            (player_slot >= 128 && !radiant_win)

// Team (Radiant = 0-4, Dire = 5-9)
const isRadiant = player_slot < 128
const team = player_slot < 128 ? 'radiant' : 'dire'
```

---

## Player Matches Array

### Oggetto Match Summary (da /players/{id}/matches)
```typescript
{
  match_id: number
  player_slot: number
  radiant_win: boolean
  duration: number
  start_time: number
  
  // Stats base (possono mancare, meglio fetch match completo)
  kills?: number
  deaths?: number
  assists?: number
  gold_per_min?: number
  xp_per_min?: number
  hero_id?: number
}
```

**⚠️ Attenzione**: Questo endpoint ritorna solo summary. Per dati completi, fetch `/matches/{match_id}`.

---

## Player Profile Object

### Campi Affidabili
```typescript
{
  profile: {
    account_id: number
    personaname: string      // Nome Steam
    avatarfull: string       // URL avatar
    steamid: string
  }
  win: number                // Vittorie totali
  lose: number               // Sconfitte totali
  solo_competitive_rank?: number  // MMR solo
  competitive_rank?: number      // MMR party
  rank_tier?: number        // Rank badge (1-80)
  leaderboard_rank?: number // Global rank (solo top players)
}
```

### Campi Opzionali
```typescript
{
  mmr_estimate?: {
    estimate: number
  }
  country_code?: string
  plus?: boolean            // Dota Plus subscriber
}
```

---

## Player Heroes Array

### Oggetto Hero Stats (da /players/{id}/heroes)
```typescript
{
  hero_id: number
  games: number             // Partite giocate
  win: number               // Vittorie
  // winrate = (win / games) * 100
}
```

**Nota**: Non include nome eroe. Devi mappare `hero_id` usando `/heroes` endpoint.

---

## Heroes List Array

### Oggetto Hero (da /heroes)
```typescript
{
  id: number                // Hero ID
  name: string              // "npc_dota_hero_antimage"
  localized_name: string    // "Anti-Mage"
  primary_attr: string      // "agi" | "str" | "int"
  attack_type: string       // "Melee" | "Ranged"
  roles: string[]           // ["Carry", "Escape", "Nuker"]
  legs: number              // 2 (sempre)
}
```

**Mapping nel Progetto**:
```typescript
// Crea mappa hero_id → nome
const heroesMap: Record<number, { name: string; localized_name: string }> = {}
heroes.forEach(hero => {
  heroesMap[hero.id] = {
    name: hero.name,
    localized_name: hero.localized_name
  }
})

// Usa
const heroName = heroesMap[hero_id]?.localized_name || `Hero ${hero_id}`
```

---

## Campi Critici per Dashboard

### Per Match Analysis
- `match.duration` → Durata partita
- `match.radiant_win` → Risultato
- `match.players[].kills/deaths/assists` → KDA
- `match.players[].gold_per_min` → GPM
- `match.players[].xp_per_min` → XPM
- `match.players[].hero_id` → Eroe giocato
- `match.players[].player_slot` → Team (Radiant/Dire)

### Per Player Stats
- `matches[].match_id` → ID match
- `matches[].radiant_win` + `player_slot` → Win/Loss
- `matches[].kills/deaths/assists` → KDA
- `matches[].gold_per_min` → GPM
- `matches[].xp_per_min` → XPM

### Per Role Analysis
- `playerHeroes[].hero_id` → Eroe
- `playerHeroes[].games` → Partite
- `playerHeroes[].win` → Vittorie
- `heroes[].roles` → Ruoli eroe (per assegnare a Carry/Mid/Offlane/Support)

---

## Valori Speciali

### player_slot
- `0-4` = Radiant team
- `5-9` = Dire team
- `128-132` = Radiant (formato alternativo, raro)
- `133-137` = Dire (formato alternativo, raro)

**Sempre usare**: `player_slot < 128` per Radiant

### account_id
- Può essere `null` se profilo privato
- Steam Account ID (non Steam ID64)
- Per convertire: Steam ID64 = account_id + 76561197960265728

### hero_id
- Range: 1-138 (circa)
- Alcuni ID potrebbero non esistere (gap nella numerazione)

---

**Nota**: Sempre validare che i campi esistano prima di usarli (optional chaining `?.`).

