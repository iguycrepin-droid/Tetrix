-- ============================================================
-- TETRIX — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT NOT NULL UNIQUE,
  avatar_id     INT DEFAULT 0,
  best_score    INT DEFAULT 0,
  best_level    INT DEFAULT 1,
  total_games   INT DEFAULT 0,
  total_lines   INT DEFAULT 0,
  playtime_seconds INT DEFAULT 0,
  ads_removed   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Scores table
CREATE TABLE IF NOT EXISTS public.scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score           INT NOT NULL,
  level_reached   INT DEFAULT 1,
  lines_cleared   INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Purchases table (for IAP - Phase 3)
CREATE TABLE IF NOT EXISTS public.purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL,
  purchase_token  TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  purchased_at    TIMESTAMPTZ DEFAULT NOW(),
  -- FIX #15/#16: unique constraint enables upsert without duplicates
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- Leaderboard View (All-Time Top 100)
-- ============================================================
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  p.id,
  p.username,
  p.avatar_id,
  p.best_score,
  p.best_level,
  p.total_games
FROM public.profiles p
WHERE p.best_score > 0
ORDER BY p.best_score DESC
LIMIT 100;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Scores: public read, owner insert
CREATE POLICY "Scores are viewable by everyone"
  ON public.scores FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores"
  ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchases: owner only
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Auto-update updated_at on profiles
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON public.scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_best_score ON public.profiles(best_score DESC);
