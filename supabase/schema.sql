-- Dota 2 Coaching Platform Database Schema
-- Supabase Project: yzfjtrteezvyoudpfccb
-- URL: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match analyses table
CREATE TABLE IF NOT EXISTS public.match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  analysis_data JSONB NOT NULL,
  ai_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- User achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievement progress
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- User XP and level
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  matches_analyzed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_analyses_user_id ON public.match_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_match_analyses_match_id ON public.match_analyses(match_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Match analyses policies
CREATE POLICY "Users can view own analyses" ON public.match_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.match_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.match_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements are publicly readable
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT TO authenticated USING (true);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user stats (required for gamification)
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update user XP
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

-- Function to increment matches_analyzed counter
CREATE OR REPLACE FUNCTION public.increment_matches_analyzed(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_stats
  SET matches_analyzed = COALESCE(matches_analyzed, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create stats if they don't exist
  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, matches_analyzed)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET matches_analyzed = COALESCE(user_stats.matches_analyzed, 0) + 1,
        updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;