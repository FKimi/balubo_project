// 環境変数テスト用のNetlify Function
exports.handler = async function(event, context) {
  try {
    // 環境変数が正しく設定されているか確認
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ? 
      process.env.SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'undefined';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'undefined';
    const geminiApiKey = process.env.GEMINI_API_KEY ? 
      'Set (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'undefined';
    
    // 環境変数のリストを取得
    const allEnvVars = Object.keys(process.env).filter(key => 
      !key.includes('npm_') && 
      !key.includes('PATH') && 
      !key.includes('HOME')
    );
    
    // 詳細な環境情報
    const envDetails = {
      node_version: process.version,
      netlify_dev: process.env.NETLIFY_DEV || 'not set',
      context: process.env.CONTEXT || 'not set',
      deploy_url: process.env.DEPLOY_URL || 'not set',
      netlify_local: process.env.NETLIFY_LOCAL || 'not set'
    };
    
    // レスポンスを返す
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        message: "環境変数テスト",
        supabaseUrl,
        supabaseAnonKey,
        supabaseServiceKey,
        geminiApiKey,
        allEnvVars,
        envDetails
      })
    };
  } catch (error) {
    console.error('環境変数チェック中にエラーが発生しました:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: '環境変数チェック中にエラーが発生しました',
        details: error.message
      })
    };
  }
};
