import React, { useState, useEffect } from 'react';
import { supabase, resetAuthState } from '../../lib/supabase';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authReset, setAuthReset] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // URLパラメータからエラー情報を取得
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      setError(`${errorParam}: ${errorDescription || '認証エラーが発生しました'}`);
    }

    // セッション期限切れまたはリフレッシュトークンエラーがURLに含まれている場合、
    // または前回のセッションで問題があった場合は認証状態をリセット
    const needsReset = params.get('reset') === 'true' || 
                        errorParam === 'session_expired' ||
                        localStorage.getItem('auth_error') === 'true';
    
    if (needsReset) {
      handleAuthReset();
    }
  }, [location]);

  // 認証状態のリセットを行う関数
  const handleAuthReset = async () => {
    try {
      setAuthReset(true);
      await resetAuthState();
      localStorage.removeItem('auth_error');
      setAuthReset(false);
    } catch (err) {
      console.error('認証リセットエラー:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ログイン前に現在の認証状態をリセット（オプション）
      if (authReset) {
        await resetAuthState();
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // エラーフラグをクリア
      localStorage.removeItem('auth_error');
      
      // Login successful
      navigate('/mypage');
    } catch (err) {
      // 認証エラーの場合、フラグを設定
      if (err && typeof err === 'object' && '__isAuthError' in err) {
        localStorage.setItem('auth_error', 'true');
      }
      
      let errorMessage = 'ログイン中にエラーが発生しました';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // 特定のエラーメッセージをより分かりやすく変換
        if (err.message.includes('Invalid login')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません';
        } else if (err.message.includes('refresh_token_not_found')) {
          errorMessage = 'セッションの有効期限が切れました。再度ログインしてください。';
          // リフレッシュトークンエラーの場合は認証状態をリセット
          await handleAuthReset();
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      // Google認証前に現在の認証状態をリセット（オプション）
      if (authReset) {
        await resetAuthState();
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // Google認証はリダイレクトするため、ここではnavigateは不要
    } catch (err) {
      let errorMessage = 'Googleログイン中にエラーが発生しました';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          トップに戻る
        </button>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          ログイン
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は
          <button
            onClick={() => navigate('/signup')}
            className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
          >
            新規登録
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {authReset && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700">認証状態をリセットしています...</p>
                <p className="text-xs text-blue-600 mt-1">前回のセッションで問題が発生したため、安全のためにログイン状態がリセットされました。</p>
              </div>
            </div>
          )}
          
          {/* Googleログインボタン */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || authReset}
              className="flex w-full justify-center items-center gap-3 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Googleで認証中...' : 'Googleでログイン'}</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">または</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || authReset}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'ログイン中...' : authReset ? '準備中...' : 'ログイン'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}