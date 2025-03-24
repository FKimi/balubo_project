import { createTag } from '../../../api/tags';

/**
 * タグ作成APIエンドポイント
 * クライアントサイドからのリクエストを処理し、RLSポリシーを回避してタグを作成する
 */
export async function POST(request: Request) {
  try {
    console.log('タグ作成APIエンドポイントが呼び出されました');
    
    // リクエストボディからデータを取得
    const body = await request.json();
    const { name, category = 'user_generated' } = body;
    
    console.log(`タグ作成リクエスト: name=${name}, category=${category}`);
    
    // バリデーション
    if (!name) {
      console.error('タグ名が指定されていません');
      return new Response(
        JSON.stringify({ error: 'タグ名は必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // タグを作成
    try {
      const tag = await createTag(name, category);
      console.log('タグが正常に作成されました:', tag);
      
      // 成功レスポンスを返す
      return new Response(
        JSON.stringify(tag),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (createError) {
      console.error('タグ作成中にエラーが発生しました:', createError);
      
      return new Response(
        JSON.stringify({ 
          error: createError instanceof Error ? createError.message : '不明なエラーが発生しました',
          details: createError
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('タグ作成APIルートでエラーが発生しました:', error);
    
    // エラーレスポンスを返す
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
        details: error
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
