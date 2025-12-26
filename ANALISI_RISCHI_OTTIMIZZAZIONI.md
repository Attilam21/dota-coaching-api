# ⚠️ Analisi Rischi Ottimizzazioni

## 📊 Dipendenze Trovate

### Endpoint `/api/player/${id}/stats` usato da:
- ✅ `dashboard/page.tsx` (main dashboard)
- ✅ `dashboard/performance/page.tsx`
- ✅ `dashboard/coaching-insights/page.tsx`
- ✅ `dashboard/matches/page.tsx`
- ✅ `dashboard/match-analysis/[id]/page.tsx`
- ✅ `app/analysis/player/[id]/page.tsx`
- ✅ `app/api/player/[id]/profile/route.ts`
- ✅ `app/api/player/[id]/role-analysis/route.ts`
- ✅ `app/api/player/[id]/coaching/route.ts`
- ✅ `app/api/player/[id]/meta-comparison/route.ts`
- ✅ `app/api/ai-summary/profile/[id]/route.ts`

**Totale: 11 dipendenze**

### Endpoint `/api/player/${id}/advanced-stats` usato da:
- ✅ `dashboard/page.tsx` (main dashboard)
- ✅ `dashboard/performance/page.tsx`
- ✅ `dashboard/role-analysis/page.tsx`
- ✅ `dashboard/advanced/lane-early/page.tsx`
- ✅ `dashboard/advanced/farm-economy/page.tsx`
- ✅ `dashboard/advanced/fights-damage/page.tsx`
- ✅ `dashboard/advanced/vision-control/page.tsx`
- ✅ `dashboard/match-analysis/[id]/page.tsx`
- ✅ `app/api/player/[id]/profile/route.ts`
- ✅ `app/api/player/[id]/role-analysis/route.ts`
- ✅ `app/api/player/[id]/coaching/route.ts`
- ✅ `app/api/player/[id]/meta-comparison/route.ts`

**Totale: 12 dipendenze**

---

## ❌ OTTIMIZZAZIONI RISCHIOSE (NON FARE)

### 1. ❌ Unificare stats e advanced-stats in un unico endpoint
**Rischio: ALTO** 🔴
- **Problema**: 23 dipendenze totali che usano endpoint separati
- **Impatto**: Dovrei modificare 23 file per cambiare le chiamate
- **Risultato**: Breaking change massivo, alto rischio di bug

### 2. ❌ Rimuovere endpoint esistenti
**Rischio: CRITICO** 🔴
- **Problema**: Romperebbe tutte le pagine che li usano
- **Impatto**: App completamente non funzionante
- **Risultato**: Catastrofico

---

## ✅ OTTIMIZZAZIONI SICURE (POSSO FARE)

### 1. ✅ Condividere cache tra stats e advanced-stats
**Rischio: ZERO** 🟢
- **Cosa fa**: Usa stessa cache key per match list
- **Impatto**: Nessun cambio API, solo ottimizzazione interna
- **Risultato**: Elimina 20 chiamate duplicate senza rompere nulla
- **Implementazione**: Già fatto! Usano stessa cache key `player:${id}:matches`

### 2. ✅ Lazy loading match per trend (query param opzionale)
**Rischio: BASSO** 🟡
- **Cosa fa**: Aggiunge `?includeTrend=true` opzionale
- **Impatto**: Backward compatible (default: false per sicurezza)
- **Risultato**: Elimina 50 chiamate se trend non usato
- **Nota**: Devo modificare solo `role-analysis` endpoint

### 3. ✅ Rimuovere chiamata frontend advanced-stats in role-analysis
**Rischio: ZERO** 🟢
- **Cosa fa**: `role-analysis` già include dati advanced-stats
- **Impatto**: Solo frontend, endpoint già restituisce tutto
- **Risultato**: Elimina 1 chiamata inutile
- **Implementazione**: Rimuovere linea 131 in `role-analysis/page.tsx`

### 4. ✅ Ottimizzare cache sharing in role-analysis
**Rischio: ZERO** 🟢
- **Cosa fa**: `role-analysis` controlla cache prima di chiamare stats/advanced-stats
- **Impatto**: Nessun cambio API, solo ottimizzazione interna
- **Risultato**: Riutilizza dati già cached

---

## 🎯 PIANO OTTIMIZZAZIONI SICURE

### Fase 1: Ottimizzazioni Zero-Rischio (ora)
1. ✅ Rimuovere chiamata frontend `advanced-stats` in `role-analysis` (-1 chiamata)
2. ✅ Verificare che cache sharing funzioni correttamente

### Fase 2: Ottimizzazioni Low-Risk (dopo test)
3. 🟡 Lazy loading match per trend con query param opzionale (-50 chiamate se non usato)
   - **Test**: Verificare che trend funzioni ancora
   - **Rollback**: Facile, basta rimuovere query param

---

## 📊 RISPARMIO TOTALE (Solo Ottimizzazioni Sicure)

### Prima:
- Cache vuota: 94 chiamate
- Cache piena: 0 chiamate

### Dopo Fase 1 (Zero-Rischio):
- Cache vuota: 93 chiamate (-1)
- Cache piena: 0 chiamate

### Dopo Fase 2 (Low-Risk):
- Cache vuota: 43 chiamate (-50 se trend non usato)
- Cache piena: 0 chiamate

**Riduzione: 54% (se trend non usato)**

---

## ✅ RACCOMANDAZIONE FINALE

**FARE SUBITO (Zero-Rischio):**
1. Rimuovere chiamata frontend `advanced-stats` in role-analysis
2. Verificare cache sharing

**FARE DOPO TEST (Low-Risk):**
3. Lazy loading match per trend

**NON FARE (Alto-Rischio):**
- ❌ Unificare endpoint
- ❌ Rimuovere endpoint esistenti
- ❌ Cambiare signature API

