# Balubo - AI分析型ポートフォリオサービス

![Balubo Logo](https://via.placeholder.com/200x80?text=Balubo)

Baluboは、ライターやクリエイターのためのAI分析型ポートフォリオサービスです。URLを入力するだけでAIが作品を分析し、専門性・作品特徴・興味関心の3軸で可視化することができます。

## 🌟 特徴

- **簡単な作品登録**: URLを入力するだけで自動的に作品情報を取得・登録
- **AI分析**: Google Gemini APIを活用した高度な作品分析
- **タグベース解析**: タグの出現頻度分析、関連タグのクラスタリング、時系列変化分析
- **直感的なダッシュボード**: 専門性、スタイル、興味関心を視覚的に表示
- **レスポンシブデザイン**: あらゆるデバイスに最適化された表示

## 🚀 技術スタック

- **フロントエンド**: React + TypeScript, Tailwind CSS
- **バックエンド/DB**: Supabase (PostgreSQL)
- **認証**: Supabase Auth (Google認証含む)
- **ストレージ**: Supabase Storage
- **AI/ML**: Google Gemini API (1.5 Flash)
- **ホスティング**: Netlify

## 🛠 開発環境のセットアップ

### 前提条件

- Node.js (v20.0.0以上)
- npm (v10.0.0以上)
- Supabaseアカウント
- Google Gemini APIキー

### インストール手順

1. リポジトリをクローン
   ```bash
   git clone https://github.com/yourusername/balubo_project.git
   cd balubo_project
   ```

2. 依存関係のインストール
   ```bash
   npm install
   ```

3. 環境変数の設定
   `.env.example`ファイルを`.env`にコピーし、必要な環境変数を設定してください。
   ```bash
   cp .env.example .env
   ```
   
   以下の項目を適切に設定してください：
   - Supabase URL
   - Supabase Anon Key
   - Supabase Service Role Key
   - Google Gemini API Key

4. 開発サーバーの起動
   ```bash
   npm run dev
   ```
   
5. Netlify Functionsをローカルで実行（オプション）
   ```bash
   npm run netlify-dev
   ```

## 📊 データベース構造

主要なテーブルと関連は以下の通りです：

- `profiles`: ユーザープロフィール情報
- `works`: 作品情報
- `tags`: タグ情報
- `work_tags`: 作品とタグの中間テーブル
- `ai_analyses`: 作品のAI分析結果
- `user_analyses`: ユーザーの総合分析結果
- `tag_analytics`: タグ分析結果

詳細なデータベース構造は[database.md](./database.md)を参照してください。

## 🔒 認証とセキュリティ

- Supabase Authを使用したセキュアな認証システム
- Row Level Security (RLS)によるデータアクセス制御
- 環境変数による機密情報の安全な管理

## 💼 主要機能

### ユーザー管理
- メール/パスワードでのサインアップ・ログイン
- Googleアカウントによるソーシャルログイン
- プロフィール編集機能
- SNS連携機能

### 作品管理
- URL入力による作品情報の自動取得
- 作品タイプ分け（記事/デザイン）
- 公開/非公開設定
- フィルタリング・検索機能

### AI分析
- 作品ごとの自動分析（専門性、文章スタイル、興味関心）
- ユーザー総合分析（タグベースの集約・分析）
- 分析結果のビジュアライズ（チャート表示）

## 🤝 コントリビューション

1. フォークする
2. 機能ブランチを作成する (`git checkout -b feature/amazing-feature`)
3. 変更をコミットする (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュする (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。

## 🙏 謝辞

- [React](https://reactjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Gemini API](https://cloud.google.com/generative-ai)
- [Netlify](https://www.netlify.com/)