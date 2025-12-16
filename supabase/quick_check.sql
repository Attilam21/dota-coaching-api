-- ✅ Quick Check - Verifica Rapida dello Stato
-- Esegui questo per un check veloce

-- Check 1: Tabella users esiste?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users'
        ) THEN '✅ Tabella users ESISTE'
        ELSE '❌ Tabella users NON ESISTE'
    END AS check_tabella;

-- Check 2: Colonna dota_account_id esiste?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'users' 
              AND column_name = 'dota_account_id'
        ) THEN '✅ Colonna dota_account_id ESISTE'
        ELSE '❌ Colonna dota_account_id NON ESISTE - Devi eseguire lo schema SQL!'
    END AS check_colonna;

-- Check 3: RLS è abilitato?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename = 'users' 
              AND rowsecurity = true
        ) THEN '✅ RLS è ABILITATO'
        ELSE '❌ RLS NON è abilitato - Devi abilitarlo!'
    END AS check_rls;

-- Check 4: Policies esistono?
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') >= 3 
        THEN '✅ Policies RLS configurate (' || (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') || ' policies)'
        ELSE '❌ Policies RLS MANCANTI - Devi eseguire fix_rls_policies.sql!'
    END AS check_policies;

-- Lista policies esistenti
SELECT 
    policyname AS nome_policy,
    cmd AS tipo_operazione
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY cmd;

