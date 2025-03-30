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
    
    // 外部サイトから画像を取得 (タイムアウトも追加してみる)
    const response = await fetch(imageUrl, { timeout: 15000 }); // 15秒タイムアウト
    
    if (!response.ok) {
      // ターゲットサーバーからのエラーレスポンスの場合、その情報を返す
      const errorBody = await response.text(); // ターゲットサーバーのエラー内容を読み取る
      console.error(`Failed to fetch image from target server (${response.status}): ${errorBody}`);
      return {
        statusCode: response.status, // ターゲットサーバーのステータスを返す
        body: JSON.stringify({ 
          error: `Failed to fetch image from target server: ${response.statusText}`,
          details: errorBody 
        })
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
    console.error('Proxy image error:', error); // サーバーログには詳細なエラーオブジェクトを出力

    // エラーの種類に応じてステータスコードとメッセージを設定
    let statusCode = 500;
    let errorMessage = 'Failed to proxy image due to an internal error.';
    let errorDetails = error instanceof Error ? error.message : String(error);

    if (error.code === 'ENOTFOUND') {
      statusCode = 502; // Bad Gateway
      errorMessage = 'Could not resolve the image host (DNS lookup failed)';
    } else if (error.code === 'ETIMEDOUT' || error.type === 'request-timeout') {
      statusCode = 504; // Gateway Timeout
      errorMessage = 'Connection to image server timed out';
    } else if (error.code === 'ECONNRESET') {
        statusCode = 502; // Bad Gateway
        errorMessage = 'Connection to image server was reset';
    } else if (error.code === 'ECONNREFUSED') {
        statusCode = 502; // Bad Gateway
        errorMessage = 'Connection to image server was refused';
    } else if (error.message && error.message.includes('invalid URL')) {
        statusCode = 400; // Bad Request
        errorMessage = 'Invalid image URL format provided to proxy';
    } else if (error.name === 'FetchError') {
        // node-fetch が投げる可能性のある一般的なエラー
        errorMessage = 'Failed to fetch the image from the target server.';
        // 実際の fetch エラーに関連する詳細情報があれば含める
        errorDetails = error.message; 
    }
    // 他の潜在的なエラーコード (例: SSL関連エラーなど) にも対応を追加可能

    // クライアントにはより詳細なエラー情報を返す
    return {
      statusCode: statusCode, 
      body: JSON.stringify({ 
        error: errorMessage, 
        details: errorDetails // 具体的なエラーメッセージを追加
      })
    };
  }
};
