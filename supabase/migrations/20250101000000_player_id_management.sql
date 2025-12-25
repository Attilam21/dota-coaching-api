-- =====================================================
-- MIGRAZIONE: Player ID Management System
-- Data: 2025-01-01
-- Descrizione: Aggiunge sistema di gestione Player ID con limite 3 cambi,
--              storico cambi e cache profilazione
-- =====================================================
-- 
-- ⚠️ ROLLBACK: Per annullare questa migrazione, esegui:
--   1. DROP TRIGGER IF EXISTS trigger_check_player_id_change_limit ON public.users;
--   2. DROP FUNCTION IF EXISTS check_player_id_change_limit();
--   3. DROP TABLE IF EXISTS public.player_profiles;
--   4. DROP TABLE IF EXISTS public.player_id_history;
--   5. ALTER TABLE public.users DROP COLUMN IF EXISTS dota_account_id_locked;
--   6. ALTER TABLE public.users DROP COLUMN IF EXISTS dota_account_id_last_changed_at;
--   7. ALTER TABLE public.users DROP COLUMN IF EXISTS dota_account_id_change_count;
-- =====================================================

-- =====================================================
-- 1. AGGIUNGI COLONNE A public.users
-- =====================================================

-- Contatore cambi Player ID (default 0 = nessun cambio, solo prima impostazione)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS dota_account_id_change_count INTEGER DEFAULT 0;

-- Timestamp ultimo cambio
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS dota_account_id_last_changed_at TIMESTAMPTZ;

-- Flag blocco (true = bloccato dopo 3 cambi)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS dota_account_id_locked BOOLEAN DEFAULT FALSE;

-- Commenti per documentazione
COMMENT ON COLUMN public.users.dota_account_id_change_count IS 
  'Numero di volte che l''utente ha cambiato il Player ID (max 3)';
COMMENT ON COLUMN public.users.dota_account_id_last_changed_at IS 
  'Timestamp dell''ultimo cambio di Player ID';
COMMENT ON COLUMN public.users.dota_account_id_locked IS 
  'True se l''utente ha raggiunto il limite di 3 cambi e non può più modificare il Player ID';

-- =====================================================
-- 2. TABELLA: player_id_history
-- Storico di tutti i cambi di Player ID
-- =====================================================

CREATE TABLE IF NOT EXISTS public.player_id_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dota_account_id BIGINT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_from BIGINT, -- ID precedente (NULL se primo)
  reason TEXT, -- 'initial', 'change', 'reset'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_player_id_history_user_id 
  ON public.player_id_history(user_id);
CREATE INDEX IF NOT EXISTS idx_player_id_history_dota_account_id 
  ON public.player_id_history(dota_account_id);
CREATE INDEX IF NOT EXISTS idx_player_id_history_changed_at 
  ON public.player_id_history(changed_at DESC);

-- Commenti
COMMENT ON TABLE public.player_id_history IS 
  'Storico completo di tutti i cambi di Player ID per ogni utente';
COMMENT ON COLUMN public.player_id_history.changed_from IS 
  'Player ID precedente (NULL se è la prima impostazione)';
COMMENT ON COLUMN public.player_id_history.reason IS 
  'Motivo del cambio: initial (prima impostazione), change (cambio), reset (reset admin)';

