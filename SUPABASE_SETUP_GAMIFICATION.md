# 🗄️ Setup Gamification su Supabase

## ⚠️ IMPORTANTE: Devi eseguire queste query SQL su Supabase!

Ho creato il file `supabase/gamification_schema_update.sql` ma **devi eseguirlo manualmente** su Supabase Dashboard.

---

## 📋 STEP-BY-STEP ISTRUZIONI

### 1. Vai su Supabase Dashboard
- Apri: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb
- Oppure: https://supabase.com/dashboard → Seleziona il tuo progetto

### 2. Apri SQL Editor
- Nel menu laterale, clicca su **"SQL Editor"**
- Clicca su **"New Query"**

### 3. Copia e Incolla lo Script
- Apri il file: `supabase/gamification_schema_update.sql`
- Copia **tutto il contenuto** (lo script è completo e gestisce tutte le colonne mancanti)
- Incolla nella query box di Supabase

### 4. Esegui la Query
- Clicca sul pulsante **"RUN"** (o premi `Ctrl+Enter`)
- Attendi che finisca (dovrebbe dire "Success")

---

## ✅ COSA FA LO SCRIPT

Lo script esegue:

1. **Aggiunge colonne a `user_stats`**:
   - `total_matches_played`
   - `login_streak`
   - `last_login_date`
   - `last_seen_match_id`
   - `last_match_check`

2. **Crea tabella `user_performance_snapshots`**:
   - Per tracciare percentiles/rankings storici
   - Indexes per performance
   - RLS policies

3. **Popola `achievements` table**:
   - Inserisce ~20 achievement iniziali
   - Divisi per categoria (progression, milestone, consistency, platform, streak)

4. **Aggiorna RLS policies**:
   - Permette agli utenti di leggere/aggiornare i propri stats

---

## ⚠️ SE VEDI ERRORI

### Errore "column already exists"
- ✅ **OK**: Significa che le colonne esistono già, lo script usa `IF NOT EXISTS`
- Continua comunque, non fa niente

### Errore "table already exists"
- ✅ **OK**: La tabella esiste già
- Continua comunque

### Errore "achievement already exists"
- ✅ **OK**: Significa che alcuni achievement esistono già
- Lo script usa `ON CONFLICT DO NOTHING`, quindi ignora i duplicati

---

## 🔍 VERIFICA CHE FUNZIONI

Dopo aver eseguito lo script, verifica:

```sql
-- 1. Verifica colonne aggiunte a user_stats
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
AND column_name IN ('total_matches_played', 'login_streak', 'last_login_date');

-- 2. Verifica tabella user_performance_snapshots esiste
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'user_performance_snapshots';

-- 3. Verifica achievement inseriti
SELECT COUNT(*) FROM achievements;

-- Dovresti vedere ~20 achievement
```

---

## 🚀 DOPO L'ESECUZIONE

Una volta eseguito lo script:
- ✅ Il database è pronto per la gamification
- ✅ Gli endpoint API funzioneranno correttamente
- ✅ I componenti UI potranno mostrare dati reali

---

**Esegui lo script e dimmi se vedi errori!** 🎮

