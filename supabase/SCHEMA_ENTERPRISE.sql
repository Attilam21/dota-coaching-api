-- =====================================================
-- SCHEMA ENTERPRISE - Dota 2 Coaching Platform
-- Versione completa e ottimizzata per produzione
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELLA: users (AGGIORNAMENTO)
-- =====================================================

-- Aggiungi colonne mancanti se non esistono
DO $$ 
BEGIN
  -- Aggiungi dota_account_id_locked se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'dota_account_id_locked'
  ) THEN
    ALTER TABLE public.users ADD COLUMN dota_account_id_locked BOOLEAN DEFAULT FALSE;
  END IF;

  -- Aggiungi last_analyzed_match_id se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_analyzed_match_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_analyzed_match_id BIGINT;
  END IF;

  -- Aggiungi last_analyzed_at se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_analyzed_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_analyzed_at TIMESTAMPTZ;
  END IF;

  -- Aggiungi preferences se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'preferences'
  ) THEN
    ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{}';
  END IF;
END $$;

-- =====================================================
-- 2. TABELLA: match_analyses (AGGIORNAMENTO)
-- =====================================================

-- Aggiungi colonne mancanti se non esistono
DO $$ 
BEGIN
  -- Aggiungi match_data se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'match_analyses' 
    AND column_name = 'match_data'
  ) THEN
    ALTER TABLE public.match_analyses ADD COLUMN match_data JSONB;
  END IF;

  -- Aggiungi previous_match_id se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'match_analyses' 
    AND column_name = 'previous_match_id'
  ) THEN
    ALTER TABLE public.match_analyses ADD COLUMN previous_match_id BIGINT;
  END IF;

  -- Aggiungi comparison_data se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'match_analyses' 
    AND column_name = 'comparison_data'
  ) THEN
    ALTER TABLE public.match_analyses ADD COLUMN comparison_data JSONB;
  END IF;

  -- Aggiungi analyzed_at se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'match_analyses' 
    AND column_name = 'analyzed_at'
  ) THEN
    ALTER TABLE public.match_analyses ADD COLUMN analyzed_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- 3. TABELLA: player_match_history (NUOVA)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.player_match_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL,
  
  -- Dati match essenziali
  match_id BIGINT NOT NULL,
  match_data JSONB NOT NULL,
  
  -- Statistiche giocatore in questa partita
  player_stats JSONB NOT NULL,
  
  -- Timestamp
  match_start_time TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Vincolo univoco
  UNIQUE(user_id, match_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_player_history_user_match ON public.player_match_history(user_id, match_id);
CREATE INDEX IF NOT EXISTS idx_player_history_player_time ON public.player_match_history(player_id, match_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_player_history_user_time ON public.player_match_history(user_id, match_start_time DESC);

-- =====================================================
-- 4. TABELLA: match_cache (NUOVA)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.match_cache (
  match_id BIGINT PRIMARY KEY,
  
  -- Dati match completi da OpenDota
  match_data JSONB NOT NULL,
  
  -- Metadata cache
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_match_cache_expires ON public.match_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_match_cache_last_accessed ON public.match_cache(last_accessed_at);

-- =====================================================
-- 5. TABELLA: player_statistics_snapshots (NUOVA - OPZIONALE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.player_statistics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL,
  
  -- Snapshot statistiche
  snapshot_data JSONB NOT NULL,
  
  -- Periodo di riferimento
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Metadata
  matches_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, player_id, period_start, period_type)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_snapshots_user_player ON public.player_statistics_snapshots(user_id, player_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_period ON public.player_statistics_snapshots(period_start, period_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics_snapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: users (AGGIORNAMENTO)
-- =====================================================

-- Rimuovi policies esistenti per evitare duplicati
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- SELECT: Utente può vedere solo il proprio profilo
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- UPDATE: Utente può aggiornare solo il proprio profilo
-- MA: dota_account_id può essere modificato SOLO se non è bloccato
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: Utente può inserire solo il proprio profilo
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES: match_analyses (GIÀ ESISTENTI - VERIFICA)
-- =====================================================

-- Rimuovi policies esistenti per evitare duplicati
DROP POLICY IF EXISTS "Users can view own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.match_analyses;

-- SELECT: Utente può vedere solo le proprie analisi
CREATE POLICY "Users can view own analyses" ON public.match_analyses
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: Utente può inserire solo le proprie analisi
CREATE POLICY "Users can insert own analyses" ON public.match_analyses
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Utente può aggiornare solo le proprie analisi
CREATE POLICY "Users can update own analyses" ON public.match_analyses
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Utente può eliminare solo le proprie analisi
CREATE POLICY "Users can delete own analyses" ON public.match_analyses
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: player_match_history
-- =====================================================

-- SELECT: Utente può vedere solo la propria history
CREATE POLICY "Users can view own match history" ON public.player_match_history
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: Utente può inserire solo nella propria history
CREATE POLICY "Users can insert own match history" ON public.player_match_history
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Utente può aggiornare solo la propria history
CREATE POLICY "Users can update own match history" ON public.player_match_history
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Utente può eliminare solo dalla propria history
CREATE POLICY "Users can delete own match history" ON public.player_match_history
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: match_cache
-- =====================================================

-- Cache è pubblica (read-only per tutti, write solo da server)
-- SELECT: Tutti possono leggere la cache
CREATE POLICY "Anyone can view match cache" ON public.match_cache
  FOR SELECT 
  USING (true);

-- INSERT/UPDATE: Solo service role (gestito lato server)
-- Non creiamo policy per INSERT/UPDATE, solo service role può scrivere

-- =====================================================
-- RLS POLICIES: player_statistics_snapshots
-- =====================================================

-- SELECT: Utente può vedere solo i propri snapshot
CREATE POLICY "Users can view own snapshots" ON public.player_statistics_snapshots
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: Utente può inserire solo i propri snapshot
CREATE POLICY "Users can insert own snapshots" ON public.player_statistics_snapshots
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Utente può aggiornare solo i propri snapshot
CREATE POLICY "Users can update own snapshots" ON public.player_statistics_snapshots
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Utente può eliminare solo i propri snapshot
CREATE POLICY "Users can delete own snapshots" ON public.player_statistics_snapshots
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: Blocca modifiche a dota_account_id dopo verifica
-- =====================================================

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
  
  -- Aggiorna updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rimuovi trigger esistente se presente
DROP TRIGGER IF EXISTS prevent_dota_id_change_trigger ON public.users;

-- Crea trigger
CREATE TRIGGER prevent_dota_id_change_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_dota_id_change();

-- =====================================================
-- TRIGGER: Auto-crea profilo utente alla registrazione
-- =====================================================

-- Funzione per creare profilo utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rimuovi trigger esistente se presente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crea trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNZIONE: Aggiorna last_analyzed_match_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_last_analyzed_match()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    last_analyzed_match_id = NEW.match_id,
    last_analyzed_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per aggiornare last_analyzed_match_id quando si crea una nuova analisi
DROP TRIGGER IF EXISTS update_last_analyzed_match_trigger ON public.match_analyses;
CREATE TRIGGER update_last_analyzed_match_trigger
  AFTER INSERT ON public.match_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_analyzed_match();

-- =====================================================
-- FUNZIONE: Pulisci cache scaduta
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.match_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICA FINALE
-- =====================================================

-- Conta tabelle create
SELECT 
  'Tables created/updated' as info,
  COUNT(*) as count,
  string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('users', 'match_analyses', 'player_match_history', 'match_cache', 'player_statistics_snapshots')
  AND table_type = 'BASE TABLE';

-- Verifica RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND table_name IN ('users', 'match_analyses', 'player_match_history', 'match_cache', 'player_statistics_snapshots')
ORDER BY tablename;

-- Verifica colonne aggiunte a users
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('dota_account_id_locked', 'last_analyzed_match_id', 'last_analyzed_at', 'preferences')
ORDER BY column_name;

