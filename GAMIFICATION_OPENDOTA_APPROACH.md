# 🎮 Gamification con Dati OpenDota - Approccio Alternativo

**Data**: Dicembre 2025  
**Status**: 📋 Proposta - In attesa approvazione

---

## 💡 IDEA CHIAVE

**Invece di creare un sistema XP/Level nostro, usiamo i rankings/ratings che OpenDota già fornisce per mostrare progressione e creare achievement basati su miglioramenti reali.**

---

## 📊 COSA OFFRE OPENDOTA

### **Endpoint Disponibili:**

1. **`/players/{id}/ratings`** - Percentiles per metriche
   ```json
   {
     "gold_per_min": { "percentile": 85 },
     "xp_per_min": { "percentile": 78 },
     "kda": { "percentile": 90 }
   }
   ```

2. **`/players/{id}/rankings`** - Ranking globale e per ruolo
   ```json
   {
     "global_rank": 12345,
     "country_rank": 789,
     "rankings": [
       { "hero_id": 1, "rank": 234 },
       { "hero_id": 2, "rank": 456 }
     ]
   }
   ```

3. **`/players/{id}`** - Statistiche base
   ```json
   {
     "win": 450,
     "lose": 380,
     "solo_competitive_rank": 4500,
     "competitive_rank": 4200
   }
   ```

---

## 🎯 APPROCCIO: GAMIFICATION BASATA SU DATI READI

### **1. Progressione Visibile con Rankings OpenDota**

**Invece di XP/Level nostri, mostriamo:**

#### **A) Percentile Progress (Come "Level")**
```
Prima: GPM percentile 60% (Top 40%)
Dopo:  GPM percentile 75% (Top 25%)
→ "Miglioramento del 15%!"
```

**Visualizzazione:**
- Progress bar che mostra percentile attuale
- Target: raggiungere percentile 90% (Top 10%)
- Badge: "Top 10% GPM Player" quando raggiungi percentile 90

#### **B) Ranking Progress**
```
Prima: Global Rank #50,000
Dopo:  Global Rank #40,000
→ "Salito di 10,000 posizioni!"
```

**Visualizzazione:**
- Mostra ranking attuale e miglioramento
- Achievement quando sali di X posizioni

#### **C) Winrate Progress**
```
Prima: 52% winrate
Dopo:  55% winrate
→ "Miglioramento del 3%!"
```

---

### **2. Achievement Basati su Miglioramenti Reali**

**Invece di achievement "gioca 10 partite", achievement basati su performance:**

#### **📈 Progression Achievements**
- **"Climber"** - Migliora percentile di qualsiasi metrica del 10%
- **"Rising Star"** - Migliora ranking globale di 5,000 posizioni
- **"Consistent Improver"** - Mantieni percentile >75% per 20 partite consecutive
- **"Top Performer"** - Raggiungi percentile 90% in GPM, XPM, o KDA
- **"Elite Player"** - Raggiungi percentile 95% in qualsiasi metrica

#### **🎯 Milestone Achievements**
- **"Above Average"** - Raggiungi percentile 50% in tutte le metriche
- **"Top Quarter"** - Raggiungi percentile 75% in almeno 2 metriche
- **"Top 10%"** - Raggiungi percentile 90% in almeno 1 metrica
- **"Elite Tier"** - Raggiungi percentile 95% in almeno 1 metrica

#### **📊 Consistency Achievements**
- **"Steady Hand"** - Mantieni winrate >55% per 30 partite
- **"Farm King"** - Mantieni GPM percentile >80% per 15 partite
- **"Carry Master"** - Mantieni KDA percentile >85% per 20 partite

---

### **3. Tracking Miglioramenti**

#### **Database Schema:**
```sql
-- Traccia percentile/ranking storici per vedere miglioramenti
CREATE TABLE user_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dota_account_id BIGINT NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Percentiles (da OpenDota ratings)
  gpm_percentile INTEGER,
  xpm_percentile INTEGER,
  kda_percentile INTEGER,
  
  -- Rankings (da OpenDota rankings)
  global_rank INTEGER,
  country_rank INTEGER,
  
  -- Winrate
  winrate DECIMAL(5,2),
  total_wins INTEGER,
  total_losses INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, snapshot_date)
);

-- Index per query efficenti
CREATE INDEX idx_performance_snapshots_user_date 
ON user_performance_snapshots(user_id, snapshot_date DESC);
```

