/**
 * URLスクレイピングサービス
 * Puppeteerを使用してURLからデータを取得するサービス
 */

/**
 * スクレイピング結果の型定義
 */
export interface ScrapingResult {
  metadata: {
    title: string;
    description: string;
    thumbnail_url: string;
    site_name: string;
    url: string;
  };
  main_content: string;
}

/**
 * エラーレスポンスの型定義
 */
export interface ScrapingError {
  error: string;
  details?: string;
}

/**
 * 環境に応じたAPIエンドポイントを取得する
 */
function getApiEndpoint(): string {
  // 開発環境かどうかを判定
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // 開発環境ではローカルのNetlify Functionを使用
    return '/.netlify/functions/scrape-url';
  } else {
    // 本番環境ではデプロイ済みのNetlify Functionを使用
    return 'https://stupendous-llama-975208.netlify.app/.netlify/functions/scrape-url';
  }
}

/**
 * URLからコンテンツをスクレイピングする
 * @param url スクレイピング対象のURL
 * @returns スクレイピング結果
 */
export async function scrapeUrl(url: string): Promise<ScrapingResult> {
  try {
    // URLにプロトコルがない場合は追加
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }
    
    console.log(`Scraping URL: ${targetUrl}`);
    
    // Netlify Functionにリクエスト
    const apiEndpoint = getApiEndpoint();
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: targetUrl }),
    });
    
    if (!response.ok) {
      // エラーレスポンスの場合
      const errorData = await response.json() as ScrapingError;
      throw new Error(errorData.error || `Failed to scrape URL: ${response.status} ${response.statusText}`);
    }
    
    // 正常なレスポンスの場合
    const data = await response.json() as ScrapingResult;
    return data;
  } catch (error) {
    console.error('Error in scrapeUrl:', error);
    throw error;
  }
}
