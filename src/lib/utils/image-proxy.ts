/**
 * 画像プロキシユーティリティ
 * 
 * このモジュールは、CORSの制限を回避するためのNetlify Functions
 * プロキシを使用して外部画像を取得するための関数を提供します。
 * 特にnewspicks.comなどの外部サイトからの画像取得に対応しています。
 */

// Netlify Functions URLのベースパス
const NETLIFY_FUNCTION_URL = import.meta.env.VITE_NETLIFY_FUNCTION_URL || '/.netlify/functions';

/**
 * 外部画像URLをプロキシURLに変換する関数
 * 
 * @param originalUrl - 元の画像URL
 * @returns プロキシを通した画像URL
 */
export function getProxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  console.log('getProxiedImageUrl - 元のURL:', originalUrl);
  console.log('NETLIFY_FUNCTION_URL:', NETLIFY_FUNCTION_URL);
  
  // 既にプロキシURLの場合はそのまま返す
  if (originalUrl.startsWith(NETLIFY_FUNCTION_URL) || originalUrl.startsWith('data:')) {
    console.log('既にプロキシURLまたはdata:URLのため、そのまま返します');
    return originalUrl;
  }
  
  // 相対URLの場合はプロキシを通さない
  if (originalUrl.startsWith('/')) {
    console.log('相対URLのため、プロキシを通しません');
    return originalUrl;
  }
  
  // URLエンコードして、プロキシURLを生成
  const encodedUrl = encodeURIComponent(originalUrl);
  const proxyUrl = `${NETLIFY_FUNCTION_URL}/image-proxy?url=${encodedUrl}`;
  console.log('生成されたプロキシURL:', proxyUrl);
  return proxyUrl;
}

/**
 * プロキシを通して画像データを取得する関数
 * 
 * @param originalUrl - 元の画像URL
 * @returns 画像データのBlobとContent-Type
 */
export async function fetchImageViaProxy(originalUrl: string): Promise<{ blob: Blob, contentType: string }> {
  try {
    console.log('fetchImageViaProxy - 元のURL:', originalUrl);
    
    // 直接フェッチを試みる
    try {
      const directResponse = await fetch(originalUrl);
      if (directResponse.ok) {
        const blob = await directResponse.blob();
        const contentType = directResponse.headers.get('Content-Type') || 'application/octet-stream';
        console.log('直接フェッチに成功しました。Content-Type:', contentType);
        return { blob, contentType };
      }
    } catch (directError) {
      console.log('直接フェッチに失敗しました。プロキシを試みます:', directError);
    }

    // プロキシURLを生成
    const proxyUrl = getProxiedImageUrl(originalUrl);
    console.log('プロキシURLを使用してfetchします:', proxyUrl);
    
    // プロキシを通してfetch
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error('プロキシを通したfetchに失敗:', response.status, response.statusText);
      let errorData = { error: `プロキシエラー: ${response.status} ${response.statusText}`, details: '詳細不明' };
      
      try {
        const errorBody = await response.text();
        try {
          const jsonError = JSON.parse(errorBody);
          errorData = jsonError;
        } catch {
          errorData.details = errorBody.substring(0, 200);
        }
      } catch (parseError) {
        console.error('プロキシのエラーレスポンスの解析に失敗:', parseError);
      }

      // 代替のプロキシサービスを試みる
      try {
        const corsAnywhereUrl = `https://cors-anywhere.herokuapp.com/${originalUrl}`;
        const corsResponse = await fetch(corsAnywhereUrl);
        if (corsResponse.ok) {
          const blob = await corsResponse.blob();
          const contentType = corsResponse.headers.get('Content-Type') || 'application/octet-stream';
          console.log('CORS Anywhereを使用したフェッチに成功しました。Content-Type:', contentType);
          return { blob, contentType };
        }
      } catch (corsError) {
        console.error('CORS Anywhereを使用したフェッチに失敗:', corsError);
      }

      throw new Error(`画像の取得に失敗しました: ${errorData.error}${errorData.details ? ` (${errorData.details})` : ''}`);
    }
    
    const blob = await response.blob();
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    console.log('プロキシを通したfetchに成功しました。Content-Type:', contentType);
    return { blob, contentType };
  } catch (error) {
    console.error('画像取得エラー:', error);
    throw error;
  }
}

/**
 * 画像をBase64エンコードされたデータURLに変換する関数
 * 
 * @param blob - 画像Blob
 * @returns Base64エンコードされたデータURL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 外部画像URLからBase64エンコードされたデータURLを取得する関数
 * 
 * @param originalUrl - 元の画像URL
 * @returns Base64エンコードされたデータURL
 */
export async function getBase64ImageFromUrl(originalUrl: string): Promise<string> {
  try {
    const { blob } = await fetchImageViaProxy(originalUrl);
    return await blobToDataUrl(blob);
  } catch (error) {
    console.error('Base64画像変換エラー:', error);
    throw error;
  }
}

/**
 * 画像URLがプロキシを必要とするかどうかを判定する関数
 * 特定のドメイン（newspicks.comなど）の画像はプロキシを通す
 * 
 * @param url - 画像URL
 * @returns プロキシが必要かどうか
 */
export function needsProxy(url: string): boolean {
  if (!url) return false;
  
  // 既にプロキシURLまたはdata:URLの場合
  if (url.startsWith(NETLIFY_FUNCTION_URL) || url.startsWith('data:')) {
    return false;
  }
  
  // 相対URLの場合
  if (url.startsWith('/')) {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    
    // プロキシが必要なドメインのリスト
    const proxyDomains = [
      'newspicks.com',
      'assets.st-note.com',
      'images.unsplash.com',
      'pbs.twimg.com',
      'cdn-images-1.medium.com'
    ];
    
    // ドメインがリストに含まれているかチェック
    return proxyDomains.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    // URLの解析に失敗した場合は安全のためプロキシを使用
    return true;
  }
}

/**
 * 画像URLをプロキシ経由で取得するかどうかを判断し、
 * 必要に応じてプロキシURLに変換する関数
 * 
 * @param url - 元の画像URL
 * @returns 適切に処理されたURL
 */
export function getImageUrl(url: string): string {
  if (!url) return '';
  
  return needsProxy(url) ? getProxiedImageUrl(url) : url;
}
