-- profiles テーブルの作成
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  bio TEXT,
  website_url TEXT,
  profile_image_url TEXT,
  background_image_url TEXT,
  twitter_username TEXT,
  instagram_username TEXT,
  facebook_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) ポリシーの設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ参照可能
CREATE POLICY "プロフィールは誰でも閲覧可能" ON public.profiles
  FOR SELECT USING (true);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "自分のプロフィールのみ更新可能" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 自分のプロフィールのみ削除可能
CREATE POLICY "自分のプロフィールのみ削除可能" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 自分のプロフィールのみ作成可能
CREATE POLICY "自分のプロフィールのみ作成可能" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ユーザー登録時に自動的にプロフィールを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの設定（既に存在する場合は作成しない）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;
