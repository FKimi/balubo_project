const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

/**
 * Puppeteerを使用してURLからデータを取得するNetlify Function
 */
exports.handler = async (event, context) => {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエスト（プリフライトリクエスト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // POSTリクエスト以外は拒否
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let url;
  try {
    const requestBody = JSON.parse(event.body);
    url = requestBody.url;

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URLパラメータが必要です' })
      };
    }

    // URLが正しい形式かチェック
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    console.log(`Scraping URL: ${url}`);

    // Puppeteerの起動オプション
    const executablePath = await chromium.executablePath();
    
    // ブラウザを起動
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    // 新しいページを開く
    const page = await browser.newPage();
    
    // User-Agentを設定
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // ページに移動
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // メタデータを取得
    const metadata = await page.evaluate(() => {
      const getMetaContent = (property) => {
        const element = document.querySelector(`meta[property="${property}"]`) || 
                        document.querySelector(`meta[name="${property}"]`) ||
                        document.querySelector(`meta[property="${property.replace('og:', '')}"]`) || 
                        document.querySelector(`meta[name="${property.replace('og:', '')}"]`);
        return element ? element.getAttribute('content') : '';
      };

      return {
        title: getMetaContent('og:title') || document.title || '',
        description: getMetaContent('og:description') || getMetaContent('description') || '',
        thumbnail_url: getMetaContent('og:image') || '',
        site_name: getMetaContent('og:site_name') || '',
        url: getMetaContent('og:url') || window.location.href,
      };
    });

    // メインコンテンツを取得
    const mainContent = await page.evaluate(() => {
      // 記事コンテンツを含む可能性が高い要素を探す
      const articleElement = document.querySelector('article') || document.querySelector('main');
      
      if (articleElement) {
        // 記事要素が見つかった場合はそのテキストを使用
        return articleElement.textContent.trim();
      } else {
        // 記事要素が見つからない場合は段落を連結
        const paragraphs = document.querySelectorAll('p');
        const paragraphTexts = [];
        
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (text.length > 100) { // 短すぎる段落は無視
            paragraphTexts.push(text);
          }
        });
        
        if (paragraphTexts.length > 0) {
          return paragraphTexts.join(' ');
        } else {
          // 段落が見つからない場合はbodyから取得（最大10000文字）
          return document.body.textContent
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000);
        }
      }
    });

    // ブラウザを閉じる
    await browser.close();

    // 結果を返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        metadata,
        main_content: mainContent
      })
    };
  } catch (error) {
    console.error('Error scraping URL:', error);

    // エラーの種類に応じたメッセージを返す
    let statusCode = 500;
    let errorMessage = 'URLからコンテンツを取得できませんでした';
    
    if (error.message && error.message.includes('Navigation timeout')) {
      statusCode = 504;
      errorMessage = 'ページの読み込みがタイムアウトしました。URLが正しいか確認してください。';
    } else if (error.message && error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      statusCode = 404;
      errorMessage = 'ドメインが見つかりません。URLが正しいか確認してください。';
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message || String(error)
      })
    };
  }
};
