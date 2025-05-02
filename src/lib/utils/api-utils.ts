/**
 * API呼び出し用ユーティリティ
 * エラーハンドリングと共通処理を統一
 */

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
};

/**
 * 共通のフェッチラッパー
 * エラーハンドリングとJSONパースを統一
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const { method = 'GET', headers = {}, body } = options;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    // 204 No Content の場合は空オブジェクトを返す
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * GET リクエスト
 */
export async function apiGet<T>(url: string, headers?: Record<string, string>): Promise<T> {
  return fetchWithErrorHandling<T>(url, { method: 'GET', headers });
}

/**
 * POST リクエスト
 */
export async function apiPost<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
  return fetchWithErrorHandling<T>(url, { method: 'POST', body: data, headers });
}

/**
 * PUT リクエスト
 */
export async function apiPut<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
  return fetchWithErrorHandling<T>(url, { method: 'PUT', body: data, headers });
}

/**
 * DELETE リクエスト
 */
export async function apiDelete<T>(url: string, headers?: Record<string, string>): Promise<T> {
  return fetchWithErrorHandling<T>(url, { method: 'DELETE', headers });
}
