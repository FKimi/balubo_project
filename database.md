# Balubo - データベース設計

## 1. 概要

BaluboプロジェクトのデータベースはSupabase（PostgreSQL）を使用し、以下の主要テーブルで構成されています。データベース設計は、ユーザー管理、作品管理、タグ管理、AI分析結果の保存という4つの主要機能をサポートするように構造化されています。

## 2. テーブル一覧

現在のデータベースには以下のテーブルが存在します：

| テーブル名 | 説明 | 行数（推定） | サイズ（推定） |
|---------|------|------------|------------|
| ai_analyses | 作品のAI分析結果 | 0 | 16 kB |
| careers | ユーザーの経歴情報 | 0 | 24 kB |
| profiles | ユーザープロフィール情報 | 2 | 240 kB |
| tag_analytics | タグの分析結果 | 0 | 16 kB |
| tag_stats | タグの統計情報 | 0 | 16 kB |
| tags | タグマスター | 0 | 40 kB |
| user_analyses | ユーザーの総合分析結果 | 0 | 16 kB |
| user_insights | ユーザーの分析インサイト | 2 | 64 kB |
| work_analysis | 作品の分析結果 | 29 | 112 kB |
| work_tags | 作品とタグの中間テーブル | 0 | 24 kB |
| work_tags_with_names | 作品タグ名を含むビュー | - | - |
| works | 作品情報 | 49 | 72 kB |

## 3. テーブル構造

### 3.1 ユーザー管理

#### profiles テーブル（旧 users テーブル）
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | ユーザーID | 主キー, auth.usersと紐付け |
| full_name | TEXT | ユーザー名 | |
| about | TEXT | 自己紹介文 | null許容 |
| website_url | TEXT | ウェブサイトURL | null許容 |
| profile_image_url | TEXT | プロフィール画像URL | null許容 |
| background_image_url | TEXT | 背景画像URL | null許容 |
| subscription_tier | INTEGER | 利用プラン（0:無料, 1:有料） | デフォルト:0 |
| twitter_username | TEXT | Twitterユーザー名 | null許容 |
| instagram_username | TEXT | Instagramユーザー名 | null許容 |
| facebook_username | TEXT | Facebookユーザー名 | null許容 |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |
| avatar_url | TEXT | アバターURL | null許容 |
| headline | TEXT | 見出し | null許容 |
| location | TEXT | 所在地 | null許容 |
| industry | TEXT | 業界 | null許容 |
| skills | TEXT[] | スキル配列 | null許容 |

#### careers テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 経歴ID | 主キー, デフォルト:gen_random_uuid() |
| user_id | UUID | ユーザーID | 外部キー → auth.users |
| company | TEXT | 会社・組織名 | NOT NULL |
| position | TEXT | 職種・役職 | NOT NULL |
| department | TEXT | 部署名 | null許容 |
| start_date | TEXT | 開始日 | NOT NULL |
| end_date | TEXT | 終了日 | null許容 |
| is_current_position | BOOLEAN | 現職かどうか | デフォルト:false |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

### 3.2 作品管理

#### works テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 作品ID | 主キー, デフォルト:gen_random_uuid() |
| user_id | UUID | ユーザーID | 外部キー → auth.users |
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
| content | TEXT | 作品内容 | null許容 |
| roles | TEXT[] | 役割（企画、取材、執筆など） | デフォルト:'{}', null許容 |

#### work_analysis テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 分析ID | 主キー, デフォルト:gen_random_uuid() |
| work_id | UUID | 作品ID | 外部キー → works.id |
| analysis_result | JSONB | 分析結果 | NOT NULL |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

### 3.3 タグ管理

#### tags テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | タグID | 主キー, デフォルト:gen_random_uuid() |
| name | TEXT | タグ名 | NOT NULL, UNIQUE |
| category | TEXT | タグカテゴリ | null許容 |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |

#### work_tags テーブル（中間テーブル）
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| work_id | UUID | 作品ID | 外部キー → works.id, ON DELETE CASCADE |
| tag_id | UUID | タグID | 外部キー → tags.id, ON DELETE CASCADE |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
|  |  |  | 複合主キー(work_id, tag_id) |

#### work_tags_with_names ビュー
| カラム名 | データ型 | 説明 |
|---------|---------|------|
| work_id | UUID | 作品ID |
| tag_id | UUID | タグID |
| name | TEXT | タグ名 |

#### tag_stats テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 統計ID | 主キー, デフォルト:gen_random_uuid() |
| tag_id | UUID | タグID | 外部キー → tags.id |
| usage_count | INTEGER | 使用回数 | デフォルト:0 |
| last_used | TIMESTAMP | 最終使用日時 | null許容 |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |

### 3.4 AI分析結果

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
| user_id | UUID | ユーザーID | 外部キー → auth.users, ON DELETE CASCADE |
| expertise_summary | JSONB | 専門性総合評価 | NOT NULL |
| style_summary | JSONB | スタイル総合評価 | NOT NULL |
| interests_summary | JSONB | 興味関心総合評価 | NOT NULL |
| talent_score | JSONB | 才能総合評価 | NOT NULL |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |
| analysis_date | TIMESTAMP | 分析実施日時 | null許容 |

