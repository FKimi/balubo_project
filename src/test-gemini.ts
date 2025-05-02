/**
 * Gemini API接続テストファイル
 */

// グローバルwindowオブジェクトにtestGeminiApi関数の型定義を追加
declare global {
  interface Window {
    testGeminiApi: () => Promise<{
      success: boolean;
      message: string;
      response?: string;
      details?: any;
    }>;
  }
}

// 環境変数からAPIキーを取得
const getGeminiApiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 
                 import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  console.log('環境変数VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? '設定済み' : '未設定');
  console.log('環境変数GEMINI_API_KEY:', import.meta.env.GEMINI_API_KEY ? '設定済み' : '未設定');
  
  if (!apiKey) {
    throw new Error('Gemini API キーが設定されていません。環境変数を確認してください。');
  }
  
  // APIキーの先頭部分のみログに出力（セキュリティのため完全なキーは出力しない）
  const keyPrefix = apiKey.substring(0, 8) + '...';
  console.log('使用するAPIキー:', keyPrefix);
  
  return apiKey;
};

/**
 * シンプルなAPIテスト関数
 */
export async function testGeminiApi() {
  try {
    const apiKey = getGeminiApiKey();
    console.log('Gemini APIテスト実行中...');
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `こんにちは、簡単なテストです。「テスト成功」と返信してください。`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 128,
        }
      })
    });

    console.log('APIレスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('APIエラーレスポンス:', errorText);
      return {
        success: false,
        message: `API エラー: ステータスコード ${response.status}`,
        details: errorText
      };
    }

    const data = await response.json();
    console.log('APIレスポンス:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      return {
        success: false,
        message: 'APIからの応答形式が不正です',
        details: JSON.stringify(data)
      };
    }
    
    const text = data.candidates[0].content.parts[0].text;
    return {
      success: true,
      message: 'APIテスト成功',
      response: text
    };
  } catch (error) {
    console.error('APIテストエラー:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '不明なエラー',
      details: error
    };
  }
}

// ブラウザコンソールでテスト実行用
window.testGeminiApi = testGeminiApi; 