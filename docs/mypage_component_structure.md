# Mypageコンポーネント構造ドキュメント

## 概要
Mypageコンポーネントは、ユーザーのプロフィール、キャリア履歴、作品一覧、AI分析結果を表示する中核的なコンポーネントです。このドキュメントは、コンポーネントの構造と重要な実装詳細を記録し、将来の開発や保守の際の参考にするためのものです。

## データモデル

### ユーザープロフィール
```typescript
interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  website_url: string;
  twitter_username: string;
  instagram_username: string;
  facebook_username: string;
  bio: string;
  created_at: string;
}
```

### 職歴
```typescript
interface Career {
  id: string;
  user_id: string;
  company: string;
  position: string;
  department: string;
  start_date: string;
  end_date: string | null;
  is_current_position: boolean;
  created_at: string;
}
```

### 作品
```typescript
interface Work {
  id: string;
  user_id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  created_at: string;
  work_tags: WorkTag[];
}

interface WorkTag {
  tag_id: string;
  tags: {
    name: string;
  };
}
```

### AI分析結果
```typescript
interface AIAnalysisResult {
  expertise: string;
  contentStyle: string;
  talent: string;
  specialties: string[];
  designStyles: string[];
  interests: string[];
}
```

## 主要な状態変数

| 変数名 | 型 | 説明 |
|--------|-----|------|
| loading | boolean | データ読み込み中の状態 |
| userProfile | UserProfile \| null | ユーザープロフィール情報 |
| works | Work[] | ユーザーの作品一覧 |
| careers | Career[] | ユーザーの職歴一覧 |
| aiAnalysisResult | AIAnalysisResult \| null | AI分析結果 |
| showCareerDialog | boolean | キャリア編集ダイアログの表示状態 |
| editingCareer | Career \| null | 編集中の職歴 |
| companyName | string | 会社名入力フィールド |
| position | string | 役職入力フィールド |
| department | string | 部署入力フィールド |
| startDate | string | 開始日入力フィールド |
| endDate | string | 終了日入力フィールド |
| isCurrentJob | boolean | 現職フラグ |
| analysisLoading | boolean | AI分析実行中の状態 |

## 主要な関数

### データ取得関数
- `fetchUserData()`: ユーザーデータ、作品、職歴、AI分析結果を取得
- `fetchCareers()`: ユーザーの職歴を取得
- `runAIAnalysis()`: AI分析を実行し、結果を保存

### キャリア管理関数
- `openCareerEditDialog(career?: Career)`: キャリア編集ダイアログを開く
- `saveCareer()`: キャリア情報を保存
- `handleCompanyNameChange(e)`: 会社名変更ハンドラ
- `handlePositionChange(e)`: 役職変更ハンドラ
- `handleDepartmentChange(e)`: 部署変更ハンドラ
- `handleStartDateChange(e)`: 開始日変更ハンドラ
- `handleEndDateChange(e)`: 終了日変更ハンドラ
- `handleIsCurrentJobChange(e)`: 現職フラグ変更ハンドラ

## コンポーネント構造

```
Mypage
├── ローディング表示
├── ユーザープロフィールセクション
│   ├── プロフィール情報
│   ├── SNSリンク
│   └── プロフィール編集ボタン
├── AI分析セクション
│   ├── 専門性
│   ├── コンテンツスタイル
│   ├── 才能
│   ├── 専門分野
│   ├── デザインスタイル
│   ├── 興味関心
│   └── 分析実行ボタン
├── 作品セクション
│   ├── 作品一覧
│   └── 新規作品追加ボタン
├── キャリアセクション
│   ├── キャリア一覧
│   └── 新規キャリア追加ボタン
└── キャリア編集ダイアログ
    ├── 会社名入力
    ├── 役職入力
    ├── 部署入力
    ├── 開始日入力
    ├── 現職チェックボックス
    ├── 終了日入力
    ├── 保存ボタン
    └── キャンセルボタン
```

## データベース連携

### テーブル構造
- `profiles`: ユーザープロフィール情報
- `works`: ユーザーの作品情報
- `work_tags`: 作品とタグの関連付け
- `tags`: タグ情報
- `careers`: ユーザーの職歴情報
- `user_insights`: AI分析結果

### 重要な注意点
1. **カラム名の命名規則**: データベースではスネークケース（`start_date`）、TypeScriptではキャメルケース（`startDate`）を使用していましたが、統一のためにTypeScriptもスネークケースに合わせています。

2. **認証チェック**: 本番環境では必ず認証チェックを有効にし、開発環境用のモックユーザーIDを削除してください。

3. **エラーハンドリング**: データベースクエリのエラーは適切にキャッチし、ユーザーに通知する必要があります。

## 今後の改善点
1. **型安全性の向上**: any型を使用している箇所を具体的な型に置き換える
2. **エラーハンドリングの強化**: ユーザーにわかりやすいエラーメッセージを表示
3. **パフォーマンスの最適化**: 不要な再レンダリングを防ぐ
4. **UIの改善**: ユーザーエクスペリエンスの向上
5. **テストの追加**: 単体テストと統合テストの実装

## 関連コンポーネント
- `SignUpForm`: ユーザー登録フォーム
- `LoginForm`: ログインフォーム
- `AddWork`: 作品追加・編集フォーム
- `WorkDetail`: 作品詳細表示
- `Profile`: 公開プロフィール表示
- `ProfileEdit`: プロフィール編集フォーム

## 更新履歴
- 2025-03-24: 初版作成。データベースカラム名の不一致を修正し、開発環境用の認証バイパスを実装。
