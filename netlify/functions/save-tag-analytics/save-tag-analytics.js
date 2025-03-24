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
 * タグ分析結果をデータベースに保存する関数
 * @param {string} userId ユーザーID
 * @param {Object} tagAnalysis タグ分析結果
 * @returns {Promise<Object>} 保存結果
 */
async function saveTagAnalyticsToDatabase(userId, tagAnalysis) {
  try {
    console.log(`saveTagAnalyticsToDatabase関数が呼び出されました: userId=${userId}`);
    
    // タグトレンド（タグの出現頻度）
    const tagTrends = {
      tags: tagAnalysis.tags.map(tag => ({
        name: tag.name,
        relevance: tag.relevance
      }))
    };
    
    // タグクラスター
    const tagClusters = {
      clusters: tagAnalysis.clusters
    };
    
    // タイムライン（空のオブジェクト、後で別の関数で更新）
    const tagTimeline = {};
    
    // まず既存のレコードを確認
    console.log('既存のタグ分析レコードを検索中...');
    const { data: existingRecord, error: selectError } = await supabase
      .from('tag_analytics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (selectError) {
      console.error('Error checking existing tag analytics:', selectError);
      return { success: false, error: selectError.message };
    }
    
    let error;
    
    if (existingRecord) {
      // 既存レコードがある場合は更新（サービスロールを使用）
      console.log('既存のタグ分析レコードを更新中...');
      const { error: updateError } = await supabaseAdmin
        .from('tag_analytics')
        .update({
          tag_trends: tagTrends,
          tag_clusters: tagClusters,
          tag_timeline: tagTimeline,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
      
      error = updateError;
    } else {
      // 新規レコードを作成（サービスロールを使用）
      console.log('新規タグ分析レコードを作成中...');
      const { error: insertError } = await supabaseAdmin
        .from('tag_analytics')
        .insert({
          user_id: userId,
          tag_trends: tagTrends,
          tag_clusters: tagClusters,
          tag_timeline: tagTimeline,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      error = insertError;
    }
    
    if (error) {
      console.error('Error saving tag analytics:', error);
      return { success: false, error: error.message };
    }
    
    console.log('タグ分析結果を正常に保存しました');
    return { success: true };
  } catch (error) {
    console.error('Error in saveTagAnalyticsToDatabase:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Netlify Function: タグ分析結果保存API
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
    const { userId, tagAnalysis } = body;

    // バリデーション
    if (!userId || !tagAnalysis) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ユーザーIDとタグ分析結果は必須です' })
      };
    }

    // タグ分析結果を保存
    const result = await saveTagAnalyticsToDatabase(userId, tagAnalysis);

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
    console.error('Error in save-tag-analytics function:', error);

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
