# 🚀 Quick Reference - OpenDota

Guida rapida per sviluppatori. Per dettagli completi, vedi gli altri file della KB.

## Endpoint Più Usati

```typescript
// Match completo (per GPM/XPM accurati)
GET /api/matches/{match_id}

// Match summary giocatore (veloce, ma dati limitati)
GET /api/players/{account_id}/matches?limit=20

// Profilo giocatore
GET /api/players/{account_id}

// Heroes giocatore
GET /api/players/{account_id}/heroes

// Lista heroes
GET /api/heroes
```

## Formule Essenziali

```typescript
// KDA (sempre con Math.max per evitare divisione per zero)
const kda = (kills + assists) / Math.max(deaths, 1)

// Win (determina se giocatore ha vinto)
const isWin = (player_slot < 128 && radiant_win) || (player_slot >= 128 && !radiant_win)

// Winrate
const winrate = matches.length > 0 ? (wins / matches.length) * 100 : 0

// GPM (se mancante, calcola da total_gold)
let gpm = player.gold_per_min || 0
if (gpm === 0 && match.duration > 0) {
  gpm = Math.round((player.total_gold / match.duration) * 60)
}

// XPM (se mancante, calcola da total_xp)
let xpm = player.xp_per_min || 0
if (xpm === 0 && match.duration > 0) {
  xpm = Math.round((player.total_xp / match.duration) * 60)
}

// CS per minuto
const csPerMin = match.duration > 0 
  ? ((lastHits + denies) / (match.duration / 60)).toFixed(1) 
  : '0'
```

## Pattern Critici

### 1. Fetch Match Completo per GPM/XPM
```typescript
// ❌ SBAGLIATO - Summary non ha GPM/XPM affidabili
const summary = await fetch(`/players/${id}/matches`)
const gpm = summary[0].gold_per_min  // Può essere 0 o undefined!

// ✅ CORRETTO - Fetch match completo
const summary = await fetch(`/players/${id}/matches`)
const fullMatch = await fetch(`/matches/${summary[0].match_id}`)
const player = fullMatch.players.find(p => p.player_slot === summary[0].player_slot)
const gpm = player.gold_per_min || calculateGPM(player, fullMatch)
```

### 2. Evitare Divisione per Zero
```typescript
// ❌ SBAGLIATO
const kda = (kills + assists) / deaths

// ✅ CORRETTO
const kda = (kills + assists) / Math.max(deaths, 1)
```

### 3. Array Vuoti
```typescript
// ❌ SBAGLIATO
const avg = matches.reduce((a, m) => a + m.gpm, 0) / matches.length

// ✅ CORRETTO
const avg = matches.length > 0
  ? matches.reduce((a, m) => a + m.gpm, 0) / matches.length
  : 0
```

## Campi Importanti

### Match
- `duration`: In **secondi** (non minuti!)
- `radiant_win`: Boolean
- `players`: Array di 10 giocatori (0-4 Radiant, 5-9 Dire)

### Player
- `player_slot`: 0-127 = Radiant, 128-255 = Dire
- `kills`, `deaths`, `assists`: Numeri interi
- `gold_per_min`, `xp_per_min`: Numeri (possono essere 0)
- `total_gold`, `total_xp`: Usa per calcolare GPM/XPM se mancanti
- `last_hits`, `denies`: Numeri interi
- `hero_damage`, `tower_damage`: Numeri interi
- `hero_id`: ID eroe (number)

### Hero
- `id`: ID eroe
- `name`: "npc_dota_hero_antimage"
- `localized_name`: "Anti-Mage"
- `primary_attr`: "agi" | "str" | "int" | "all"
- `roles`: Array di stringhe ["Carry", "Support", ...]

## Trappole Comuni

1. **GPM/XPM da summary**: Non affidabile, usa match completo
2. **Divisione per zero**: Usa `Math.max(denominator, 1)`
3. **Array vuoti**: Controlla `length > 0` prima di dividere
4. **Durata in secondi**: `match.duration` è in secondi, non minuti
5. **Campi opzionali**: Usa `|| 0` come fallback
6. **Player slot**: `< 128` = Radiant, `>= 128` = Dire

## Cache

```typescript
// Next.js fetch con cache
fetch(url, {
  next: { revalidate: 3600 }  // Cache 1 ora
})

// Headers response
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
})
```

## File di Riferimento

- **Formule complete**: `calculations.md`
- **Endpoint dettagliati**: `endpoints.md`
- **Campi JSON**: `payloads.md`
- **Errori e limiti**: `errors-and-limits.md`
- **Esempi JSON**: `examples/`

