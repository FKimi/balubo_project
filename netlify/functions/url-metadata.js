const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * URLからメタデータを抽出するNetlify Function
 * 
 * @param {Object} event - Netlify Functionsのイベントオブジェクト
 * @returns {Promise<Object>} レスポンスオブジェクト
 */
exports.handler = async function(event, context) {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // GETリクエスト以外は拒否
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // クエリパラメータからURLを取得
  const url = event.queryStringParameters.url;
  
  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'URL parameter is required' })
    };
  }

  try {
    // URLからHTMLを取得
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BaluboBot/1.0; +https://stupendous-llama-975208.netlify.app/)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // HTMLからメタデータを抽出
    const metadata = extractMetadata(html, url);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(metadata)
    };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Error fetching URL metadata: ${error.message}`,
        url: url
      })
    };
  }
};

/**
 * HTMLからメタデータを抽出する関数
 * 
 * @param {string} html - HTMLコンテンツ
 * @param {string} url - 元のURL
 * @returns {Object} 抽出されたメタデータ
 */
function extractMetadata(html, url) {
  const $ = cheerio.load(html);
  
  // 基本的なメタデータを抽出
  const metadata = {
    url: url,
    title: $('title').text().trim() || '',
    description: $('meta[name="description"]').attr('content') || '',
    keywords: $('meta[name="keywords"]').attr('content') || '',
    author: $('meta[name="author"]').attr('content') || '',
    siteName: $('meta[property="og:site_name"]').attr('content') || '',
    type: $('meta[property="og:type"]').attr('content') || '',
  };
  
  // OpenGraphメタデータを抽出
  metadata.ogTitle = $('meta[property="og:title"]').attr('content') || '';
  metadata.ogDescription = $('meta[property="og:description"]').attr('content') || '';
  metadata.ogImage = $('meta[property="og:image"]').attr('content') || '';
  
  // Twitterカードメタデータを抽出
  metadata.twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
  metadata.twitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
  metadata.twitterImage = $('meta[name="twitter:image"]').attr('content') || '';
  
  // 最終的なデータを整理
  const result = {
    title: metadata.ogTitle || metadata.twitterTitle || metadata.title || '',
    description: metadata.ogDescription || metadata.twitterDescription || metadata.description || '',
    image: metadata.ogImage || metadata.twitterImage || '',
    url: url,
    siteName: metadata.siteName || '',
    type: metadata.type || '',
    author: metadata.author || '',
    keywords: metadata.keywords ? metadata.keywords.split(',').map(k => k.trim()) : []
  };
  
  return result;
}
