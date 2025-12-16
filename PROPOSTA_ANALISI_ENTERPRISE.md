# 🎯 PROPOSTA: Analisi Enterprise-Level

## 📊 NUOVE ANALISI DA IMPLEMENTARE

### 1. **HERO ANALYSIS (Analisi Heroes Approfondita)**
**Endpoint:** `/api/player/[id]/hero-analysis`

**Analisi:**
- Winrate per hero con trend temporale
- KDA/GPM/XPM per ogni hero
- Matchup analysis (winrate vs heroes avversari comuni)
- Item builds più usati per ogni hero
- Performance per role (carry, support, etc.)
- Hero progression (miglioramento nel tempo)
- Best/worst heroes identificati

**Sezione Sidebar:** "Hero Analysis" dentro ANALISI CORE

---

### 2. **ROLE ANALYSIS (Analisi per Ruolo)**
**Endpoint:** `/api/player/[id]/role-analysis`

**Analisi:**
- Performance per ruolo (Carry, Mid, Offlane, Support)
- Winrate per ruolo
- Metriche chiave per ruolo (GPM per carry, Wards per support, etc.)
- Ruolo preferito vs ruoli meno efficaci
- Raccomandazioni per ruolo

**Sezione Sidebar:** "Analisi Ruolo" dentro ANALISI CORE

---

### 3. **MATCH TIMELINE ANALYSIS (Timeline Partita)**
**Endpoint:** `/api/match/[id]/timeline`

**Analisi:**
- Gold/XP/Net Worth over time per ogni player
- Item purchase timeline
- Key events timeline (kills, deaths, tower kills, roshan)
- Gold advantage graph (radiant vs dire)
- Power spikes analysis

**Integrazione:** Migliorare pagina `/analysis/match/[id]`

---

### 4. **ITEM BUILD ANALYSIS (Analisi Build)**
**Endpoint:** `/api/player/[id]/item-analysis`

**Analisi:**
- Item più usati per hero
- Item timings (quando compri ogni item)
- Winrate con/senza specifici item
- Build efficiency
- Raccomandazioni item per hero/ruolo

**Sezione Sidebar:** "Item Builds" dentro ANALISI CORE

---

### 5. **META ANALYSIS (Analisi Meta)**
**Endpoint:** `/api/player/[id]/meta-analysis`

**Analisi:**
- Adaptazione al meta corrente
- Heroes più giocati nel periodo
- Winrate vs meta heroes
- Raccomandazioni meta

**Sezione Sidebar:** "Meta Analysis" dentro ANALISI CORE

---

## 🗂️ STRUTTURA SIDEBAR AGGIORNATA

```
ANALISI CORE
├─ Panoramica
├─ Performance & Stile di Gioco
├─ Hero Pool
├─ Hero Analysis (NUOVO) 🆕
├─ Analisi Ruolo (NUOVO) 🆕
├─ Item Builds (NUOVO) 🆕
├─ Team & Compagni
├─ Partite
└─ Analisi partita (migliorata)

COACHING
├─ Coaching & Task
└─ Profilazione FZTH

ANALISI AVANZATE
├─ Analisi avanzate (submenu esistente)
└─ Meta Analysis (NUOVO) 🆕
```

---

## 🎯 PRIORITÀ DI IMPLEMENTAZIONE

1. **Hero Analysis** - Molto utile, dati disponibili
2. **Role Analysis** - Complementa profilazione
3. **Match Timeline** - Migliora analisi partita esistente
4. **Item Build Analysis** - Utile ma più complesso
5. **Meta Analysis** - Può essere aggiunta dopo

---

## 💡 LOGICA ENDPOINT (Standard)

Tutti gli endpoint seguono questa logica:

```typescript
1. Fetch player ID da params
2. Fetch dati base: /api/player/[id]/stats
3. Fetch dati avanzati: /api/player/[id]/advanced-stats
4. Fetch dati specifici da OpenDota (se necessari)
5. Calcola metriche specifiche
6. Genera insights e raccomandazioni
7. Ritorna JSON strutturato
```

