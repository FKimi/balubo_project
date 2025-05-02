-- avatarsバケットのRLSポリシーを設定

-- バケットが存在しない場合は作成
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- 認証されたユーザーが自分のフォルダにアップロードできるようにするポリシー
CREATE POLICY "authenticated users can upload avatars"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 認証されたユーザーが自分のフォルダのファイルを更新できるようにするポリシー
CREATE POLICY "authenticated users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 認証されたユーザーが自分のフォルダのファイルを削除できるようにするポリシー
CREATE POLICY "authenticated users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 誰でもavatarsバケットのファイルを閲覧できるようにするポリシー
CREATE POLICY "public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
