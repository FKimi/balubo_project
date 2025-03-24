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
 * タグを作成する関数
 * @param {string} name タグ名
 * @param {string} category タグカテゴリ（デフォルト: 'user_generated'）
 * @returns {Promise<Object>} 作成されたタグ
 */
async function createTag(name, category = 'user_generated') {
  try {
    console.log(`createTag関数が呼び出されました: name=${name}, category=${category}`);
    
    // 1. まず既存のタグを確認
    console.log('既存のタグを検索中...');
    const { data: existingTags, error: fetchError } = await supabase
      .from('tags')
      .select('id, name, category')
      .eq('name', name)
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching existing tag:', fetchError);
      throw new Error(`タグの検索中にエラーが発生しました: ${fetchError.message}`);
    }
    
    // 既存のタグが見つかった場合はそれを返す
    if (existingTags && existingTags.length > 0) {
      console.log('既存のタグが見つかりました:', existingTags[0]);
      return existingTags[0];
    }
    
    // 2. 類似タグを検索（完全一致がない場合）
    console.log('類似タグを検索中...');
    const { data: similarTags, error: similarError } = await supabase
      .from('tags')
      .select('id, name, category')
      .ilike('name', `%${name}%`)
      .limit(5);
    
    if (similarError) {
      console.error('Error fetching similar tags:', similarError);
      // エラーがあっても処理を続行（新しいタグを作成する）
    }
    
    // 類似タグが見つかった場合は最も類似度の高いものを返す
    // ここでは単純に最初のものを返す（将来的には類似度計算を実装可能）
    if (similarTags && similarTags.length > 0) {
      console.log(`類似タグを使用: "${similarTags[0].name}" (元のタグ: "${name}")`);
      return similarTags[0];
    }
    
    // 3. 新しいタグを作成（サービスロールを使用）
    console.log('新しいタグを作成中（サービスロール使用）...');
    const tagData = { 
      name, 
      category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('作成するタグデータ:', tagData);
    
    const { data: newTag, error: insertError } = await supabaseAdmin
      .from('tags')
      .insert([tagData])
      .select('id, name, category')
      .single();
    
    if (insertError) {
      console.error('Error creating tag with admin client:', insertError);
      throw new Error(`タグの作成中にエラーが発生しました: ${insertError.message}`);
    }
    
    if (!newTag) {
      console.error('タグ作成結果が空です');
      throw new Error('タグの作成に失敗しました: レスポンスが空です');
    }
    
    console.log('新しいタグが正常に作成されました:', newTag);
    return newTag;
  } catch (error) {
    console.error('Error in createTag function:', error);
    throw error;
  }
}

/**
 * Netlify Function: タグ作成API
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
    const { name, category = 'user_generated' } = body;

    // バリデーション
    if (!name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'タグ名は必須です' })
      };
    }

    // タグを作成
    const tag = await createTag(name, category);

    // 成功レスポンスを返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(tag)
    };
  } catch (error) {
    console.error('Error in create-tag function:', error);

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
