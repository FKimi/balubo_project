import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseの設定を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase Admin Client初期化:', {
  urlExists: !!supabaseUrl,
  keyExists: !!supabaseServiceKey,
  url: supabaseUrl,
  // キーの一部のみを表示（セキュリティのため）
  keyPreview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : 'undefined'
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase admin environment variables');
}

/**
 * サービスロールを使用したSupabaseクライアント
 * 注意: このクライアントはサーバーサイドでのみ使用し、
 * クライアントサイドのコードには絶対に含めないでください。
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
