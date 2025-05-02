import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * エラーバウンダリコンポーネント
 * 子コンポーネントでエラーが発生した場合にフォールバックUIを表示
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラーログの記録
    console.error('エラーバウンダリがエラーをキャッチしました:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // フォールバックUIを表示
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのフォールバックUI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700 mb-2">エラーが発生しました</h2>
          <p className="text-red-600 mb-4">
            申し訳ありませんが、コンポーネントの表示中にエラーが発生しました。
          </p>
          <details className="bg-white p-3 rounded border border-red-100">
            <summary className="cursor-pointer text-red-600 font-medium">エラー詳細</summary>
            <pre className="mt-2 text-sm text-gray-700 overflow-auto">
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
          </details>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
