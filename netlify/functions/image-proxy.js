const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // URLパラメータから取得するイメージURLを取得
  const imageUrl = event.queryStringParameters.url;
  
  if (!imageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Image URL is required' })
    };
  }

  try {
    console.log(`Proxying image: ${imageUrl}`);
    
    // 外部サイトから画像を取得
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch image: ${response.statusText}` })
      };
    }

    // 画像のバイナリデータを取得
    const imageBuffer = await response.buffer();
    
    // Content-Typeを取得
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // 適切なCORSヘッダーを設定して画像を返す
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=86400' // 24時間キャッシュ
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Proxy image error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to proxy image' })
    };
  }
};
