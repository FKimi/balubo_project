# Balubo プロジェクト構造

## 概要

Baluboはライター・クリエイターのためのポートフォリオサービスです。このドキュメントではプロジェクトの構造と主要コンポーネントについて説明します。

## 技術スタック

- **フロントエンド**: React + TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL)
- **AI/ML**: Google Gemini API
- **ホスティング**: Netlify

## ディレクトリ構造

```
balubo_project/
├── src/                     # ソースコード
│   ├── api/                 # API関連
│   │   ├── services/        # API呼び出しロジック
│   │   ├── routes/          # APIエンドポイント
│   │   └── types/           # API関連の型定義
│   ├── components/          # Reactコンポーネント
│   │   ├── ui/              # 基本UI要素
│   │   ├── layout/          # レイアウトコンポーネント
│   │   ├── auth/            # 認証関連コンポーネント
│   │   ├── profile/         # プロフィール関連コンポーネント
│   │   ├── works/           # 作品関連コンポーネント
│   │   └── analytics/       # 分析関連コンポーネント
│   ├── lib/                 # ユーティリティ
│   │   ├── utils/           # 共通ユーティリティ関数
│   │   ├── hooks/           # カスタムフック
│   │   ├── services/        # サービスロジック
│   │   └── context/         # Reactコンテキスト
│   └── types/               # 共通型定義
├── supabase/                # Supabase関連
│   └── migrations/          # データベースマイグレーション
├── netlify/                 # Netlify関連
│   └── functions/           # Netlify Functions
└── docs/                    # ドキュメント
```

## 主要コンポーネント

### 認証関連

- `AuthCallback.tsx`: OAuth認証コールバック処理
- `LoginForm.tsx`: ログインフォーム
- `Register.tsx`: ユーザー登録
- `SignUpForm.tsx`: サインアップフォーム

### プロフィール関連

- `Mypage.tsx`: ユーザーマイページ
- `Profile.tsx`: プロフィール表示
- `ProfileEdit.tsx`: プロフィール編集
- `Settings.tsx`: ユーザー設定

### 作品関連

- `AddWork.tsx`: 作品追加
- `WorkCreate.tsx`: 作品作成
- `WorkDetail.tsx`: 作品詳細

### 分析関連

- `CreatorAnalysis.tsx`: クリエイター分析
- `TagAnalysis.tsx`: タグ分析
- `TagForceGraph.tsx`: タグ関連性グラフ
- `TagTimelineChart.tsx`: タグタイムライン
- `CategoryDistributionChart.tsx`: カテゴリ分布チャート

## データフロー

1. **認証フロー**:
   - ユーザーがログイン/サインアップ
   - Supabase認証を使用
   - 認証成功後、ユーザープロフィールを取得

2. **プロフィール管理**:
   - `profiles`テーブルでユーザー情報を管理
   - プロフィール編集はSupabaseに直接更新

3. **作品管理**:
   - `works`テーブルで作品情報を管理
   - `work_tags`テーブルで作品とタグの関連付け

4. **AI分析**:
   - ユーザーの作品とタグを収集
   - Google Gemini APIで分析
   - 分析結果を`user_insights`テーブルに保存

## API構造

### Supabase API

- ユーザー認証
- データベースCRUD操作
- ストレージ管理

### Netlify Functions

- `analyze-tags`: タグ分析処理
- その他のサーバーサイド処理

## 開発ガイドライン

1. **コンポーネント開発**:
   - 機能別にコンポーネントを分割
   - 再利用可能なUIコンポーネントは`ui`ディレクトリに配置

2. **状態管理**:
   - Reactコンテキストを使用した状態管理
   - Supabaseリアルタイムサブスクリプションの活用

3. **型安全性**:
   - 共通型定義を`types`ディレクトリに集約
   - 厳格な型チェックの実施

4. **エラーハンドリング**:
   - 統一されたエラーハンドリングパターン
   - ユーザーフレンドリーなエラーメッセージ

5. **パフォーマンス**:
   - 不要な再レンダリングの防止
   - 効率的なデータフェッチング
   - 適切なメモ化の使用
