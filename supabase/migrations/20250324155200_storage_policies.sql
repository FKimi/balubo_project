-- ストレージバケットが存在しない場合は作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'user-content'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('user-content', 'user-content', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}');
  END IF;
END
$$;

-- RLSポリシーを設定
-- 認証されたユーザーがアップロードできるようにするポリシー
DROP POLICY IF EXISTS "authenticated can upload" ON storage.objects;
CREATE POLICY "authenticated can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'user-content');

-- 認証されたユーザーが自分のファイルを更新できるようにするポリシー
DROP POLICY IF EXISTS "authenticated can update own files" ON storage.objects;
CREATE POLICY "authenticated can update own files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'user-content' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 認証されたユーザーが自分のファイルを削除できるようにするポリシー
DROP POLICY IF EXISTS "authenticated can delete own files" ON storage.objects;
CREATE POLICY "authenticated can delete own files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'user-content' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 誰でも画像を閲覧できるようにするポリシー
DROP POLICY IF EXISTS "public can view" ON storage.objects;
CREATE POLICY "public can view" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'user-content');

-- プロフィールテーブルに画像URLカラムを追加（存在しない場合）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_image_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN website_url TEXT;
  END IF;
END
$$;
