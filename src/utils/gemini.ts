/**
 * Gemini APIを使用するためのユーティリティ関数
 */

// 環境変数からAPIキーを取得
const getGeminiApiKey = () => {
  // ViteではVITE_プレフィックスの環境変数が優先されます
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API キーが設定されていません。環境変数 VITE_GEMINI_API_KEY を確認してください。');
  }
  return apiKey;
};

/**
 * プロジェクトの要件を生成・整理するための関数
 * @param prompt ユーザーの入力プロンプト
 * @returns 整理された要件の内容
 */
export async function generateProjectRequirements(prompt: string): Promise<string> {
  try {
    const apiKey = getGeminiApiKey();

    console.log('Gemini API リクエスト送信中...');
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
                text: `以下のプロジェクト概要から、明確な要件定義に整理してください。
                
                プロジェクト概要:
                ${prompt}
                
                以下の項目に分けて整理してください:
                1. プロジェクトの目的
                2. 主な要件（優先度順）
                3. 成功基準
                4. 推奨されるスキルセット
                5. 注意点・リスク
                
                日本語で、ビジネス的な価値と技術的な要件のバランスを考慮して回答してください。`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API エラーレスポンス:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`API エラー: ${errorData.error?.message || response.status}`);
      } catch (e) {
        // JSONパースに失敗した場合
        throw new Error(`API エラー: ステータスコード ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Gemini API レスポンス受信:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Gemini API 不正なレスポンス形式:', data);
      throw new Error('APIからの応答形式が不正です');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API エラー:', error);
    throw new Error(`要件の生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * プロジェクトのタイトルを生成するための関数
 * @param description プロジェクトの説明
 * @returns 生成されたタイトル
 */
export async function generateProjectTitle(description: string): Promise<string> {
  try {
    const apiKey = getGeminiApiKey();

    console.log('Gemini API タイトル生成リクエスト送信中...');
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
                text: `以下のプロジェクト説明から、魅力的で簡潔なプロジェクトタイトルを作成してください。
                
                プロジェクト説明:
                ${description}
                
                タイトルは30文字以内で、クリエイターが興味を持ちやすい、具体的で魅力的な表現にしてください。タイトルのみを回答してください。`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 128,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API エラーレスポンス:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`API エラー: ${errorData.error?.message || response.status}`);
      } catch (e) {
        throw new Error(`API エラー: ステータスコード ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Gemini API タイトル生成レスポンス:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Gemini API 不正なレスポンス形式:', data);
      throw new Error('APIからの応答形式が不正です');
    }
    
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Gemini API エラー:', error);
    throw new Error(`タイトルの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * 予算の範囲を提案するための関数
 * @param category カテゴリー
 * @param description プロジェクトの説明
 * @returns 推奨予算範囲の配列 [最小予算, 最大予算]
 */
export async function suggestBudgetRange(category: string, description: string): Promise<[string, string]> {
  try {
    const apiKey = getGeminiApiKey();

    console.log('Gemini API 予算提案リクエスト送信中...');
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
                text: `以下のプロジェクト情報から、適切な予算範囲を提案してください。
                
                カテゴリー: ${category}
                プロジェクト説明: ${description}
                
                以下のフォーマットでJSONで回答してください:
                {"min": "最小予算（数値のみ）", "max": "最大予算（数値のみ）"}
                
                最小予算と最大予算は数値のみを含め、カンマや単位は含めないでください。例: 50000`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 128,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API エラーレスポンス:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`API エラー: ${errorData.error?.message || response.status}`);
      } catch (e) {
        throw new Error(`API エラー: ステータスコード ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Gemini API 予算提案レスポンス:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Gemini API 不正なレスポンス形式:', data);
      throw new Error('APIからの応答形式が不正です');
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    
    // JSON部分を抽出して解析
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('予算提案のフォーマットが正しくありません:', responseText);
      throw new Error('予算提案のフォーマットが正しくありません');
    }
    
    try {
      const budgetJson = JSON.parse(jsonMatch[0]);
      if (!budgetJson.min || !budgetJson.max) {
        throw new Error('予算情報が不完全です');
      }
      return [budgetJson.min, budgetJson.max];
    } catch (e) {
      console.error('JSON解析エラー:', e, jsonMatch[0]);
      throw new Error('予算提案の形式が正しくありません');
    }
  } catch (error) {
    console.error('Gemini API エラー:', error);
    throw new Error(`予算提案の生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
} 