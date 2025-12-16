-- 🔧 Fix Duplicate INSERT Policies
-- Rimuove la policy troppo permissiva e mantiene solo quella corretta

-- Rimuovi la policy problematica "Enable insert for authenticated users only"
-- Questa policy probabilmente non controlla auth.uid() = id
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Verifica che rimangano solo le policies corrette
SELECT 
    policyname AS nome_policy,
    cmd AS tipo_operazione,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Dovresti vedere solo:
-- 1. "Users can insert own profile" (INSERT) - con WITH CHECK (auth.uid() = id)
-- 2. "Users can view own profile" (SELECT) - con USING (auth.uid() = id)
-- 3. "Users can update own profile" (UPDATE) - con USING/WITH CHECK (auth.uid() = id)

