-- =====================================================
-- PULIZIA FINALE TABELLE SUPABASE
-- Rimuove tutte le tabelle non utilizzate
-- =====================================================
-- ⚠️ ATTENZIONE: Questo script ELIMINA dati!
-- Esegui solo se sei sicuro
-- =====================================================

-- =====================================================
-- COSA SERVE:
-- - auth.users (gestito automaticamente da Supabase per autenticazione)
--   → Email, password, sessioni - NON TOCCARE
-- =====================================================

-- =====================================================
-- COSA NON SERVE (da rimuovere):
-- =====================================================

-- 1. public.users - Creata dal trigger ma NON usata nel codice
--    Commento in lib/supabase.ts: "NON lo usiamo nel codice"
--    Player ID salvato in localStorage, non in Supabase
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. public.match_analyses - NON usata nel codice
--    Nessun riferimento trovato nel codice
DROP TABLE IF EXISTS public.match_analyses CASCADE;

-- 3. Tabelle gamification (non implementato)
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.leaderboard CASCADE;
DROP TABLE IF EXISTS public.user_performance_snapshots CASCADE;
DROP TABLE IF EXISTS public.user_hero_rankings CASCADE;

-- 4. Tabelle coaching avanzato (non implementato)
DROP TABLE IF EXISTS public.coaching_tasks CASCADE;
DROP TABLE IF EXISTS public.coaching_task_progress CASCADE;
DROP TABLE IF EXISTS public.user_statistics CASCADE;
DROP TABLE IF EXISTS public.matches_digest CASCADE;
DROP TABLE IF EXISTS public.players_digest CASCADE;
DROP TABLE IF EXISTS public.player_match_metrics CASCADE;
DROP TABLE IF EXISTS public.user_profile CASCADE;

-- 5. Tabelle learning (non implementato)
DROP TABLE IF EXISTS public.learning_paths CASCADE;
DROP TABLE IF EXISTS public.learning_tasks CASCADE;

-- 6. Tabelle vecchie/non usate
DROP TABLE IF EXISTS public.raw_matches CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_history CASCADE;
DROP TABLE IF EXISTS public.dota2_accounts CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.match_analysis CASCADE;
DROP TABLE IF EXISTS public.heroes CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;

-- =====================================================
-- RIMUOVI TRIGGER E FUNZIONI ASSOCIATE
-- =====================================================

-- Rimuovi trigger che crea public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =====================================================
-- VERIFICA FINALE
-- Dopo l'esecuzione, dovresti avere SOLO:
-- - auth.users (gestito da Supabase, non toccare)
-- =====================================================

-- Conta tabelle rimanenti in public schema
SELECT 
  'Remaining public tables' as info,
  COUNT(*) as count,
  string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Mostra tutte le tabelle public rimanenti (dovrebbero essere 0)
SELECT 
  table_name,
  'Should be empty' as note
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

