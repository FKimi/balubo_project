import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * URLから取得した情報の型定義
 */
export interface UrlExtractedData {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
  tags: {
    name: string;
    relevance: number;
  }[];
}

/**
 * Gemini APIを使用してURLから情報を取得・分析する
 * @param url 分析対象のURL
 * @returns 抽出された情報
 */
export async function extractDataFromUrl(url: string): Promise<UrlExtractedData> {
  try {
    // APIキーを取得
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBiWIbXXRT0wDqHl8VdChfLmmBN_VKuseQ';
    
    if (!apiKey) {
      throw new Error('Gemini API key is not set');
    }
    
    // Gemini APIの初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // URLにプロトコルがない場合は追加
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }
    
    // プロンプトの作成
    const prompt = `
# URLスクレイピング指示

## 基本情報
対象URL: ${targetUrl}
目的: baluboポートフォリオへの自動追加

## 取得したい情報
- タイトル
- 内容の要約（200字程度）
- 関連スキル・キーワード（5つまで、関連度スコア付き）
- サムネイル画像URL（OGP画像があれば）

## 出力形式
以下のJSON形式で結果を出力してください。他の説明は一切不要です：
{
  "title": "記事タイトル",
  "description": "内容の要約（200字程度）",
  "imageUrl": "サムネイル画像URL（あれば）",
  "url": "${targetUrl}",
  "tags": [
    {"name": "キーワード1", "relevance": 0.9},
    {"name": "キーワード2", "relevance": 0.8},
    {"name": "キーワード3", "relevance": 0.7},
    {"name": "キーワード4", "relevance": 0.6},
    {"name": "キーワード5", "relevance": 0.5}
  ]
}

## 特別な指示
- JSONのみを出力し、他の説明は一切含めないでください
- 情報が見つからない場合は該当フィールドを空文字列にしてください
- タグは関連度が高い順に並べ、関連度は0.0〜1.0の範囲で設定してください
- タグはスキルや技術に関連するものを優先してください
`;
    
    console.log('Sending prompt to Gemini API...');
    
    // Gemini APIにリクエスト
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Received response from Gemini API');
    
    // JSONを抽出（余分なテキストがある場合に対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini API response');
    }
    
    const jsonText = jsonMatch[0];
    const data = JSON.parse(jsonText) as UrlExtractedData;
    
    // 必須フィールドの確認と設定
    return {
      title: data.title || 'Untitled',
      description: data.description || '',
      imageUrl: data.imageUrl || undefined,
      url: data.url || targetUrl,
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  } catch (error) {
    console.error('Error extracting data from URL:', error);
    throw error;
  }
}
