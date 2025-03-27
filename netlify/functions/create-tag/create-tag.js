// Netlify Function: create-tag
// タグを作成するNetlify Function
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  try {
    // 環境変数からSupabase設定を取得
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('環境変数の詳細情報:');
    console.log('SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み (最初の10文字: ' + supabaseServiceKey.substring(0, 10) + '...)' : '未設定');
    
    // 環境変数が設定されているか確認
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase環境変数が設定されていません');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Supabase環境変数が設定されていません',
          details: {
            supabaseUrl: supabaseUrl ? '設定済み' : '未設定',
            supabaseServiceKey: supabaseServiceKey ? '設定済み' : '未設定'
          }
        })
      };
    }
    
    // Supabaseクライアントの初期化（サービスロールキーを使用）
    console.log('Supabaseクライアントを初期化します (サービスロールキー使用)...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // テスト接続
    console.log('Supabase接続テスト実行中...');
    const { data: testData, error: testError } = await supabase
      .from('tags')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Supabase接続テストに失敗:', testError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: `Supabase接続テストに失敗: ${testError.message}`,
          details: testError
        })
      };
    }
    
    console.log('Supabase接続テスト成功:', testData);

    // リクエストボディの解析
    const { body } = event;
    let tagData;
    
    try {
      tagData = JSON.parse(body);
      console.log('リクエストデータ:', tagData);
    } catch (error) {
      console.error('リクエストボディの解析に失敗:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'リクエストボディの解析に失敗しました' })
      };
    }

    // タグ名とカテゴリの取得
    const { name, category = 'user_generated' } = tagData;
    
    if (!name) {
      console.error('タグ名が指定されていません');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'タグ名は必須です' })
      };
    }

    // 既存のタグを検索
    console.log(`タグを検索: name=${name}`);
    const { data: existingTags, error: fetchError } = await supabase
      .from('tags')
      .select('id, name, category')
      .eq('name', name)
      .limit(1);
    
    if (fetchError) {
      console.error('タグの検索中にエラーが発生しました:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: `タグの検索中にエラーが発生しました: ${fetchError.message}`,
          details: fetchError
        })
      };
    }
    
    // 既存のタグが見つかった場合はそれを返す
    if (existingTags && existingTags.length > 0) {
      console.log('既存のタグが見つかりました:', existingTags[0]);
      return {
        statusCode: 200,
        body: JSON.stringify(existingTags[0])
      };
    }
    
    // 新しいタグを作成
    console.log(`新しいタグを作成: name=${name}, category=${category}`);
    const newTagData = { 
      name, 
      category,
      created_at: new Date().toISOString()
    };
    
    const { data: newTag, error: insertError } = await supabase
      .from('tags')
      .insert([newTagData])
      .select('id, name, category')
      .single();
    
    if (insertError) {
      console.error('タグの作成中にエラーが発生しました:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: `タグの作成中にエラーが発生しました: ${insertError.message}`,
          details: insertError
        })
      };
    }
    
    if (!newTag) {
      console.error('タグ作成結果が空です');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'タグの作成に失敗しました: レスポンスが空です' })
      };
    }
    
    console.log('新しいタグが正常に作成されました:', newTag);
    return {
      statusCode: 200,
      body: JSON.stringify(newTag)
    };
  } catch (error) {
    console.error('予期せぬエラーが発生しました:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: `予期せぬエラーが発生しました: ${error.message || '不明なエラー'}`,
        details: error.toString()
      })
    };
  }
};
