import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/hooks/useToast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // コールバック処理を非同期で実行
    const handleCallback = async () => {
      console.log('🌟 Auth Callbackが初期化されました', window.location.href);
      
      try {
        // ローカルストレージからリダイレクト先を取得
        const redirectTo = localStorage.getItem('redirect_after_login') || '/mypage';
        console.log('📌 リダイレクト先:', redirectTo);
        
        // セッションを取得して確認
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔴 認証セッション取得エラー:', error.message);
          toast.error({
            title: "認証に失敗しました",
            description: error.message
          });
          navigate('/login', { replace: true });
          return;
        }
        
        if (!data.session) {
          console.warn('⚠️ 認証セッションがありません');
          toast.error({
            title: "認証セッションがありません",
            description: "再度ログインしてください"
          });
          navigate('/login', { replace: true });
          return;
        }
        
        // セッションが確認できたら、成功通知
        console.log('✅ 認証成功！ユーザーID:', data.session.user.id);
        toast({
          title: "ログインに成功しました",
        });
        
        // リダイレクト先に移動
        console.log('🚀 リダイレクト先へ移動します:', redirectTo);
        localStorage.removeItem('redirect_after_login'); // クリーンアップ
        navigate(redirectTo, { replace: true });
      } catch (error) {
        console.error('🔴 認証コールバック処理エラー:', error);
        toast.error({
          title: "認証処理中にエラーが発生しました",
          description: error instanceof Error ? error.message : '不明なエラー'
        });
        navigate('/login', { replace: true });
      }
    };

    // コールバック処理を実行
    handleCallback();
  }, [navigate, toast]);

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
