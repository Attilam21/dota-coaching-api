-- =====================================================
-- Aggiunge bonus prestazione alla funzione daily XP
-- =====================================================

BEGIN;

-- =====================================================
-- FUNZIONE RPC: increment_daily_xp_with_bonus()
-- Incrementa XP giornaliero + bonus prestazione (idempotente)
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_daily_xp_with_bonus(p_performance_bonus INT DEFAULT 0)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_xp INT;
  v_last_login_day DATE;
  v_total_bonus INT;
BEGIN
  -- Ottieni user_id corrente
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Valida bonus (0-10)
  v_total_bonus := GREATEST(0, LEAST(10, COALESCE(p_performance_bonus, 0)));

  -- Prova a ottenere XP esistente
  SELECT xp, last_login_day INTO v_current_xp, v_last_login_day
  FROM public.user_xp
  WHERE user_id = v_user_id;

  -- Se riga non esiste -> INSERT
  IF NOT FOUND THEN
    INSERT INTO public.user_xp (user_id, xp, last_login_day, updated_at)
    VALUES (v_user_id, 10 + v_total_bonus, CURRENT_DATE, NOW())
    RETURNING xp INTO v_current_xp;
    RETURN v_current_xp;
  END IF;

  -- Se last_login_day = current_date -> non cambia xp (idempotente)
  IF v_last_login_day = CURRENT_DATE THEN
    RETURN v_current_xp;
  END IF;

  -- Altrimenti incrementa XP (10 base + bonus prestazione)
  UPDATE public.user_xp
  SET 
    xp = xp + 10 + v_total_bonus,
    last_login_day = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING xp INTO v_current_xp;

  RETURN v_current_xp;
END;
$$;

-- =====================================================
-- GRANT execute permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.increment_daily_xp_with_bonus(INT) TO authenticated;

-- Revoke da public (sicurezza)
REVOKE EXECUTE ON FUNCTION public.increment_daily_xp_with_bonus(INT) FROM public;

COMMIT;

