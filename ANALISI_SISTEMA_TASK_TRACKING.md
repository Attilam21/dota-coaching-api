# 📋 ANALISI: Sistema di Tracking Task per Partita

## 🎯 OBIETTIVO
Salvare e tracciare ogni task per ogni player ID, validare automaticamente quando gli obiettivi vengono raggiunti nelle partite.

---

## 🔍 COSA SERVE

### 1. **Database Schema**

#### Opzione A: Schema Semplice (Immediato)
```sql
CREATE TABLE player_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL, -- Es: 'farm-gpm', 'fights-deaths'
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  target_value TEXT, -- Es: '500', '70%', '5'
  target_type TEXT, -- Es: 'gpm', 'percentage', 'count'
  target_matches INTEGER, -- Es: "nelle prossime 5 partite"
  current_value TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, task_id, status) -- Un task attivo per user
);
```

#### Opzione B: Schema con Progresso Dettagliato (Più Completo)
```sql
-- Tabella principale task
CREATE TABLE player_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  target_value TEXT,
  target_type TEXT,
  target_matches INTEGER, -- Es: 5 partite
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Quando scade il task
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, task_id)
);

-- Tabella per tracciare progresso per ogni partita
CREATE TABLE task_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES player_tasks(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL, -- ID partita OpenDota
  achieved_value TEXT, -- Valore raggiunto in questa partita
  target_met BOOLEAN, -- True se obiettivo raggiunto in questa partita
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, match_id)
);

-- Index per performance
CREATE INDEX idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX idx_task_progress_match_id ON task_progress(match_id);
CREATE INDEX idx_player_tasks_user_status ON player_tasks(user_id, status);
```

---

## ⚠️ DIFFICOLTÀ PRINCIPALI

### 1. **Quando Validare i Task?**

**Problema:** Quando controllare se un task è completato?

**Opzioni:**
- ✅ **On-Demand (Consigliato)**: Quando il player carica la pagina Coaching
  - Pro: Semplice, no trigger complessi
  - Pro: Controllo sempre aggiornato
  - Contro: Richiede fetch delle ultime partite ogni volta

- ⚠️ **Trigger Automatico**: Quando si salva una nuova partita
  - Pro: Validazione immediata
  - Contro: Complesso, richiede trigger/function PostgreSQL
  - Contro: Dipende da quando viene salvata la partita

- ❌ **Cron Job**: Script schedulato che verifica periodicamente
  - Pro: Non bloccante
  - Contro: Richiede infrastructure aggiuntiva (cron, worker)
  - Contro: Non real-time

**Raccomandazione: On-Demand** - Validazione quando si carica la pagina

---

### 2. **Come Validare un Task?**

**Problema:** Come verificare se un obiettivo è stato raggiunto?

**Esempio Task "Migliora Farm Rate":**
- Obiettivo: Raggiungere 500 GPM in almeno 3 delle prossime 5 partite
- Devo: Fetchare le ultime 5 partite → Contare quante hanno GPM >= 500

**Logica di Validazione:**

```typescript
async function validateTask(task: PlayerTask, playerId: string) {
  // Fetch ultime N partite (dove N = target_matches)
  const matches = await fetch(`/api/player/${playerId}/matches?limit=${task.target_matches}`)
  
  // Per ogni partita, verifica se obiettivo raggiunto
  let matchesMet = 0
  for (const match of matches) {
    const value = getMetricValue(match, task.target_type) // Es: match.gpm
    if (compareValue(value, task.target_value, task.target_type)) {
      matchesMet++
      // Salva in task_progress
      await saveTaskProgress(task.id, match.match_id, value, true)
    }
  }
  
  // Se target raggiunto (es: 3/5 partite), completa il task
  const requiredMatches = Math.ceil(task.target_matches * 0.6) // 60% = 3/5
  if (matchesMet >= requiredMatches) {
    await completeTask(task.id)
  }
}
```

**Difficoltà:**
- Ogni tipo di task richiede logica diversa (GPM, %, count, etc.)
- Deve essere flessibile per diversi tipi di obiettivi
- Deve gestire edge cases (partite non valide, dati mancanti)

---

### 3. **Gestione Task Dinamici**

**Problema:** I task vengono rigenerati ogni volta che si carica `/api/player/[id]/coaching`

**Scenari:**
- Player migliora → Task "GPM basso" non dovrebbe più essere generato
- Player completa task → Deve essere marcato come completato
- Task scade → Deve essere marcato come expired

