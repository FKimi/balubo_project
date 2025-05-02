-- profilesテーブルの更新
-- 既存のカラム名を変更（存在する場合のみ）
DO $$
BEGIN
  -- nameカラムが存在する場合のみfull_nameに変更
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'profiles' 
             AND column_name = 'name') THEN
    ALTER TABLE public.profiles RENAME COLUMN name TO full_name;
  END IF;

  -- bioカラムが存在する場合のみaboutに変更
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'profiles' 
             AND column_name = 'bio') THEN
    ALTER TABLE public.profiles RENAME COLUMN bio TO about;
  END IF;
END
$$;

-- 新しいカラムの追加
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[],
  ADD COLUMN IF NOT EXISTS connections INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 既存のカラムが存在しない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'profile_image_url') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_image_url TEXT;
  END IF;
END
$$;

-- 不要なカラムを削除（オプション - 既存データに影響する可能性があるため注意）
-- ALTER TABLE public.profiles 
--   DROP COLUMN IF EXISTS background_image_url,
--   DROP COLUMN IF EXISTS twitter_username,
--   DROP COLUMN IF EXISTS instagram_username,
--   DROP COLUMN IF EXISTS facebook_username;

-- トリガー関数を更新して新しいカラム名を使用
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- インデックスの作成（検索パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON public.profiles(industry);

COMMENT ON TABLE public.profiles IS 'ユーザープロファイル情報を格納するテーブル';
