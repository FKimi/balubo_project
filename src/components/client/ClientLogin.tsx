import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ClientLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // 既にログインしているかチェック
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // セッションがある場合は常にダッシュボードへ遷移
        navigate('/client/dashboard');
        
        /* 本来のユーザータイプ確認コード（削除）
        // ユーザータイプを確認
        const { data: { user } } = await supabase.auth.getUser();
        const userType = user?.user_metadata?.user_type;
        
        if (userType === 'client') {
          // 企業ユーザーの場合はダッシュボードへ
          navigate('/client/dashboard');
        } else {
          // クリエイターの場合はクリエイターページへ
          navigate('/portfolio');
        }
        */
      }
    };
    
    checkSession();
  }, [navigate]);

  // ログイン処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // ログイン成功時は常にダッシュボードに遷移（ユーザータイプのチェックを一時的に無効化）
      navigate('/client/dashboard');
      
      /* 本来のユーザータイプ確認コード（現在は無効化）
      if (data.user?.user_metadata?.user_type === 'client') {
        // 企業アカウントとしてログイン成功
        navigate('/client/dashboard');
      } else {
        // クリエイターアカウントの場合はエラー表示
        setError('このログインフォームは企業アカウント用です。クリエイターの方は別のログインページをご利用ください。');
        // ログアウト処理
        await supabase.auth.signOut();
      }
      */
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'ログイン中にエラーが発生しました');
    } finally {
      setLoading(false);
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
          企業アカウントログイン
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は
          <button
            onClick={() => navigate('/client/register')}
            className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
          >
            新規登録
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* メールアドレス */}
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

            {/* パスワード */}
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

            {/* パスワードを忘れた方 */}
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/client/reset-password')}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  パスワードをお忘れですか？
                </button>
              </div>
            </div>

            {/* エラーメッセージ表示 */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* ログインボタン */}
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin; 