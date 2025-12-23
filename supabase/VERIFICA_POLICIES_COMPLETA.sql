-- 🔍 VERIFICA COMPLETA RLS POLICIES
-- Esegui questo script in Supabase SQL Editor per verificare tutte le policies
-- Data: Verifica dopo rimozione localStorage per Player ID

-- =====================================================
-- 1. STATO RLS SU TUTTE LE TABELLE
-- =====================================================
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ABILITATO'
        ELSE '❌ RLS NON ABILITATO'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'match_analyses')
ORDER BY tablename;

-- =====================================================
-- 2. POLICIES PER TABELLA USERS
-- =====================================================
SELECT 
    'USERS POLICIES' as check_type,
    policyname,
    cmd as operazione,
    CASE 
        WHEN cmd = 'SELECT' AND qual = '(auth.uid() = id)' THEN '✅ CORRETTA'
        WHEN cmd = 'UPDATE' AND qual = '(auth.uid() = id)' AND with_check = '(auth.uid() = id)' THEN '✅ CORRETTA'
        WHEN cmd = 'INSERT' AND with_check = '(auth.uid() = id)' THEN '✅ CORRETTA'
        ELSE '⚠️ VERIFICA MANUALE'
    END as stato
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY cmd;

-- Verifica che ci siano ESATTAMENTE 3 policies per users
SELECT 
    'USERS COUNT' as check_type,
    COUNT(*) as numero_policies,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ CORRETTO (3 policies)'
        WHEN COUNT(*) < 3 THEN '❌ MANCANO POLICIES'
        WHEN COUNT(*) > 3 THEN '⚠️ TROPPE POLICIES (potrebbero esserci duplicati)'
    END as stato
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public';

-- =====================================================
-- 3. POLICIES PER TABELLA MATCH_ANALYSES
-- =====================================================
SELECT 
    'MATCH_ANALYSES POLICIES' as check_type,
    policyname,
    cmd as operazione,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid() = user_id%' THEN '✅ CORRETTA'
        WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid() = user_id%' AND with_check LIKE '%auth.uid() = user_id%' THEN '✅ CORRETTA'
        WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid() = user_id%' THEN '✅ CORRETTA'
        WHEN cmd = 'DELETE' AND qual LIKE '%auth.uid() = user_id%' THEN '✅ CORRETTA'
        ELSE '⚠️ VERIFICA MANUALE'
    END as stato
FROM pg_policies 
WHERE tablename = 'match_analyses' 
  AND schemaname = 'public'
ORDER BY cmd;

-- Verifica che ci siano almeno 3 policies per match_analyses
SELECT 
    'MATCH_ANALYSES COUNT' as check_type,
    COUNT(*) as numero_policies,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CORRETTO (' || COUNT(*)::text || ' policies)'
        WHEN COUNT(*) < 3 THEN '❌ MANCANO POLICIES'
    END as stato
FROM pg_policies 
WHERE tablename = 'match_analyses' 
  AND schemaname = 'public';

-- =====================================================
-- 4. DETTAGLIO COMPLETO POLICIES USERS
-- =====================================================
SELECT 
    'DETTAGLIO USERS' as check_type,
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- =====================================================
-- 5. DETTAGLIO COMPLETO POLICIES MATCH_ANALYSES
-- =====================================================
SELECT 
    'DETTAGLIO MATCH_ANALYSES' as check_type,
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'match_analyses' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- =====================================================
-- 6. VERIFICA POLICIES DUPLICATE
-- =====================================================
SELECT 
    'DUPLICATI' as check_type,
    tablename,
    cmd,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 1 THEN '⚠️ DUPLICATI TROVATI'
        ELSE '✅ NESSUN DUPLICATO'
    END as stato
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'match_analyses')
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;

-- =====================================================
-- 7. RIEPILOGO FINALE
-- =====================================================
SELECT 
    'RIEPILOGO' as check_type,
    tablename,
    COUNT(*) as totale_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
    CASE 
        WHEN tablename = 'users' AND COUNT(*) = 3 THEN '✅ OK'
        WHEN tablename = 'match_analyses' AND COUNT(*) >= 3 THEN '✅ OK'
        ELSE '⚠️ VERIFICA'
    END as stato
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'match_analyses')
GROUP BY tablename
ORDER BY tablename;

