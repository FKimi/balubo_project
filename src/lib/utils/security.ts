/**
 * セキュリティ関連ユーティリティ
 */

/**
 * 入力値のサニタイズ
 * XSS攻撃を防止するためのHTMLエスケープ
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 入力値のバリデーション
 * 一般的な入力値のバリデーションパターン
 */
export const validators = {
  /**
   * メールアドレスの検証
   */
  isValidEmail: (email: string): boolean => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
  },
  
  /**
   * URLの検証
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * 必須フィールドの検証
   */
  isRequired: (value: string): boolean => {
    return value.trim().length > 0;
  },
  
  /**
   * 最小文字数の検証
   */
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },
  
  /**
   * 最大文字数の検証
   */
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  }
};

/**
 * CSRFトークンの生成
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 機密情報のマスキング
 * ログ出力時などに使用
 */
export function maskSensitiveData<T extends Record<string, unknown>>(data: T, keysToMask: string[]): T {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // 配列・オブジェクト両対応でanyを使わず型安全に
  const result: Record<string, unknown> = Array.isArray(data)
    ? [...(data as unknown as unknown[])] as unknown as Record<string, unknown>
    : { ...data };

  for (const key in result) {
    if (keysToMask.includes(key)) {
      result[key] = '********';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = maskSensitiveData(result[key] as Record<string, unknown>, keysToMask);
    }
  }

  return result as T;
}
