# 🔍 Report Incoerenze - Analisi Completa

**Data**: Gennaio 2025  
**Scope**: Tutte le sezioni, card, analisi, tab del dashboard

---

## 📊 INCOERENZE NUMERO PARTITE ANALIZZATE

### 🔴 CRITICHE (Da risolvere)

#### 1. **Dashboard Principale (`/dashboard/page.tsx`)**

**Problema**: Info box dice "fino a 10 partite" ma API carica 20 partite

**Dettagli**:
- **Info box (linea 362)**: "Analisi basata sul tuo storico recente (fino a 10 partite)"
- **API (`/api/player/[id]/stats/route.ts` linea 25)**: `limit=20` → carica 20 partite
- **Card Winrate/KDA**: Mostrano "Ultime 5 partite" e "Ultime 10 partite" ✅ (corretto)
- **Grafico Trend (linea 899)**: "Trend Ultime 10 Partite" con `{chartData.length} partite analizzate`
- **Sezione Ultime Partite (linea 994)**: Mostra prime 5 partite (`slice(0, 5)`)

**Incoerenza**: 
- Info box dice "fino a 10" ma vengono caricate 20 partite
- Grafico mostra 10 partite ma potrebbero essercene 20 disponibili

**File**: `app/dashboard/page.tsx` linea 362

---

#### 2. **Performance Page (`/dashboard/performance/page.tsx`)**

**Problema**: Testo dinamico vs grafico fisso

**Dettagli**:
- **Testo Stile Gioco (linea 384)**: "Basato su {stats.matches?.length || 20} partite recenti"
- **API**: Carica 20 partite (`matches.slice(0, 20)` linea 133)
- **Grafico Trend (linea 538)**: "Trend Performance (Ultime 10 Partite)" - FISSO a 10
- **Grafico usa**: `stats.matches.slice(0, 10)` (linea 540)

**Incoerenza**: 
- Testo dice numero dinamico (fino a 20) ma grafico mostra sempre 10
- Utente potrebbe confondersi: quante partite vengono analizzate?

**File**: `app/dashboard/performance/page.tsx` linee 384, 538, 540

---

#### 3. **Teammates Page (`/dashboard/teammates/page.tsx`)**

**Problema**: "Partite Totali" non specifica se recenti o storico completo

**Dettagli**:
- **Card "Partite Totali" (linea 328)**: Mostra `aggregateStats.totalGames`
- **API `/api/player/[id]/peers`**: Restituisce totale storico (tutte le partite con quei compagni)
- **Card "Totale Compagni" (linea 318)**: Mostra top 20 compagni (`slice(0, 20)` linea 179)
- **Card "Winrate Medio" (linea 322)**: Basato su cosa? Non specificato

**Incoerenza**: 
- "Partite Totali: 7560" → è il totale storico, non recenti
- Non è chiaro se si riferisce a recenti o storico completo
- "Winrate Medio" non specifica su quante partite è calcolato

**File**: `app/dashboard/teammates/page.tsx` linee 318, 322, 328

---

#### 4. **Profiling Page (`/dashboard/profiling/page.tsx`)**

**Problema**: Testo dice 20 ma grafico mostra 10

**Dettagli**:
- **API carica**: 20 partite (da `/api/player/[id]/profile`)
- **Grafico Trend (linea 771)**: "Trend Performance (Ultime 10 Partite)"
- **Grafico usa**: `matches.slice(0, 10)` (linea 340 in API)

**Incoerenza**: 
- Se l'API carica 20 partite, perché il grafico mostra solo 10?
- Testo non specifica quante partite vengono usate

**File**: `app/dashboard/profiling/page.tsx` linea 771

---

### 🟡 MEDIE (Da verificare)

#### 5. **Advanced Page (`/dashboard/advanced/page.tsx`)**

**Status**: ✅ COERENTE
- Info box: "fino a 20 partite"
- API: carica 20 partite
- **Nessuna incoerenza**

---

#### 6. **Matches Page (`/dashboard/matches/page.tsx`)**

**Dettagli**:
- **Titolo (linea 188)**: "Le tue ultime 20 partite"
- **API**: Carica 20 partite (`/api/player/[id]/stats`)
- **Status**: ✅ COERENTE

---

#### 7. **Match Analysis (`/dashboard/match-analysis/[id]/page.tsx`)**

**Dettagli**:
- **Commento codice (linea 212)**: "Calculate averages from last 10 matches"
- **Status**: ⚠️ Da verificare se è coerente con altre sezioni

