/*
  # Initial Schema Setup for Balubo

  1. New Tables
    - `users`: ユーザープロフィール情報
    - `works`: 作品情報
    - `tags`: タグマスター
    - `work_tags`: 作品とタグの中間テーブル
    - `ai_analyses`: 作品のAI分析結果
    - `user_analyses`: ユーザーの総合分析結果
    - `tag_analytics`: タグ分析結果

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for authenticated users
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users,
  name text,
  bio text,
  website_url text,
  profile_image_url text,
  subscription_tier integer DEFAULT 0,
  twitter_username text,
  instagram_username text,
  facebook_username text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read any profile"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Works table
CREATE TABLE IF NOT EXISTS works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  source_url text NOT NULL,
  thumbnail_url text,
  is_public boolean DEFAULT true,
  work_type text DEFAULT 'writing' CHECK (work_type IN ('writing', 'design')),
  design_type text,
  tools_used text[],
  design_url text,
  behance_url text,
  dribbble_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public works"
  ON works FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own works"
  ON works FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own works"
  ON works FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own works"
  ON works FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

-- Work tags table
CREATE TABLE IF NOT EXISTS work_tags (
  work_id uuid REFERENCES works ON DELETE CASCADE,
  tag_id uuid REFERENCES tags ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (work_id, tag_id)
);

ALTER TABLE work_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read work tags"
  ON work_tags FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM works
    WHERE works.id = work_tags.work_id
    AND (works.is_public = true OR works.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage own work tags"
  ON work_tags
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM works
    WHERE works.id = work_tags.work_id
    AND works.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM works
    WHERE works.id = work_tags.work_id
    AND works.user_id = auth.uid()
  ));

-- AI analyses table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid REFERENCES works ON DELETE CASCADE,
  expertise jsonb NOT NULL,
  content_style jsonb NOT NULL,
  interests jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read ai analyses of accessible works"
  ON ai_analyses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM works
    WHERE works.id = ai_analyses.work_id
    AND (works.is_public = true OR works.user_id = auth.uid())
  ));

-- User analyses table
CREATE TABLE IF NOT EXISTS user_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  expertise_summary jsonb NOT NULL,
  style_summary jsonb NOT NULL,
  interests_summary jsonb NOT NULL,
  talent_score jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read any user analyses"
  ON user_analyses FOR SELECT
  TO authenticated
  USING (true);

-- Tag analytics table
CREATE TABLE IF NOT EXISTS tag_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  tag_trends jsonb NOT NULL,
  tag_clusters jsonb NOT NULL,
  tag_timeline jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tag_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tag analytics"
  ON tag_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);