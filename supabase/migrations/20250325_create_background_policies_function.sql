-- バックグラウンド画像用のRLSポリシーを作成するための関数
CREATE OR REPLACE FUNCTION create_background_policies()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 既存のポリシーをクリア
  DROP POLICY IF EXISTS backgrounds_select_policy ON storage.objects;
  DROP POLICY IF EXISTS backgrounds_insert_policy ON storage.objects;
  DROP POLICY IF EXISTS backgrounds_update_policy ON storage.objects;
  DROP POLICY IF EXISTS backgrounds_delete_policy ON storage.objects;

  -- バケットが存在することを確認
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('backgrounds', 'backgrounds', true)
  ON CONFLICT (id) DO NOTHING;

  -- 背景画像は誰でも閲覧可能
  CREATE POLICY backgrounds_select_policy
  ON storage.objects FOR SELECT
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
    auth.uid()::text = (storage.foldername(name))[1]
  );

  -- 認証済みユーザーは自分の背景画像のみ削除可能
  CREATE POLICY backgrounds_delete_policy
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'backgrounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

  RETURN true;
END;
$$;
