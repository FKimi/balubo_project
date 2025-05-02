import { saveUserInsights } from '../user-insights';

/**
 * ユーザーインサイト保存APIエンドポイント
 * クライアントサイドからのリクエストを処理し、RLSポリシーを回避してユーザーインサイトを保存する
 */
export async function POST(request: Request) {
  try {
    // リクエストボディからデータを取得
    const body = await request.json();
    const { userId, insights } = body;
    
    // バリデーション
    if (!userId || !insights) {
      return new Response(
        JSON.stringify({ error: 'ユーザーIDとインサイトデータは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // ユーザーインサイトを保存
    const result = await saveUserInsights(userId, insights);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 成功レスポンスを返す
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in user-insights API route:', error);
    
    // エラーレスポンスを返す
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '不明なエラーが発生しました' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
