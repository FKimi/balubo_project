import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StrictMode, useState, useEffect } from 'react';
import App from './App.tsx';
import './index.css';

// エラーハンドリングコンポーネント
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // グローバルエラーハンドラーを設定
    const errorHandler = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
      setHasError(true);
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
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
