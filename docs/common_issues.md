# Baluboプロジェクト - よくある問題と解決策

## データベースとフロントエンドの連携問題

### 1. フィールド名の不一致

#### 問題
フロントエンドコンポーネントでデータベースのフィールド名と異なる名前でプロパティを参照すると、データが表示されない。

**例**: Mypageコンポーネントで作品のバナー画像を表示する際、データベースでは `thumbnail_url` というフィールド名だが、フロントエンドでは `image_url` として参照していた。

```tsx
// 誤った参照
{work.image_url ? (
  <img 
    src={work.image_url} 
    alt={work.title} 
    className="w-full h-full object-cover"
  />
) : (
  // フォールバック表示
)}

// 正しい参照
{work.thumbnail_url ? (
  <img 
    src={work.thumbnail_url} 
    alt={work.title} 
    className="w-full h-full object-cover"
  />
) : (
  // フォールバック表示
)}
```

#### 解決策
1. データベースのテーブル構造を確認し、正確なフィールド名を把握する
2. フロントエンドコンポーネントで参照する際は、データベースのフィールド名と一致させる
3. 型定義を活用して、コンパイル時にフィールド名の不一致を検出する

#### 予防策
- Supabaseの型生成機能を使用して、データベースのスキーマに基づいた型定義を自動生成する
- コンポーネントで使用する前に、取得したデータを一度コンソールに出力して構造を確認する
- データベースのスキーマ変更時は、フロントエンドの参照も同時に更新する

### 2. work_tagsテーブルのカラム名に関するエラー

タグ取得時に `tag`、`tag_name`、`name` のいずれも存在しないというエラーが発生する場合があります。これはテーブル構造とクエリの不一致によるものです。エラーハンドリングを強化し、タグ取得に失敗しても作品表示を継続できるようにすることが重要です。

## その他のよくある問題

### 1. ローディング状態が解除されない

#### 問題
非同期処理でエラーが発生した場合、ローディング状態が解除されずユーザーインターフェースがフリーズしたように見える。

#### 解決策
`try/catch/finally` パターンを使用し、`finally` ブロック内でローディング状態を必ず解除する：

```tsx
const fetchData = async () => {
  setIsLoading(true);
  try {
    // データ取得処理
  } catch (error) {
    console.error("Error:", error);
    // エラー処理
  } finally {
    setIsLoading(false); // 必ずローディング状態を解除
  }
};
```

### 2. RLSポリシー違反によるデータ取得エラー

#### 問題
Supabaseの行レベルセキュリティ(RLS)ポリシーが適切に設定されていないと、データ取得時にエラーが発生する。

#### 解決策
1. Supabaseダッシュボードで適切なRLSポリシーを設定する
2. フロントエンドでエラーハンドリングを強化し、ユーザーエクスペリエンスを損なわないようにする

### 3. AI分析結果の表示と保存

#### 問題
作品保存時にタグを収集してAI分析を行い、その結果をMypageで表示する際に、データの形式や保存方法に関する問題が発生することがあります。

**例**: user_insightsテーブルに保存されたJSONBデータの構造とフロントエンドでの表示形式が一致しない場合、データが正しく表示されない。

```tsx
// 誤った参照方法
<p>{displayAiResult.expertise}</p> // JSONBオブジェクトをそのまま表示しようとしてエラー

// 正しい参照方法
<p>
  {typeof displayAiResult.expertise === 'object' && displayAiResult.expertise?.summary 
    ? displayAiResult.expertise.summary 
    : typeof displayAiResult.expertise === 'string' 
      ? displayAiResult.expertise 
      : "専門分野における深い知識と経験が見られます。"}
</p>
```

#### 解決策
1. JSONBデータを扱う際は、型チェックを行ってから参照する
2. 配列データ（specialties, design_styles）にはインデックスを含むキーを使用する
3. データが存在しない場合のフォールバック表示を用意する

#### 実装のポイント
- WorkCreate.tsxでの保存時に、タグ情報を収集してAI分析を実行
- 分析結果をuser_insightsテーブルに保存（既存レコードがある場合は更新）
- Mypage.tsxでページロード時にuser_insightsテーブルから分析結果を取得
- 「AI分析を実行」ボタンをクリックした場合も同様の処理を行い、結果を更新

