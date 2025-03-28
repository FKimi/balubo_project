const fetch = require('node-fetch');

/**
 * 画像プロキシ関数
 * 
 * この関数は、CORSの制限を回避するために外部画像をプロキシとして取得し、
 * 適切なヘッダーを設定して返します。特にnewspicks.comなどの外部サイトからの
 * 画像取得に対応しています。
 */
exports.handler = async function(event, context) {
  // GETリクエストのみを許可
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET'
      }
    };
  }

  // URLパラメータを取得
  const params = new URLSearchParams(event.queryStringParameters);
  const url = params.get('url');

  // URLが指定されていない場合はエラー
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL parameter is required' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  try {
    // 外部URLから画像を取得
    const response = await fetch(url, {
      headers: {
        // 一般的なブラウザのUser-Agentを設定
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        // Refererを設定（必要に応じて）
        'Referer': new URL(url).origin
      }
    });

    // レスポンスが成功しなかった場合
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch image: ${response.statusText}` }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // レスポンスボディとContent-Typeを取得
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 成功レスポンスを返す
    return {
      statusCode: 200,
      body: buffer.toString('base64'),
      isBase64Encoded: true,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
        'Access-Control-Allow-Origin': '*', // CORSを許可
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Image proxy error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to proxy image' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
