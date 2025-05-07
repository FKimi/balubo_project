-- profiles テーブルに featured_work_ids カラムを追加する
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS featured_work_ids TEXT[] DEFAULT '{}';

-- 必要に応じて既存のnullを空配列に変換する
UPDATE profiles SET featured_work_ids = '{}' WHERE featured_work_ids IS NULL;

-- カラムにコメントを追加（Supabaseの管理ツールでわかりやすくするため）
COMMENT ON COLUMN profiles.featured_work_ids IS 'ユーザーが選択した代表作品のID配列（最大3つ）'; 