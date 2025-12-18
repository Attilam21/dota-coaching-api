# Calcoli e Analisi OpenDota

Questo documento contiene **tutte le formule, pattern e best practices** usate nel progetto per calcolare statistiche e analisi dai dati OpenDota.

## 📊 Formule Base

### KDA (Kill/Death/Assist Ratio)
```typescript
// Formula standard (evita divisione per zero)
const kda = (kills + assists) / Math.max(deaths, 1)

// Esempio dal codice:
const kda = (player.kills + player.assists) / Math.max(player.deaths, 1)
```

**⚠️ IMPORTANTE**: Sempre usare `Math.max(deaths, 1)` per evitare divisione per zero quando `deaths = 0`.

### Winrate
```typescript
// Determina se il giocatore ha vinto
const isWin = (player_slot < 128 && radiant_win) || (player_slot >= 128 && !radiant_win)

// Calcola winrate su N partite
const wins = matches.filter(m => isWin).length
const winrate = matches.length > 0 ? (wins / matches.length) * 100 : 0
```

**⚠️ IMPORTANTE**: 
- `player_slot < 128` = Radiant (0-127)
- `player_slot >= 128` = Dire (128-255)
- Sempre controllare `matches.length > 0` prima di dividere.

### GPM (Gold Per Minute)
```typescript
// Priorità: 1) gold_per_min dal match completo, 2) calcolo da total_gold
let gpm = player.gold_per_min || 0

if (gpm === 0 && match.duration > 0) {
  const totalGold = player.total_gold || player.gold || 0
  gpm = Math.round((totalGold / match.duration) * 60)
}

// Media su N partite
const avgGPM = matches.length > 0 
  ? matches.reduce((acc, m) => acc + (m.gold_per_min || 0), 0) / matches.length 
  : 0
```

**⚠️ IMPORTANTE**: 
- `gold_per_min` può essere `undefined` o `0` nel match summary
- **SEMPRE** fetchare il match completo (`/api/matches/{match_id}`) per GPM/XPM accurati
- `match.duration` è in **secondi**, moltiplicare per 60 per ottenere minuti

### XPM (XP Per Minute)
```typescript
// Priorità: 1) xp_per_min dal match completo, 2) calcolo da total_xp
let xpm = player.xp_per_min || 0

if (xpm === 0 && match.duration > 0) {
  const totalXP = player.total_xp || player.xp || 0
  xpm = Math.round((totalXP / match.duration) * 60)
}

// Media su N partite
const avgXPM = matches.length > 0
  ? matches.reduce((acc, m) => acc + (m.xp_per_min || 0), 0) / matches.length
  : 0
```

### CS (Creep Score) Per Minute
```typescript
const lastHits = player.last_hits || 0
const denies = player.denies || 0
const totalCS = lastHits + denies

// CS per minuto
const csPerMin = match.duration > 0 
  ? (totalCS / (match.duration / 60)).toFixed(1) 
  : '0'

// Media su N partite
const avgCS = matches.length > 0
  ? matches.reduce((acc, m) => acc + (m.last_hits || 0) + (m.denies || 0), 0) / matches.length
  : 0
```

### Kill Participation
```typescript
// Calcola kill participation del giocatore rispetto al team
const playerTeam = player.player_slot < 128 
  ? match.players.slice(0, 5)  // Radiant
  : match.players.slice(5, 10)  // Dire

const teamTotalKills = playerTeam.reduce((sum, p) => sum + p.kills, 0)
const killParticipation = teamTotalKills > 0 
  ? (((player.kills + player.assists) / teamTotalKills) * 100).toFixed(1)
  : '0'
```

## 🎯 Statistiche Avanzate

### Farm Efficiency
```typescript
// (last_hits + denies) per minuto di durata media
const avgDuration = matches.reduce((acc, m) => acc + m.duration, 0) / matches.length
const farmEfficiency = avgDuration > 0 
  ? ((avgLastHits + avgDenies) / (avgDuration / 60)) 
  : 0
```

### Damage Efficiency
```typescript
// Danno per morte (evita divisione per zero)
const damageEfficiency = player.deaths > 0 
  ? (heroDamage / player.deaths).toFixed(0) 
  : heroDamage.toFixed(0)
```

### Gold Utilization
```typescript
// Percentuale di gold speso rispetto a gold totale
const totalGold = goldSpent + netWorth
const goldUtilization = totalGold > 0 
  ? ((goldSpent / totalGold) * 100).toFixed(1) 
  : '0'
```

