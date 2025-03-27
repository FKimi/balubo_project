export interface UrlAnalysisResult {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  tags?: Array<{
    name: string;
    relevance: number;
    category?: string;
  }>;
}

/**
 * URLを解析して情報を取得する
 * @param url 解析対象のURL
 * @returns 解析結果
 */
export async function analyzeUrl(url: string): Promise<UrlAnalysisResult> {
  try {
    // Netlify Functionを呼び出す
    const response = await fetch('/.netlify/functions/analyze-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('URL解析エラー:', error);
    return {};
  }
}

// デフォルトエクスポート
const urlAnalyzer = {
  analyzeUrl,
};

export default urlAnalyzer;
