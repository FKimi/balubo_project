const { createClient } = require('@supabase/supabase-js');

// 環境変数からSupabaseの設定を取得
// Netlify Functionsでは、VITE_プレフィックスなしで環境変数にアクセスする必要がある
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// 環境変数のデバッグログ（本番環境では削除すること）
console.log('Environment variables check:');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
console.log('SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);

// サービスロールを使用したSupabaseクライアント
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 通常のSupabaseクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * ユーザーインサイトをデータベースに保存する関数
 * @param {string} userId ユーザーID
 * @param {Object} insights ユーザーインサイト
 * @returns {Promise<Object>} 保存結果
 */
async function saveUserInsightsToDatabase(userId, insights) {
  try {
    console.log(`saveUserInsightsToDatabase関数が呼び出されました: userId=${userId}`);
    console.log('保存するインサイト:', JSON.stringify(insights, null, 2));
    
    // まず既存のレコードを確認
    console.log('既存のユーザーインサイトレコードを検索中...');
    const { data: existingRecord, error: selectError } = await supabase
      .from('user_insights')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (selectError) {
      console.error('Error checking existing user insights:', selectError);
      return { success: false, error: selectError.message };
    }
    
    let error;
    
    if (existingRecord) {
      // 既存レコードがある場合は更新（サービスロールを使用）
      console.log('既存のユーザーインサイトレコードを更新中...');
      const { error: updateError } = await supabaseAdmin
        .from('user_insights')
        .update({
          expertise: insights.expertise || {},
          uniqueness: insights.uniqueness || {},
          interests: insights.interests || {},
          talent: insights.talent || {},
          specialties: insights.specialties || [],
          design_styles: insights.design_styles || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
      
      error = updateError;
    } else {
      // 新規レコードを作成（サービスロールを使用）
      console.log('新規ユーザーインサイトレコードを作成中...');
      const { error: insertError } = await supabaseAdmin
        .from('user_insights')
        .insert({
          user_id: userId,
          expertise: insights.expertise || {},
          uniqueness: insights.uniqueness || {},
          interests: insights.interests || {},
          talent: insights.talent || {},
          specialties: insights.specialties || [],
          design_styles: insights.design_styles || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      error = insertError;
    }
    
    if (error) {
      console.error('Error saving user insights:', error);
      return { success: false, error: error.message };
    }
    
    console.log('ユーザーインサイトを正常に保存しました');
    return { success: true };
  } catch (error) {
    console.error('Error in saveUserInsightsToDatabase:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Netlify Function: ユーザーインサイト保存API
 */
exports.handler = async (event, context) => {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエスト（プリフライト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // POSTリクエスト以外は拒否
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // リクエストボディを解析
    const body = JSON.parse(event.body);
    const { userId, insights } = body;

    // バリデーション
    if (!userId || !insights) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ユーザーIDとインサイトデータは必須です' })
      };
    }

    // ユーザーインサイトを保存
    const result = await saveUserInsightsToDatabase(userId, insights);

    if (!result.success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: result.error })
      };
    }

    // 成功レスポンスを返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error in save-user-insights function:', error);

    // エラーレスポンスを返す
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || '不明なエラーが発生しました',
        details: error.toString()
      })
    };
  }
};
