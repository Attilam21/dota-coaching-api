# 🔧 Setup Supabase Database - ISTRUZIONI RAPIDE

## ⚠️ PROBLEMA ATTUALE
L'errore **"Could not find the 'dota_account_id' column of 'users'"** indica che lo schema del database non è stato applicato in Supabase.

## ✅ SOLUZIONE RAPIDA

### Passo 1: Vai su Supabase Dashboard
1. Apri [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. Oppure vai su https://supabase.com/dashboard e seleziona il progetto

### Passo 2: SQL Editor
1. Nel menu laterale, clicca su **"SQL Editor"**
2. Clicca su **"New Query"**

### Passo 3: Esegui lo Schema
Copia e incolla questo script SQL completo:

```sql
-- Dota 2 Coaching Platform Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dota_account_id BIGINT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Se la tabella esiste già, aggiungi solo la colonna mancante
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'dota_account_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN dota_account_id BIGINT;
  END IF;
END $$;

-- Aggiungi constraint UNIQUE se non esiste
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_dota_account_id_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_dota_account_id_key UNIQUE (dota_account_id);
  END IF;
END $$;

-- Match analyses table
CREATE TABLE IF NOT EXISTS public.match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  analysis_data JSONB NOT NULL,
  ai_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own data (for UPSERT to work)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- IMPORTANTE: Verifica che RLS sia abilitato
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Match analyses policies
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analyses" ON public.match_analyses;
CREATE POLICY "Users can view own analyses" ON public.match_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.match_analyses;
CREATE POLICY "Users can insert own analyses" ON public.match_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Passo 4: Esegui la Query
1. Clicca sul pulsante **"RUN"** (o premi `Ctrl+Enter`)
2. Attendi che la query finisca
3. Dovresti vedere "Success. No rows returned" o un messaggio di successo

### Passo 4.5: Se vedi "permission denied" ⚠️
Se dopo aver eseguito lo script vedi ancora errori **"permission denied for table users"**, esegui anche questo script:

1. Nel SQL Editor, esegui lo script `supabase/fix_rls_policies.sql` (o copia il contenuto)
2. Esegui lo script
3. Questo configurerà correttamente le Row Level Security policies

### Passo 4.6: Se vedi policies duplicate ⚠️
Se lo script `quick_check.sql` o `diagnostic_script.sql` mostra **4 policies invece di 3**:

1. Esegui `supabase/fix_all_policies.sql` per rimuovere tutte le policies e ricrearle corrette (se necessario)
2. Oppure esegui solo: `DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;`
3. Verifica che rimangano solo 3 policies corrette (SELECT, UPDATE, INSERT)

### Passo 5: Verifica
1. Vai su **"Table Editor"** nel menu laterale
2. Controlla se la tabella `users` esiste
3. Verifica che abbia la colonna `dota_account_id`

### Passo 6: Test nell'App
1. Ricarica la pagina delle impostazioni
2. Prova a salvare il Dota Account ID
3. Dovrebbe funzionare! ✅

---

## 🔍 TROUBLESHOOTING

### Se vedi errori di "policy already exists"
- Il database aveva già alcune policies
- Gli script usano `DROP POLICY IF EXISTS` quindi dovrebbero funzionare
- Se continua a dare errore, rimuovi manualmente le policies duplicate

### Se la tabella users non esiste
- Lo script crea la tabella automaticamente
- Se continua a non funzionare, controlla che tu abbia i permessi corretti

### Se le RLS policies bloccano tutto
- Verifica che l'utente sia autenticato
- Controlla che le policies usino `auth.uid() = id` correttamente

---

## 🔍 VERIFICA CONFIGURAZIONE

Prima di testare, esegui lo script di diagnostica per verificare lo stato:

1. Nel SQL Editor, apri `supabase/quick_check.sql`
2. Esegui lo script
3. Verifica che tutti i check siano ✅

**Oppure** per un controllo completo:
- Esegui `supabase/diagnostic_script.sql` per vedere tutti i dettagli

---

## 📋 CHECKLIST POST-SETUP

- [ ] Tabella `users` creata con colonna `dota_account_id`
- [ ] RLS policies attive
- [ ] Constraints applicati
- [ ] Test salvataggio Account ID funziona
- [ ] Nessun errore nella console browser

