-- =====================================================
-- VERIFICA TABELLA player_profiles
-- Esegui questo script per verificare se la tabella esiste
-- e se ci sono problemi con le RLS policies
-- =====================================================

-- 1. Verifica se la tabella esiste
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'player_profiles';

-- 2. Verifica struttura tabella
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'player_profiles'
ORDER BY ordinal_position;

-- 3. Verifica constraint UNIQUE
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'player_profiles';

-- 4. Verifica RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'player_profiles';

-- 5. Verifica se RLS è abilitato
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'player_profiles';

-- 6. Conta record esistenti (solo se autenticato)
SELECT COUNT(*) as total_profiles
FROM public.player_profiles;

-- 7. Verifica indici
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'player_profiles';

