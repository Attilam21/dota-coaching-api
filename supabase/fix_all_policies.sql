-- 🔧 Fix Completo Policies - Rimuove tutte e ricrea solo quelle corrette
-- Esegui questo se hai ancora 4 policies invece di 3

-- Rimuovi TUTTE le policies esistenti
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Ricrea solo le 3 policies corrette
-- 1. SELECT - lettura del proprio profilo
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. UPDATE - aggiornamento del proprio profilo
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. INSERT - creazione del proprio profilo (per UPSERT)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Verifica finale - dovresti vedere solo 3 policies
SELECT 
    policyname AS nome_policy,
    cmd AS tipo_operazione
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

