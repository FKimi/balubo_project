// @ts-expect-error: Deno DOM型定義
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

interface OGPMetadata {
  title: string;
  description: string;
  thumbnail_url: string;
  site_name: string;
  url: string;
}

// Netlify Edge Functionsのコンテキスト型
interface NetlifyContext {
  geo: {
    city?: string;
    country?: string;
    region?: string;
  };
  ip: string;
  site: {
    id: string;
    name: string;
    url: string;
  };
  cookies: Record<string, string>;
}

export default async (request: Request, context: NetlifyContext) => {
  // リクエスト元の情報をログに記録（必要に応じて）
  console.log(`Request from IP: ${context.ip}, Country: ${context.geo.country || 'unknown'}`);

  // CORSヘッダーを設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // OPTIONSリクエスト（プリフライトリクエスト）の処理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // URLパラメータの取得
  const url = new URL(request.url).searchParams.get('url');

  // URLが指定されていない場合はエラーを返す
  if (!url) {
    return new Response(
      JSON.stringify({ error: 'URLパラメータが必要です' }),
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  try {
    console.log(`Fetching content from URL: ${url}`);
    
    // URLが正しい形式かチェック
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    // 指定されたURLからコンテンツを取得
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    // HTMLコンテンツを取得
    const html = await response.text();
    
    // HTMLをパース
    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');
    
    if (!document) {
      throw new Error('HTMLのパースに失敗しました');
    }

    // OGPメタデータを抽出
    const ogpData: OGPMetadata = {
      title: getMetaContent(document, 'og:title') || document.querySelector('title')?.textContent || '',
      description: getMetaContent(document, 'og:description') || getMetaContent(document, 'description') || '',
      thumbnail_url: getMetaContent(document, 'og:image') || '',
      site_name: getMetaContent(document, 'og:site_name') || '',
      url: getMetaContent(document, 'og:url') || targetUrl,
    };

    // タイトルが取得できなかった場合、h1タグから取得を試みる
    if (!ogpData.title) {
      const h1 = document.querySelector('h1');
      if (h1) {
        ogpData.title = h1.textContent.trim();
      }
    }

    // 説明が取得できなかった場合、最初の段落から取得を試みる
    if (!ogpData.description) {
      const firstParagraph = document.querySelector('p');
      if (firstParagraph) {
        ogpData.description = firstParagraph.textContent.trim();
      }
    }

    // メインコンテンツの抽出を試みる
    let mainContent = '';
    
    // 記事コンテンツを含む可能性が高い要素を探す
    const articleElement = document.querySelector('article') || document.querySelector('main');
    
    if (articleElement) {
      // 記事要素が見つかった場合はそのテキストを使用
      mainContent = articleElement.textContent.trim();
    } else {
      // 記事要素が見つからない場合は段落を連結
      const paragraphs = document.querySelectorAll('p');
      const paragraphTexts: string[] = [];
      
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text.length > 100) { // 短すぎる段落は無視
          paragraphTexts.push(text);
        }
      });
      
      mainContent = paragraphTexts.join(' ');
    }

    // コンテンツが少ない場合はbodyから取得（最大5000文字）
    if (mainContent.length < 500 && document.querySelector('body')) {
      mainContent = document.querySelector('body')!.textContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000);
    }

    // 結果を返す
    return new Response(
      JSON.stringify({
        metadata: ogpData,
        main_content: mainContent.substring(0, 10000), // 最大10000文字まで
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Error fetching URL content:', error);
    
    // エラーの種類に応じたメッセージを返す
    let statusCode = 500;
    let errorMessage = 'URLからコンテンツを取得できませんでした';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch URL: 404')) {
        statusCode = 404;
        errorMessage = 'ページが見つかりません。URLが正しいか確認してください。';
      } else if (error.message.includes('Failed to fetch URL: 403')) {
        statusCode = 403;
        errorMessage = 'アクセスが拒否されました。このサイトはスクレイピングを許可していない可能性があります。';
      } else if (error.message.includes('Failed to fetch URL: 5')) {
        statusCode = 502;
        errorMessage = 'サーバーエラーが発生しました。しばらく経ってからもう一度お試しください。';
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: statusCode,
        headers: corsHeaders,
      }
    );
  }
};

// メタタグの内容を取得するヘルパー関数
function getMetaContent(document: Document, property: string): string {
  // og:プロパティの場合
  const ogMeta = document.querySelector(`meta[property="og:${property}"]`) || 
                document.querySelector(`meta[property="${property}"]`);
  
  if (ogMeta) {
    return ogMeta.getAttribute('content') || '';
  }
  
  // name属性の場合
  const nameMeta = document.querySelector(`meta[name="${property}"]`);
  if (nameMeta) {
    return nameMeta.getAttribute('content') || '';
  }
  
  return '';
}
