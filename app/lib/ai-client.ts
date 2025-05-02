import OpenAI from 'openai';

// AIクライアント設定
// OpenAIクライアントの初期化
export const aiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // MCPサーバー接続設定を追加（必要な場合は適切な設定を追加）
  // mcpConfig変数が未定義のため、この行を削除または適切に定義する必要があります
}); // OpenAIクライアントの設定オブジェクトを閉じる