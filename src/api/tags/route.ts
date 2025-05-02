import { createTag } from '../tags';

/**
 * タグ作成APIエンドポイント
 * クライアントサイドからのリクエストを処理し、RLSポリシーを回避してタグを作成する
 */
export async function POST(request: Request) {
  try {
    // リクエストボディからデータを取得
    const body = await request.json();
    const { name, category = 'user_generated' } = body;
    
    // バリデーション
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'タグ名は必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // タグを作成
    const tag = await createTag(name, category);
    
    // 成功レスポンスを返す
    return new Response(
      JSON.stringify(tag),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in tags API route:', error);
    
    // エラーレスポンスを返す
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '不明なエラーが発生しました' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
