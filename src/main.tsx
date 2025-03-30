import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StrictMode, useState, useEffect } from 'react';
import App from './App.tsx';
import './index.css';
import { resetAuthState } from './lib/supabase.ts';

// デバッグ情報表示用のスタイルとボタンを追加
const debugStyle = document.createElement('style');
debugStyle.textContent = `
  #debug-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(79, 70, 229, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 16px;
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #debug-button:hover {
    background-color: rgba(79, 70, 229, 1);
  }
`;
document.head.appendChild(debugStyle);

// デバッグボタンを追加（開発環境でのみ表示）
if (import.meta.env.DEV) {
  const debugButton = document.createElement('button');
  debugButton.id = 'debug-button';
  debugButton.textContent = '?';
  debugButton.title = 'デバッグ情報を表示';
  debugButton.onclick = () => {
    try {
      const debugInfo = localStorage.getItem('auth_debug_info');
      alert(debugInfo ? `デバッグ情報:\n${JSON.stringify(JSON.parse(debugInfo), null, 2)}` : 'デバッグ情報なし');
    } catch (e) {
      alert('デバッグ情報の取得に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    }
  };
  document.body.appendChild(debugButton);
}

// エラーハンドリングコンポーネント
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  useEffect(() => {
    // グローバルエラーハンドラーを設定
    const errorHandler = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      
      // 認証エラーを検出
      const err = event.error;
      const isAuthRelated = 
        err && 
        typeof err === 'object' && 
        (('__isAuthError' in err && err.__isAuthError === true) ||
         (err.message && typeof err.message === 'string' && 
          (err.message.includes('refresh_token_not_found') || 
           err.message.includes('session expired'))));
      
      if (isAuthRelated) {
        console.warn('認証エラーを検出しました - 認証状態をリセットします');
        setIsAuthError(true);
        
        // 認証状態をリセット
        resetAuthState()
          .then(() => {
            console.log('認証状態のリセットが完了しました');
            // ログインページにリダイレクト
            window.location.href = '/login?reset=true&error=session_expired';
          })
          .catch(resetErr => {
            console.error('認証状態のリセット中にエラーが発生しました:', resetErr);
          });
      }
      
      setError(event.error);
      setHasError(true);
      event.preventDefault();
    };

    // Promiseエラーハンドラーを設定
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      
      // 認証エラーを検出
      const err = event.reason;
      const isAuthRelated = 
        err && 
        typeof err === 'object' && 
        (('__isAuthError' in err && err.__isAuthError === true) ||
         (err.message && typeof err.message === 'string' && 
          (err.message.includes('refresh_token_not_found') || 
           err.message.includes('session expired'))));
      
      if (isAuthRelated) {
        console.warn('認証エラーを検出しました - 認証状態をリセットします');
        setIsAuthError(true);
        
        // 認証状態をリセット
        resetAuthState()
          .then(() => {
            console.log('認証状態のリセットが完了しました');
            // ログインページにリダイレクト
            window.location.href = '/login?reset=true&error=session_expired';
          })
          .catch(resetErr => {
            console.error('認証状態のリセット中にエラーが発生しました:', resetErr);
          });
      }
      
      setError(err instanceof Error ? err : new Error(String(err)));
      setHasError(true);
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);

  // 追加: ルートへのリダイレクト回避
  useEffect(() => {
    // リダイレクトループ検出
    let redirectCount = parseInt(sessionStorage.getItem('redirect_count') || '0');
    const currentPath = window.location.pathname;
    
    // callbackページの場合はカウントをリセット
    if (currentPath.includes('/callback') || currentPath.includes('/auth/callback')) {
      sessionStorage.setItem('redirect_count', '0');
      return;
    }
    
    // リダイレクト回数をカウント
    if (currentPath === '/') {
      redirectCount++;
      sessionStorage.setItem('redirect_count', redirectCount.toString());
      
      // 閾値を超えるリダイレクトを検出した場合
      if (redirectCount > 3) {
        console.error('リダイレクトループを検出しました');
        
        try {
          // デバッグ情報を保存
          const debugInfo = JSON.parse(localStorage.getItem('auth_debug_info') || '{"steps":[]}');
          debugInfo.steps.push(`[System] リダイレクトループ検出 (${redirectCount}回)`);
          localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
        } catch (e) {
          console.error('デバッグ情報の保存に失敗しました:', e);
        }
        
        // 明示的にマイページに強制リダイレクト（最終手段）
        if (redirectCount > 5) {
          sessionStorage.removeItem('redirect_count');  // カウントをリセット
          window.location.href = '/mypage';
        }
      }
    }
  }, []);

  if (hasError) {
    // 認証エラーの場合
    if (isAuthError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: '#4f46e5' }}>セッションの有効期限が切れました</h1>
          <p>長時間操作がなかったため、セキュリティのため自動的にログアウトされました。</p>
          <p>再度ログインしてください。</p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => window.location.href = '/login?reset=true'}
              style={{
                padding: '10px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ログイン画面へ
            </button>
          </div>
        </div>
      );
    }
    
    // その他の一般的なエラー
    return (
      <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#e53e3e' }}>アプリケーションエラー</h1>
        <p>申し訳ありませんが、アプリケーションの読み込み中にエラーが発生しました。</p>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f7fafc', 
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          marginTop: '12px'
        }}>
          <pre style={{ margin: 0, overflow: 'auto' }}>
            {error?.message || 'Unknown error'}
          </pre>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ページを再読み込み
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: system-ui, sans-serif;">
      <h1 style="color: #e53e3e;">初期化エラー</h1>
      <p>アプリケーションの初期化中にエラーが発生しました。</p>
      <div style="padding: 12px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 12px;">
        <pre style="margin: 0; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
      <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background-color: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">
        ページを再読み込み
      </button>
    </div>
  `;
}
