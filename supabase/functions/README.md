# Supabase Edge Functions

## プロキシ機能について

このプロジェクトでは、CORSの制限を回避するためにSupabase Edge Functionを使用して画像プロキシを実装しています。

### proxy-image

`proxy-image` Edge Functionは、フロントエンドから直接アクセスできない外部画像リソースを取得するためのプロキシとして機能します。

#### 使用方法

```typescript
// フロントエンドでの使用例
import { fetchImageViaProxy } from './lib/utils/image-proxy';

async function getImage(url: string) {
  try {
    const { blob, contentType } = await fetchImageViaProxy(url);
    // blobを使って処理を行う
  } catch (error) {
    console.error('画像取得エラー:', error);
  }
}
```

#### デプロイ方法

1. Supabase CLIをインストール
```bash
npm install -g supabase
```

2. ログイン
```bash
supabase login
```

3. Edge Functionをデプロイ
```bash
supabase functions deploy proxy-image --project-ref <YOUR_PROJECT_REF>
```

#### 環境変数の設定

Netlifyの環境変数に以下を設定してください：

```
VITE_SUPABASE_FUNCTION_URL=https://<YOUR_PROJECT_REF>.supabase.co/functions/v1
```

## トラブルシューティング

### CORSエラー

Edge Functionがデプロイされていても、CORSエラーが発生する場合は以下を確認してください：

1. Supabase Projectの設定でCORSが正しく設定されているか
2. フロントエンドが正しいURLでEdge Functionにアクセスしているか
3. 環境変数`VITE_SUPABASE_FUNCTION_URL`が正しく設定されているか

### 画像取得エラー

画像取得に失敗する場合は、以下を確認してください：

1. 元の画像URLが有効であるか
2. Edge Functionが正常に動作しているか（ログを確認）
3. ネットワーク接続に問題がないか
