const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*', // 本番環境では特定のオリジンに制限することを推奨
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエスト（プリフライトリクエスト）の場合は早期に応答
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // リクエストボディからURLを取得
    let url;
    try {
      const body = JSON.parse(event.body);
      url = body.url;
    } catch (error) {
      console.error('Error parsing request body:', error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    console.log(`Fetching content from URL: ${url}`);

    // URLからコンテンツを取得
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000, // 10秒でタイムアウト
      maxContentLength: 10 * 1024 * 1024 // 10MBまで
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // OGPメタデータの抽出
    const ogp = {
      title: $('meta[property="og:title"]').attr('content') || 
             $('title').text() || 
             '',
      description: $('meta[property="og:description"]').attr('content') || 
                  $('meta[name="description"]').attr('content') || 
                  '',
      image: $('meta[property="og:image"]').attr('content') || 
             $('link[rel="image_src"]').attr('href') || 
             '',
      url: $('meta[property="og:url"]').attr('content') || 
           url
    };

    // タイトルが取得できなかった場合、h1タグから取得を試みる
    if (!ogp.title) {
      ogp.title = $('h1').first().text().trim();
    }

    // 説明が取得できなかった場合、最初の段落から取得を試みる
    if (!ogp.description) {
      ogp.description = $('p').first().text().trim();
    }

    // コンテンツの抽出
    // 記事の本文と思われる部分を抽出（articleタグ、mainタグ、または特定のクラス名を持つ要素）
    let content = '';
    const articleContent = $('article').text() || $('main').text();
    
    if (articleContent) {
      content = articleContent;
    } else {
      // 記事タグがない場合は、段落テキストを連結
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 100) { // 短すぎる段落は無視
          content += text + ' ';
        }
      });
    }

    // コンテンツが少ない場合はbodyから取得
    if (content.length < 500) {
      content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    console.log('OGP Data extracted:', {
      title: ogp.title,
      description: ogp.description.substring(0, 50) + '...',
      imageUrl: ogp.image ? 'Found' : 'Not found'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ogp: {
          title: ogp.title,
          description: ogp.description,
          imageUrl: ogp.image,
          url: ogp.url
        },
        content: content.substring(0, 10000) // コンテンツは最大10000文字まで
      })
    };
  } catch (error) {
    console.error('Error fetching URL content:', error);
    
    // エラーの種類に応じたメッセージを返す
    let statusCode = 500;
    let errorMessage = 'URLからコンテンツを取得できませんでした';
    
    if (error.code === 'ENOTFOUND') {
      statusCode = 404;
      errorMessage = 'ドメインが見つかりません。URLが正しいか確認してください。';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      statusCode = 408;
      errorMessage = 'リクエストがタイムアウトしました。サイトの応答が遅いか、アクセスできません。';
    } else if (error.response) {
      statusCode = error.response.status;
      
      if (statusCode === 403) {
        errorMessage = 'アクセスが拒否されました。このサイトはスクレイピングを許可していない可能性があります。';
      } else if (statusCode === 404) {
        errorMessage = 'ページが見つかりません。URLが正しいか確認してください。';
      } else if (statusCode >= 500) {
        errorMessage = 'サーバーエラーが発生しました。しばらく経ってからもう一度お試しください。';
      }
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message
      })
    };
  }
};