### 4. プロフィール画像アップロードの問題

#### 問題
プロフィール画像をアップロードする際に、以下のようなエラーが発生することがあります：

1. **バケットが見つからないエラー**:
```
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

2. **RLSポリシー違反エラー**:
```
{"statusCode":"403","error":"Unauthorized","message":"new row violates row-level security policy"}
```

3. **カラムが存在しないエラー**:
```
{"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'profile_image_url' column of 'profiles' in the schema cache"}
```

#### 解決策

1. **バケットの作成と確認**:
   - Supabase管理画面でストレージバケット（`avatars`）が存在することを確認
   - 存在しない場合は、以下のSQLで作成:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('avatars', 'avatars', true)
   ON CONFLICT (id) DO NOTHING;
   ```

2. **RLSポリシーの設定**:
   - 適切なRLSポリシーを設定して、認証されたユーザーがアップロードできるようにする:
   ```sql
   CREATE POLICY "authenticated users can upload avatars"
   ON storage.objects FOR INSERT 
   TO authenticated 
   WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
   
   CREATE POLICY "public can view avatars"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'avatars');
   ```

3. **データベーススキーマの更新**:
   - `profiles`テーブルに必要なカラムを追加:
   ```sql
   ALTER TABLE public.profiles 
     ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
   ```

4. **フロントエンドでのエラーハンドリング強化**:
   ```tsx
   if (uploadError) {
     console.error('画像アップロードエラー:', uploadError);
     
     if (uploadError.message && uploadError.message.includes('row-level security policy')) {
       throw new Error('セキュリティポリシーによりアップロードが拒否されました。正しいフォルダにアップロードしているか確認してください。');
     } else if (uploadError.message && uploadError.message.includes('Bucket not found')) {
       throw new Error('ストレージバケットが見つかりません。管理者に連絡してください。');
     } else {
       throw uploadError;
     }
   }
   ```

5. **ローカルストレージの更新**:
   - プロフィール保存成功時にローカルストレージを更新して、マイページに戻った際に最新情報が表示されるようにする:
   ```tsx
   try {
     const storedProfile = localStorage.getItem('userProfile');
     if (storedProfile) {
       const parsedProfile = JSON.parse(storedProfile);
       const updatedProfile = { ...parsedProfile, ...updateData };
       localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
     }
   } catch (storageError) {
     console.error('ローカルストレージ更新エラー:', storageError);
   }
   ```

#### 予防策
- コンポーネントの実装前にデータベーススキーマを確認する
- 画像アップロード処理には必ず適切なエラーハンドリングを実装する
- Supabaseのストレージバケットとそのポリシーを定期的に確認する
- データベーススキーマの変更時は、関連するコンポーネントも同時に更新する

### 5. work_tags_with_namesビューの活用

#### 問題
work_tagsテーブルからタグ名を取得する際に、複数のテーブル結合が必要となり、コードが複雑化する。

#### 解決策
work_tags_with_namesビューを使用して、work_id, tag_id, tag_nameを一度に取得する。

```tsx
// work_tags_with_namesビューを使用したタグ取得例
const { data: tagsData, error: tagsError } = await supabase
  .from('work_tags_with_names')
  .select('*')
  .eq('work_id', work.id);
  
if (tagsError) throw tagsError;

// タグ名を抽出
const tags = tagsData 
  ? tagsData.map(item => item.tag_name).filter(Boolean)
  : [];
```

このビューを活用することで、タグ名取得のエラーを減らし、コードの可読性と保守性を向上させることができます。

### 6. テーブル未作成によるエラー

#### 問題
データベースにテーブルが存在しない場合に、そのテーブルにアクセスしようとするとエラーが発生します。

**例**: Mypageコンポーネントで職歴情報を取得しようとした際に、careersテーブルが存在しないためエラーが発生する。

```
[ERROR] Error fetching careers: {"code":"42P01","details":null,"hint":null,"message":"relation \"public.careers\" does not exist"}
```

