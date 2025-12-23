# 🏢 Schema Database Enterprise - Analisi Completa

## 🔍 ANALISI SITUAZIONE ATTUALE

### ❌ PROBLEMI IDENTIFICATI:

1. **Player ID in localStorage** (fragile, può essere modificato)
   - Attualmente: `localStorage.getItem('fzth_player_id')`
   - Problema: Utente può cambiarlo, perdere dati, non sincronizzato tra dispositivi
   - **SOLUZIONE**: Salvare in `public.users.dota_account_id` (bloccato dopo verifica)

2. **Nessun tracking ultima partita**
   - Non c'è modo di confrontare l'ultima partita con la precedente
   - Non c'è storico delle analisi
   - **SOLUZIONE**: Tabella `player_match_history` con snapshot

3. **Dati fetchati ogni volta da OpenDota**
   - Nessuna cache locale
   - Rate limiting di OpenDota
   - Lentezza nelle chiamate
   - **SOLUZIONE**: Cache match data in Supabase

4. **Nessun tracking progresso nel tempo**
   - Non possiamo vedere miglioramenti/peggioramenti
   - Nessun trend analysis
   - **SOLUZIONE**: Snapshot periodici delle statistiche

---

## ✅ SCHEMA ENTERPRISE PROPOSTO

### 📋 TABELLE NECESSARIE:

#### 1. `public.users` (GIÀ ESISTENTE - DA AGGIORNARE)
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Dota 2 Account ID (BLOCCATO dopo verifica)
  dota_account_id BIGINT UNIQUE,
  dota_account_id_locked BOOLEAN DEFAULT FALSE, -- 🔒 BLOCCA modifiche dopo verifica
  dota_account_verified_at TIMESTAMPTZ,
  dota_verification_method TEXT, -- 'questions', 'steam_oauth', 'manual'
  
  -- Ultima partita analizzata (per confronti)
  last_analyzed_match_id BIGINT,
  last_analyzed_at TIMESTAMPTZ,
  
  -- Preferenze utente
  preferences JSONB DEFAULT '{}', -- Theme, notifiche, ecc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**🔒 LOGICA BLOCCAGGIO:**
- Quando `dota_account_id_locked = TRUE`, l'utente NON può modificare `dota_account_id`
- Si blocca automaticamente dopo la prima verifica
- Solo admin può sbloccare (per casi eccezionali)

---

#### 2. `public.match_analyses` (GIÀ ESISTENTE - DA AGGIORNARE)
```sql
CREATE TABLE public.match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  
  -- Dati match completi (cache da OpenDota)
  match_data JSONB NOT NULL, -- Dati completi del match
  
  -- Analisi AI
  analysis_data JSONB NOT NULL, -- Analisi dettagliata
  ai_insights JSONB,
  
  -- Confronto con partita precedente
  previous_match_id BIGINT, -- ID partita precedente per confronto
  comparison_data JSONB, -- Dati confronto (miglioramenti/peggioramenti)
  
  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, match_id)
);
```

**📊 FUNZIONALITÀ:**
- Cache completa match data (evita chiamate OpenDota)
- Confronto automatico con partita precedente
- Storico completo analisi

---

#### 3. `public.player_match_history` (NUOVA - TRACKING PARTITE)
```sql
CREATE TABLE public.player_match_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL, -- Dota Account ID
  
  -- Dati match essenziali
  match_id BIGINT NOT NULL,
  match_data JSONB NOT NULL, -- Snapshot completo match
  
  -- Statistiche giocatore in questa partita
  player_stats JSONB NOT NULL, -- KDA, GPM, XPM, hero, ecc.
  
  -- Timestamp
  match_start_time TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indici per performance
  UNIQUE(user_id, match_id),
  INDEX idx_player_history_user_match (user_id, match_id),
  INDEX idx_player_history_player_time (player_id, match_start_time DESC)
);
```

**📈 SCOPO:**
- Storico completo partite giocate
- Tracking progresso nel tempo
- Confronti tra partite
- Analisi trend

---

#### 4. `public.player_statistics_snapshots` (NUOVA - SNAPSHOT PERIODICI)
```sql
CREATE TABLE public.player_statistics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL,
  
  -- Snapshot statistiche
  snapshot_data JSONB NOT NULL, -- Statistiche complete al momento dello snapshot
  
  -- Periodo di riferimento
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  
  -- Metadata
  matches_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, player_id, period_start, period_type)
);
```

