/**
 * デバッグ情報をファイルに記録するためのユーティリティ
 */

// 重要な環境変数の情報をログに記録
export function logEnvironmentInfo() {
  const envInfo = {
    VITE_SUPABASE_URL: typeof import.meta !== 'undefined' ? import.meta.env.VITE_SUPABASE_URL || '未設定' : '未検出',
    VITE_SUPABASE_ANON_KEY: typeof import.meta !== 'undefined' ? (import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定あり' : '未設定') : '未検出',
    VITE_SUPABASE_SERVICE_ROLE_KEY: typeof import.meta !== 'undefined' ? (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '設定あり' : '未設定') : '未検出',
    VITE_GEMINI_API_KEY: typeof import.meta !== 'undefined' ? (import.meta.env.VITE_GEMINI_API_KEY ? '設定あり' : '未設定') : '未検出',
    NODE_ENV: typeof process !== 'undefined' ? process.env.NODE_ENV || '未設定' : '未検出',
    環境: typeof window !== 'undefined' ? 'ブラウザ' : 'Node.js',
    ブラウザ情報: typeof navigator !== 'undefined' ? navigator.userAgent : '未検出',
  };

  console.log('[環境変数情報]', JSON.stringify(envInfo, null, 2));
  return envInfo;
}

/**
 * デバッグログを出力する関数
 * @param label ログのラベル
 * @param value 値
 * @param details 詳細情報（オプション）
 */
export function debugLog(label: string, value: string, details?: string) {
  const isDebugMode = typeof localStorage !== 'undefined' && localStorage.getItem('debugMode') === 'true';
  
  // デバッグモードの場合のみログを出力
  if (isDebugMode || process.env.NODE_ENV === 'development') {
    if (details) {
      console.log(`[DEBUG] ${label}: ${value} (${details})`);
    } else {
      console.log(`[DEBUG] ${label}: ${value}`);
    }
  }
}

// Supabase接続情報の詳細をログに記録
export function logSupabaseDetails() {
  try {
    // Supabase URL情報
    const supabaseUrlInfo = {
      VITE_SUPABASE_URL: typeof import.meta !== 'undefined' ? import.meta.env.VITE_SUPABASE_URL : undefined,
      SUPABASE_URL: typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined,
      URLの長さ: typeof import.meta !== 'undefined' ? (import.meta.env.VITE_SUPABASE_URL?.length || 0) : 0,
      URLが有効: typeof import.meta !== 'undefined' ? !!import.meta.env.VITE_SUPABASE_URL : false,
    };

    console.log('[Supabase URL情報]', JSON.stringify(supabaseUrlInfo, null, 2));

    // Supabase ANON KEY情報
    const supabaseKeyInfo = {
      VITE_ANON_KEY有効: typeof import.meta !== 'undefined' ? !!import.meta.env.VITE_SUPABASE_ANON_KEY : false,
      VITE_SERVICE_KEY有効: typeof import.meta !== 'undefined' ? !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY : false,
      ANON_KEY有効: typeof process !== 'undefined' ? !!process.env.SUPABASE_ANON_KEY : false,
      SERVICE_KEY有効: typeof process !== 'undefined' ? !!process.env.SUPABASE_SERVICE_ROLE_KEY : false,
      VITE_ANON_KEY長さ: typeof import.meta !== 'undefined' ? (import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0) : 0,
      VITE_SERVICE_KEY長さ: typeof import.meta !== 'undefined' ? (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.length || 0) : 0,
    };

    console.log('[Supabase KEY情報]', JSON.stringify(supabaseKeyInfo, null, 2));
    
    return { supabaseUrlInfo, supabaseKeyInfo };
  } catch (error) {
    console.error('[Supabase詳細情報取得エラー]', error);
    return { error: String(error) };
  }
}

// API通信のエラーをよりわかりやすく記録
export function logApiError(apiName: string, error: unknown) {
  let errorInfo = {};
  
  if (error && typeof error === 'object') {
    if ('message' in error) {
      errorInfo = { 
        ...errorInfo, 
        message: error.message
      };
    }
    
    if ('code' in error) {
      errorInfo = { 
        ...errorInfo, 
        code: error.code
      };
    }
    
    if ('details' in error) {
      errorInfo = { 
        ...errorInfo, 
        details: error.details
      };
    }
  }
  
  console.error(`[API エラー: ${apiName}]`, JSON.stringify({
    timestamp: new Date().toISOString(),
    api: apiName,
    error: typeof error === 'string' ? error : errorInfo,
    errorObj: error,
  }, null, 2));
}
