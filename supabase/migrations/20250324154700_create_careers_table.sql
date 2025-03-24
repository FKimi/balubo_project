-- キャリアテーブルのマイグレーション
BEGIN;

-- UUID拡張機能が有効になっていることを確認
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 職歴テーブルの作成
CREATE TABLE IF NOT EXISTS public.careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current_position BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_careers_user_id ON public.careers(user_id);

-- RLSポリシーの設定
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- 自分の職歴のみ参照可能
DROP POLICY IF EXISTS "ユーザーは自分の職歴のみ参照可能" ON public.careers;
CREATE POLICY "ユーザーは自分の職歴のみ参照可能" ON public.careers
  FOR SELECT USING (auth.uid() = user_id);

-- 自分の職歴のみ挿入可能
DROP POLICY IF EXISTS "ユーザーは自分の職歴のみ挿入可能" ON public.careers;
CREATE POLICY "ユーザーは自分の職歴のみ挿入可能" ON public.careers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 自分の職歴のみ更新可能
DROP POLICY IF EXISTS "ユーザーは自分の職歴のみ更新可能" ON public.careers;
CREATE POLICY "ユーザーは自分の職歴のみ更新可能" ON public.careers
  FOR UPDATE USING (auth.uid() = user_id);

-- 自分の職歴のみ削除可能
DROP POLICY IF EXISTS "ユーザーは自分の職歴のみ削除可能" ON public.careers;
CREATE POLICY "ユーザーは自分の職歴のみ削除可能" ON public.careers
  FOR DELETE USING (auth.uid() = user_id);

-- トリガー関数の作成（更新時にupdated_atを更新する）
CREATE OR REPLACE FUNCTION public.update_careers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの設定
DROP TRIGGER IF EXISTS set_careers_updated_at ON public.careers;
CREATE TRIGGER set_careers_updated_at
BEFORE UPDATE ON public.careers
FOR EACH ROW
EXECUTE FUNCTION public.update_careers_updated_at();

COMMIT;
