-- ============================================================
-- TETRIX — Supabase schema (fresh install or re-run)
-- Paste into the SQL editor, or apply supabase/migrations.
-- Clients cannot insert scores or verified purchases.
-- Score totals and ads_removed are written by SECURITY DEFINER
-- functions only.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         TEXT NOT NULL UNIQUE,
  avatar_id        INT DEFAULT 0,
  best_score       INT DEFAULT 0,
  best_level       INT DEFAULT 1,
  total_games      INT DEFAULT 0,
  total_lines      INT DEFAULT 0,
  playtime_seconds INT DEFAULT 0,
  ads_removed      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score            INT NOT NULL,
  level_reached    INT DEFAULT 1,
  lines_cleared    INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS client_game_id UUID;

CREATE TABLE IF NOT EXISTS public.purchases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id     TEXT NOT NULL,
  purchase_token TEXT,
  verified       BOOLEAN DEFAULT FALSE,
  purchased_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS scores_user_client_game_uidx
  ON public.scores (user_id, client_game_id)
  WHERE client_game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON public.scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_best_score ON public.profiles(best_score DESC);

-- Keep in sync with src/lib/plausibility.js
CREATE OR REPLACE FUNCTION public.score_is_plausible(
  p_score INT,
  p_level INT,
  p_lines INT,
  p_duration_seconds INT
) RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_score >= 0
    AND p_lines >= 0
    AND p_duration_seconds >= 0
    AND p_level BETWEEN 1 AND 20
    AND p_lines <= 5000
    AND p_duration_seconds <= 86400
    AND p_level <= (p_lines / 10) + 1
    AND p_lines <= p_duration_seconds * 20 + 40
    AND p_score <= p_lines * 200000 + p_duration_seconds * 500 + 2000
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('tetrix.trusted_write', true) = '1' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.ads_removed := OLD.ads_removed;
    NEW.best_score := OLD.best_score;
    NEW.best_level := OLD.best_level;
    NEW.total_games := OLD.total_games;
    NEW.total_lines := OLD.total_lines;
    NEW.playtime_seconds := OLD.playtime_seconds;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON public.profiles;
CREATE TRIGGER profiles_protect_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.submit_score(
  p_score INT,
  p_level INT,
  p_lines INT,
  p_duration_seconds INT,
  p_client_game_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  existing_id UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_client_game_id IS NULL THEN
    RAISE EXCEPTION 'missing game id';
  END IF;

  SELECT id INTO existing_id
  FROM public.scores
  WHERE user_id = uid AND client_game_id = p_client_game_id;
  IF existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'id', existing_id);
  END IF;

  IF NOT public.score_is_plausible(p_score, p_level, p_lines, p_duration_seconds) THEN
    RAISE EXCEPTION 'implausible score';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid) THEN
    RAISE EXCEPTION 'profile missing';
  END IF;

  INSERT INTO public.scores (user_id, score, level_reached, lines_cleared, duration_seconds, client_game_id)
  VALUES (uid, p_score, p_level, p_lines, p_duration_seconds, p_client_game_id);

  PERFORM set_config('tetrix.trusted_write', '1', true);
  UPDATE public.profiles
  SET
    total_games = total_games + 1,
    total_lines = total_lines + p_lines,
    playtime_seconds = playtime_seconds + p_duration_seconds,
    best_score = GREATEST(best_score, p_score),
    best_level = CASE WHEN p_score > best_score THEN p_level ELSE best_level END
  WHERE id = uid;

  RETURN jsonb_build_object('ok', true, 'duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_verified_purchase(
  p_user_id UUID,
  p_product_id TEXT,
  p_token TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'missing purchase';
  END IF;
  IF p_product_id IS DISTINCT FROM 'tetrix_remove_ads' THEN
    RAISE EXCEPTION 'unknown product';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'profile missing';
  END IF;

  INSERT INTO public.purchases (user_id, product_id, purchase_token, verified)
  VALUES (p_user_id, p_product_id, p_token, true)
  ON CONFLICT (user_id, product_id) DO UPDATE
  SET purchase_token = EXCLUDED.purchase_token,
      verified = true,
      purchased_at = NOW();

  PERFORM set_config('tetrix.trusted_write', '1', true);
  UPDATE public.profiles
  SET ads_removed = true
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_score(INT, INT, INT, INT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_score(INT, INT, INT, INT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.record_verified_purchase(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.record_verified_purchase(UUID, TEXT, TEXT) TO service_role;
  END IF;
END $$;

DROP VIEW IF EXISTS public.weekly_leaderboard;
CREATE VIEW public.weekly_leaderboard
WITH (security_invoker = true) AS
SELECT
  ranked.user_id AS id,
  ranked.username,
  ranked.avatar_id,
  ranked.score AS best_score,
  ranked.level_reached AS best_level,
  ranked.lines_cleared,
  ranked.created_at
FROM (
  SELECT DISTINCT ON (s.user_id)
    s.user_id,
    p.username,
    p.avatar_id,
    s.score,
    s.level_reached,
    s.lines_cleared,
    s.created_at
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE s.created_at >= (date_trunc('week', (now() AT TIME ZONE 'utc')) AT TIME ZONE 'utc')
  ORDER BY s.user_id, s.score DESC, s.created_at ASC
) ranked;

DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.leaderboard_view TO anon, authenticated;
GRANT SELECT ON public.weekly_leaderboard TO anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Scores are viewable by everyone" ON public.scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can delete own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete own purchases" ON public.purchases;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND coalesce(ads_removed, false) = false
    AND coalesce(best_score, 0) = 0
    AND coalesce(best_level, 1) = 1
    AND coalesce(total_games, 0) = 0
    AND coalesce(total_lines, 0) = 0
    AND coalesce(playtime_seconds, 0) = 0
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Scores are viewable by everyone"
  ON public.scores FOR SELECT USING (true);

CREATE POLICY "Users can delete own scores"
  ON public.scores FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
  ON public.purchases FOR DELETE
  USING (auth.uid() = user_id);

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, DELETE ON public.profiles TO authenticated;
GRANT UPDATE (username, avatar_id) ON public.profiles TO authenticated;

REVOKE ALL ON public.scores FROM anon, authenticated;
GRANT SELECT ON public.scores TO anon, authenticated;
GRANT DELETE ON public.scores TO authenticated;

REVOKE ALL ON public.purchases FROM anon, authenticated;
GRANT SELECT, DELETE ON public.purchases TO authenticated;
