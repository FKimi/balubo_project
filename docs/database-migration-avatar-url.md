# Supabase Database Migration: avatar_url カラム追加

## 概要
`profiles`テーブルに`avatar_url`カラムを追加し、既存の`profile_image_url`カラムの値をコピーするマイグレーションを実行します。

## 実行するSQL

```sql
-- profiles テーブルに avatar_url カラムを追加
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;

-- 既存の profile_image_url の値を avatar_url にコピー
UPDATE profiles SET avatar_url = profile_image_url;

-- RLS (Row Level Security) ポリシーを更新して新しいカラムにアクセスできるようにする
-- 必要に応じて以下のポリシーを調整してください
ALTER POLICY "プロフィールは本人のみ編集可能" ON profiles
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## 実装後の確認事項
1. `avatar_url`カラムが正しく追加されていることを確認
2. 既存の`profile_image_url`の値が`avatar_url`にコピーされていることを確認
3. RLSポリシーが正しく機能していることを確認

## 影響範囲
- `profiles`テーブルの構造が変更されます
- 既存のアプリケーションコードは、`avatar_url`を参照している箇所があるため、この変更によりそれらの機能が正常に動作するようになります

## ロールバック手順
問題が発生した場合は、以下のSQLを実行してロールバックします：

```sql
ALTER TABLE profiles DROP COLUMN avatar_url;
```