#### 解決策
1. 必要なテーブルをSupabaseで作成する
2. テーブルが存在しない場合のフォールバック処理を実装する

```tsx
// テーブルが存在しない場合のフォールバック処理の例
try {
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    // テーブルが存在しない場合（42P01エラー）はダミーデータを使用
    if (error.code === '42P01') {
      // ダミーデータを設定
      const dummyData = [
        // ダミーデータの内容
      ];
      setData(dummyData);
      return;
    }
    // その他のエラーの場合は通常のエラー処理
    throw error;
  }
  
  // 正常にデータが取得できた場合の処理
  setData(data);
} catch (error) {
  console.error('データ取得エラー:', error);
  // エラー処理
}
```

#### 予防策
1. 移行ファイルを作成してテーブル構造を定義する
2. 開発環境と本番環境の両方でテーブルが作成されていることを確認する
3. アプリケーション起動時に必要なテーブルの存在チェックを行い、存在しない場合は作成する処理を実装する

### 7. Supabaseストレージとプロフィール画像の問題

#### 問題
プロフィール画像のアップロードや表示に関する問題が発生することがあります。主な問題は以下の通りです：

1. **バケット作成エラー**: `{"name":"StorageApiError","message":"new row violates row-level security policy","status":400}`
2. **バケット確認エラー**: バケットが存在しないか、アクセス権限がない
3. **画像アップロードエラー**: `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`

#### 解決策

##### 1. RLSポリシーの設定
Supabaseストレージを使用するには、適切なRLSポリシーを設定する必要があります：

```sql
-- 認証されたユーザーがアップロードできるようにするポリシー
CREATE POLICY "authenticated can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'user-content');

-- 誰でも画像を閲覧できるようにするポリシー
CREATE POLICY "public can view" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'user-content');
```

##### 2. バケットの作成
バケットが存在しない場合は、SQLで作成します：

```sql
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('user-content', 'user-content', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}');
```

##### 3. プロフィール画像のアップロード実装
以下のようなコードパターンを使用して、画像をアップロードします：

```typescript
const uploadProfileImage = async (file, userId) => {
  try {
    // セッション確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('認証が必要です');
    }
    
    // ファイル名を一意にする
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // アップロード
    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    
    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    throw error;
  }
};
```

#### 代替アプローチ
ストレージの問題が解決できない場合は、以下の代替手段があります：

1. **Base64形式で保存**: 小さな画像の場合、Base64エンコードしてデータベースに直接保存
2. **外部ストレージサービスの利用**: CloudinaryやAWS S3などの外部サービスを使用
3. **Auth機能のavatarURLを使用**: Supabaseの認証システムのメタデータとして`avatar_url`を更新

```typescript
// avatarURLを更新する例
const updateAvatarUrl = async (avatarUrl) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl }
  });
  
  if (error) throw error;
  return data;
};
```

#### 予防策
- マイグレーションファイルにストレージバケットとRLSポリシーの設定を含める
- 画像アップロード前にセッション状態を確認する
- エラーハンドリングを強化し、ユーザーに適切なフィードバックを提供する

### 作品一覧のバナー表示問題

#### 問題の概要
Mypageコンポーネントの作品一覧セクションで、作品のバナー画像が正しく表示されない。

#### 原因
1. アスペクト比の設定が適切でない（`aspect-w-16 aspect-h-9`がTailwindで正しく機能していない）
2. 画像コンテナのスタイリングが不適切
3. 画像読み込みエラー時のフォールバック処理がない
4. 画像URLが正しく設定されていない、またはアクセスできない
5. **データベースのフィールド名とフロントエンドでの参照名の不一致**（最も重要な問題）
   - データベースでは`thumbnail_url`フィールドに画像URLが保存されている
   - フロントエンドでは`image_url`として参照していた

#### 解決策
1. アスペクト比を固定するために相対・絶対位置指定を使用
   ```jsx
   <div className="relative pb-[56.25%] bg-gray-100"> {/* 16:9のアスペクト比 */}
     <img 
       src={imageUrl} 
       className="absolute inset-0 w-full h-full object-cover" 
       alt={title} 
     />
   </div>
   ```

