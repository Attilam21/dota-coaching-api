# ANALISI COMPLETA - PROBLEMI TROVATI NEL DASHBOARD

## 🔴 PROBLEMI CRITICI

### 1. CHIAMATE API DUPLICATE

#### hero-analysis/page.tsx
- **Linea 147**: `fetch('/api/player/${playerId}/hero-analysis')` in `fetchAnalysis()`
- **Linea 182**: `fetch('/api/player/${playerId}/hero-analysis')` in `fetchTrendData()`
- **PROBLEMA**: Chiama la stessa API due volte quando potrebbe riutilizzare i dati

#### role-analysis/page.tsx
- **Linea 128**: `fetch('/api/player/${playerId}/role-analysis')` in `fetchAnalysis()`
- **Linea 284**: `fetch('/api/player/${playerId}/role-analysis')` in `fetchTrendData()`
- **PROBLEMA**: Chiama la stessa API due volte (già parzialmente risolto con riuso dati, ma fallback ancora fa fetch)

#### builds/page.tsx
- **Linea 155**: `fetch('/api/opendota/heroes')` in `useEffect` principale
- **Linea 248**: `fetch('/api/opendota/heroes')` in `retryHeroes()`
- **PROBLEMA**: Fetch duplicato se heroes già caricati

#### match-analysis/[id]/page.tsx
- **Linea 217**: `fetch('/api/player/${playerId}/stats')` 
- **Linea 229**: `fetch('/api/player/${playerId}/advanced-stats')` (dopo stats)
- **PROBLEMA**: Fetch sequenziali invece di paralleli (più lento)

---

## 🟡 INCONSISTENZE ARCHITETTURALI

### 2. GESTIONE AbortController INCONSISTENTE

**role-analysis/page.tsx**: ✅ Usa AbortController per gestire race conditions
- `fetchAnalysis(abortController.signal)`
- `fetchTrendData(abortController.signal)`

**Tutte le altre pagine**: ❌ NON usano AbortController
- hero-analysis, performance, matches, teammates, coaching-insights, etc.
- **PROBLEMA**: Race conditions possibili quando playerId cambia rapidamente

**RACCOMANDAZIONE**: Standardizzare uso di AbortController in tutte le pagine

---

### 3. GESTIONE ERRORI INCONSISTENTE

#### Pagine con try-catch per .json():
- ✅ role-analysis: `try { roleData = await roleResponse.json() } catch`
- ✅ coaching-insights: `try { data = await response.json() } catch`
- ✅ performance: `try { statsData = await statsResponse.json() } catch`

#### Pagine SENZA try-catch per .json():
- ❌ hero-analysis: `const data = await response.json()` (linea 150, 167, 185)
- ❌ matches: `const data = await response.json()` (linea 95)
- ❌ teammates: `const data = await response.json()` (probabile)
- ❌ heroes: `const data = await response.json()` (probabile)

**PROBLEMA**: Se API ritorna HTML invece di JSON (es. errore 500), crash dell'app

---

### 4. VALIDAZIONE DATI INCONSISTENTE

#### Pagine con validazione:
- ✅ role-analysis: `if (!roleData || typeof roleData !== 'object')`
- ✅ coaching-insights: `if (!data || typeof data !== 'object')`
- ✅ matches: `if (!data || typeof data !== 'object')`

#### Pagine SENZA validazione:
- ❌ hero-analysis: `setAnalysis(data)` senza validazione
- ❌ teammates: `setTeammates(data.peers || [])` (validazione minima)
- ❌ heroes: `setHeroStats(data.heroStats || [])` (validazione minima)

**PROBLEMA**: Se API ritorna formato inatteso, crash o dati corrotti

---

### 5. FETCH HEROES DUPLICATO IN OGNI PAGINA

**Pagine che fanno fetch di `/api/opendota/heroes`:**
- role-analysis/page.tsx (linea 90)
- hero-analysis/page.tsx (linea 117)
- heroes/page.tsx (linea 74)
- matches/page.tsx (linea 62)
- page.tsx (dashboard principale, linea 168)
- builds/page.tsx (linea 155, 248)
- match-analysis/[id]/page.tsx (linea 157)

**PROBLEMA**: 
- 7+ fetch separati per gli stessi dati
- Nessuna cache condivisa
- Spreco di risorse

**RACCOMANDAZIONE**: 
- Creare un hook `useHeroes()` condiviso
- O caricare heroes una volta nel layout/context

---

## 🟠 CODICE DUPLICATO

### 6. PATTERN FETCH HEROES IDENTICO

Tutte le pagine hanno questo codice duplicato:

