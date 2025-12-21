-- =====================================================
-- SCRIPT DIAGNOSI PROBLEMI DATABASE
-- Esegui questo per capire cosa non funziona
-- Prima di decidere se ripristinare o sistemare
-- =====================================================

-- =====================================================
-- 1. VERIFICA TABELLE
-- =====================================================
SELECT 
  '1. TABELLE' as sezione,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Trovate ' || COUNT(*)::text || ' tabelle principali'
    WHEN COUNT(*) = 1 THEN '⚠️ Solo 1 tabella trovata'
    ELSE '❌ Tabelle principali mancanti!'
  END as status,
  string_agg(table_name, ', ') as tabelle_trovate
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'match_analyses');

-- Lista tutte le tabelle (per vedere se ci sono tabelle inattese)
SELECT 
  '1b. TUTTE LE TABELLE' as sezione,
  table_name,
  CASE 
    WHEN table_name IN ('users', 'match_analyses') THEN '✅ Prevista'
    ELSE '⚠️ Tabella extra'
  END as tipo
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICA STRUTTURA TABELLA users
-- =====================================================
SELECT 
  '2. COLONNE users' as sezione,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ Tutte le colonne presenti (' || COUNT(*)::text || ')'
    WHEN COUNT(*) >= 4 THEN '⚠️ Alcune colonne mancanti (' || COUNT(*)::text || ')'
    ELSE '❌ Colonne essenziali mancanti!'
  END as status,
  string_agg(column_name, ', ') as colonne_presenti
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- Dettaglio colonne users
SELECT 
  '2b. DETTAGLIO COLONNE' as sezione,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'email', 'dota_account_id', 'created_at', 'updated_at') THEN '✅ Essenziale'
    WHEN column_name IN ('dota_account_verified_at', 'dota_verification_method') THEN '🔧 Opzionale'
    ELSE '❓ Extra'
  END as importanza
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICA RLS (ROW LEVEL SECURITY)
-- =====================================================
SELECT 
  '3. RLS STATUS' as sezione,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS abilitato'
    ELSE '❌ RLS NON abilitato - PROBLEMA!'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'match_analyses')
ORDER BY tablename;

-- =====================================================
-- 4. VERIFICA POLICIES RLS
-- =====================================================
SELECT 
  '4. POLICIES users' as sezione,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ 3 policies corrette (SELECT, UPDATE, INSERT)'
    WHEN COUNT(*) > 3 THEN '⚠️ ' || COUNT(*)::text || ' policies (potrebbero esserci duplicati)'
    WHEN COUNT(*) > 0 THEN '❌ Solo ' || COUNT(*)::text || ' policies (dovrebbero essere 3)'
    ELSE '❌ NESSUNA policy - PROBLEMA CRITICO!'
  END as status,
  string_agg(cmd || ':' || policyname, ' | ') as policies_presenti
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'users';

-- Dettaglio policies users
SELECT 
  '4b. DETTAGLIO POLICIES users' as sezione,
  policyname,
  cmd as operazione,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid() = id%' THEN '✅ Corretta'
    WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid() = id%' AND with_check LIKE '%auth.uid() = id%' THEN '✅ Corretta'
    WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid() = id%' THEN '✅ Corretta'
    ELSE '⚠️ Verifica manualmente'
  END as validazione
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY cmd;

-- Policies match_analyses
SELECT 
  '4c. POLICIES match_analyses' as sezione,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ 3 policies corrette'
    WHEN COUNT(*) > 0 THEN '⚠️ ' || COUNT(*)::text || ' policies'
    ELSE '❌ NESSUNA policy - PROBLEMA!'
  END as status,
  string_agg(cmd || ':' || policyname, ' | ') as policies_presenti
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'match_analyses';

