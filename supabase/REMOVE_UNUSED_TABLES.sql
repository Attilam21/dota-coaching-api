-- =====================================================
-- RIMUOVI TABELLE INUTILI
-- ⚠️ ATTENZIONE: Questo script ELIMINA dati!
-- Esegui solo se sei sicuro che queste tabelle non servono
-- =====================================================

-- =====================================================
-- TABELLE DA RIMUOVERE (non usate nel codice)
-- =====================================================

-- Tabelle coaching avanzato (non implementato)
DROP TABLE IF EXISTS public.coaching_tasks CASCADE;
DROP TABLE IF EXISTS public.coaching_task_progress CASCADE;
DROP TABLE IF EXISTS public.user_statistics CASCADE;
DROP TABLE IF EXISTS public.matches_digest CASCADE;
DROP TABLE IF EXISTS public.players_digest CASCADE;
DROP TABLE IF EXISTS public.player_match_metrics CASCADE;
DROP TABLE IF EXISTS public.user_profile CASCADE;

-- Tabelle learning (non implementato)
DROP TABLE IF EXISTS public.learning_paths CASCADE;
DROP TABLE IF EXISTS public.learning_tasks CASCADE;

-- Tabelle gamification (non implementato)
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.leaderboard CASCADE;
DROP TABLE IF EXISTS public.user_performance_snapshots CASCADE;
DROP TABLE IF EXISTS public.user_hero_rankings CASCADE;

-- Tabelle vecchie/non usate
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
-- VERIFICA FINALE
-- Dopo l'esecuzione, dovresti avere solo:
-- - public.users
-- - public.match_analyses
-- =====================================================

-- Conta tabelle rimanenti
SELECT 
  'Remaining tables' as info,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('users', 'match_analyses');