#### **Logica Snapshot:**
- **Quando:** Ogni volta che l'utente visita Dashboard o ogni 24 ore
- **Cosa:** Salva percentile/ranking attuali
- **Perché:** Confrontare con snapshot precedenti per vedere miglioramenti

#### **API Endpoint: `/api/user/progression-snapshot`**
```typescript
// 1. Fetch ratings/rankings da OpenDota
const ratings = await fetch(`/api/players/${dotaAccountId}/ratings`)
const rankings = await fetch(`/api/players/${dotaAccountId}/rankings`)
const profile = await fetch(`/api/players/${dotaAccountId}`)

// 2. Calcola winrate
const winrate = (profile.win / (profile.win + profile.lose)) * 100

// 3. Crea snapshot
await supabase.from('user_performance_snapshots').insert({
  user_id: user.id,
  dota_account_id: dotaAccountId,
  snapshot_date: new Date().toISOString().split('T')[0],
  gpm_percentile: ratings.gold_per_min?.percentile,
  xpm_percentile: ratings.xp_per_min?.percentile,
  kda_percentile: ratings.kda?.percentile,
  global_rank: rankings.global_rank,
  country_rank: rankings.country_rank,
  winrate: winrate,
  total_wins: profile.win,
  total_losses: profile.lose
})

// 4. Confronta con snapshot precedente
const previousSnapshot = await getPreviousSnapshot(user.id)
if (previousSnapshot) {
  const improvement = calculateImprovement(currentSnapshot, previousSnapshot)
  
  // Check achievement basati su miglioramenti
  await checkProgressionAchievements(user.id, improvement)
}
```

---

### **4. UI/UX - Mostrare Progressione**

#### **Dashboard Widget: "La Tua Progressione"**
```
┌─────────────────────────────────────┐
│        La Tua Progressione          │
│                                     │
│  📊 GPM: Top 25% (75 percentile)   │
│     ████████░░ 75%                  │
│     +5% dall'ultimo check           │
│                                     │
│  ⚡ XPM: Top 40% (60 percentile)    │
│     ███████░░░ 60%                  │
│     +3% dall'ultimo check           │
│                                     │
│  ⚔️ KDA: Top 10% (90 percentile)    │
│     ██████████ 90%                  │
│     +2% dall'ultimo check           │
│                                     │
│  🌍 Global Rank: #40,123            │
│     ⬆️ +5,000 posizioni             │
│                                     │
│  🏆 Winrate: 55%                    │
│     +2% dall'ultimo check           │
└─────────────────────────────────────┘
```

#### **Achievement Gallery:**
```
┌─────────────────────────────────────┐
│  ✅ Climber                          │
│  Migliorato percentile del 10%      │
│  Sbloccato: 2 giorni fa             │
│                                     │
│  🔒 Elite Player                     │
│  Raggiungi percentile 95%           │
│  Progress: 90% (5% rimanenti)       │
└─────────────────────────────────────┘
```

---

### **5. Sistema Ibrido (Raccomandato)**

**Combiniamo:**
- ✅ **Rankings OpenDota** → Progressione principale (percentile, ranking)
- ✅ **Achievement nostri** → Basati su miglioramenti reali
- ✅ **XP/Level leggero** → Solo per azioni sulla piattaforma (analisi match, moduli completati)

**XP Solo per:**
- Analizzare match → +50 XP
- Completare modulo → +100 XP
- Login daily → +10 XP

**Non XP per:**
- Partite giocate (usiamo rankings)
- Miglioramenti performance (usiamo percentile progress)

---

## 📋 IMPLEMENTAZIONE

### **FASE 1: Snapshot System** (2 giorni)
1. Creare tabella `user_performance_snapshots`
2. API endpoint `/api/user/progression-snapshot`
3. Logica snapshot al login/visita Dashboard
4. Confronto con snapshot precedente

### **FASE 2: UI Progressione** (1 giorno)
1. Widget Dashboard "La Tua Progressione"
2. Mostra percentiles attuali
3. Mostra miglioramenti dall'ultimo check