#### user_insights テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | インサイトID | 主キー, デフォルト:gen_random_uuid() |
| user_id | UUID | ユーザーID | 外部キー → auth.users |
| expertise | TEXT[] | 専門性 | デフォルト:[] |
| style | TEXT[] | スタイル | デフォルト:[] |
| interests | TEXT[] | 興味・関心 | デフォルト:[] |
| uniqueness | JSONB | 独自性 | null許容 |
| talent | JSONB | 才能 | null許容 |
| specialties | TEXT[] | 専門分野 | デフォルト:[] |
| design_styles | TEXT[] | デザインスタイル | デフォルト:[] |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| analysis_date | TIMESTAMP | 分析実施日時 | null許容 |
| is_sample | BOOLEAN | サンプルデータかどうか | デフォルト:false |
| work_count | INTEGER | 分析対象作品数 | デフォルト:0 |
| originality | JSONB | オリジナリティ（独自性）の分析結果 | null許容 |
| quality | JSONB | クオリティ（品質）の分析結果 | null許容 |
| overall_insight | JSONB | 総合的な考察の分析結果 | null許容 |
| engagement | JSONB | 影響力と共感（エンゲージメント）の分析結果 | null許容 |

#### tag_analytics テーブル
| カラム名 | データ型 | 説明 | 制約 |
|---------|---------|------|------|
| id | UUID | 分析ID | 主キー, デフォルト:gen_random_uuid() |
| user_id | UUID | ユーザーID | 外部キー → auth.users, ON DELETE CASCADE |
| tag_trends | JSONB | タグトレンド分析結果 | NOT NULL |
| tag_clusters | JSONB | タグクラスタリング結果 | NOT NULL |
| tag_timeline | JSONB | タグ時系列変化 | NOT NULL |
| created_at | TIMESTAMP | 作成日時 | デフォルト:now() |
| updated_at | TIMESTAMP | 更新日時 | デフォルト:now() |

## 4. データ構造

### 4.1 JSONB構造例

#### expertise (専門性分析)
```json
{
  "categories": [
    {"name": "テクノロジー", "score": 0.85},
    {"name": "ビジネス", "score": 0.65},
    {"name": "ライフスタイル", "score": 0.45}
  ],
  "keywords": ["AI", "機械学習", "データ分析", "プログラミング"],
  "summary": "AIとデータ分析に強みを持ち、テクノロジーとビジネスの接点に関する専門知識が豊富です。"
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

#### originality (オリジナリティ分析)
```json
{
  "level": 0.85,
  "aspects": [
    {"name": "独創的な視点", "score": 0.9},
    {"name": "斬新なアプローチ", "score": 0.8},
    {"name": "新しい概念の導入", "score": 0.85}
  ],
  "summary": "既存の概念を新しい視点で捉え直す能力に優れています。特にテクノロジーと人間の関係性について独自の見解を提示しています。"
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

#### work_analysis (作品分析)
```json
{
  "tags": [
    {"name": "AI", "relevance": 0.9, "category": "technology"},
    {"name": "データ分析", "relevance": 0.85, "category": "technology"},
    {"name": "ビジネス", "relevance": 0.7, "category": "business"}
  ],
  "summary": "AIとデータ分析を活用したビジネス戦略についての解説記事",
  "expertise_level": "中級者向け"
}
```

## 5. リレーションシップ

1. **auth.users ↔ profiles**: 1対1 (認証ユーザーとプロフィール情報)
2. **auth.users ↔ careers**: 1対多 (1人のユーザーが複数の経歴を持つ)
3. **auth.users ↔ works**: 1対多 (1人のユーザーが複数の作品を持つ)
4. **works ↔ tags**: 多対多 (work_tagsテーブルを介して)
5. **works ↔ work_analysis**: 1対1 (1つの作品に1つの分析結果)
6. **auth.users ↔ user_insights**: 1対1 (1人のユーザーに1つのインサイト)
7. **auth.users ↔ user_analyses**: 1対1 (1人のユーザーに1つの総合分析)
8. **auth.users ↔ tag_analytics**: 1対1 (1人のユーザーに1つのタグ分析)

## 6. インデックス設計

- **profiles**: id (主キー), full_name, industry
- **careers**: id (主キー), user_id (外部キー)
- **works**: id (主キー), user_id (外部キー), work_type (検索用)
- **tags**: id (主キー), name (UNIQUE制約)
- **work_tags**: (work_id, tag_id) (複合主キー)
- **work_analysis**: id (主キー), work_id (外部キー)
- **ai_analyses**: id (主キー), work_id (外部キー)
- **user_analyses**: id (主キー), user_id (外部キー)
- **user_insights**: id (主キー), user_id (外部キー)
- **tag_analytics**: id (主キー), user_id (外部キー)
- **tag_stats**: id (主キー), tag_id (外部キー)

## 7. セキュリティ設計

- Supabase RLS (Row Level Security) を使用して、ユーザーが自分のデータのみにアクセスできるように制限
- 公開設定が有効な作品のみ、他のユーザーからも閲覧可能
- API呼び出しはSupabase認証トークンを使用して保護
- ストレージポリシーにより、プロフィール画像や背景画像へのアクセスを制御

## 8. マイグレーション履歴

- **2025-03-22**: 初期テーブル構造作成
- **2025-03-23**: background_image_urlカラム追加
- **2025-03-24**: profiles テーブルと users テーブルの統合
- **2025-03-24**: avatarsとbackgroundsのストレージバケット追加
- **2025-03-24**: careersテーブル追加
- **2025-03-25**: worksテーブルにrolesカラム追加
- **2025-03-28**: user_insightsテーブルにoriginality, quality, overall_insight, engagementカラム追加