**📊 SCOPO:**
- Snapshot giornalieri/settimanali/mensili
- Tracking miglioramenti nel tempo
- Grafici trend
- Analisi performance a lungo termine

---

#### 5. `public.match_cache` (NUOVA - CACHE OPENDOTA)
```sql
CREATE TABLE public.match_cache (
  match_id BIGINT PRIMARY KEY,
  
  -- Dati match completi da OpenDota
  match_data JSONB NOT NULL,
  
  -- Metadata cache
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- TTL cache (es. 7 giorni)
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indici
  INDEX idx_match_cache_expires (expires_at)
);
```

**⚡ SCOPO:**
- Cache match data da OpenDota
- Riduce chiamate API
- Migliora performance
- Evita rate limiting

---

## 🔒 LOGICA BLOCCAGGIO PLAYER ID

### Trigger per bloccare modifiche dopo verifica:

```sql
-- Funzione per bloccare modifiche a dota_account_id dopo verifica
CREATE OR REPLACE FUNCTION public.prevent_dota_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se l'account è già verificato e bloccato
  IF OLD.dota_account_id_locked = TRUE THEN
    -- Non permettere modifiche a dota_account_id
    IF NEW.dota_account_id IS DISTINCT FROM OLD.dota_account_id THEN
      RAISE EXCEPTION 'dota_account_id is locked and cannot be changed after verification';
    END IF;
  END IF;
  
  -- Auto-blocca dopo prima verifica
  IF OLD.dota_account_verified_at IS NULL AND NEW.dota_account_verified_at IS NOT NULL THEN
    NEW.dota_account_id_locked = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER prevent_dota_id_change_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_dota_id_change();
```

---

## 📊 FLUSSO DATI ENTERPRISE

### 1. Registrazione Utente
```
auth.users (creato) 
  → trigger → public.users (creato automaticamente)
  → utente inserisce dota_account_id
  → verifica account
  → dota_account_id_locked = TRUE (BLOCCATO)
```

### 2. Analisi Partita
```
Utente analizza partita
  → Controlla cache (match_cache)
  → Se non in cache, fetcha da OpenDota
  → Salva in match_cache
  → Crea record in match_analyses
  → Crea record in player_match_history
  → Confronta con ultima partita (last_analyzed_match_id)
  → Aggiorna users.last_analyzed_match_id
```

### 3. Snapshot Periodico
```
Cron job (o trigger)
  → Calcola statistiche periodo (giorno/settimana/mese)
  → Crea snapshot in player_statistics_snapshots
  → Permette analisi trend nel tempo
```

---

## 🎯 VANTAGGI SCHEMA ENTERPRISE

✅ **Player ID bloccato** - Non può essere modificato dopo verifica
✅ **Ultima partita tracciata** - Facile confronto con precedente
✅ **Cache match data** - Performance migliorate, meno chiamate API
✅ **Storico completo** - Tutte le partite salvate
✅ **Trend analysis** - Snapshot periodici per vedere miglioramenti
✅ **Scalabilità** - Schema ottimizzato per crescita
✅ **Sicurezza** - RLS su tutte le tabelle

---

## 📋 IMPLEMENTAZIONE

### Fase 1: Aggiorna `users` (PRIORITÀ ALTA)
- Aggiungi `dota_account_id_locked`
- Aggiungi `last_analyzed_match_id`, `last_analyzed_at`
- Aggiungi `preferences`

### Fase 2: Aggiorna `match_analyses` (PRIORITÀ ALTA)
- Aggiungi `match_data` (cache completa)
- Aggiungi `previous_match_id`, `comparison_data`

### Fase 3: Crea `player_match_history` (PRIORITÀ MEDIA)
- Storico partite
- Tracking progresso

### Fase 4: Crea `match_cache` (PRIORITÀ MEDIA)
- Cache OpenDota
- Performance

### Fase 5: Crea `player_statistics_snapshots` (PRIORITÀ BASSA)
- Snapshot periodici
- Trend analysis

---

## 🔐 SICUREZZA

- ✅ RLS su tutte le tabelle
- ✅ Policies: utente vede solo i propri dati
- ✅ Trigger per bloccare modifiche ID dopo verifica
- ✅ Validazione dati in ingresso

---

## 📈 PERFORMANCE

- ✅ Indici su tutte le foreign keys
- ✅ Indici su campi usati per query frequenti
- ✅ JSONB per dati flessibili e queryabili
- ✅ Cache per ridurre chiamate esterne

---

**Questo schema è enterprise-ready e scalabile!** 🚀