### **FASE 3: Achievement Basati su Miglioramenti** (2 giorni)
1. Creare achievement che richiedono miglioramenti
2. Check achievement dopo ogni snapshot
3. Notifiche quando si sblocca achievement

### **FASE 4: XP System Leggero** (1 giorno)
1. XP solo per azioni piattaforma
2. Level basato su XP piattaforma (non performance)
3. UI badge level in navbar

---

## ✅ VANTAGGI DI QUESTO APPROCCIO

1. **Autenticità** - Basato su dati reali, non "artificiali"
2. **Motivazione** - Utente vede miglioramenti effettivi nel gioco
3. **Semplicità** - Meno dati da tracciare, usiamo OpenDota
4. **Valore** - Più utile per l'utente (vede come migliora realmente)

---

## 🤔 DOMANDE DA DECIDERE

1. **Usare solo OpenDota rankings O sistema ibrido (rankings + XP leggero)?**
   - Raccomandazione: **Ibrido** (rankings per progressione, XP solo per azioni piattaforma)

2. **Quanto spesso fare snapshot?**
   - Raccomandazione: **1 volta al giorno** (al login o visita Dashboard)

3. **Retroattivo?** (Dare achievement per miglioramenti passati)
   - Raccomandazione: **No** - Solo miglioramenti futuri dopo implementazione

---

**Aspetto il tuo feedback per procedere!** 🚀

---

## 📋 TASK BASATI SU DATI OPENDOTA

### **Stessa Logica per i Task! ✅**

**Invece di task "artificiali", creiamo task basati su dati reali OpenDota che si completano automaticamente quando raggiungi l'obiettivo.**

### **Come Funziona:**

#### **1. Task Generati Dinamicamente da Dati OpenDota**

**Esempi di Task:**

**A) Percentile Improvement Tasks**
```
Task: "Migliora GPM Percentile"
- Current: 60% (da OpenDota ratings)
- Target: 75%
- Completed: ✅ quando percentile >= 75% (check automatico)
```

**B) Ranking Improvement Tasks**
```
Task: "Raggiungi Top 50,000 Global Rank"
- Current: #65,000 (da OpenDota rankings)
- Target: #50,000
- Completed: ✅ quando global_rank <= 50,000
```

**C) Winrate Improvement Tasks**
```
Task: "Mantieni Winrate >55% per 10 partite"
- Current: 52% (ultime 10 partite)
- Target: 55%
- Completed: ✅ quando winrate >= 55% per 10 partite consecutive
```

#### **2. Generazione Task Automatica**

**API Endpoint: `/api/player/{id}/coaching`** (aggiornato)

