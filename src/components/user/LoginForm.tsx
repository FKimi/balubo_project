import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Login successful
      navigate('/portfolio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      // デバッグ情報をクリア
      localStorage.removeItem('auth_debug_info');
      
      // デバッグトレースを開始
      const debugInfo = {
        startTime: new Date().toISOString(),
        steps: ['ログイン開始']
      };
      localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
      
      // ログイン後のリダイレクト先をlocalStorageに保存（Supabaseのストレージキーにも注意）
      const redirectPath = '/portfolio';
      localStorage.setItem('redirect_after_login', redirectPath);
      localStorage.setItem('supabase.auth.callbackUrl', redirectPath);
      
      // デバッグ情報を更新
      debugInfo.steps.push(`リダイレクト先設定: ${redirectPath}`);
      localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
      
      // コールバックURLを設定（絶対パスで指定）
      const callbackUrl = `${window.location.origin}/auth/callback`;
      debugInfo.steps.push(`コールバックURL設定: ${callbackUrl}`);
      localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
      
      // セッションをクリアしてから新しいログインを開始
      await supabase.auth.signOut();
      debugInfo.steps.push('既存セッションをクリア');
      localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
      
      // Google OAuth認証を実行
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false // ブラウザリダイレクトを確実に実行する
        },
      });
      
      // デバッグ情報を更新
      if (data?.url) {
        debugInfo.steps.push(`OAuth成功: ${data.url.substring(0, 50)}...`);
      } else {
        debugInfo.steps.push('OAuth結果URLなし');
      }
      localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
      
      if (error) {
        debugInfo.steps.push(`OAuth失敗: ${error.message}`);
        localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
        throw error;
      }
      
      if (data?.url) {
        debugInfo.steps.push('リダイレクト開始');
        localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
        
        // 直接URLにリダイレクト
        window.location.href = data.url;
      } else {
        debugInfo.steps.push('リダイレクトURL取得失敗');
        localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
        throw new Error('認証URLが取得できませんでした');
      }
    } catch (err) {
      // エラー情報も保存
      try {
        const debugInfo = JSON.parse(localStorage.getItem('auth_debug_info') || '{"steps":[]}');
        debugInfo.steps.push(`エラー発生: ${err instanceof Error ? err.message : String(err)}`);
        debugInfo.error = err instanceof Error ? err.message : String(err);
        localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
      } catch (e) {
        console.error('デバッグ情報保存エラー:', e);
      }
      
      localStorage.removeItem('redirect_after_login');
      setError(err instanceof Error ? err.message : 'Googleログイン中にエラーが発生しました');
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
          {/* Googleログインボタン */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
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
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}