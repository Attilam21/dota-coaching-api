# 🔍 ANALISI GESTIONE PARTITE - Il Vero Problema

**Data**: 20 Dicembre 2025  
**Errore**: "Failed to fetch basic player stats"  
**Causa**: Struttura dati partite inconsistente tra endpoint

---

## 🎯 STRUTTURA DATI - Come vengono gestite le partite

### 1. **stats/route.ts** ritorna:

```typescript
return NextResponse.json({
  matches: matches.slice(0, 20),  // ← Array RAW (OpenDotaMatch[])
  stats: {
    winrate: {...},
    kda: {...},
    farm: {...},
    matches: matches.slice(0, 20).map(...)  // ← Array PROCESSATO dentro stats
  }
})
```

**Struttura risultante:**
```json
{
  "matches": [...],  // Array RAW delle partite
  "stats": {
    "winrate": {...},
    "kda": {...},
    "farm": {...},
    "matches": [...]  // Array PROCESSATO dentro stats (con gpm, xpm, kda, win)
  }
}
```

---

### 2. **advanced-stats/route.ts** ritorna:

```typescript
return NextResponse.json({
  matches: matchesBreakdown,  // ← Array PROCESSATO
  stats: {
    lane: {...},
    farm: {...},
    fights: {...},
    vision: {...}
  }
})
```

**Struttura risultante:**
```json
{
  "matches": [...],  // Array PROCESSATO
  "stats": {
    "lane": {...},
    "farm": {...},
    "fights": {...},
    "vision": {...}
    // ← NO matches dentro stats!
  }
}
```

---

### 3. **profile/route.ts** si aspetta:

```typescript
const stats = statsData.stats  // ← Prende stats da stats/route.ts
const matches = stats.matches || []  // ← Prende matches DENTRO stats!
```

**Problema**: `profile/route.ts` si aspetta che `stats.matches` esista, ma:
- ✅ `stats/route.ts` HA `stats.matches`
- ❌ `advanced-stats/route.ts` NON HA `stats.matches`

---

## 🔴 IL PROBLEMA REALE

### Flusso attuale:

1. **profile/route.ts** chiama:
   - `stats/route.ts` → ritorna `{ matches: [...], stats: { matches: [...] } }`
   - `advanced-stats/route.ts` → ritorna `{ matches: [...], stats: { ... } }` (senza matches dentro stats)

2. **profile/route.ts** fa:
   ```typescript
   if (!statsData?.stats) {  // ← Controlla se stats esiste
     return error
   }
   const stats = statsData.stats
   const matches = stats.matches || []  // ← Prende matches da DENTRO stats
   ```

3. **Se stats/route.ts fallisce o ritorna struttura diversa:**
   - `statsData.stats` = `undefined` o `null`
   - Errore: "Failed to fetch basic player stats"

---

## 🔍 POSSIBILI CAUSE

### Causa 1: stats/route.ts ritorna errore invece di dati

Se `stats/route.ts` fallisce (per es. OpenDota API down):
```typescript
return NextResponse.json(
  { error: 'Failed to fetch matches' },
  { status: 500 }
)
```

Allora `statsResponse.ok` = `false`, ma il codice in profile/route.ts:
```typescript
if (statsResponse.ok) {
  statsData = await statsResponse.json()  // ← Non viene eseguito
}
// statsData rimane null
if (!statsData?.stats) {  // ← TRUE, quindi errore!
  return error
}
```

---

### Causa 2: Struttura risposta diversa quando matches.length === 0

In `stats/route.ts` quando non ci sono match:
```typescript
if (!matches || matches.length === 0) {
  return NextResponse.json({
    matches: [],
    stats: {
      winrate: {...},
      kda: {...},
      farm: {...},
      matches: [],  // ← Array vuoto, ma ESISTE
    }
  })
}
```

Questo dovrebbe funzionare, ma se c'è un problema nel parsing...

---

### Causa 3: Modifiche al codice hanno cambiato la struttura

Dopo il revert del refresh system, potrebbe esserci un problema:
- Cache headers rimossi potrebbero influenzare il comportamento
- Chiamate interne potrebbero fallire in modo diverso

---

## ✅ SOLUZIONE

### Verificare cosa ritorna realmente stats/route.ts

Devo testare:
1. Chiamata diretta a `/api/player/[id]/stats`
2. Verificare struttura risposta
3. Verificare se `stats.matches` esiste sempre

### Fix possibile:

**Opzione A**: Usare `statsData.matches` invece di `stats.matches`:
```typescript
const stats = statsData.stats
const matches = statsData.matches || stats.matches || []  // ← Fallback a root matches
```

**Opzione B**: Verificare meglio la struttura:
```typescript
if (!statsData?.stats || !statsData.stats.matches) {
  // Usa statsData.matches come fallback
  const matches = statsData.matches || []
}
```

---

## 🔧 DEBUG NECESSARIO

1. Testare chiamata diretta a `/api/player/[id]/stats`
2. Verificare log Vercel per vedere cosa ritorna realmente
3. Verificare se il problema è solo quando non ci sono match o sempre
4. Confrontare struttura dati attuale vs precedente

**ASPETTO IL TUO VIA PER PROCEDERE CON IL DEBUG E IL FIX.**

