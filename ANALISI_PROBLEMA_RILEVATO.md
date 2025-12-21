# 🔍 ANALISI PROBLEMA - Cosa Ho Rotto

**Data**: 20 Dicembre 2025  
**Errore**: "Failed to fetch basic player stats"  
**Causa**: Modifiche al sistema di refresh hanno rotto le chiamate API interne

---

## 🔴 PROBLEMA IDENTIFICATO

### Flusso delle chiamate API:

```
Frontend → /api/player/[id]/profile
           ↓ (chiamata interna)
           /api/player/[id]/stats  ← QUI È IL PROBLEMA
           ↓
           OpenDota API
```

### Cosa ho modificato (e poi revert):

**Commit `2d7e786` (refresh system):**
- ✅ Aggiunto gestione `forceRefresh` con query param `_refresh`
- ✅ Aggiunto `cache: 'no-store'` quando `forceRefresh = true`
- ✅ Modificato headers response con Cache-Control condizionale

**Commit `a49f1ed` (revert):**
- ✅ Rimosso gestione `forceRefresh`
- ✅ Rimosso `cache: 'no-store'`
- ✅ **RIMOSSO gli headers Cache-Control dalla risposta** ⚠️

---

## ⚠️ COSA HO ROTTO (Involontariamente)

### 1. **Rimozione Cache-Control Headers**

**Prima (funzionante):**
```typescript
return NextResponse.json({
  matches: matches.slice(0, 20),
  stats,
}, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
})
```

**Dopo (rotto?):**
```typescript
return NextResponse.json({
  matches: matches.slice(0, 20),
  stats,
})  // ← NESSUN HEADER!
```

**Problema**: Questo NON dovrebbe rompere le chiamate interne, ma potrebbe influenzare il caching in Vercel.

---

### 2. **Problema Reale: Chiamate Interne**

Il vero problema è qui in `profile/route.ts` (riga 23):

```typescript
const [statsResponse, advancedStatsResponse, opendotaResponse] = await Promise.all([
  fetch(`${request.nextUrl.origin}/api/player/${playerId}/stats`),  // ← CHIAMATA INTERNA
  fetch(`${request.nextUrl.origin}/api/player/${playerId}/advanced-stats`),
  fetch(`https://api.opendota.com/api/players/${playerId}`, {
    next: { revalidate: 3600 }
  }).catch(() => null)
])
```

**Possibili problemi:**
1. `request.nextUrl.origin` potrebbe non funzionare correttamente in Vercel production
2. La chiamata interna potrebbe fallire silenziosamente
3. Il parsing della risposta potrebbe fallire

---

### 3. **Validazione Player ID in profile/route.ts**

**Aggiunta validazione (righe 11-16):**
```typescript
if (!id || id.trim() === '' || isNaN(Number(id.trim()))) {
  return NextResponse.json(
    { error: 'Invalid player ID format...' },
    { status: 400 }
  )
}
const playerId = id.trim()
```

Questa validazione è **corretta**, ma potrebbe essere troppo restrittiva se l'ID ha caratteri strani.

---

## 🔍 ANALISI FLUSSO COMPLETO

### Flusso che DOVREBBE funzionare:

1. **Frontend chiama**: `/api/player/123456/profile`
2. **profile/route.ts**:
   - Valida player ID
   - Chiama internamente: `${origin}/api/player/123456/stats`
   - Chiama internamente: `${origin}/api/player/123456/advanced-stats`
   - Chiama OpenDota: `https://api.opendota.com/api/players/123456`
3. **stats/route.ts**:
   - Chiama OpenDota: `https://api.opendota.com/api/players/123456/matches?limit=20`
   - Processa i match
   - Ritorna `{ matches, stats }`
4. **profile/route.ts**:
   - Verifica `if (!statsData?.stats)` ← **QUI FALLISCE**
   - Ritorna errore se statsData.stats non esiste

---

## 🎯 CAUSE PROBABILI

### Causa 1: Chiamata interna fallisce silenziosamente

Se `fetch(`${request.nextUrl.origin}/api/player/${playerId}/stats`)` fallisce:
- `statsResponse.ok` = `false`
- `statsData` = `null`
- `if (!statsData?.stats)` → `true` → Errore!

**Verifica necessaria**: Log in Vercel per vedere se statsResponse.ok è false.

---

### Causa 2: request.nextUrl.origin non funziona in Vercel

In Vercel production, `request.nextUrl.origin` potrebbe:
- Non essere disponibile correttamente
- Essere diverso dall'URL atteso
- Causare timeout nelle chiamate interne

**Soluzione**: Usare URL assoluto o variabile d'ambiente.

---

### Causa 3: Formato risposta cambiato

Se la risposta di `stats/route.ts` non ha la struttura attesa:
- Potrebbe non avere `statsData.stats`
- Potrebbe avere struttura diversa
- Potrebbe essere un errore invece di dati

**Verifica**: Confrontare struttura risposta attesa vs reale.

---

## ✅ VERIFICA NECESSARIA

Per capire il problema esatto, serve:

1. **Log Vercel** → Verificare cosa succede quando profile chiama stats
2. **Test diretto** → Chiamare `/api/player/[id]/stats` direttamente
3. **Test interno** → Verificare se `request.nextUrl.origin` funziona

---

## 🔧 SOLUZIONE PROVVISORIA

Se il problema è `request.nextUrl.origin`:

**Opzione A**: Usare URL assoluto da env variable
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin
fetch(`${apiUrl}/api/player/${playerId}/stats`)
```

**Opzione B**: Usare URL relativo (ma potrebbe non funzionare in server-side)
```typescript
fetch(`/api/player/${playerId}/stats`)  // Potrebbe non funzionare in API route
```

**Opzione C**: Chiamare direttamente OpenDota invece di chiamate interne
```typescript
// In profile/route.ts, invece di chiamare stats/route.ts,
// chiamare direttamente OpenDota (duplicazione logica)
```

---

## 📋 CHECKLIST DEBUG

- [ ] Verificare log Vercel per errori in stats/route.ts
- [ ] Testare `/api/player/[id]/stats` direttamente nel browser
- [ ] Verificare se `request.nextUrl.origin` è corretto
- [ ] Confrontare risposta stats attuale vs attesa
- [ ] Testare se il problema è solo in produzione o anche locale

---

**Aspetto il tuo via per procedere con la fix.**

