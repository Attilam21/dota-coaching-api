-- =====================================================
-- Rimozione colonne e grant non più necessari
-- =====================================================

BEGIN;

-- =====================================================
-- RIMUOVI COLONNA: last_awarded_match_id
-- Non più necessaria dopo rimozione award_last_match_xp
-- =====================================================
ALTER TABLE public.user_xp 
DROP COLUMN IF EXISTS last_awarded_match_id;

-- =====================================================
-- VERIFICA: Nessun grant inutile da rimuovere
-- I grant per award_last_match_xp sono già stati rimossi
-- nella migration 20251223230331_user_xp_gamification.sql
-- =====================================================

COMMIT;

