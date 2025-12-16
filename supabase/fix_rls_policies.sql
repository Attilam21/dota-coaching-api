-- Fix RLS Policies per tabella users
-- Esegui questo script in Supabase SQL Editor se vedi errori "permission denied"

-- Abilita RLS se non è già abilitato
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Rimuovi policies esistenti (se ci sono)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Crea policy per SELECT (lettura)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Crea policy per UPDATE (aggiornamento)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Crea policy per INSERT (creazione - necessario per UPSERT)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Verifica che le policies siano attive
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