### Buyback Efficiency
```typescript
// Winrate quando viene usato buyback
const matchesWithBuyback = matches.filter(m => m.buyback_count > 0)
const buybackWins = matchesWithBuyback.filter(m => m.win).length
const buybackEfficiency = matchesWithBuyback.length > 0 
  ? (buybackWins / matchesWithBuyback.length) * 100 
  : 0
```

### Vision Score
```typescript
// Score basato su ward piazzati e uccisi
const visionScore = (observerPlaced * 2) + (observerKilled * 1) + (sentryPlaced * 1)
```

### Support Score
```typescript
// Score per support (solo se è support)
const supportScore = isSupport 
  ? (observerWards * 2 + sentryWards * 1.5 + assists * 3 + heroHealing / 100).toFixed(0)
  : '0'
```

### Carry Impact Score
```typescript
// Score per carry (solo se è carry)
const carryImpactScore = isCarry
  ? (goldPerMin * 0.5 + towerDamage * 0.3 + heroDamage * 0.001 + kda * 10).toFixed(0)
  : '0'
```

## 🔍 Pattern di Analisi

### Determinare Team (Radiant vs Dire)
```typescript
// Pattern standard usato in tutto il progetto
const isRadiant = player.player_slot < 128
const isDire = player.player_slot >= 128

// Trova tutti i giocatori del team
const radiantPlayers = match.players.slice(0, 5)
const direPlayers = match.players.slice(5, 10)
```

### Trovare Giocatore in Match Completo
```typescript
// Pattern: 1) per account_id, 2) fallback su player_slot
let playerInMatch = fullMatch.players.find((p: any) => 
  p.account_id?.toString() === accountId
) || fullMatch.players.find((p: any) => 
  p.player_slot === summaryMatch.player_slot
)
```

### Arricchire Match Summary con Dati Completi
```typescript
// Pattern usato in stats/route.ts e advanced-stats/route.ts
// 1. Fetch match summary (veloce, ma dati limitati)
const matchesSummary = await fetch(`/api/players/${id}/matches?limit=20`)

// 2. Fetch match completi per GPM/XPM accurati
const fullMatchesPromises = matchesSummary.slice(0, 20).map((m) =>
  fetch(`https://api.opendota.com/api/matches/${m.match_id}`)
    .then(res => res.ok ? res.json() : null)
    .catch(() => null)
)
const fullMatches = await Promise.all(fullMatchesPromises)

// 3. Arricchisci ogni match con dati completi
matchesSummary.forEach((match, idx) => {
  const fullMatch = fullMatches[idx]
  if (fullMatch?.players && fullMatch.duration > 0) {
    const playerInMatch = fullMatch.players.find((p: any) => 
      p.player_slot === match.player_slot
    )
    if (playerInMatch) {
      match.gold_per_min = playerInMatch.gold_per_min || calculateGPM(playerInMatch, fullMatch)
      match.xp_per_min = playerInMatch.xp_per_min || calculateXPM(playerInMatch, fullMatch)
    }
  }
})
```

### Analisi per Fase di Gioco
```typescript
// Early: 0-15min, Mid: 15-30min, Late: 30+min
const earlyMatches = matches.filter(m => m.duration <= 900)  // 15 min = 900 sec
const midMatches = matches.filter(m => m.duration > 900 && m.duration <= 1800)  // 15-30 min
const lateMatches = matches.filter(m => m.duration > 1800)  // 30+ min

const earlyWinrate = earlyMatches.length > 0 
  ? (earlyMatches.filter(m => m.win).length / earlyMatches.length) * 100 
  : 0
```

### Determinare Ruolo del Giocatore
```typescript
// Pattern usato in analysis/match/[id]/route.ts
let role = 'Core' // default
let isCarry = false
let isSupport = false

