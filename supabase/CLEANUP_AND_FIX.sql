-- =====================================================
-- CLEANUP E FIX SCHEMA SUPABASE
-- Rimuove tabelle inutili e corregge quello che serve
-- =====================================================

-- =====================================================
-- STEP 1: AGGIUNGI COLONNE MANCANTI A users
-- =====================================================

-- Aggiungi colonne per verifica Dota Account ID (se non esistono)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_account_verified_at TIMESTAMPTZ;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_verification_method TEXT;

-- Verifica che dota_account_id abbia constraint UNIQUE (se non esiste)
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
-- STEP 2: CORREGGI TRIGGER on_auth_user_created
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
-- STEP 3: AGGIORNA RLS POLICIES (se necessario)
-- =====================================================

-- Verifica che RLS sia abilitato
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;

-- Rimuovi e ricrea policies per users (per sicurezza)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Rimuovi e ricrea policies per match_analyses (per sicurezza)
DROP POLICY IF EXISTS "Users can view own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.match_analyses;

CREATE POLICY "Users can view own analyses" ON public.match_analyses
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.match_analyses
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.match_analyses
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 4: CREA INDICI (se non esistono)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_match_analyses_user_id ON public.match_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_match_analyses_match_id ON public.match_analyses(match_id);
CREATE INDEX IF NOT EXISTS idx_users_dota_account_id ON public.users(dota_account_id) WHERE dota_account_id IS NOT NULL;

-- =====================================================
-- STEP 5: VERIFICA FINALE
-- =====================================================

-- Verifica colonne users
SELECT 
  'users columns' as check_type,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('id', 'email', 'dota_account_id', 'dota_account_verified_at', 'dota_verification_method', 'created_at', 'updated_at');

-- Verifica policies
SELECT 
  'policies' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'match_analyses');

-- Verifica trigger
SELECT 
  'trigger' as check_type,
  COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

