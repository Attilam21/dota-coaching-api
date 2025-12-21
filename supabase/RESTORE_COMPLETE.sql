-- =====================================================
-- SCRIPT RIPRISTINO COMPLETO DATABASE
-- Esegui questo script DOPO aver ripristinato il backup
-- Oppure usa questo per sistemare tutte le logiche
-- =====================================================
-- 
-- ⚠️ ATTENZIONE: Questo script modifica lo schema
-- Esegui solo se sei sicuro di quello che fai!
-- =====================================================

-- =====================================================
-- STEP 1: VERIFICA E CREA ESTENSIONI
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 2: CREA/RIPARA TABELLA users
-- =====================================================

-- Crea tabella users se non esiste
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dota_account_id BIGINT UNIQUE,
  dota_account_verified_at TIMESTAMPTZ,
  dota_verification_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiungi colonne se mancano (non da errore se esistono già)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_account_verified_at TIMESTAMPTZ;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_verification_method TEXT;

-- Assicura constraint UNIQUE su dota_account_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_dota_account_id_key'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_dota_account_id_key UNIQUE (dota_account_id);
  END IF;
END $$;

-- =====================================================
-- STEP 3: CREA/RIPARA TABELLA match_analyses
-- =====================================================

CREATE TABLE IF NOT EXISTS public.match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  analysis_data JSONB NOT NULL,
  ai_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- =====================================================
-- STEP 4: CREA INDICI PER PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_match_analyses_user_id ON public.match_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_match_analyses_match_id ON public.match_analyses(match_id);
CREATE INDEX IF NOT EXISTS idx_users_dota_account_id ON public.users(dota_account_id) WHERE dota_account_id IS NOT NULL;

-- =====================================================
-- STEP 5: ABILITA ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: RIMUOVI E RICREA TUTTE LE POLICIES (FIX COMPLETO)
-- =====================================================

-- Rimuovi TUTTE le policies esistenti su users
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Rimuovi TUTTE le policies esistenti su match_analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.match_analyses;

-- =====================================================
-- STEP 7: CREA POLICIES CORRETTE PER users
-- =====================================================

-- SELECT: Utente può vedere solo il proprio profilo
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- UPDATE: Utente può aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: Utente può inserire solo il proprio profilo (necessario per UPSERT)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 8: CREA POLICIES CORRETTE PER match_analyses
-- =====================================================

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

-- =====================================================
-- STEP 9: FIX TRIGGER handle_new_user
-- =====================================================

-- Rimuovi trigger sbagliato (se esiste su public.users invece di auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;

-- Crea/aggiorna funzione handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea profilo utente in public.users quando si registra
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea trigger corretto su auth.users (non public.users!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 10: VERIFICA FINALE
-- =====================================================

-- Verifica tabelle
SELECT 
  'TABELLE' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('users', 'match_analyses') THEN '✅ OK'
    ELSE '⚠️ Non prevista'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verifica colonne users
SELECT 
  'COLONNE users' as check_type,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Verifica RLS abilitato
SELECT 
  'RLS STATUS' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS abilitato'
    ELSE '❌ RLS NON abilitato'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'match_analyses')
ORDER BY tablename;

-- Verifica policies
SELECT 
  'POLICIES' as check_type,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'match_analyses')
ORDER BY tablename, cmd;

-- Verifica trigger
SELECT 
  'TRIGGER' as check_type,
  trigger_name,
  event_object_table,
  CASE 
    WHEN event_object_schema = 'auth' AND event_object_table = 'users' THEN '✅ OK'
    ELSE '⚠️ Controlla'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Verifica constraint UNIQUE
SELECT 
  'CONSTRAINT' as check_type,
  conname as constraint_name,
  CASE 
    WHEN conname = 'users_dota_account_id_key' THEN '✅ OK'
    ELSE 'N/A'
  END as status
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND contype = 'u';

-- =====================================================
-- FINE SCRIPT
-- =====================================================
-- 
-- Dopo aver eseguito questo script:
-- 1. Verifica i risultati della sezione "VERIFICA FINALE"
-- 2. Testa l'autenticazione nell'app
-- 3. Testa il salvataggio dati nel dashboard
-- 
-- Se vedi errori, controlla i log in Supabase Dashboard
-- =====================================================