-- =====================================================
-- 3. TABELLA: player_profiles
-- Cache delle profilazioni calcolate (TTL 7 giorni)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dota_account_id BIGINT NOT NULL,
  profile_data JSONB NOT NULL, -- role, playstyle, strengths, weaknesses, ecc.
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Cache scade dopo 7 giorni
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, dota_account_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id 
  ON public.player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_dota_account_id 
  ON public.player_profiles(dota_account_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_expires_at 
  ON public.player_profiles(expires_at);

-- Commenti
COMMENT ON TABLE public.player_profiles IS 
  'Cache delle profilazioni calcolate per evitare ricalcoli costosi';
COMMENT ON COLUMN public.player_profiles.profile_data IS 
  'Dati profilazione completi in formato JSONB (role, playstyle, strengths, weaknesses, trends, ecc.)';
COMMENT ON COLUMN public.player_profiles.expires_at IS 
  'Timestamp di scadenza cache (default 7 giorni dopo calculated_at)';

-- =====================================================
-- 4. FUNZIONE: check_player_id_change_limit()
-- Verifica e applica limite 3 cambi con trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_player_id_change_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  old_id BIGINT;
BEGIN
  -- Se dota_account_id non cambia, non fare nulla
  IF OLD.dota_account_id = NEW.dota_account_id THEN
    RETURN NEW;
  END IF;

  -- Se sta rimuovendo l'ID (NULL), permetti (non conta come cambio)
  IF NEW.dota_account_id IS NULL THEN
    -- Reset contatore se rimuove completamente
    NEW.dota_account_id_change_count := 0;
    NEW.dota_account_id_last_changed_at := NULL;
    NEW.dota_account_id_locked := FALSE;
    RETURN NEW;
  END IF;

  -- Se sta impostando per la prima volta (da NULL a valore), permetti
  IF OLD.dota_account_id IS NULL AND NEW.dota_account_id IS NOT NULL THEN
    -- Prima impostazione: non conta come cambio
    NEW.dota_account_id_change_count := 0;
    NEW.dota_account_id_last_changed_at := NOW();
    
    -- Salva nello storico come 'initial'
    INSERT INTO public.player_id_history (
      user_id, 
      dota_account_id, 
      changed_from, 
      reason
    ) VALUES (
      NEW.id,
      NEW.dota_account_id,
      NULL,
      'initial'
    );
    
    RETURN NEW;
  END IF;

  -- Controlla se è già bloccato
  IF OLD.dota_account_id_locked = TRUE THEN
    RAISE EXCEPTION 'Player ID è bloccato. Hai già cambiato 3 volte. Contatta il supporto per sbloccare.';
  END IF;

  -- Conta i cambi
  current_count := COALESCE(OLD.dota_account_id_change_count, 0);
  
  -- Se ha già fatto 3 cambi, blocca
  IF current_count >= 3 THEN
    NEW.dota_account_id_locked := TRUE;
    RAISE EXCEPTION 'Hai raggiunto il limite di 3 cambi Player ID. Contatta il supporto per sbloccare.';
  END IF;

  -- Incrementa contatore
  NEW.dota_account_id_change_count := current_count + 1;
  NEW.dota_account_id_last_changed_at := NOW();

  -- Salva nello storico
  INSERT INTO public.player_id_history (
    user_id, 
    dota_account_id, 
    changed_from, 
    reason
  ) VALUES (
    NEW.id,
    NEW.dota_account_id,
    OLD.dota_account_id,
    'change'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commento funzione
COMMENT ON FUNCTION public.check_player_id_change_limit() IS 
  'Trigger function che verifica e applica il limite di 3 cambi Player ID per utente';

-- =====================================================
-- 5. TRIGGER: trigger_check_player_id_change_limit
-- Esegue la funzione prima di ogni UPDATE su dota_account_id
-- =====================================================

DROP TRIGGER IF EXISTS trigger_check_player_id_change_limit ON public.users;

CREATE TRIGGER trigger_check_player_id_change_limit
  BEFORE UPDATE OF dota_account_id ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_player_id_change_limit();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- Abilita RLS sulle nuove tabelle
-- =====================================================

ALTER TABLE public.player_id_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS POLICIES: player_id_history
-- Ogni utente può vedere solo il proprio storico
-- =====================================================

-- Rimuovi policies esistenti (se ci sono)
DROP POLICY IF EXISTS "Users can view own player id history" ON public.player_id_history;

-- SELECT: Utente può vedere solo il proprio storico
CREATE POLICY "Users can view own player id history" ON public.player_id_history
  FOR SELECT 
  USING (auth.uid() = user_id);

-- NOTA: INSERT è gestito dal trigger, non serve policy
-- NOTA: UPDATE/DELETE non permessi (storico immutabile)

-- =====================================================
-- 8. RLS POLICIES: player_profiles
-- Ogni utente può vedere/modificare solo i propri profili
-- =====================================================

-- Rimuovi policies esistenti (se ci sono)
DROP POLICY IF EXISTS "Users can view own profiles" ON public.player_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.player_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.player_profiles;

-- SELECT: Utente può vedere solo i propri profili
CREATE POLICY "Users can view own profiles" ON public.player_profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: Utente può inserire solo i propri profili
CREATE POLICY "Users can insert own profiles" ON public.player_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Utente può aggiornare solo i propri profili
CREATE POLICY "Users can update own profiles" ON public.player_profiles
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 9. FUNZIONE: cleanup_expired_profiles()
-- Rimuove automaticamente profili scaduti (opzionale, per mantenimento)
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_profiles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.player_profiles
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commento funzione
COMMENT ON FUNCTION public.cleanup_expired_profiles() IS 
  'Rimuove profili scaduti dalla cache. Eseguire periodicamente (es. via cron job)';

-- =====================================================
-- VERIFICA MIGRAZIONE
-- Esegui queste query per verificare che tutto sia corretto
-- =====================================================
-- 
-- -- Verifica colonne aggiunte
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'users' 
--   AND column_name IN ('dota_account_id_change_count', 'dota_account_id_last_changed_at', 'dota_account_id_locked');
-- 
-- -- Verifica tabelle create
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('player_id_history', 'player_profiles');
-- 
-- -- Verifica trigger
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' 
--   AND trigger_name = 'trigger_check_player_id_change_limit';
-- 
-- -- Verifica policies RLS
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('player_id_history', 'player_profiles');
-- =====================================================

