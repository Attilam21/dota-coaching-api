-- =====================================================
-- QUIZ GAME SCHEMA - PRO DOTA ANALISI
-- Mini-gioco quiz interattivo per engagement
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELLA: quiz_questions
-- Domande del quiz
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('heroes', 'items', 'mechanics', 'strategy', 'meta')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  correct_answer TEXT NOT NULL,
  wrong_answers TEXT[] NOT NULL, -- Array di 3 risposte sbagliate
  explanation TEXT, -- Spiegazione risposta corretta
  points INTEGER DEFAULT 10, -- Punti per risposta corretta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON public.quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON public.quiz_questions(difficulty);

-- =====================================================
-- TABELLA: quiz_sessions
-- Sessioni quiz completate dagli utenti
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- secondi totali
  category TEXT,
  difficulty TEXT,
  questions_answered JSONB, -- Array di {question_id, answer, correct, time_taken}
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON public.quiz_sessions(completed_at DESC);

-- =====================================================
-- TABELLA: quiz_leaderboard
-- Leaderboard aggregato per utente
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  perfect_games INTEGER DEFAULT 0, -- Partite con 100% risposte corrette
  streak_days INTEGER DEFAULT 0, -- Giorni consecutivi
  last_played_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per ranking
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_total_score ON public.quiz_leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_streak ON public.quiz_leaderboard(streak_days DESC);

-- =====================================================
-- TABELLA: quiz_achievements
-- Achievement sbloccati dagli utenti
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'first_quiz', 'perfect_score', 'streak_7', 'streak_30', 'category_master', etc.
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB, -- Dati aggiuntivi (es. score raggiunto, categoria, etc.)
  UNIQUE(user_id, achievement_type)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_quiz_achievements_user_id ON public.quiz_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_achievements_type ON public.quiz_achievements(achievement_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_achievements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: quiz_questions
-- Tutti possono leggere le domande
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions
  FOR SELECT 
  USING (true);

-- =====================================================
-- RLS POLICIES: quiz_sessions
-- Utenti possono vedere solo le proprie sessioni
-- =====================================================
DROP POLICY IF EXISTS "Users can view own sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.quiz_sessions;

CREATE POLICY "Users can view own sessions" ON public.quiz_sessions
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.quiz_sessions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: quiz_leaderboard
-- Tutti possono vedere la leaderboard, utenti possono aggiornare solo il proprio record
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.quiz_leaderboard;
DROP POLICY IF EXISTS "Users can update own leaderboard" ON public.quiz_leaderboard;
DROP POLICY IF EXISTS "Users can insert own leaderboard" ON public.quiz_leaderboard;

CREATE POLICY "Anyone can view leaderboard" ON public.quiz_leaderboard
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own leaderboard" ON public.quiz_leaderboard
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own leaderboard" ON public.quiz_leaderboard
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: quiz_achievements
-- Utenti possono vedere solo i propri achievement
-- =====================================================
DROP POLICY IF EXISTS "Users can view own achievements" ON public.quiz_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.quiz_achievements;

CREATE POLICY "Users can view own achievements" ON public.quiz_achievements
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.quiz_achievements
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNZIONI: Aggiorna leaderboard dopo sessione
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_quiz_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  avg_score DECIMAL(5,2);
  perfect_count INTEGER;
BEGIN
  -- Calcola statistiche aggregate
  SELECT 
    AVG(score)::DECIMAL(5,2),
    COUNT(*) FILTER (WHERE correct_answers = total_questions)
  INTO avg_score, perfect_count
  FROM public.quiz_sessions
  WHERE user_id = NEW.user_id;

  -- Aggiorna o inserisci record leaderboard
  INSERT INTO public.quiz_leaderboard (
    user_id,
    total_score,
    games_played,
    best_score,
    average_score,
    perfect_games,
    last_played_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    COALESCE((SELECT SUM(score) FROM public.quiz_sessions WHERE user_id = NEW.user_id), 0),
    (SELECT COUNT(*) FROM public.quiz_sessions WHERE user_id = NEW.user_id),
    GREATEST(
      COALESCE((SELECT best_score FROM public.quiz_leaderboard WHERE user_id = NEW.user_id), 0),
      NEW.score
    ),
    avg_score,
    perfect_count,
    NEW.completed_at,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = (SELECT SUM(score) FROM public.quiz_sessions WHERE user_id = NEW.user_id),
    games_played = (SELECT COUNT(*) FROM public.quiz_sessions WHERE user_id = NEW.user_id),
    best_score = GREATEST(quiz_leaderboard.best_score, NEW.score),
    average_score = avg_score,
    perfect_games = perfect_count,
    last_played_at = NEW.completed_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Aggiorna leaderboard automaticamente
-- =====================================================
DROP TRIGGER IF EXISTS on_quiz_session_completed ON public.quiz_sessions;
CREATE TRIGGER on_quiz_session_completed
  AFTER INSERT ON public.quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quiz_leaderboard();

-- =====================================================
-- FUNZIONE: Verifica e sblocca achievement
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_quiz_achievements(p_user_id UUID, p_session_id UUID)
RETURNS void AS $$
DECLARE
  v_session RECORD;
  v_stats RECORD;
  v_streak_days INTEGER;
BEGIN
  -- Recupera dati sessione
  SELECT * INTO v_session FROM public.quiz_sessions WHERE id = p_session_id;
  
  -- Recupera statistiche utente
  SELECT * INTO v_stats FROM public.quiz_leaderboard WHERE user_id = p_user_id;
  
  -- Calcola streak (giorni consecutivi)
  SELECT COALESCE(streak_days, 0) INTO v_streak_days FROM public.quiz_leaderboard WHERE user_id = p_user_id;

  -- Achievement: First Quiz
  IF v_stats.games_played = 1 THEN
    INSERT INTO public.quiz_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'first_quiz', '{"session_id": "' || p_session_id || '"}')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Achievement: Perfect Score
  IF v_session.correct_answers = v_session.total_questions THEN
    INSERT INTO public.quiz_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'perfect_score', jsonb_build_object('session_id', p_session_id, 'score', v_session.score))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Achievement: Streak 7 giorni
  IF v_streak_days >= 7 THEN
    INSERT INTO public.quiz_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'streak_7', jsonb_build_object('days', v_streak_days))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Achievement: Streak 30 giorni
  IF v_streak_days >= 30 THEN
    INSERT INTO public.quiz_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'streak_30', jsonb_build_object('days', v_streak_days))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Achievement: 100 Quiz completati
  IF v_stats.games_played >= 100 THEN
    INSERT INTO public.quiz_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'quiz_master_100', jsonb_build_object('games', v_stats.games_played))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

