-- 既存のポリシーをクリア
DROP POLICY IF EXISTS backgrounds_select_policy ON storage.objects;
DROP POLICY IF EXISTS backgrounds_insert_policy ON storage.objects;
DROP POLICY IF EXISTS backgrounds_update_policy ON storage.objects;
DROP POLICY IF EXISTS backgrounds_delete_policy ON storage.objects;

BEGIN;

-- バケットが存在しない場合のみ作成
INSERT INTO storage.buckets (id, name, public)
SELECT 'backgrounds', 'backgrounds', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'backgrounds'
);

-- 背景画像は誰でも閲覧可能
CREATE POLICY backgrounds_select_policy
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'backgrounds');

-- 認証済みユーザーは背景画像をアップロード可能
CREATE POLICY backgrounds_insert_policy
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backgrounds');

-- 認証済みユーザーは自分の背景画像のみ更新可能
CREATE POLICY backgrounds_update_policy
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは自分の背景画像のみ削除可能
CREATE POLICY backgrounds_delete_policy
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
