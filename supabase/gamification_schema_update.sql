-- Gamification Schema Updates
-- Run this SQL in Supabase SQL Editor

-- 0. Create user_stats table if it doesn't exist (from original schema)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  matches_analyzed INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Add columns to user_stats for tracking matches and login streak
ALTER TABLE public.user_stats 
ADD COLUMN IF NOT EXISTS total_matches_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS last_seen_match_id BIGINT,
ADD COLUMN IF NOT EXISTS last_match_check TIMESTAMPTZ;

-- 2. Create user_performance_snapshots table for tracking improvements
CREATE TABLE IF NOT EXISTS public.user_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  dota_account_id BIGINT NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Percentiles (da OpenDota ratings)
  gpm_percentile INTEGER,
  xpm_percentile INTEGER,
  kda_percentile INTEGER,
  
  -- Rankings (da OpenDota rankings)
  global_rank INTEGER,
  country_rank INTEGER,
  
  -- Winrate
  winrate DECIMAL(5,2),
  total_wins INTEGER,
  total_losses INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, snapshot_date)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_user_date 
ON public.user_performance_snapshots(user_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_performance_snapshots_account_date 
ON public.user_performance_snapshots(dota_account_id, snapshot_date DESC);

-- 4. RLS Policies for user_performance_snapshots
ALTER TABLE public.user_performance_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own snapshots" ON public.user_performance_snapshots;
DROP POLICY IF EXISTS "Users can insert own snapshots" ON public.user_performance_snapshots;

CREATE POLICY "Users can view own snapshots" ON public.user_performance_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots" ON public.user_performance_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create achievements and user_achievements tables if they don't exist
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS for achievements tables if not already enabled
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed initial achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, category) VALUES
-- Progression Achievements (based on percentile improvements)
('Climber', 'Migliora percentile di qualsiasi metrica del 10%', '📈', 200, 'progression'),
('Rising Star', 'Migliora ranking globale di 5,000 posizioni', '⭐', 300, 'progression'),
('Top Performer', 'Raggiungi percentile 90% in GPM, XPM, o KDA', '🏆', 500, 'progression'),
('Elite Player', 'Raggiungi percentile 95% in qualsiasi metrica', '👑', 1000, 'progression'),

-- Milestone Achievements
('Above Average', 'Raggiungi percentile 50% in tutte le metriche', '📊', 150, 'milestone'),
('Top Quarter', 'Raggiungi percentile 75% in almeno 2 metriche', '🎯', 300, 'milestone'),
('Top 10%', 'Raggiungi percentile 90% in almeno 1 metrica', '💎', 500, 'milestone'),
('Elite Tier', 'Raggiungi percentile 95% in almeno 1 metrica', '✨', 1000, 'milestone'),

-- Consistency Achievements
('Steady Hand', 'Mantieni winrate >55% per 30 partite', '🎲', 400, 'consistency'),
('Farm King', 'Mantieni GPM percentile >80% per 15 partite', '💰', 300, 'consistency'),
('Carry Master', 'Mantieni KDA percentile >85% per 20 partite', '⚔️', 400, 'consistency'),

-- Platform Achievements (XP-based)
('First Analysis', 'Analizza la tua prima match', '🔍', 50, 'platform'),
('Analyst', 'Analizza 10 match', '📝', 200, 'platform'),
('Deep Diver', 'Analizza 50 match', '🌊', 500, 'platform'),
('Master Analyst', 'Analizza 100 match', '🎓', 1000, 'platform'),

-- Streak Achievements
('Dedicated', 'Login 3 giorni consecutivi', '🔥', 50, 'streak'),
('Committed', 'Login 7 giorni consecutivi', '💪', 150, 'streak'),
('Unstoppable', 'Login 30 giorni consecutivi', '⚡', 500, 'streak')
ON CONFLICT (name) DO NOTHING;

-- 6. Enable RLS for user_stats if not already enabled
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Update RLS policy for user_stats (allow users to update their own stats)
-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;

CREATE POLICY "Users can update own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Create add_user_xp function if it doesn't exist (from original schema)
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  UPDATE public.user_stats
  SET total_xp = total_xp + p_xp,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_xp;
  
  -- Simple level calculation (every 1000 XP = 1 level)
  v_new_level := FLOOR(v_new_xp / 1000) + 1;
  
  UPDATE public.user_stats
  SET level = v_new_level
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

