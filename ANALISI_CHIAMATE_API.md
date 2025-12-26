# 📊 Analisi Chiamate API - Role Analysis

## 🔍 Chiamate per Analisi "Role Analysis"

### Endpoint: `/api/player/[id]/role-analysis`

#### Chiamate Dirette OpenDota:
1. `/players/${id}/heroes` - 1 chiamata
2. `/heroes` - 1 chiamata  
3. `/matches/${matchId}` - **50 chiamate** (per trend)

#### Chiamate Interne (che a loro volta chiamano OpenDota):

**1. `/api/player/${id}/stats`** chiama:
- `/players/${id}/matches?limit=20` - 1 chiamata
- `/matches/${matchId}` - **20 chiamate** (per ogni match)

**2. `/api/player/${id}/advanced-stats`** chiama:
- `/players/${id}/matches?limit=20` - 1 chiamata ⚠️ **DUPLICATO**
- `/matches/${matchId}` - **20 chiamate** ⚠️ **DUPLICATO**

---

## 📈 Totale Chiamate OpenDota per Role Analysis

### Scenario: Cache VUOTA (prima richiesta)
```
1. /players/${id}/matches?limit=20 (da stats)          = 1
2. /matches/${matchId} x 20 (da stats)                 = 20
3. /players/${id}/matches?limit=20 (da advanced-stats) = 1 ⚠️ DUPLICATO
4. /matches/${matchId} x 20 (da advanced-stats)        = 20 ⚠️ DUPLICATO
5. /players/${id}/heroes                               = 1
6. /heroes                                              = 1
7. /matches/${matchId} x 50 (da role-analysis)         = 50
────────────────────────────────────────────────────────────
TOTALE: 94 chiamate OpenDota
```

### Scenario: Cache PIENA (richieste successive)
```
1. /players/${id}/matches?limit=20 (cache 60s)         = 0 ✅
2. /matches/${matchId} x 20 (cache 6h)                = 0 ✅
3. /players/${id}/matches?limit=20 (cache 60s)         = 0 ✅
4. /matches/${matchId} x 20 (cache 6h)                 = 0 ✅
5. /players/${id}/heroes (cache 60s)                  = 0 ✅
6. /heroes (cache 24h)                                 = 0 ✅
7. /matches/${matchId} x 50 (cache 6h)                = 0 ✅
────────────────────────────────────────────────────────────
TOTALE: 0 chiamate OpenDota ✅
```

---

## ⚠️ PROBLEMI IDENTIFICATI

### 1. DUPLICAZIONE CRITICA: `/api/player/${id}/stats` e `/api/player/${id}/advanced-stats`

**Problema:**
- Entrambi chiamano `/players/${id}/matches?limit=20`
- Entrambi chiamano `/matches/${matchId}` x 20
- **Risultato: 40 chiamate duplicate!**

**Soluzione:**
- `advanced-stats` dovrebbe riutilizzare i dati da `stats` se disponibili
- Oppure: unificare in un unico endpoint che restituisce entrambi

### 2. Fetch 50 Match in `role-analysis` SEMPRE

**Problema:**
- `role-analysis` fa fetch di 50 match completi SEMPRE
- Anche se l'utente non apre il tab "Trend"
- **Risultato: 50 chiamate inutili se non si usa Trend**

**Soluzione:**
- Fetch lazy: solo quando l'utente apre il tab "Trend"
- Oppure: query parameter `?includeTrend=true`

### 3. Cache Key Inconsistente

**Problema:**
- `stats` usa: `player:${id}:matches` (cache 60s)
- `advanced-stats` usa: `player:${id}:matches` (cache 60s) ✅ OK
- `role-analysis` non usa questa cache, fa fetch interno

**Soluzione:**
- `role-analysis` dovrebbe controllare cache prima di chiamare `stats`/`advanced-stats`

---

## 💡 OTTIMIZZAZIONI PROPOSTE

### Ottimizzazione 1: Unificare stats e advanced-stats
```typescript
// Nuovo endpoint: /api/player/${id}/all-stats
// Restituisce sia stats che advanced-stats in una chiamata
// Elimina duplicazione: -40 chiamate
```

### Ottimizzazione 2: Lazy loading match per trend
```typescript
// role-analysis: fetch 50 match solo se ?includeTrend=true
// Elimina chiamate inutili: -50 chiamate (se trend non usato)
```

### Ottimizzazione 3: Riutilizzare cache tra endpoint
```typescript
// role-analysis: controlla cache prima di chiamare stats/advanced-stats
// Se cache presente, usa dati cached invece di fetch interno
```

---

## 📊 RISPARMIO POTENZIALE

### Prima (cache vuota):
- **94 chiamate** per analisi completa

### Dopo ottimizzazioni (cache vuota):
- Unificare stats: **-20 chiamate** (elimina duplicati)
- Lazy trend: **-50 chiamate** (se non usato)
- **Totale: 24 chiamate** (74% riduzione)

### Dopo ottimizzazioni (cache piena):
- **0 chiamate** (già ottimizzato)

---

## 🎯 PRIORITÀ OTTIMIZZAZIONI

1. **ALTA**: Unificare stats e advanced-stats (-20 chiamate)
2. **ALTA**: Lazy loading match per trend (-50 chiamate se non usato)
3. **MEDIA**: Migliorare cache sharing tra endpoint
4. **BASSA**: Query parameter per sezioni opzionali

