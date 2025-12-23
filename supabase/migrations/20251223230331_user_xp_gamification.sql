-- =====================================================
-- Gamification XP System
-- Tabella user_xp + RLS policies + RPC functions
-- =====================================================

BEGIN;

-- =====================================================
-- TABELLA: user_xp
-- Gestisce XP persistente per gamification
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INT NOT NULL DEFAULT 0,
  last_login_day DATE,
  last_awarded_match_id BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON public.user_xp(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- Rimuovi policies esistenti (se ci sono) per evitare duplicati
DROP POLICY IF EXISTS "user_xp_select_own" ON public.user_xp;
DROP POLICY IF EXISTS "user_xp_insert_own" ON public.user_xp;
DROP POLICY IF EXISTS "user_xp_update_own" ON public.user_xp;

-- SELECT: Utente può vedere solo il proprio XP
CREATE POLICY "user_xp_select_own"
ON public.user_xp FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Utente può inserire solo il proprio XP
CREATE POLICY "user_xp_insert_own"
ON public.user_xp FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Utente può aggiornare solo il proprio XP
CREATE POLICY "user_xp_update_own"
ON public.user_xp FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- GRANT permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_xp TO authenticated;

-- =====================================================
-- FUNZIONE RPC: increment_daily_xp()
-- Incrementa XP giornaliero (idempotente)
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_daily_xp()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_xp INT;
  v_last_login_day DATE;
BEGIN
  -- Ottieni user_id corrente
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Prova a ottenere XP esistente
  SELECT xp, last_login_day INTO v_current_xp, v_last_login_day
  FROM public.user_xp
  WHERE user_id = v_user_id;

  -- Se riga non esiste -> INSERT
  IF NOT FOUND THEN
    INSERT INTO public.user_xp (user_id, xp, last_login_day, updated_at)
    VALUES (v_user_id, 10, CURRENT_DATE, NOW())
    RETURNING xp INTO v_current_xp;
    RETURN v_current_xp;
  END IF;

  -- Se last_login_day = current_date -> non cambia xp (idempotente)
  IF v_last_login_day = CURRENT_DATE THEN
    RETURN v_current_xp;
  END IF;

  -- Altrimenti incrementa XP
  UPDATE public.user_xp
  SET 
    xp = xp + 10,
    last_login_day = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING xp INTO v_current_xp;

  RETURN v_current_xp;
END;
$$;

-- =====================================================
-- FUNZIONE RPC: award_last_match_xp()
-- Assegna XP per ultima partita (idempotente)
-- =====================================================
CREATE OR REPLACE FUNCTION public.award_last_match_xp(
  p_match_id BIGINT,
  p_win BOOLEAN
)
RETURNS TABLE(xp INT, delta INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_xp INT;
  v_last_awarded_match_id BIGINT;
  v_delta INT;
  v_new_xp INT;
BEGIN
  -- Ottieni user_id corrente
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Prova a ottenere XP esistente
  SELECT xp, last_awarded_match_id INTO v_current_xp, v_last_awarded_match_id
  FROM public.user_xp
  WHERE user_id = v_user_id;

  -- Se riga non esiste -> INSERT
  IF NOT FOUND THEN
    v_delta := CASE WHEN p_win THEN 25 ELSE -10 END;
    v_new_xp := GREATEST(0, v_delta);
    
    INSERT INTO public.user_xp (user_id, xp, last_awarded_match_id, updated_at)
    VALUES (v_user_id, v_new_xp, p_match_id, NOW())
    RETURNING xp INTO v_new_xp;
    
    RETURN QUERY SELECT v_new_xp, v_delta;
    RETURN;
  END IF;

  -- Se last_awarded_match_id = p_match_id -> non cambia (idempotente)
  IF v_last_awarded_match_id = p_match_id THEN
    RETURN QUERY SELECT v_current_xp, 0;
    RETURN;
  END IF;

  -- Calcola delta
  v_delta := CASE WHEN p_win THEN 25 ELSE -10 END;
  v_new_xp := GREATEST(0, v_current_xp + v_delta);

  -- Aggiorna XP
  UPDATE public.user_xp
  SET 
    xp = v_new_xp,
    last_awarded_match_id = p_match_id,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN QUERY SELECT v_new_xp, v_delta;
END;
$$;

-- =====================================================
-- GRANT execute permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.increment_daily_xp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_last_match_xp(BIGINT, BOOLEAN) TO authenticated;

-- Revoke da public (sicurezza)
REVOKE EXECUTE ON FUNCTION public.increment_daily_xp() FROM public;
REVOKE EXECUTE ON FUNCTION public.award_last_match_xp(BIGINT, BOOLEAN) FROM public;

COMMIT;

