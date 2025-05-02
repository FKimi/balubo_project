import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseの設定を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'exists' : 'missing');
}

// Supabaseクライアントの作成 - 改善した認証設定
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // URLからセッション情報を検出
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('LocalStorage access error:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('LocalStorage write error:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('LocalStorage remove error:', error);
        }
      }
    }
  }
});

/**
 * 認証状態をリセットする関数
 * リフレッシュトークンエラーなどの認証問題が発生した場合に使用
 */
export const resetAuthState = async (): Promise<void> => {
  try {
    // ローカルストレージをクリア
    localStorage.removeItem('supabase.auth.token');
    
    // Supabase認証をクリア
    await supabase.auth.signOut();
    
    console.log('認証状態がリセットされました');
  } catch (error) {
    console.error('認証状態のリセット中にエラーが発生しました:', error);
  }
};

/**
 * オフライン状態かどうかを判定する関数
 * @returns オフライン状態の場合はtrue、そうでない場合はfalse
 */
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

/**
 * Supabaseのエラーを適切に処理し、ユーザーフレンドリーなメッセージを返す
 * @param error Supabaseから返されたエラーオブジェクト
 * @returns ユーザーフレンドリーなエラーメッセージ
 */
export const handleSupabaseError = (error: unknown): string => {
  console.error('Supabase error:', error);
  
  // オフラインチェック
  if (isOffline()) {
    return 'ネットワーク接続がありません。インターネット接続を確認してください。';
  }

  // 認証エラーの特別な処理
  if (error && typeof error === 'object' && '__isAuthError' in error && error.__isAuthError === true) {
    if ('code' in error && error.code === 'refresh_token_not_found') {
      // 自動的に認証状態をリセット
      resetAuthState().catch(e => console.error('リセット中のエラー:', e));
      return 'セッションの有効期限が切れました。再度ログインしてください。';
    }
  }

  // エラーオブジェクトの形式によって処理を分岐
  if (error && typeof error === 'object' && 'code' in error && error.code) {
    const errorCode = error.code as string;
    const errorMessage = 'message' in error ? (error.message as string) : '不明なエラー';
    
    switch (errorCode) {
      case 'PGRST116':
        return 'データが見つかりませんでした。';
      case '23505':
        return '一意制約違反: 同じデータが既に存在します。';
      case '23503':
        return '外部キー制約違反: 関連するデータが存在しません。';
      case '42P01':
        return 'テーブルが存在しません。システム管理者に連絡してください。';
      case 'P0001':
        return 'データベースエラー: ' + errorMessage;
      case 'PGRST301':
        return 'アクセス権限がありません。';
      default:
        return `データベースエラー (${errorCode}): ${errorMessage}`;
    }
  }
  
  // エラーメッセージがある場合はそれを返す
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message as string;
  }
  
  // エラーが文字列の場合
  if (typeof error === 'string') {
    return error;
  }
  
  // それ以外の場合は汎用メッセージ
  return '不明なエラーが発生しました。';
};

/**
 * Supabaseリクエストを安全に実行し、エラーハンドリングを行う関数
 * @param requestFn Supabaseリクエスト関数
 * @param fallbackValue エラー時のフォールバック値
 * @returns リクエスト結果またはフォールバック値
 */
export const safeSupabaseRequest = async <T>(
  requestFn: () => Promise<{ data: T | null; error: unknown }>,
  fallbackValue: T | null = null
): Promise<{ data: T | null; error: string | null }> => {
  try {
    // オフラインチェック
    if (isOffline()) {
      console.warn('オフラインモードです。ローカルデータを使用します。');
      return { data: fallbackValue, error: 'ネットワーク接続がありません。' };
    }
    
    const { data, error } = await requestFn();
    
    if (error) {
      const errorMessage = handleSupabaseError(error);
      console.error('Supabaseリクエストエラー:', errorMessage);
      return { data: fallbackValue, error: errorMessage };
    }
    
    return { data, error: null };
  } catch (error) {
    const errorMessage = handleSupabaseError(error);
    console.error('Supabaseリクエスト例外:', errorMessage);
    return { data: fallbackValue, error: errorMessage };
  }
};