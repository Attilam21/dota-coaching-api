-- 🔍 Script di Diagnostica Supabase
-- Esegui questo script in Supabase SQL Editor per vedere cosa hai configurato

-- ============================================
-- 1. TABELLE ESISTENTI
-- ============================================
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 2. STRUTTURA TABELLA USERS
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================
-- 3. CONSTRAINT DELLA TABELLA USERS
-- ============================================
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
ORDER BY contype, conname;

-- ============================================
-- 4. RLS POLICIES PER USERS
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command_type,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY policyname;

-- ============================================
-- 5. STATO RLS PER USERS
-- ============================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- ============================================
-- 6. VERIFICA COLONNA dota_account_id
-- ============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'users' 
              AND column_name = 'dota_account_id'
        ) THEN '✅ Colonna dota_account_id ESISTE'
        ELSE '❌ Colonna dota_account_id NON ESISTE'
    END AS status_colonna;

-- ============================================
-- 7. NUMERO UTENTI NELLA TABELLA
-- ============================================
SELECT 
    COUNT(*) AS totale_utenti,
    COUNT(dota_account_id) AS utenti_con_dota_id,
    COUNT(*) - COUNT(dota_account_id) AS utenti_senza_dota_id
FROM public.users;

-- ============================================
-- 8. SAMPLE DATA (solo se ci sono utenti)
-- ============================================
SELECT 
    id,
    email,
    dota_account_id,
    created_at
FROM public.users
LIMIT 5;

-- ============================================
-- 9. VERIFICA EXTENSIONS
-- ============================================
SELECT 
    extname AS extension_name,
    extversion AS version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- ============================================
-- 10. INDICI PER USERS
-- ============================================
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- ============================================
-- 11. TABELLA MATCH_ANALYSES (se esiste)
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'match_analyses'
ORDER BY ordinal_position;

-- ============================================
-- 12. RIEPILOGO FINALE
-- ============================================
SELECT 
    'RIEPILOGO DIAGNOSTICA' AS sezione,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS tabelle_totali,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users') AS colonne_users,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') AS policies_rls_users,
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') AS rls_abilitato,
    (SELECT COUNT(*) FROM public.users) AS utenti_totali;

