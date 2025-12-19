-- =====================================================
-- Dota 2 Coaching Platform - Database Schema
-- Supabase Project: yzfjtrteezvyoudpfccb
-- URL: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb
-- =====================================================
-- 
-- SCHEMA PULITO E OTTIMIZZATO
-- Include solo quello che serve per il progetto
-- =====================================================

-- Enable UUID extension (necessario per UUID primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELLA: users
-- Estende auth.users di Supabase con dati aggiuntivi
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Dota 2 Account ID e verifica
  dota_account_id BIGINT UNIQUE,
  dota_account_verified_at TIMESTAMPTZ,
  dota_verification_method TEXT, -- 'questions', 'steam_oauth', 'manual'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELLA: match_analyses
-- Salva le analisi match personalizzate degli utenti
-- =====================================================
CREATE TABLE IF NOT EXISTS public.match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  analysis_data JSONB NOT NULL,
  ai_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- =====================================================
-- INDICI per performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_match_analyses_user_id ON public.match_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_match_analyses_match_id ON public.match_analyses(match_id);
CREATE INDEX IF NOT EXISTS idx_users_dota_account_id ON public.users(dota_account_id) WHERE dota_account_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Abilita RLS su tutte le tabelle
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: users
-- Ogni utente può vedere/modificare solo i propri dati
-- =====================================================

-- Rimuovi policies esistenti (se ci sono) per evitare duplicati
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- SELECT: Utente può vedere solo il proprio profilo
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- UPDATE: Utente può aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: Utente può inserire solo il proprio profilo (necessario per UPSERT)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES: match_analyses
-- Ogni utente può vedere/modificare solo le proprie analisi
-- =====================================================

-- Rimuovi policies esistenti (se ci sono) per evitare duplicati
DROP POLICY IF EXISTS "Users can view own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.match_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.match_analyses;

-- SELECT: Utente può vedere solo le proprie analisi
CREATE POLICY "Users can view own analyses" ON public.match_analyses
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: Utente può inserire solo le proprie analisi
CREATE POLICY "Users can insert own analyses" ON public.match_analyses
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Utente può aggiornare solo le proprie analisi
CREATE POLICY "Users can update own analyses" ON public.match_analyses
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNZIONE: handle_new_user
-- Crea automaticamente il profilo utente quando si registra
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea profilo utente in public.users quando si registra
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: on_auth_user_created
-- Esegue handle_new_user() quando viene creato un nuovo utente in auth.users
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICA SCHEMA
-- Esegui questa query per verificare che tutto sia corretto
-- =====================================================
-- SELECT 
--   'users' as table_name,
--   COUNT(*) as policies_count
-- FROM pg_policies 
-- WHERE tablename = 'users' AND schemaname = 'public'
-- UNION ALL
-- SELECT 
--   'match_analyses' as table_name,
--   COUNT(*) as policies_count
-- FROM pg_policies 
-- WHERE tablename = 'match_analyses' AND schemaname = 'public';
