-- =====================================================
-- VERIFICA RAPIDA TRIGGER
-- Esegui questo nel SQL Editor Supabase
-- =====================================================

-- 1. Lista tutti i trigger
SELECT 
  trigger_name as "Trigger",
  event_object_schema as "Schema",
  event_object_table as "Tabella",
  event_manipulation as "Evento",
  action_timing as "Timing"
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY trigger_schema, trigger_name;

-- 2. Verifica trigger specifici
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers adesso
      WHERE trigger_name = 'on_auth_user_created' 
      AND event_object_schema = 'auth'
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as "on_auth_user_created",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'prevent_dota_id_change_trigger' 
      AND event_object_schema = 'public'
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as "prevent_dota_id_change_trigger",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'update_last_analyzed_match_trigger' 
      AND event_object_schema = 'public'
    ) THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as "update_last_analyzed_match_trigger";

-- 3. Verifica funzioni
SELECT 
  proname as "Funzione",
  CASE 
    WHEN proname IN ('handle_new_user', 'prevent_dota_id_change', 'update_last_analyzed_match', 'cleanup_expired_cache')
    THEN '✅ PRESENTE'
    ELSE '❌ MANCANTE'
  END as "Stato"
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('handle_new_user', 'prevent_dota_id_change', 'update_last_analyzed_match', 'cleanup_expired_cache')
ORDER BY proname;