**Soluzione:**
```typescript
// Quando genero task, controllo prima quelli esistenti
async function generateTasks(playerId: string) {
  // 1. Fetch task esistenti ancora attivi
  const existingTasks = await getActiveTasks(playerId)
  
  // 2. Genera nuovi task potenziali
  const potentialTasks = calculateTasksFromStats(playerId)
  
  // 3. Filtra: non creare task già esistenti e attivi
  const newTasks = potentialTasks.filter(pt => 
    !existingTasks.find(et => et.task_id === pt.id && et.status === 'active')
  )
  
  // 4. Crea solo nuovi task
  await createTasks(playerId, newTasks)
  
  // 5. Valida task esistenti
  for (const task of existingTasks) {
    await validateTask(task, playerId)
  }
  
  // 6. Ritorna tutti i task (esistenti + nuovi)
  return [...existingTasks, ...newTasks]
}
```

---

### 4. **Tracking Progresso**

**Problema:** Come mostrare "3/5 partite completate"?

**Soluzione:**
- Usare tabella `task_progress` per salvare ogni partita che raggiunge l'obiettivo
- Query: `COUNT(*) WHERE task_id = X AND target_met = true`
- Mostrare: "3/5 partite con GPM >= 500"

**Esempio UI:**
```
Migliora il Farm Rate
[████████░░] 3/5 partite
Obiettivo: 500 GPM
Attuale: 520 GPM (ultima partita)
```

---

## 🛠️ COSA SERVE IMPLEMENTARE

### 1. **Database Schema** ✅
- [ ] Creare tabella `player_tasks`
- [ ] Creare tabella `task_progress` (opzionale ma consigliato)
- [ ] Aggiungere RLS policies
- [ ] Aggiungere indexes

### 2. **API Endpoint per Task**
- [ ] `GET /api/player/[id]/tasks` - Lista task attivi
- [ ] `POST /api/player/[id]/tasks/validate` - Valida tutti i task
- [ ] `PUT /api/player/[id]/tasks/[taskId]/complete` - Completa manualmente
- [ ] `DELETE /api/player/[id]/tasks/[taskId]` - Cancella task

### 3. **Logica di Validazione**
- [ ] Funzione per fetchare partite recenti
- [ ] Funzione per estrarre metrica da partita (GPM, KDA, etc.)
- [ ] Funzione per comparare valore vs obiettivo
- [ ] Funzione per aggiornare progresso
- [ ] Funzione per completare task quando obiettivo raggiunto

### 4. **Frontend Updates**
- [ ] Salvare task in database invece che solo in memoria
- [ ] Mostrare progresso (es: "3/5 partite")
- [ ] Auto-validazione quando si carica la pagina
- [ ] Notifica quando task completato
- [ ] Refresh automatico se task completato

---

## 🔄 FLUSSO COMPLETO

```
1. Player carica pagina Coaching
   ↓
2. API chiama generateTasks(playerId)
   ↓
3. Sistema:
   - Fetcha statistiche attuali
   - Controlla task esistenti nel DB
   - Genera nuovi task se necessario
   - Valida task esistenti (controlla ultime partite)
   ↓
4. Per ogni task attivo:
   - Fetch ultime N partite
   - Controlla se obiettivo raggiunto
   - Aggiorna task_progress
   - Se completato, marca task.status = 'completed'
   ↓
5. Ritorna task aggiornati al frontend
   ↓
6. Frontend mostra:
   - Task attivi con progresso
   - Task completati
   - Task scaduti
```

---

## 💡 RACCOMANDAZIONI

### Approccio Incrementale:

**Fase 1 (MVP):**
- Tabella `player_tasks` semplice (Opzione A)
- Validazione on-demand quando si carica la pagina
- No tracking dettagliato per partita (solo completed/not completed)

**Fase 2 (Avanzato):**
- Aggiungere `task_progress` per tracking dettagliato
- Mostrare progresso "3/5 partite"
- Notifiche quando task completato

**Fase 3 (Pro):**
- Trigger automatici per validazione in tempo reale
- Task che scadono dopo X giorni
- Task ricorrenti (es: "Ogni settimana migliora X")

---

## ❓ DOMANDE DA DECIDERE

1. **Validazione automatica o manuale?**
   - Raccomandazione: Automatica on-demand

2. **Tracking dettagliato per partita?**
   - Raccomandazione: Sì, per UX migliore

3. **Cosa succede quando task completato?**
   - Rimuovere? Mantenere storico? Creare nuovo task?
   - Raccomandazione: Mantenere come "completed", creare nuovo se ancora necessario

4. **Task scadono?**
   - Raccomandazione: Sì, dopo 30 giorni o dopo N partite

5. **Un task può essere ri-creato se ancora necessario?**
   - Raccomandazione: Sì, ma solo se non esiste già uno attivo

---

## 🎯 PROSSIMI PASSI

1. ✅ Ragionare su schema e difficoltà (questo documento)
2. ⏭️ Decidere approccio (Opzione A vs B)
3. ⏭️ Creare schema database
4. ⏭️ Implementare API endpoints
5. ⏭️ Implementare logica di validazione
6. ⏭️ Aggiornare frontend

