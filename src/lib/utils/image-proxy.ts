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
  
  // 既にプロキシURLの場合はそのまま返す
  if (originalUrl.startsWith(NETLIFY_FUNCTION_URL) || originalUrl.startsWith('data:')) {
    return originalUrl;
  }
  
  // 相対URLの場合はプロキシを通さない
  if (originalUrl.startsWith('/')) {
    return originalUrl;
  }
  
  // URLエンコードして、プロキシURLを生成
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${NETLIFY_FUNCTION_URL}/image-proxy?url=${encodedUrl}`;
}

/**
 * プロキシを通して画像データを取得する関数
 * 
 * @param originalUrl - 元の画像URL
 * @returns 画像データのBlobとContent-Type
 */
export async function fetchImageViaProxy(originalUrl: string): Promise<{ blob: Blob, contentType: string }> {
  try {
    // 相対URLまたはdata:URLの場合はプロキシを通さない
    if (originalUrl.startsWith('/') || originalUrl.startsWith('data:')) {
      const response = await fetch(originalUrl);
      
      if (!response.ok) {
        throw new Error(`画像の取得に失敗しました: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      
      return { blob, contentType };
    }
    
    // プロキシURLを生成
    const proxyUrl = getProxiedImageUrl(originalUrl);
    
    // プロキシを通してfetch
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`画像の取得に失敗しました: ${response.status} ${response.statusText}`);
    }
    
    // レスポンスからBlobとContent-Typeを取得
    const blob = await response.blob();
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    return { blob, contentType };
  } catch (error) {
    console.error('プロキシ経由の画像取得エラー:', error);
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
