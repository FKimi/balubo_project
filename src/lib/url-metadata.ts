/**
 * URLメタデータ抽出サービス
 * 
 * このファイルでは、LinkPreview APIを使用してURLからメタデータを抽出する機能を提供します。
 * OpenGraph, TwitterカードなどのメタデータとHTMLコンテンツから情報を抽出します。
 */

import { UrlExtractedData } from './gemini-url-service';

/**
 * URLからメタデータを抽出するためのインターフェース
 */
export interface UrlMetadata {
  title: string;
  description: string;
  image?: string;
  url: string;
  siteName?: string;
  type?: string;
  author?: string;
  keywords?: string[];
}

/**
 * URLからメタデータを抽出する関数
 * @param url 抽出対象のURL
 * @returns 抽出されたメタデータ
 */
export async function extractUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    // URLにプロトコルがない場合は追加
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    // LinkPreview APIを使用
    const apiKey = import.meta.env.VITE_LINKPREVIEW_API_KEY || '23c2c2d4e248bc250a0adf683ac26621';
    const apiUrl = `https://api.linkpreview.net/?key=${apiKey}&q=${encodeURIComponent(targetUrl)}`;
    
    console.log(`Fetching metadata from URL: ${targetUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      title: data.title || 'Untitled',
      description: data.description || '',
      image: data.image || undefined,
      url: data.url || targetUrl,
      siteName: data.siteName || '',
      type: '',
      author: '',
      keywords: []
    };
  } catch (error) {
    console.error('Error extracting metadata from URL:', error instanceof Error ? error.message : String(error));
    
    // エラーが発生した場合はデフォルト値を返す
    return {
      title: 'URL取得エラー',
      description: 'URLからメタデータを取得できませんでした。手動で情報を入力してください。',
      url: url,
      keywords: []
    };
  }
}

/**
 * URLメタデータをUrlExtractedData形式に変換する関数
 * @param metadata URLメタデータ
 * @returns UrlExtractedData形式のデータ
 */
export function convertMetadataToExtractedData(metadata: UrlMetadata): UrlExtractedData {
  // キーワードからタグを生成
  const tags = metadata.keywords 
    ? metadata.keywords.map((keyword, index) => ({
        name: keyword,
        relevance: 1 - (index * 0.1) // 順番に基づいて関連度を設定
      })).slice(0, 5) // 最大5つまで
    : [];
  
  // サイト名をタグに追加（存在する場合）
  if (metadata.siteName && !tags.some(tag => tag.name === metadata.siteName)) {
    tags.unshift({
      name: metadata.siteName,
      relevance: 0.9
    });
  }
  
  return {
    title: metadata.title,
    description: metadata.description,
    imageUrl: metadata.image,
    url: metadata.url,
    tags: tags.length > 0 ? tags : [{ name: '未分類', relevance: 1.0 }]
  };
}

/**
 * URLからデータを抽出してUrlExtractedData形式で返す関数
 * @param url 抽出対象のURL
 * @returns 抽出されたデータ
 */
export async function extractDataFromUrlWithMetadata(url: string): Promise<UrlExtractedData> {
  try {
    const metadata = await extractUrlMetadata(url);
    return convertMetadataToExtractedData(metadata);
  } catch (error) {
    console.error('Error in extractDataFromUrlWithMetadata:', error);
    throw error; // Gemini APIにフォールバックするためにエラーを再スロー
  }
}
