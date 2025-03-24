import { useToast } from './hooks/useToast';

// グローバルなtoast関数を提供するためのダミーオブジェクト
// 実際の実装はToastコンポーネントのuseToastフックを使用する必要があります
const toast = {
  // エラートースト
  error: (message: string) => {
    console.error('Toast error:', message);
    // 実際のToastコンポーネントを使用する場合は、ここでuseToastフックを呼び出す必要があります
    // しかし、フックはコンポーネント内でのみ使用可能なため、ここでは直接呼び出せません
    // このファイルはインポートの解決のためのプレースホルダーとして機能します
  },
  
  // 成功トースト
  success: (message: string) => {
    console.log('Toast success:', message);
  },
  
  // 情報トースト
  info: (message: string) => {
    console.log('Toast info:', message);
  }
};

export default toast;

// 実際のToastコンポーネントを使用するためのフックをエクスポート
export { useToast };
