/**
 * OGPメタデータの型定義
 */
export interface OGPMetadata {
  title: string;
  description: string;
  thumbnail_url: string;
  site_name: string;
  url: string;
}

/**
 * Edge Function APIのレスポンス型
 */
export interface OGPResponse {
  metadata: OGPMetadata;
  main_content: string;
}

/**
 * Edge Function APIのエラーレスポンス型
 */
export interface OGPError {
  error: string;
  details?: string;
}

/**
 * 環境に応じたAPIエンドポイントを取得する
 * @returns APIのベースURL
 */
function getApiBaseUrl(): string {
  // 開発環境かどうかを判定
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // 開発環境では従来のNetlify Functionを使用
    return '/.netlify/functions/fetch-url';
  } else {
    // 本番環境ではEdge Functionを使用
    return '/api/ogp';
  }
}

/**
 * URLからOGPメタデータとメインコンテンツを取得する
 * @param url 取得対象のURL
 * @returns OGPメタデータとメインコンテンツ
 */
export async function fetchOGPData(url: string): Promise<OGPResponse> {
  try {
    // URLにプロトコルがない場合は追加
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }
    
    console.log(`Fetching OGP data for URL: ${targetUrl}`);
    
    // 環境に応じたAPIエンドポイントを取得
    const apiBase = getApiBaseUrl();
    let apiUrl: string;
    let requestOptions: RequestInit = {};
    
    if (apiBase.includes('functions')) {
      // 従来のNetlify Functionを使用する場合
      apiUrl = apiBase;
      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      };
    } else {
      // Edge Functionを使用する場合
      apiUrl = `${apiBase}?url=${encodeURIComponent(targetUrl)}`;
    }
    
    console.log(`Calling API endpoint: ${apiUrl}`);
    const response = await fetch(apiUrl, requestOptions);
    
    if (!response.ok) {
      // エラーレスポンスの場合
      const errorData = await response.json() as OGPError;
      throw new Error(errorData.error || `Failed to fetch OGP data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 従来のNetlify Functionのレスポンス形式を変換
    if (apiBase.includes('functions') && data.ogp) {
      return {
        metadata: {
          title: data.ogp.title || '',
          description: data.ogp.description || '',
          thumbnail_url: data.ogp.imageUrl || '',
          site_name: '',
          url: data.ogp.url || targetUrl,
        },
        main_content: data.content || '',
      };
    }
    
    return data as OGPResponse;
  } catch (error) {
    console.error('Error fetching OGP data:', error);
    throw error;
  }
}

/**
 * OGPメタデータをURLアナライザーの結果形式に変換する
 * @param ogpData OGPメタデータとメインコンテンツ
 * @returns URLアナライザーの結果形式
 */
export function convertOGPToAnalysisResult(ogpData: OGPResponse): {
  metadata: {
    title: string;
    description: string;
    imageUrl?: string;
    url: string;
  };
  content: string;
} {
  return {
    metadata: {
      title: ogpData.metadata.title,
      description: ogpData.metadata.description,
      imageUrl: ogpData.metadata.thumbnail_url,
      url: ogpData.metadata.url,
    },
    content: ogpData.main_content,
  };
}