-- =====================================================
-- 5. VERIFICA TRIGGER handle_new_user
-- =====================================================
SELECT 
  '5. TRIGGER handle_new_user' as sezione,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      CASE 
        WHEN MAX(event_object_schema) = 'auth' AND MAX(event_object_table) = 'users' THEN '✅ Trigger corretto su auth.users'
        ELSE '⚠️ Trigger presente ma posizione sospetta'
      END
    ELSE '❌ Trigger mancante - PROBLEMA!'
  END as status,
  COALESCE(MAX(event_object_schema || '.' || event_object_table), 'N/A') as posizione
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Verifica funzione handle_new_user
SELECT 
  '5b. FUNZIONE handle_new_user' as sezione,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Funzione esiste'
    ELSE '❌ Funzione mancante - PROBLEMA!'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;

-- =====================================================
-- 6. VERIFICA CONSTRAINT E INDICI
-- =====================================================
-- Constraint UNIQUE su dota_account_id
SELECT 
  '6. CONSTRAINT dota_account_id' as sezione,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Constraint UNIQUE presente'
    ELSE '⚠️ Constraint UNIQUE mancante (non critico ma raccomandato)'
  END as status
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_dota_account_id_key';

-- Indici
SELECT 
  '6b. INDICI' as sezione,
  indexname,
  CASE 
    WHEN indexname LIKE 'idx_users_%' OR indexname LIKE 'idx_match_analyses_%' THEN '✅ Indice previsto'
    ELSE 'ℹ️ Altro indice'
  END as tipo
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'users' OR tablename = 'match_analyses')
ORDER BY tablename, indexname;

-- =====================================================
-- 7. VERIFICA DATI UTENTE (se presenti)
-- =====================================================
SELECT 
  '7. DATI UTENTI' as sezione,
  COUNT(*)::text || ' utenti nel database' as info,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Dati presenti - ATTENZIONE: backup consigliato prima di modifiche!'
    ELSE 'ℹ️ Nessun utente (puoi modificare senza perdere dati)'
  END as raccomandazione
FROM public.users;

-- Verifica match_analyses
SELECT 
  '7b. DATI MATCH ANALYSES' as sezione,
  COUNT(*)::text || ' analisi salvate' as info,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ Dati presenti - backup consigliato!'
    ELSE 'ℹ️ Nessuna analisi salvata'
  END as raccomandazione
FROM public.match_analyses;

-- =====================================================
-- 8. RIEPILOGO PROBLEMI TROVATI
-- =====================================================
SELECT 
  '8. RIEPILOGO' as sezione,
  CASE 
    -- Conta problemi
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users' AND rowsecurity)
      THEN '❌ PROBLEMA CRITICO: RLS non abilitato su users'
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_analyses' AND rowsecurity)
      THEN '❌ PROBLEMA CRITICO: RLS non abilitato su match_analyses'
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') < 3
      THEN '❌ PROBLEMA CRITICO: Policies RLS mancanti su users'
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'match_analyses') < 3
      THEN '❌ PROBLEMA CRITICO: Policies RLS mancanti su match_analyses'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth')
      THEN '⚠️ PROBLEMA: Trigger handle_new_user non configurato correttamente'
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users') < 6
      THEN '⚠️ PROBLEMA: Colonne mancanti nella tabella users'
    ELSE '✅ Tutto sembra OK - verifica comunque i dettagli sopra'
  END as valutazione_finale,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users) OR EXISTS (SELECT 1 FROM public.match_analyses)
      THEN '⚠️ ATTENZIONE: Ci sono dati nel database. Fai backup prima di modifiche!'
    ELSE 'ℹ️ Nessun dato da salvare'
  END as raccomandazione_backup;

-- =====================================================
-- FINE DIAGNOSI
-- =====================================================
-- 
-- INTERPRETAZIONE RISULTATI:
-- 
-- Se vedi "PROBLEMA CRITICO":
--   → Considera il ripristino da backup OPPURE esegui RESTORE_COMPLETE.sql
-- 
-- Se vedi "PROBLEMA" (non critico):
--   → Puoi sistemare con fix specifici (vedi RIPRISTINO_BACKUP_GUIDA.md)
-- 
-- Se vedi "✅ Tutto sembra OK":
--   → Il problema potrebbe essere nel codice applicativo, non nel database
-- 
-- =====================================================

