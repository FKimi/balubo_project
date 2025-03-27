# データベース構造の最適化: usersテーブルからprofilesテーブルへの統一

## 背景と目的

プロジェクト内で`users`テーブルと`profiles`テーブルの両方が存在し、フィールド名の不一致（`name`/`full_name`, `bio`/`about`など）によりデータの一貫性に問題が生じていました。この問題を解決するため、`profiles`テーブルに統一する作業を実施しました。

## 実施内容

### 1. コードの修正

- `auth-context.tsx`: `users`テーブルから`profiles`テーブルを参照するように変更
  - ユーザー認証時にプロファイルが存在しない場合、自動的に作成する処理を追加
  - ユーザーのメタデータから名前を取得し、デフォルト値を設定

- `Mypage.tsx`: フィールド名を統一し、型定義を共通化
  - ローカルで定義していた型定義を削除し、共通の型定義ファイルからインポート
  - `profile_image_url`の参照を削除し、`avatar_url`のみを使用するように修正

- 型定義の統一: 共通の`UserProfile`型を使用
  - `src/types/index.ts`で定義された型を一貫して使用

### 2. データ移行

データ移行は以下の方法で実施します：

1. **自動移行**: ユーザーがログインする際に、`auth-context.tsx`の処理により自動的にプロファイルが作成されます。
   - 既存のプロファイルがある場合は更新されません
   - 新規ユーザーや未作成のプロファイルは自動的に作成されます

2. **手動確認**: 以下のSQLクエリを実行して、移行状況を確認します。
   ```sql
   -- usersテーブルのユーザー数を確認
   SELECT COUNT(*) FROM users;
   
   -- profilesテーブルのユーザー数を確認
   SELECT COUNT(*) FROM profiles;
   
   -- 両方のテーブルに存在するユーザーを確認
   SELECT u.id, u.name, p.full_name 
   FROM users u 
   LEFT JOIN profiles p ON u.id = p.id;
   ```

3. **移行完了の判断**: すべてのユーザーが`profiles`テーブルに存在することを確認できたら、移行完了とみなします。

### 3. 検証と削除

1. **全機能の動作確認**:
   - ログイン・ログアウト機能
   - プロファイル表示・編集機能
   - 新規ユーザー登録時のプロファイル自動作成

2. **`users`テーブルの削除**:
   - 全ての機能が正常に動作することを確認した後、以下のSQLを実行します。
   ```sql
   -- 注意: 実行前に必ずバックアップを取得してください
   DROP TABLE IF EXISTS users;
   ```

## 今後の注意点

- 新規コンポーネント作成時は`profiles`テーブルを参照
- フィールド名は`full_name`と`about`を使用
- 画像URLは`avatar_url`を使用

## 関連ファイル

- `src/lib/auth-context.tsx`
- `src/components/Mypage.tsx`
- `src/types/index.ts`
- `scripts/migrate-users-to-profiles.ts`（参考用）

## 移行ステータス

- [x] コードの修正
- [x] データの移行確認（ログイン機能の動作確認済み）
- [x] 全機能の動作確認
- [x] `users`テーブルの削除

移行完了日: 2025年3月25日
