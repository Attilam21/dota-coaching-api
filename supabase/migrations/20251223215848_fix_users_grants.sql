-- =====================================================
-- Fix GRANT permissions per public.users
-- Risolve "permission denied for table users" in produzione
-- =====================================================

BEGIN;

-- GRANT per schema public (necessario per accedere alle tabelle)
GRANT USAGE ON SCHEMA public TO authenticated;

-- GRANT per tabella users (SELECT, UPDATE, INSERT)
-- SELECT: necessario per leggere il proprio profilo
-- UPDATE: necessario per aggiornare dota_account_id
-- INSERT: necessario per creare il record durante signup
GRANT SELECT, UPDATE, INSERT ON TABLE public.users TO authenticated;

-- Verifica che RLS sia abilitato (già presente in schema.sql, ma assicuriamoci)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verifica che le policies esistano (già presenti in schema.sql)
-- Se non esistono, vengono create qui come fallback
DO $$
BEGIN
  -- Policy SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.users
      FOR SELECT 
      USING (auth.uid() = id);
  END IF;

  -- Policy UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE 
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Policy INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.users
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

COMMIT;