2. 画像読み込みエラー時のフォールバック処理を追加
   ```jsx
   <img
     src={work.thumbnail_url}
     alt={work.title}
     className="absolute inset-0 w-full h-full object-cover"
     onError={(e) => {
       e.currentTarget.onerror = null;
       e.currentTarget.src = 'https://via.placeholder.com/640x360?text=No+Image';
     }}
   />
   ```

3. **フィールド名の不一致を修正**
   ```typescript
   // 作品の型定義
   interface Work {
     id: string;
     title: string;
     description: string;
     url: string;
     thumbnail_url: string | null; // image_urlではなくthumbnail_url
     created_at: string;
     updated_at: string;
     user_id: string;
     tags: string[];
   }
   ```

4. Supabaseストレージの公開URL生成方法を改善
   ```typescript
   // Supabaseの設定を取得
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
   
   // Supabase Storage CDN URLを直接構築
   const storageUrl = `${supabaseUrl}/storage/v1/object/public/works/${cleanPath}`;
   ```

#### 学んだこと
1. Tailwindの`aspect-ratio`関連クラスは、追加のプラグインが必要な場合がある
2. 画像表示には常にフォールバックを用意することが重要
3. 相対・絶対位置指定を使ったレイアウトは、より確実にアスペクト比を維持できる
4. 画像URLのデバッグには、ブラウザの開発ツールが不可欠
5. **データベースのフィールド名とフロントエンドでの参照名の一致を確認することが重要**
6. Supabaseストレージの公開URLを生成する際は、正しいバケット名とパスを指定する必要がある

#### 実装時の注意点
1. 画像のプリロードやLazy Loadingを検討する
2. 画像読み込み中のスケルトンローダーを表示する
3. 画像サイズの最適化を行う
4. WebPなどの最新フォーマットのサポートを検討する
5. **データベースのスキーマとフロントエンドのインターフェースを定期的に同期する**
6. **開発初期段階でフィールド名の命名規則を統一する**（例：snake_caseまたはcamelCase）

### 8. コンポーネント間のフィールド名不一致問題

#### 問題
プロフィール編集（ProfileEdit）で変更した内容がマイページ（Mypage）に反映されない問題が発生しました。

#### 原因
1. コンポーネント間でのフィールド名の不一致：
   - ProfileEditコンポーネントでは `full_name` と `about` を使用
   - Mypageコンポーネントでは `name` と `bio` を参照
2. 同じデータを参照していても、異なるフィールド名を使用していたため、データの連携が正しく機能していなかった

```typescript
// ProfileEditコンポーネントの型定義
interface UserProfile {
  id: string;
  full_name: string;  // この名前で保存
  about: string;      // この名前で保存
  // ...
}

// Mypageコンポーネントの型定義（修正前）
interface UserProfile {
  id: string;
  name: string;       // full_nameと不一致
  bio: string;        // aboutと不一致
  // ...
}
```

#### 解決策
1. 型定義を統一し、同じフィールド名を使用する
2. データベースのフィールド名に合わせてフロントエンドの型定義を調整する
3. コンポーネント間でのデータ連携を強化するためのイベント機構を実装する

```typescript
// 修正後のMypageコンポーネントの型定義
interface UserProfile {
  id: string;
  full_name: string;  // データベースと一致
  about: string;      // データベースと一致
  // ...
}
```

#### 教訓
1. **型定義の一元管理**: プロジェクト全体で使用する型定義は共通のファイルで一元管理し、インポートして使用する
2. **データベースとの一貫性**: フロントエンドの型定義はデータベースのスキーマと一致させる
3. **命名規則の統一**: プロジェクト全体で一貫した命名規則を採用する（例：snake_caseまたはcamelCase）
4. **変更履歴の記録**: スキーマや型定義の変更は文書化し、チーム内で共有する

この問題は「バナー画像が表示されない問題」と同様のパターンであり、フィールド名の一貫性を保つことの重要性を再確認させるものでした。
