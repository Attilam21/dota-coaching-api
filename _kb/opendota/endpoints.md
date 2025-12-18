# 🔌 OpenDota API Endpoints

## Base URL
```
https://api.opendota.com/api
```

## Endpoint Principali Usati nel Progetto

### 1. Match Details
**Endpoint**: `GET /matches/{match_id}`

**Uso**: Dettagli completi di una partita

**Esempio URL**:
```
https://api.opendota.com/api/matches/8576841486
```

**Parametri**:
- `match_id` (path, required) - ID match (number)

**Ritorna**: Oggetto match completo con players, duration, radiant_win, etc.

**Cache consigliata**: 1 ora (match non cambiano)

**⚠️ IMPORTANTE - Campi Player**:
- `player_slot`: 0-4 = Radiant, 5-9 = Dire (o 0-127 Radiant, 128-255 Dire)
- `gold_per_min`, `xp_per_min`: **Sempre presenti** nel match completo
- `total_gold`, `total_xp`: Usa per calcolare GPM/XPM se mancanti
- `duration`: In **secondi**, non minuti!

**Vedi**: `calculations.md` per calcoli GPM/XPM

**Usato in**:
- `app/api/opendota/match/[id]/route.ts`
- `app/api/analysis/match/[id]/route.ts`
- `app/analysis/match/[id]/page.tsx`

---

### 2. Player Matches
**Endpoint**: `GET /players/{account_id}/matches`

**Uso**: Lista match recenti di un giocatore

**Esempio URL**:
```
https://api.opendota.com/api/players/1903287666/matches?limit=20
```

**Parametri**:
- `account_id` (path, required) - Steam Account ID (number)
- `limit` (query, optional) - Numero match da ritornare (default: 100, max: 100)
- `offset` (query, optional) - Offset per paginazione

**Ritorna**: Array di match summary (non dettagli completi)

**Cache consigliata**: 1 ora

**⚠️ IMPORTANTE - Pattern Summary + Full Match**:
- Il summary **NON** ha sempre GPM/XPM accurati
- **SEMPRE** fetchare match completi (`/matches/{match_id}`) per GPM/XPM
- Pattern usato nel progetto:
  1. Fetch summary: `/players/{id}/matches?limit=20`
  2. Fetch full matches: `/matches/{match_id}` per ogni match
  3. Arricchisci summary con dati completi

**Vedi**: `calculations.md` per pattern completo

**Usato in**:
- `app/api/player/[id]/stats/route.ts`
- `app/api/player/[id]/advanced-stats/route.ts`

---

### 3. Player Profile
**Endpoint**: `GET /players/{account_id}`

**Uso**: Profilo base giocatore (MMR, rank, win/loss)

**Esempio URL**:
```
https://api.opendota.com/api/players/1903287666
```

**Parametri**:
- `account_id` (path, required) - Steam Account ID (number)

**Ritorna**: Profilo con win, lose, solo_competitive_rank, etc.

**Cache consigliata**: 1 ora

**Usato in**:
- `app/api/player/[id]/profile/route.ts`
- `app/api/player/[id]/coaching/route.ts`

---

### 4. Player Heroes
**Endpoint**: `GET /players/{account_id}/heroes`

**Uso**: Statistiche giocatore per eroe

**Esempio URL**:
```
https://api.opendota.com/api/players/1903287666/heroes
```

**Parametri**:
- `account_id` (path, required) - Steam Account ID (number)

**Ritorna**: Array con stats per ogni eroe (games, wins, winrate)

**Cache consigliata**: 1 ora

**Usato in**:
- `app/api/player/[id]/role-analysis/route.ts`
- `app/api/player/[id]/hero-analysis/route.ts`

---

### 5. Heroes List
**Endpoint**: `GET /heroes`

**Uso**: Lista completa eroi Dota 2 (nomi, ID, ruoli)

**Esempio URL**:
```
https://api.opendota.com/api/heroes
```

**Parametri**: Nessuno

**Ritorna**: Array di tutti gli eroi con id, name, localized_name, roles

**Cache consigliata**: 24 ore (heroes non cambiano)

**Usato in**:
- `app/api/opendota/heroes/route.ts`
- Tutte le pagine che mappano hero_id → nome

---

### 6. Player Win/Loss
**Endpoint**: `GET /players/{account_id}/wl`

**Uso**: Statistiche win/loss aggregate

**Esempio URL**:
```
https://api.opendota.com/api/players/1903287666/wl
```

**Parametri**:
- `account_id` (path, required) - Steam Account ID (number)

**Ritorna**: `{ win: number, lose: number }`

**Cache consigliata**: 1 ora

**Usato in**:
- `app/api/player/[id]/profile/route.ts`

---

### 7. Player Advanced Stats (Opzionale)
**Endpoint**: `GET /players/{account_id}/matches?limit=20` + fetch dettagli

**Uso**: Per calcolare stats avanzate (lane, farm, fights, vision)

**Nota**: Non esiste endpoint diretto. Si fa:
1. Fetch `/players/{id}/matches?limit=20`
2. Per ogni match, fetch `/matches/{match_id}` per dettagli completi
3. Calcola stats aggregate lato backend

**Usato in**:
- `app/api/player/[id]/advanced-stats/route.ts`

---

## Endpoint Non Usati (ma Disponibili)

- `/players/{id}/ratings` - Percentiles (potrebbe essere utile)
- `/players/{id}/rankings` - Global rankings (potrebbe essere utile)
- `/players/{id}/matches?hero_id={hero_id}` - Match per eroe specifico
- `/matches/{id}/timeline` - Timeline eventi match

---

## Pattern di Uso nel Progetto

### Fetch Match Completo
```typescript
const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
  next: { revalidate: 3600 } // Cache 1 ora
})
const match = await response.json()
```

### Fetch Player Matches
```typescript
const response = await fetch(
  `https://api.opendota.com/api/players/${playerId}/matches?limit=20`,
  { next: { revalidate: 3600 } }
)
const matches = await response.json()
```

### Fetch Heroes List
```typescript
const response = await fetch('https://api.opendota.com/api/heroes', {
  next: { revalidate: 86400 } // Cache 24 ore
})
const heroes = await response.json()
```

---

**Nota**: Tutti gli endpoint sono pubblici, non richiedono API key.