---

## 📝 INCOERENZE TESTI E DESCRIZIONI

### 🔴 CRITICHE

#### 8. **Guide Help (`lib/pageGuides.ts`)**

**Problema**: Descrizioni non allineate con realtà

**Dettagli**:
- **Dashboard (linea 17)**: "ultime 10-20 partite" → vago
- **Matches (linea 167)**: "ultime 20 partite" ✅ corretto
- **Advanced (linea 281)**: "ultime 20 partite" ✅ corretto
- **Guida Utente (linea 403)**: "ultime 10-20 partite" → vago

**Incoerenza**: 
- Alcune guide dicono "10-20" (vago), altre "20" (specifico)
- Dovrebbe essere uniforme

---

#### 9. **Info Box Testi**

**Problema**: Testi informativi non allineati

**Dettagli**:
- **Dashboard**: "fino a 10 partite" (sbagliato, sono 20)
- **Advanced**: "fino a 20 partite" (corretto)
- **Performance**: "Basato su {dinamico} partite" (corretto ma può confondere)

**Incoerenza**: 
- Dashboard dice 10, Advanced dice 20
- Performance usa numero dinamico

---

## 🎯 INCOERENZE LOGICHE

### 🔴 CRITICHE

#### 10. **Calcolo Trend Dashboard**

**Problema**: Calcola trend su 5/10 ma ha 20 partite disponibili

**Dettagli**:
- **API carica**: 20 partite
- **Card Winrate/KDA**: Calcolano solo su ultime 5 e 10
- **Grafico Trend**: Mostra solo ultime 10

**Incoerenza**: 
- Perché non usare tutte le 20 partite disponibili?
- O perché non specificare che si usano solo 5/10 per il trend?

---

#### 11. **Teammates - Partite Totali**

**Problema**: "Partite Totali" è ambiguo

**Dettagli**:
- **Card "Partite Totali" (linea 328)**: Mostra `totalGames` = somma di tutte le partite con i top 20 compagni
- **Calcolo (linea 71)**: `teammates.reduce((sum, t) => sum + t.games, 0)` → somma storico completo
- **Card "Winrate Medio" (linea 322)**: Media dei winrate dei compagni, non basato su numero specifico di partite
- **Card "Totale Compagni" (linea 318)**: Mostra top 20 (`slice(0, 20)`)

**Incoerenza**: 
- "Partite Totali: 7560" → è il totale storico con i top 20 compagni, non recenti
- Non è chiaro se si riferisce a recenti o storico completo
- "Winrate Medio" non specifica su quante partite è calcolato

**File**: `app/dashboard/teammates/page.tsx` linee 68-84, 318, 322, 328

---

#### 12. **Dashboard - "Snapshot Stato Forma"**

**Problema**: Titolo vago "ultime partite" senza specificare quante

**Dettagli**:
- **Titolo (linea 405)**: "Snapshot Stato Forma (ultime partite)"
- **Card Winrate/KDA**: Mostrano "Ultime 5 partite" e "Ultime 10 partite" ✅
- **Card Farm**: Mostra "Media ultime 5/10 partite" ✅
- **Info box sopra (linea 362)**: Dice "fino a 10 partite" ❌

**Incoerenza**: 
- Titolo dice solo "ultime partite" senza numero
- Info box dice "10" ma API carica 20
- Le card sono corrette (5/10)

**File**: `app/dashboard/page.tsx` linee 362, 405

---

## 📋 RIEPILOGO INCOERENZE

### Per Priorità

#### 🔴 ALTA PRIORITÀ (Confusione utente)

1. **Dashboard**: Info box dice "10 partite" ma carica 20
2. **Performance**: Testo dinamico vs grafico fisso a 10
3. **Teammates**: "Partite Totali" ambiguo (storico vs recenti)
4. **Profiling**: Grafico mostra 10 ma API carica 20

#### 🟡 MEDIA PRIORITÀ (Coerenza)

5. **Guide Help**: Testi vaghi "10-20 partite" invece di specifici
6. **Info Box**: Incoerenza tra Dashboard (10) e Advanced (20)
7. **Calcolo Trend**: Usa solo 5/10 quando ci sono 20 disponibili

---

## 💡 RACCOMANDAZIONI

### Opzione A: Standardizzare a 20 partite (CONSIGLIATO)
- **Dashboard**: Cambiare info box da "10" a "20"
- **Performance**: Cambiare grafico da 10 a 20 partite
- **Profiling**: Cambiare grafico da 10 a 20 partite
- **Guide Help**: Specificare sempre "20 partite" invece di "10-20"

