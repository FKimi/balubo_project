import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // デバッグ情報の追加関数
  const addDebugStep = (step: string) => {
    try {
      const debugInfo = JSON.parse(localStorage.getItem('auth_debug_info') || '{"steps":[]}');
      debugInfo.steps.push(`[Callback] ${step}`);
      localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
    } catch (e) {
      console.error('デバッグ情報保存エラー:', e);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        addDebugStep('コールバック開始');
        
        // URLからハッシュフラグメントを取得
        const hashFragment = window.location.hash;
        addDebugStep(`URLハッシュ: ${hashFragment ? '存在します' : 'ありません'}`);
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        addDebugStep(`アクセストークン: ${accessToken ? '存在' : 'なし'}`);
        addDebugStep(`リフレッシュトークン: ${refreshToken ? '存在' : 'なし'}`);
        
        // リダイレクト先の取得 (優先順位: 1.localStorage、2.URLパラメータ、3.デフォルト値)
        const savedRedirect = localStorage.getItem('redirect_after_login');
        addDebugStep(`localStorage内リダイレクト先: ${savedRedirect || 'なし'}`);
        
        const searchParams = new URLSearchParams(location.search);
        const urlRedirect = searchParams.get('redirectFrom');
        addDebugStep(`URL内リダイレクト先: ${urlRedirect || 'なし'}`);
        
        const redirectTo = savedRedirect || urlRedirect || '/mypage';
        addDebugStep(`最終リダイレクト先: ${redirectTo}`);

        // トークンがない場合は、Supabaseのセッションを確認
        if (!accessToken || !refreshToken) {
          addDebugStep('トークンが不足しているため、セッションを確認');
          
          // 重要：セッションの再設定を試みる
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            addDebugStep(`セッション取得エラー: ${sessionError.message}`);
            throw sessionError;
          }
          
          if (data.session) {
            addDebugStep(`既存セッション発見: ID=${data.session.user.id}`);
            
            // セッションが存在する場合はリダイレクト
            localStorage.removeItem('redirect_after_login');
            addDebugStep(`リダイレクト実行: ${redirectTo}`);
            
            // ここで直接window.locationを使用
            window.location.href = redirectTo;
            return;
          } else {
            addDebugStep('セッションなし、認証失敗');
            throw new Error('認証情報の取得に失敗しました');
          }
        }

        // 以下、トークン処理コード
        addDebugStep('トークンが存在、セッション設定開始');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          addDebugStep(`セッション設定エラー: ${error.message}`);
          throw error;
        }

        addDebugStep('セッション設定成功、ユーザー情報取得開始');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          addDebugStep(`ユーザー情報取得エラー: ${userError.message}`);
          throw userError;
        }
        
        if (user) {
          addDebugStep(`ユーザー情報取得成功: ID=${user.id}`);
          
          // プロフィール処理（省略可能な部分なので、エラーがあっても続行）
          try {
            addDebugStep('プロフィール確認開始');
            // プロフィールレコードが存在するか確認
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
                addDebugStep('プロフィール作成成功');
              } catch (insertError) {
                addDebugStep('プロフィール作成エラー:');
                addDebugStep(insertError instanceof Error ? insertError.message : 'unknown');
                // RLSポリシー違反の場合はクライアント側で対応
              }
            }
            addDebugStep('プロフィール処理完了');
          } catch (err) {
            addDebugStep(`プロフィール処理エラー: ${err instanceof Error ? err.message : 'unknown'}`);
            // エラーがあっても認証自体は成功しているので続行
          }
          
          // 最終リダイレクト処理
          addDebugStep('最終リダイレクト準備');
          localStorage.removeItem('redirect_after_login');
          addDebugStep(`リダイレクト実行: ${redirectTo}`);
          
          // 直接リダイレクト
          window.location.href = redirectTo;
        } else {
          addDebugStep('ユーザー情報なし、認証失敗');
          setError('ユーザー情報の取得に失敗しました');
        }
      } catch (err) {
        addDebugStep(`致命的エラー: ${err instanceof Error ? err.message : 'unknown'}`);
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました');
        localStorage.removeItem('redirect_after_login');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">認証処理中...</p>
          <button 
            onClick={() => {
              const debugInfo = localStorage.getItem('auth_debug_info');
              alert(debugInfo ? `デバッグ情報:\n${JSON.stringify(JSON.parse(debugInfo), null, 2)}` : 'デバッグ情報なし');
            }}
            className="mt-4 text-sm text-indigo-600 underline"
          >
            デバッグ情報を表示
          </button>
        </div>
      ) : error ? (
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
            >
              ログインページに戻る
            </button>
            <button 
              onClick={() => {
                const debugInfo = localStorage.getItem('auth_debug_info');
                alert(debugInfo ? `デバッグ情報:\n${JSON.stringify(JSON.parse(debugInfo), null, 2)}` : 'デバッグ情報なし');
              }}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors"
            >
              デバッグ情報を表示
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
