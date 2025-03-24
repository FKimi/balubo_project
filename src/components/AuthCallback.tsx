import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからハッシュフラグメントを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // セッションを設定
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) throw error;

          // ユーザー情報を取得
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) throw userError;
          
          if (user) {
            // プロフィールレコードが存在するか確認
            try {
              const { error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

              // プロフィールが存在しない場合は作成
              if (profileError && profileError.code === 'PGRST116') {
                // デフォルト値を設定
                const defaultUsername = user.email ? user.email.split('@')[0] : `user_${Date.now()}`;
                const defaultDisplayName = user.user_metadata?.full_name || defaultUsername;
                
                try {
                  await supabase.from('profiles').insert({
                    id: user.id,
                    username: defaultUsername,
                    display_name: defaultDisplayName,
                    email: user.email,
                    avatar_url: user.user_metadata?.avatar_url || null,
                    bio: '',
                    website: '',
                    location: '',
                    skills: []
                  });
                } catch (insertError) {
                  console.error('プロフィール作成エラー:', insertError);
                  // RLSポリシー違反の場合はクライアント側で対応
                }
              }
            } catch (err) {
              console.error('プロフィール確認エラー:', err);
              // エラーがあっても認証自体は成功しているので続行
            }

            // ダッシュボードにリダイレクト
            navigate('/mypage');
          } else {
            setError('ユーザー情報の取得に失敗しました');
          }
        } else {
          setError('認証情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('認証コールバックエラー:', err);
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">認証処理中...</p>
        </div>
      ) : error ? (
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            ログインページに戻る
          </button>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-green-600 mb-4">認証成功</h2>
          <p className="text-gray-700 mb-6">リダイレクト中...</p>
        </div>
      )}
    </div>
  );
}