### Opzione B: Standardizzare a 10 partite
- **API**: Cambiare limit da 20 a 10
- **Advanced**: Cambiare da 20 a 10
- **Tutte le sezioni**: Allineare a 10

### Opzione C: Mantenere differenze ma chiarire
- **Dashboard**: "Analisi basata su ultime 20 partite (trend calcolato su 5/10)"
- **Performance**: "Basato su 20 partite (grafico mostra ultime 10)"
- **Teammates**: "Partite Totali (storico)" vs "Partite Recenti"

---

## 📊 STATO ATTUALE API

### Limiti API Attuali:
- `/api/player/[id]/stats`: `limit=20` ✅
- `/api/player/[id]/advanced-stats`: `limit=20` ✅
- `/api/player/[id]/profile`: `limit=20` (implicito) ✅
- `/api/player/[id]/peers`: Totale storico (non limitato)
- `/api/player/[id]/anti-tilt`: `limit=50` ⚠️
- `/api/player/[id]/team/synergy-matrix`: `limit=100` ⚠️
- `/api/player/[id]/team/optimal-builder`: `limit=100` ⚠️

**Incoerenza API**: Alcune usano 20, altre 50, altre 100

---

## ✅ COSE DA MANTENERE

1. **Card Winrate/KDA**: "Ultime 5 partite" e "Ultime 10 partite" sono corrette e utili
2. **Advanced Page**: Coerente (20 partite)
3. **Matches Page**: Coerente (20 partite)
4. **Calcolo Trend 5/10**: Utile per vedere trend recente vs medio termine

---

---

## 📸 RIFERIMENTI VISUALI (Dalle foto fornite)

### Foto 1: Dashboard Teammates
- **"Totale Compagni: 20"** ✅ (top 20)
- **"Winrate Medio: 40.5%"** ⚠️ (non specifica su quante partite)
- **"Partite Totali: 7560"** ❌ (storico, non recenti - ambiguo)
- **"Compagno Più Frequente: chad (925 partite)"** ✅ (corretto)

### Foto 2: Performance Page
- **"Basato su 20 partite recenti"** ✅ (corretto)
- **"Stile di Gioco: Support - Team Focus"** ✅
- **Metriche**: Kill Participation 68%, Gold Utilization 88%, ecc. ✅

### Foto 3: Dashboard Principale
- **Info box verde**: "Analisi basata sul tuo storico recente (fino a 10 partite)" ❌ (dice 10 ma carica 20)
- **Card Winrate**: "Ultime 5 partite: 60.0%", "Ultime 10 partite: 60.0%" ✅ (corretto)
- **Card KDA**: "Ultime 5 partite: 3.10", "Ultime 10 partite: 3.93" ✅ (corretto)
- **Card Farm**: "GPM: 329 / 359", "XPM: 446 / 470" ✅ (corretto, mostra 5/10)
- **"Snapshot Stato Forma (ultime partite)"** ⚠️ (vago, non specifica quante)

---

## 🎯 DECISIONI DA PRENDERE

### 1. **Standardizzare numero partite**
- [ ] Opzione A: Tutto a 20 partite (CONSIGLIATO)
- [ ] Opzione B: Tutto a 10 partite
- [ ] Opzione C: Mantenere differenze ma chiarire meglio

### 2. **Teammates - "Partite Totali"**
- [ ] Cambiare in "Partite Totali (storico)"
- [ ] Cambiare in "Partite con Top 20 Compagni"
- [ ] Aggiungere tooltip/spiegazione

### 3. **Grafici Trend**
- [ ] Mostrare tutte le 20 partite disponibili
- [ ] Mantenere 10 ma chiarire che sono "ultime 10 di 20"
- [ ] Aggiungere toggle per vedere 10 vs 20

### 4. **Info Box Dashboard**
- [ ] Cambiare da "fino a 10" a "fino a 20"
- [ ] Cambiare in "Analisi basata su ultime 20 partite (trend calcolato su 5/10)"
- [ ] Rimuovere info box e usare solo card con numeri specifici

### 5. **Guide Help**
- [ ] Standardizzare tutti i testi a "20 partite"
- [ ] Rimuovere riferimenti vaghi "10-20"
- [ ] Aggiungere note esplicative dove necessario

---

**Prossimo Step**: Aspetto il tuo via per decidere come allineare tutto.

