import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { createUserProfile } from '../../lib/auth-utils';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SignUpForm() {
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // セッションが有効になるまで待機（最大5回、1.5秒程度）
      let user = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
        if (user) break;
        await new Promise(res => setTimeout(res, 300));
      }
      if (!user) {
        setError('セッションの取得に失敗しました。再度ログインしてください。');
        return;
      }

      // プロフィール初期データを作成
      const profile = await createUserProfile({
        id: user.id,
        full_name: user.user_metadata?.name || 'ユーザー',
        email: user.email,
        profile_image_url: user.user_metadata?.avatar_url || null,
        subscription_tier: 0,
      });
      if (!profile) {
        setError('プロフィールの作成に失敗しました。');
        return;
      }

      navigate('/portfolio');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      // 現在の環境に基づいてリダイレクトURIを設定
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // Supabaseの認証URLを直接使用
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const redirectUri = isLocalhost 
        ? `${window.location.origin}/auth/callback`
        : `${supabaseUrl}/auth/callback`;
      
      console.log('Using redirect URI:', redirectUri);
      console.log('Current origin:', window.location.origin);
      console.log('Current hostname:', window.location.hostname);
      console.log('Supabase URL:', supabaseUrl);
      
      // リダイレクト先をlocalStorageに保存
      localStorage.setItem('redirect_after_login', '/portfolio');
      console.log('📍 ログイン後のリダイレクト先を設定:', '/portfolio');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      
      console.log('OAuth response:', data);
      
      if (error) throw error;
      
      // Google認証はリダイレクトするため、ここではnavigateは不要
    } catch (err) {
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
          アカウント登録
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          すでにアカウントをお持ちの方は
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
          >
            ログイン
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
              <span>{googleLoading ? 'Googleで認証中...' : 'Googleで登録する'}</span>
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
                  autoComplete="new-password"
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
                {loading ? '登録中...' : '登録する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}