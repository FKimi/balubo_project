import { saveTagAnalyticsToDatabase } from '../../../api/tag-analytics';

/**
 * タグ分析結果保存APIエンドポイント
 * クライアントサイドからのリクエストを処理し、RLSポリシーを回避してタグ分析結果を保存する
 */
export async function POST(request: Request) {
  try {
    // リクエストボディからデータを取得
    const body = await request.json();
    const { userId, tagAnalysis } = body;
    
    // バリデーション
    if (!userId || !tagAnalysis) {
      return new Response(
        JSON.stringify({ error: 'ユーザーIDとタグ分析結果は必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // タグ分析結果を保存
    const result = await saveTagAnalyticsToDatabase(userId, tagAnalysis);
    
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
    console.error('Error in tag-analytics API route:', error);
    
    // エラーレスポンスを返す
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '不明なエラーが発生しました' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