if (goldPerMin > 500) {
  role = 'Carry'
  isCarry = true
} else if (goldPerMin < 350 && assists > kills) {
  role = 'Support'
  isSupport = true
} else if (goldPerMin > 450 && goldPerMin <= 550 && kills > assists) {
  role = 'Mid'
} else if (goldPerMin > 350 && goldPerMin <= 500 && deaths < 8) {
  role = 'Offlane'
}
```

## 📈 Standard Meta (2024)

```typescript
// Usati per confronti e raccomandazioni
const META_STANDARDS = {
  carry: {
    gpm: 550,
    xpm: 600,
    csPerMin: 7,
    killParticipation: 60,
    towerDamage: 1500,
    deaths: 5,
    kda: 2.5
  },
  mid: {
    gpm: 550,
    xpm: 650,
    csPerMin: 6.5,
    killParticipation: 70,
    towerDamage: 1000,
    deaths: 5,
    kda: 2.8
  },
  offlane: {
    gpm: 400,
    xpm: 500,
    csPerMin: 5,
    killParticipation: 65,
    towerDamage: 800,
    deaths: 6,
    kda: 2.0
  },
  support: {
    gpm: 300,
    xpm: 400,
    csPerMin: 2,
    killParticipation: 75,
    towerDamage: 200,
    deaths: 7,
    kda: 1.5
  }
}
```

## ⚠️ Best Practices e Trappole Comuni

### 1. Divisione per Zero
```typescript
// ❌ SBAGLIATO
const kda = (kills + assists) / deaths  // Se deaths = 0, crash!

// ✅ CORRETTO
const kda = (kills + assists) / Math.max(deaths, 1)
```

### 2. Array Vuoti
```typescript
// ❌ SBAGLIATO
const avgGPM = matches.reduce((acc, m) => acc + m.gpm, 0) / matches.length

// ✅ CORRETTO
const avgGPM = matches.length > 0
  ? matches.reduce((acc, m) => acc + m.gpm, 0) / matches.length
  : 0
```

### 3. GPM/XPM da Match Summary
```typescript
// ❌ SBAGLIATO - Match summary può avere GPM/XPM = 0 o undefined
const gpm = matchSummary.gold_per_min  // Può essere 0 o undefined!

// ✅ CORRETTO - Fetch match completo
const fullMatch = await fetch(`/api/matches/${match_id}`)
const playerInMatch = fullMatch.players.find(p => p.player_slot === player_slot)
const gpm = playerInMatch.gold_per_min || calculateFromTotalGold(playerInMatch, fullMatch)
```

### 4. Durata Match in Secondi
```typescript
// ⚠️ IMPORTANTE: match.duration è in SECONDI, non minuti!
const durationMinutes = match.duration / 60
const gpm = (totalGold / match.duration) * 60  // Corretto: * 60 per convertire
```

### 5. Campi Opzionali
```typescript
// ❌ SBAGLIATO - Assume che il campo esista sempre
const heroDamage = player.hero_damage

// ✅ CORRETTO - Usa fallback
const heroDamage = player.hero_damage || 0
```

### 6. Nomi Campi Alternativi
```typescript
// ⚠️ OpenDota usa nomi diversi in contesti diversi
const observerKilled = player.observer_kills || player.obs_killed || 0
const sentryKilled = player.sentry_kills || player.sen_killed || 0
const totalGold = player.total_gold || player.gold || 0
const totalXP = player.total_xp || player.xp || 0
```

## 🔄 Pattern di Fetching

### Pattern Standard: Summary + Full Match
```typescript
// 1. Fetch veloce (summary)
const summary = await fetch(`/api/players/${id}/matches?limit=20`)

// 2. Fetch completo solo per match necessari (primi 20)
const fullMatches = await Promise.all(
  summary.slice(0, 20).map(m => 
    fetch(`/api/matches/${m.match_id}`).then(r => r.json())
  )
)

// 3. Arricchisci summary con dati completi
summary.forEach((match, idx) => {
  const full = fullMatches[idx]
  // ... arricchisci match
})
```

### Pattern: Cache e Revalidation
```typescript
// Usa sempre next: { revalidate } per cache
const response = await fetch(`https://api.opendota.com/api/players/${id}`, {
  next: { revalidate: 3600 }  // Cache 1 ora
})

// Headers per cache lato client
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
})
```

## 📝 Note Finali

1. **Sempre validare dati**: Controlla `duration > 0`, `matches.length > 0`, campi opzionali
2. **Usa match completi per GPM/XPM**: Il summary non è affidabile
3. **Evita divisione per zero**: Usa `Math.max(denominator, 1)` o controlli `length > 0`
4. **Gestisci campi opzionali**: Usa `|| 0` o `|| []` come fallback
5. **Cache appropriata**: 1 ora per dati player, 24 ore per heroes
6. **Player slot**: `< 128` = Radiant, `>= 128` = Dire

