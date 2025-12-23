-- =====================================================
-- VERIFICA TRIGGER IN SUPABASE
-- Esegui questo script per vedere quali trigger sono presenti
-- =====================================================

-- =====================================================
-- 1. LISTA TUTTI I TRIGGER
-- =====================================================

SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY trigger_schema, trigger_name;

-- =====================================================
-- 2. VERIFICA TRIGGER SPECIFICI
-- =====================================================

-- Trigger: on_auth_user_created (Auto-crea profilo alla registrazione)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created' 
      AND event_object_schema = 'auth'
      AND event_object_table = 'users'
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as status,
  'on_auth_user_created' as trigger_name,
  'auth.users' as table_name,
  'Crea automaticamente profilo in public.users quando si registra un nuovo utente' as descrizione;

-- Trigger: prevent_dota_id_change_trigger (Blocca modifiche Player ID)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'prevent_dota_id_change_trigger' 
      AND event_object_schema = 'public'
      AND event_object_table = 'users'
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as status,
  'prevent_dota_id_change_trigger' as trigger_name,
  'public.users' as table_name,
  'Blocca modifiche a dota_account_id dopo verifica' as descrizione;

-- Trigger: update_last_analyzed_match_trigger (Aggiorna ultima partita)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'update_last_analyzed_match_trigger' 
      AND event_object_schema = 'public'
      AND event_object_table = 'match_analyses'
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as status,
  'update_last_analyzed_match_trigger' as trigger_name,
  'public.match_analyses' as table_name,
  'Aggiorna last_analyzed_match_id quando si crea una nuova analisi' as descrizione;

-- =====================================================
-- 3. VERIFICA FUNZIONI ASSOCIATE
-- =====================================================

-- Funzione: handle_new_user
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as status,
  'handle_new_user()' as function_name,
  'Crea profilo utente in public.users alla registrazione' as descrizione;

-- Funzione: prevent_dota_id_change
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'prevent_dota_id_change' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as status,
  'prevent_dota_id_change()' as function_name,
  'Blocca modifiche a dota_account_id dopo verifica' as descrizione;

-- Funzione: update_last_analyzed_match
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'update_last_analyzed_match' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as status,
  'update_last_analyzed_match()' as function_name,
  'Aggiorna last_analyzed_match_id in users' as descrizione;

-- Funzione: cleanup_expired_cache
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'cleanup_expired_cache' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as status,
  'cleanup_expired_cache()' as function_name,
  'Pulisce cache match scaduta' as descrizione;

-- =====================================================
-- 4. DETTAGLI TRIGGER (se presenti)
-- =====================================================

-- Dettagli trigger on_auth_user_created
SELECT 
  t.trigger_name,
  t.event_object_schema,
  t.event_object_table,
  t.event_manipulation,
  t.action_timing,
  t.action_statement,
  p.proname as function_name
FROM information_schema.triggers t
LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON p.oid = pt.tgfoid
WHERE t.trigger_name = 'on_auth_user_created';

-- Dettagli trigger prevent_dota_id_change_trigger
SELECT 
  t.trigger_name,
  t.event_object_schema,
  t.event_object_table,
  t.event_manipulation,
  t.action_timing,
  t.action_statement,
  p.proname as function_name
FROM information_schema.triggers t
LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON p.oid = pt.tgfoid
WHERE t.trigger_name = 'prevent_dota_id_change_trigger';

-- Dettagli trigger update_last_analyzed_match_trigger
SELECT 
  t.trigger_name,
  t.event_object_schema,
  t.event_object_table,
  t.event_manipulation,
  t.action_timing,
  t.action_statement,
  p.proname as function_name
FROM information_schema.triggers t
LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON p.oid = pt.tgfoid
WHERE t.trigger_name = 'update_last_analyzed_match_trigger';

-- =====================================================
-- 5. RIEPILOGO COMPLETO
-- =====================================================

SELECT 
  'RIEPILOGO TRIGGER' as sezione,
  COUNT(*) as totale_trigger,
  string_agg(trigger_name, ', ') as trigger_list
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth');

