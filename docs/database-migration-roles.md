# データベースマイグレーション: worksテーブルにrolesカラムを追加

## 概要
作品に関連する役割（企画、取材、執筆、編集、撮影、デザインなど）を保存するために、worksテーブルにrolesカラム（TEXT[]型）を追加しました。

## 変更内容
- テーブル: works
- 追加カラム: roles
- データ型: TEXT[]（テキスト配列）
- デフォルト値: '{}'（空の配列）
- NULL許容: はい

## 実施日
2025年3月25日

## 影響範囲
- AddWorkコンポーネントでの役割選択機能が正常に動作するようになります
- 既存のレコードには空の配列がデフォルト値として設定されます

## 確認事項
- [ ] 新規作品追加時に役割が正しく保存されるか
- [ ] 既存作品編集時に役割が正しく更新されるか
- [ ] 作品詳細画面で役割が正しく表示されるか

## 関連コンポーネント
- AddWork.tsx: 役割選択UI
- WorkDetail.tsx: 役割表示UI
