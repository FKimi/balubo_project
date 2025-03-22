# Balubo - データベース設計

## 1. 概要

BaluboプロジェクトのデータベースはSupabase（PostgreSQL）を使用し、以下の主要テーブルで構成されています。データベース設計は、ユーザー管理、作品管理、タグ管理、AI分析結果の保存という4つの主要機能をサポートするように構造化されています。

## 2. テーブル構造

### 2.1 ユーザー管理

#### users テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | ユーザーID | 主キー, auth.usersと紐付け |
| name | TEXT | ユーザー名 | |
| bio | TEXT | 自己紹介文 | null許容 |
| website_url | TEXT | ウェブサイトURL | null許容 |
| profile_image_url | TEXT | プロフィール画像URL | null許容 |
| subscription_tier | INTEGER | 利用プラン（0:無料, 1:有料） | デフォルト:0 |
| twitter_username | TEXT | Twitterユーザー名 | null許容 |
| instagram_username | TEXT | Instagramユーザー名 | null許容 |
| facebook_username | TEXT | Facebookユーザー名 | null許容 |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

### 2.2 作品管理

#### works テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 作品ID | 主キー, デフォルト:gen_random_uuid() |
| user_id | UUID | ユーザーID | 外部キー → users.id |
| title | TEXT | 作品タイトル | NOT NULL |
| description | TEXT | 作品説明 | null許容 |
| source_url | TEXT | 元記事のURL | NOT NULL |
| thumbnail_url | TEXT | サムネイル画像のURL | null許容 |
| is_public | BOOLEAN | 公開設定 | デフォルト:true |
| work_type | TEXT | 作品タイプ | デフォルト:'writing', 'writing'/'design'のみ許容 |
| design_type | TEXT | デザインタイプ | null許容 |
| tools_used | TEXT[] | 使用ツール配列 | null許容 |
| design_url | TEXT | デザイン作品URL | null許容 |
| behance_url | TEXT | BehanceURL | null許容 |
| dribbble_url | TEXT | DribbbleURL | null許容 |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

### 2.3 タグ管理

#### tags テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | タグID | 主キー, デフォルト:gen_random_uuid() |
| name | TEXT | タグ名 | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |

#### work_tags テーブル（中間テーブル）
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| work_id | UUID | 作品ID | 外部キー → works.id, ON DELETE CASCADE |
| tag_id | UUID | タグID | 外部キー → tags.id, ON DELETE CASCADE |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
|  |  |  | 複合主キー(work_id, tag_id) |

### 2.4 AI分析結果

#### ai_analyses テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 分析ID | 主キー, デフォルト:gen_random_uuid() |
| work_id | UUID | 作品ID | 外部キー → works.id, ON DELETE CASCADE |
| expertise | JSONB | 専門性分析結果 | NOT NULL |
| content_style | JSONB | 内容の特徴分析結果 | NOT NULL |
| interests | JSONB | 興味・関心分析結果 | NOT NULL |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

#### user_analyses テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 分析ID | 主キー, デフォルト:gen_random_uuid() |
| user_id | UUID | ユーザーID | 外部キー → users.id, ON DELETE CASCADE |
| expertise_summary | JSONB | 専門性総合評価 | NOT NULL |
| style_summary | JSONB | スタイル総合評価 | NOT NULL |
| interests_summary | JSONB | 興味関心総合評価 | NOT NULL |
| talent_score | JSONB | 才能総合評価 | NOT NULL |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

#### tag_analytics テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 分析ID | 主キー, デフォルト:gen_random_uuid() |
| user_id | UUID | ユーザーID | 外部キー → users.id, ON DELETE CASCADE |
| tag_trends | JSONB | タグトレンド分析結果 | NOT NULL |
| tag_clusters | JSONB | タグクラスタリング結果 | NOT NULL |
| tag_timeline | JSONB | タグ時系列変化 | NOT NULL |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

## 3. データ構造

### 3.1 JSONB構造例

#### expertise (専門性分析)
```json
{
  "categories": [
    {"name": "テクノロジー", "score": 0.85},
    {"name": "ビジネス", "score": 0.65},
    {"name": "ライフスタイル", "score": 0.45}
  ],
  "keywords": ["AI", "機械学習", "データ分析", "プログラミング"]
}
```

#### content_style (内容の特徴)
```json
{
  "tone": [
    {"name": "論理的", "score": 0.9},
    {"name": "教育的", "score": 0.75},
    {"name": "説得力", "score": 0.8}
  ],
  "writing_style": "技術的で分かりやすい解説スタイル",
  "strengths": ["複雑な概念の簡潔な説明", "実用的な例の提示"]
}
```

#### tag_clusters (タグクラスタリング)
```json
{
  "clusters": [
    {
      "name": "テクノロジー",
      "tags": ["AI", "機械学習", "プログラミング"],
      "relevance": 0.9
    },
    {
      "name": "ビジネス",
      "tags": ["マーケティング", "起業", "投資"],
      "relevance": 0.7
    }
  ]
}
```

## 4. リレーションシップ

1. **users ↔ works**: 1対多 (1人のユーザーが複数の作品を持つ)
2. **works ↔ tags**: 多対多 (work_tagsテーブルを介して)
3. **works ↔ ai_analyses**: 1対1 (1つの作品に1つの分析結果)
4. **users ↔ user_analyses**: 1対1 (1人のユーザーに1つの総合分析)
5. **users ↔ tag_analytics**: 1対1 (1人のユーザーに1つのタグ分析)

## 5. インデックス設計

- **users**: id (主キー)
- **works**: id (主キー), user_id (外部キー), work_type (検索用)
- **tags**: id (主キー), name (UNIQUE制約)
- **work_tags**: (work_id, tag_id) (複合主キー)
- **ai_analyses**: id (主キー), work_id (外部キー)
- **user_analyses**: id (主キー), user_id (外部キー)
- **tag_analytics**: id (主キー), user_id (外部キー)

## 6. セキュリティ設計

- Supabase RLS (Row Level Security) を使用して、ユーザーが自分のデータのみにアクセスできるように制限
- 公開設定が有効な作品のみ、他のユーザーからも閲覧可能
- API呼び出しはSupabase認証トークンを使用して保護
