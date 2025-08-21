# balubo - 企業のビジネスを加速させるコンテンツ制作

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/fkimis-projects/v0-new-conversation)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 概要

baluboは、企業のビジネスを加速させるコンテンツ制作サービスを提供する企業の公式サイトです。

### 主なサービス

1. **コンテンツ企画・制作事業**
   - 記事・動画・イベントなどのコンテンツ企画から制作まで一貫してサポート
   - 企業のブランディングや採用広報に特化したコンテンツ制作
   - スタートアップから大手企業まで幅広い業界での実績

2. **AIポートフォリオサービス「balubo」**
   - AIがあなたの作品を分析し、強みを客観的に発見・証明するポートフォリオサービス
   - 主観的だったポートフォリオに「客観性」をもたらし、クリエイターと企業の最適なマッチングを実現

## 技術スタック

- **フレームワーク**: Next.js 15.2.4
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 4.1.9
- **UI コンポーネント**: shadcn/ui (Radix UI)
- **アイコン**: Lucide React
- **フォーム管理**: React Hook Form
- **バリデーション**: Zod
- **パッケージマネージャー**: npm
- **デプロイ**: Vercel

## セットアップ

### 前提条件

- Node.js 18.0.0 以上
- npm または pnpm

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/FKimi/balubo_project.git
cd balubo.corp

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 開発サーバー

開発サーバーが起動したら、ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構造

```
balubo.corp/
├── app/                    # Next.js App Router
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # メインページ
│   └── services/          # サービスページ
│       └── content-planning/
│           └── page.tsx   # コンテンツ企画・制作事業ページ
├── components/            # React コンポーネント
│   ├── ui/               # UI コンポーネント (shadcn/ui)
│   └── theme-provider.tsx # テーマプロバイダー
├── lib/                  # ユーティリティ関数
├── public/               # 静的ファイル
└── styles/               # 追加スタイル
```

## 主要機能

### メインページ (`/`)
- 企業概要とサービス紹介
- 課題とソリューションの説明
- お問い合わせフォーム

### サービス詳細ページ (`/services/content-planning`)
- ビジネスコンテンツの内製化潮流の説明
- コンテンツマーケ担当者の課題分析
- baluboの解決策の詳細
- 制作プロセスと料金体系

## デザインシステム

- **カラーパレット**: Slate、Blue、Indigoをベースとした洗練された配色
- **タイポグラフィ**: 読みやすさを重視したフォントサイズと行間
- **アニメーション**: ホバー効果やトランジションでインタラクティブな体験
- **レスポンシブ**: モバイルからデスクトップまで最適化されたレイアウト

## 開発ガイドライン

### コーディング規約

- TypeScriptを使用し、型安全性を確保
- コンポーネントは関数型コンポーネントで記述
- Tailwind CSSクラスを使用したスタイリング
- アクセシビリティを考慮したマークアップ

### コミットメッセージ

```
feat: 新機能の追加
fix: バグ修正
docs: ドキュメントの更新
style: コードスタイルの調整
refactor: リファクタリング
test: テストの追加
```

## デプロイ

このプロジェクトは Vercel にデプロイされています。

**本番環境**: [https://github.com/FKimi/balubo.corp](https://vercel.com/fkimis-projects/v0-new-conversation)

## ライセンス

このプロジェクトは株式会社baluboの所有物です。

## お問い合わせ

- **会社名**: 株式会社balubo
- **代表取締役**: 君和田 郁弥
- **事業内容**: コンテンツ企画・制作事業、AIポートフォリオサービス「balubo」の開発・運営

---

© 2024 balubo Inc. All Rights Reserved.