**Logica:**
```typescript
// 1. Fetch dati OpenDota
const ratings = await fetch(`/api/players/${id}/ratings`)
const rankings = await fetch(`/api/players/${id}/rankings`)
const profile = await fetch(`/api/players/${id}`)

// 2. Analizza debolezze (percentile bassi)
const currentGpmPercentile = ratings.gold_per_min?.percentile || 50
const currentXpmPercentile = ratings.xp_per_min?.percentile || 50
const currentKdaPercentile = ratings.kda?.percentile || 50

// 3. Genera task basati su obiettivi realistici
const tasks = []

// Task GPM se percentile < 75
if (currentGpmPercentile < 75) {
  tasks.push({
    id: 'gpm-improvement',
    title: 'Migliora Farm Efficiency (GPM)',
    description: 'Raggiungi Top 25% in Gold Per Minute per migliorare il tuo farm',
    category: 'Farm',
    priority: currentGpmPercentile < 50 ? 'high' : 'medium',
    current: `${currentGpmPercentile}% percentile (Top ${100 - currentGpmPercentile}%)`,
    target: '75% percentile (Top 25%)',
    targetValue: 75,
    metric: 'gpm_percentile',
    completed: currentGpmPercentile >= 75 // Check automatico!
  })
}

// Task XPM se percentile < 70
if (currentXpmPercentile < 70) {
  tasks.push({
    id: 'xpm-improvement',
    title: 'Migliora Experience Gain (XPM)',
    description: 'Raggiungi Top 30% in Experience Per Minute',
    category: 'Farm',
    priority: currentXpmPercentile < 50 ? 'high' : 'medium',
    current: `${currentXpmPercentile}% percentile`,
    target: '70% percentile (Top 30%)',
    targetValue: 70,
    metric: 'xpm_percentile',
    completed: currentXpmPercentile >= 70
  })
}

// Task Ranking se global_rank > 100,000
if (rankings.global_rank && rankings.global_rank > 100000) {
  const targetRank = Math.max(50000, rankings.global_rank - 25000)
  tasks.push({
    id: 'ranking-improvement',
    title: 'Migliora Global Ranking',
    description: `Salita di almeno 25,000 posizioni nel ranking globale`,
    category: 'Ranking',
    priority: 'medium',
    current: `#${rankings.global_rank.toLocaleString()}`,
    target: `#${targetRank.toLocaleString()}`,
    targetValue: targetRank,
    metric: 'global_rank',
    completed: rankings.global_rank <= targetRank
  })
}
```

#### **3. Task Completion Automatica**

**Non serve checkbox manuale!** Il task si completa automaticamente quando:
- L'utente gioca partite
- I dati OpenDota vengono aggiornati
- Al prossimo check, il percentile/ranking raggiunge il target

**Check Completamento:**
```typescript
// Ad ogni fetch coaching data, verifica se task completati
tasks.forEach(task => {
  if (task.metric === 'gpm_percentile') {
    task.completed = currentGpmPercentile >= task.targetValue
  } else if (task.metric === 'xpm_percentile') {
    task.completed = currentXpmPercentile >= task.targetValue
  } else if (task.metric === 'global_rank') {
    task.completed = currentGlobalRank <= task.targetValue
  }
})
```

#### **4. Progress Tracking**

**Mostra progresso verso obiettivo:**
```
Task: Migliora GPM Percentile
┌─────────────────────────────────────┐
│ Current: 60%  →  Target: 75%       │
│ Progress: ████████░░░░ 80%         │
│ (15% verso obiettivo)               │
└─────────────────────────────────────┘
```

**Calcolo progress:**
```typescript
const progress = ((currentValue - startValue) / (targetValue - startValue)) * 100
// Esempio: ((60 - 50) / (75 - 50)) * 100 = 40%
```

---

### **Vantaggi:**

1. **Task Realistici** - Basati su performance reali, non obiettivi arbitrari
2. **Completion Automatica** - Niente checkbox manuali, tutto automatico
3. **Motivazione** - Utente vede miglioramenti reali nel gioco
4. **Personalizzati** - Task diversi per ogni utente basati sulle sue debolezze

---

### **Esempio UI Task:**

```
┌─────────────────────────────────────────────┐
│ ☐ Migliora GPM Percentile          [HIGH]  │
│                                             │
│ Raggiungi Top 25% in Gold Per Minute       │
│                                             │
│ Attuale: 60% percentile (Top 40%)          │
│ Obiettivo: 75% percentile (Top 25%)        │
│                                             │
│ Progress: ████████░░░░ 60%                 │
│ (Manca 15% percentile)                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ✅ Migliora XPM Percentile          [MED]  │
│                                             │
│ Raggiungi Top 30% in Experience Per Minute │
│                                             │
│ ✅ COMPLETATO!                             │
│ Hai raggiunto 72% percentile               │
│                                             │
│ 🎉 Ottimo lavoro! Continua così!           │
└─────────────────────────────────────────────┘
```

---

### **Database Schema (Opzionale - per tracking storico task)**

```sql
CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL, -- es. 'gpm-improvement'
  title TEXT NOT NULL,
  category TEXT,
  priority TEXT,
  start_value DECIMAL, -- Valore iniziale (es. 60 percentile)
  target_value DECIMAL, -- Obiettivo (es. 75 percentile)
  current_value DECIMAL, -- Valore attuale
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, task_id)
);
```

**Usato per:**
- Tracciare progresso storico
- Mostrare quando task completato
- Evitare task duplicati
- Analytics su quali task vengono completati più spesso

---

**Questa logica si applica a TUTTO: Task, Achievement, Progressione - tutto basato su dati OpenDota reali!** ✅

