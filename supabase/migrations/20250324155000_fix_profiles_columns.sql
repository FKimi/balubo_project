-- プロフィールテーブルに必要なカラムを追加（存在しない場合のみ）
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS background_image_url TEXT;
