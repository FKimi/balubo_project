import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/hooks/useToast';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🌟 Auth Callbackが初期化されました', window.location.href);
      
      try {
        // URLからハッシュを取得
        const hash = window.location.hash;
        if (!hash) {
          console.warn('⚠️ URLハッシュがありません');
          toast.error({
            title: "認証情報が不足しています",
            description: "再度ログインしてください"
          });
          navigate('/login');
          return;
        }
        
        // ハッシュからアクセストークンとリフレッシュトークンを抽出
        const accessToken = new URLSearchParams(hash.substring(1)).get('access_token');
        const refreshToken = new URLSearchParams(hash.substring(1)).get('refresh_token');
        
        if (!accessToken || !refreshToken) {
          console.warn('⚠️ トークンが取得できませんでした');
          toast.error({
            title: "認証情報が不足しています",
            description: "再度ログインしてください"
          });
          navigate('/login');
          return;
        }
        
        // リダイレクト先の決定
        // 優先順位: ローカルストレージ > URLパラメータ > デフォルト値
        // ローカルストレージからリダイレクト先を取得
        const storedRedirectPath = localStorage.getItem('redirectAfterLogin');
        // URLパラメータからリダイレクト先を取得
        const urlParams = new URLSearchParams(window.location.search);
        const urlRedirectPath = urlParams.get('redirectTo');
        // 最終的なリダイレクト先を決定
        const redirectPath = storedRedirectPath || urlRedirectPath || '/portfolio';
        
        console.log('📌 リダイレクト先:', redirectPath);
        
        // セッション設定
        console.log('🔑 トークンでセッションを設定します');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          console.error('🔴 セッション設定エラー:', sessionError.message);
          toast.error({
            title: "セッションの設定に失敗しました",
            description: sessionError.message
          });
          navigate('/login');
          return;
        }
        
        // セッション取得して確認
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔴 セッション取得エラー:', error.message);
          toast.error({
            title: "セッションの取得に失敗しました",
            description: error.message
          });
          navigate('/login');
          return;
        }
        
        if (!data.session) {
          console.warn('⚠️ セッションが存在しません');
          toast.error({
            title: "セッションが見つかりません",
            description: "再度ログインしてください"
          });
          navigate('/login');
          return;
        }
        
        // セッション設定成功
        console.log('✅ 認証成功！ユーザーID:', data.session.user.id);
        toast({
          title: "ログインに成功しました",
        });
        
        // リダイレクト実行
        console.log('🚀 リダイレクト先へ移動します:', redirectPath);
        localStorage.removeItem('redirectAfterLogin'); // クリーンアップ
        navigate(redirectPath, { replace: true });
        
      } catch (error) {
        console.error('🔴 認証コールバック処理エラー:', error);
        toast.error({
          title: "認証処理中にエラーが発生しました",
          description: error instanceof Error ? error.message : '不明なエラー'
        });
        navigate('/login');
      }
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">認証処理中...</h2>
          <p className="mt-2 text-sm text-gray-600">
            ログイン情報を処理しています。しばらくお待ちください。
          </p>
        </div>
        <div className="flex justify-center pt-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
}