```typescript
useEffect(() => {
  let isMounted = true
  
  fetch('/api/opendota/heroes')
    .then((res) => res.ok ? res.json() : null)
    .then((data) => {
      if (data && isMounted && Array.isArray(data)) {
        const heroesMap: Record<number, { name: string; localized_name: string }> = {}
        data.forEach((hero: { id: number; name: string; localized_name: string }) => {
          if (hero.name && hero.localized_name) {
            heroesMap[hero.id] = { name: hero.name, localized_name: hero.localized_name }
          }
        })
        setHeroes(heroesMap)
      }
    })
    .catch((error) => {
      console.error('Error loading heroes:', error)
    })
  
  return () => {
    isMounted = false
  }
}, [])
```

**Pagine con questo pattern:**
- role-analysis, hero-analysis, heroes, matches, page.tsx

**RACCOMANDAZIONE**: Estrarre in hook `useHeroes()`

---

### 7. PATTERN GESTIONE ERRORI DUPLICATO

Pattern simile in molte pagine:

```typescript
try {
  const response = await fetch(`/api/player/${playerId}/...`)
  if (!response.ok) throw new Error('Failed to fetch...')
  const data = await response.json()
  setData(data)
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load...')
} finally {
  setLoading(false)
}
```

**RACCOMANDAZIONE**: Creare utility `fetchWithErrorHandling()` o hook `useApiFetch()`

---

## 🔵 PROBLEMI DI PERFORMANCE

### 8. FETCH SEQUENZIALI INVECE DI PARALLELI

#### match-analysis/[id]/page.tsx
```typescript
// ❌ SEQUENZIALE (lento)
const statsResponse = await fetch(`/api/player/${playerId}/stats`)
// ... processa stats ...
const advancedResponse = await fetch(`/api/player/${playerId}/advanced-stats`)
```

**DOVREBBE ESSERE:**
```typescript
// ✅ PARALLELO (veloce)
const [statsResponse, advancedResponse] = await Promise.all([
  fetch(`/api/player/${playerId}/stats`),
  fetch(`/api/player/${playerId}/advanced-stats`)
])
```

---

### 9. CHIAMATE RIDONDANTI

#### coaching-insights/page.tsx
- **Linea 114**: `fetch('/api/player/${playerId}/profile')`
- **Linea 200**: `fetch('/api/player/${playerId}/stats')`
- **PROBLEMA**: `stats` potrebbe già contenere dati del profile, o viceversa

#### page.tsx (dashboard principale)
- **Linea 214-220**: Fetch multipli in parallelo (OK)
- Ma alcune pagine figlie rifanno fetch degli stessi dati

---

## 🟢 PROBLEMI MINORI

### 10. GESTIONE LOADING INCONSISTENTE

- Alcune pagine hanno `loading` unico
- Altre hanno `loading`, `loadingProfile`, `loadingMeta`, `loadingWinConditions` (coaching-insights)
- Alcune pagine mostrano spinner, altre no

**RACCOMANDAZIONE**: Standardizzare pattern di loading

---

### 11. GESTIONE playerId INCONSISTENTE

- ✅ role-analysis: `if (playerId) { fetch... }` (dopo fix)
- ✅ hero-analysis: `if (playerId) { fetch... }`
- ✅ performance: `if (playerId) { fetch... }`
- ✅ matches: `if (playerId) { fetch... }`
- ✅ coaching-insights: `if (playerId) { fetch... }`

**OK**: Ora tutte coerenti dopo fix role-analysis

---

## 📊 RIEPILOGO PROBLEMI PER PRIORITÀ

### PRIORITÀ ALTA (da fixare subito):
1. ❌ Chiamate duplicate in hero-analysis (linee 147, 182)
2. ❌ Chiamate duplicate in role-analysis fallback (linea 284)
3. ❌ Fetch heroes duplicato in 7+ pagine
4. ❌ Manca AbortController in tutte le pagine tranne role-analysis
5. ❌ Manca try-catch per .json() in hero-analysis, matches, teammates

### PRIORITÀ MEDIA:
6. ⚠️ Validazione dati inconsistente
7. ⚠️ Fetch sequenziali invece di paralleli (match-analysis)
8. ⚠️ Codice duplicato per fetch heroes (estrarre in hook)

### PRIORITÀ BASSA:
9. 💡 Gestione loading inconsistente
10. 💡 Pattern error handling duplicato (estrarre utility)

---

## 🎯 RACCOMANDAZIONI

1. **Creare hook condiviso `useHeroes()`** per eliminare fetch duplicati
2. **Standardizzare AbortController** in tutte le pagine
3. **Standardizzare try-catch per .json()** in tutte le pagine
4. **Standardizzare validazione dati** in tutte le pagine
5. **Eliminare chiamate duplicate** riutilizzando dati già fetchati
6. **Convertire fetch sequenziali in paralleli** dove possibile
7. **Creare utility `fetchWithErrorHandling()`** per ridurre duplicazione

