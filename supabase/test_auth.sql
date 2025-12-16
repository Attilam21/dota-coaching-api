-- Test: Verifica se puoi vedere i tuoi dati direttamente
-- Esegui questo mentre sei loggato nell'app

-- Test 1: Verifica che auth.uid() funzioni
SELECT auth.uid() AS current_user_id;

-- Test 2: Verifica se ci sono utenti nella tabella
SELECT 
    id, 
    email, 
    dota_account_id,
    CASE 
        WHEN id = auth.uid() THEN '✅ Questo è il tuo record'
        ELSE '❌ Questo NON è il tuo record'
    END AS match_check
FROM public.users
LIMIT 10;

-- Test 3: Verifica le policies con i loro dettagli
SELECT 
    policyname,
    cmd AS command_type,
    qual AS using_clause,
    with_check AS with_check_clause
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY cmd;

-- Test 4: Prova a leggere il tuo record (dovrebbe funzionare se le policies sono corrette)
SELECT * 
FROM public.users 
WHERE id = auth.uid();

