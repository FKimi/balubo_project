-- profilesテーブルにprofile_image_urlとwebsite_urlカラムを追加

-- profile_image_urlカラムの追加
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- website_urlカラムの追加（存在しない場合のみ）
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- インデックスの作成（検索パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_profiles_website_url ON public.profiles(website_url);

COMMENT ON COLUMN public.profiles.profile_image_url IS 'ユーザーのプロフィール画像URL';
COMMENT ON COLUMN public.profiles.website_url IS 'ユーザーのウェブサイトURL';
