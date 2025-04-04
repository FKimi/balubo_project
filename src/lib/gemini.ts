import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { fetchImageViaProxy } from './utils/image-proxy';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// APIキーが設定されていない場合の警告
if (!GEMINI_API_KEY) {
  console.warn('Missing Gemini API key. Please set VITE_GEMINI_API_KEY in your environment.');
}

interface ContentInput {
  title: string;
  description?: string | null;
  url?: string;
  content?: string;
  imageUrl?: string; // 画像URLを追加
}

interface ContentAnalysis {
  originality: {
    features: Array<{ name: string; score: number }>;
    summary: string;
  };
  quality: {
    categories: Array<{ name: string; score: number }>;
    summary: string;
  };
  engagement: {
    points: Array<{ title: string; description: string }>;
    summary: string;
  };
  tags: string[];
}

// Gemini Proのモデル設定
const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 4096,
};

// 安全性設定
const safetySettings = [
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
];

export async function analyzeContent(content: ContentInput): Promise<ContentAnalysis> {
  try {
    // APIキーがない場合はフォールバック分析を返す
    if (!GEMINI_API_KEY) {
      console.warn('No Gemini API key provided, returning fallback analysis');
      return getFallbackAnalysis();
    }

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    try {
      // Get the model - 最新のモデル名を使用
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig,
        safetySettings,
      });

      let result;

      // 画像URLがある場合は画像分析を実行
      if (content.imageUrl) {
        console.log('画像分析を実行します:', content.imageUrl);
        result = await analyzeImageWithText(genAI, content);
      } else {
        // テキストのみの分析
        // プロンプトの作成
        const prompt = `
# コンテンツ分析タスク

## 分析対象
タイトル: ${content.title}
説明: ${content.description || '説明なし'}
URL: ${content.url || 'URLなし'}

## 分析指示
このコンテンツを分析し、以下の情報を抽出してください：
1. 創造性と独自性（最大5つ、スコア付き）
2. 専門性とスキル（最大5つ、スコア付き）
3. 影響力と共感（最大5つ、タイトルと説明付き）
4. 共通のタグリスト（最大10個）

## 出力形式
以下のJSON形式で出力してください：

{
  "originality": {
    "features": [
      {"name": "特徴", "score": 0.9},
      {"name": "特徴", "score": 0.8}
    ],
    "summary": "創造性と独自性に関する簡潔な説明（1-2文）"
  },
  "quality": {
    "categories": [
      {"name": "カテゴリ名", "score": 0.9},
      {"name": "カテゴリ名", "score": 0.8}
    ],
    "summary": "専門性とスキルに関する簡潔な説明（1-2文）"
  },
  "engagement": {
    "points": [
      {"title": "影響力と共感のポイントのタイトル", "description": "詳細説明"},
      {"title": "影響力と共感のポイントのタイトル", "description": "詳細説明"}
    ],
    "summary": "影響力と共感に関する簡潔な説明（1-2文）"
  },
  "tags": ["タグ1", "タグ2", "タグ3"]
}

必ずJSON形式で出力してください。追加の説明やコメントは不要です。
必ず日本語で回答してください。英語は使用しないでください。特徴、カテゴリ名、タグ、影響力と共感のポイントのタイトルと説明、すべて日本語で出力してください。
`;

        // テキスト生成
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        // JSON部分を抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('APIからの応答にJSON形式のデータが含まれていません');
        }
        
        const jsonText = jsonMatch[0];
        console.log('API応答からJSON抽出:', jsonText);
        
        try {
          return JSON.parse(jsonText) as ContentAnalysis;
        } catch (parseError) {
          console.error('JSON解析エラー:', parseError);
          throw new Error('APIレスポンスのJSON解析に失敗しました');
        }
      }
      
      return result;
    } catch (apiError) {
      console.error('Gemini API呼び出しエラー:', apiError);
      
      // エラーの種類に応じたメッセージ
      if (apiError instanceof Error) {
        if (apiError.message.includes('API key')) {
          throw new Error('API keyが無効です。環境変数を確認してください。');
        } else if (apiError.message.includes('quota')) {
          throw new Error('API使用量の上限に達しました。後でもう一度お試しください。');
        } else if (apiError.message.includes('rate')) {
          throw new Error('APIリクエストが多すぎます。しばらく待ってから再試行してください。');
        }
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('コンテンツ分析エラー:', error);
    return getFallbackAnalysis();
  }
}

// 画像とテキストを組み合わせた分析を行う関数
async function analyzeImageWithText(
  genAI: GoogleGenerativeAI, 
  content: ContentInput
): Promise<ContentAnalysis> {
  try {
    if (!content.imageUrl) {
      throw new Error('画像URLが指定されていません');
    }

    console.log('画像分析を開始します。元の画像URL:', content.imageUrl);
    
    // プロキシを経由して画像をBase64に変換
    let imageBase64: string;
    let mimeType: string;
    
    try {
      // プロキシ経由で画像を取得
      console.log('fetchImageViaProxyを呼び出します...');
      const { blob, contentType } = await fetchImageViaProxy(content.imageUrl);
      console.log('fetchImageViaProxyからの応答を受信しました');
      
      console.log('blobToBase64を呼び出します...');
      imageBase64 = await blobToBase64(blob);
      mimeType = contentType;
      console.log('画像の取得と変換に成功しました。MIMEタイプ:', mimeType);
    } catch (fetchError) {
      console.error('画像取得エラー (詳細):', fetchError instanceof Error ? fetchError.stack : String(fetchError));
      throw new Error(`画像の取得に失敗しました: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }
    
    // マルチモーダルモデルを使用
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig,
      safetySettings,
    });
    
    // プロンプトの作成
    const prompt = `
# 画像分析タスク

## 分析対象
この画像は、タイトル「${content.title}」の作品です。
${content.description ? `説明: ${content.description}` : ''}

## 分析指示
この画像を分析し、以下の情報を抽出してください：
1. 創造性と独自性（最大5つ、スコア付き）
2. 専門性とスキル（最大5つ、スコア付き）
3. 影響力と共感（最大5つ、タイトルと説明付き）
4. 共通のタグリスト（最大10個）

## 出力形式
以下のJSON形式で出力してください：

{
  "originality": {
    "features": [
      {"name": "特徴", "score": 0.9},
      {"name": "特徴", "score": 0.8}
    ],
    "summary": "創造性と独自性に関する簡潔な説明（1-2文）"
  },
  "quality": {
    "categories": [
      {"name": "カテゴリ名", "score": 0.9},
      {"name": "カテゴリ名", "score": 0.8}
    ],
    "summary": "専門性とスキルに関する簡潔な説明（1-2文）"
  },
  "engagement": {
    "points": [
      {"title": "影響力と共感のポイントのタイトル", "description": "詳細説明"},
      {"title": "影響力と共感のポイントのタイトル", "description": "詳細説明"}
    ],
    "summary": "影響力と共感に関する簡潔な説明（1-2文）"
  },
  "tags": ["タグ1", "タグ2", "タグ3"]
}

必ずJSON形式で出力してください。追加の説明やコメントは不要です。
必ず日本語で回答してください。英語は使用しないでください。特徴、カテゴリ名、タグ、影響力と共感のポイントのタイトルと説明、すべて日本語で出力してください。
`;
    
    // 画像とテキストを含むコンテンツパーツを作成
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType
      }
    };
    
    const textPart = {
      text: prompt
    };
    
    console.log('Gemini APIにリクエストを送信します');
    
    // マルチモーダル生成リクエスト
    const result = await model.generateContent([imagePart, textPart]);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini APIからレスポンスを受信しました');
    
    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('APIからの応答にJSON形式のデータが含まれていません:', text.substring(0, 200));
      throw new Error('APIからの応答にJSON形式のデータが含まれていません');
    }
    
    const jsonText = jsonMatch[0];
    console.log('画像分析API応答からJSON抽出:', jsonText);
    
    try {
      return JSON.parse(jsonText) as ContentAnalysis;
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      throw new Error('APIレスポンスのJSON解析に失敗しました');
    }
  } catch (error) {
    console.error('画像分析エラー:', error);
    throw error;
  }
}

// BlobをBase64に変換するヘルパー関数
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // data:image/jpeg;base64, の部分を削除
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('FileReaderの結果が文字列ではありません'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// フォールバック分析を返す関数
function getFallbackAnalysis(): ContentAnalysis {
  return {
    originality: {
      features: [
        { name: "一般", score: 0.8 },
        { name: "未分類", score: 0.7 }
      ],
      summary: "APIキーが設定されていないため、詳細な分析ができませんでした。"
    },
    quality: {
      categories: [
        { name: "一般", score: 0.8 },
        { name: "未分類", score: 0.7 }
      ],
      summary: "APIキーが設定されていないため、詳細な分析ができませんでした。"
    },
    engagement: {
      points: [
        { title: "基本情報", description: "コンテンツの基本情報が含まれています。" }
      ],
      summary: "APIキーが設定されていないため、詳細な分析ができませんでした。"
    },
    tags: ["一般", "その他"]
  };
}

// API接続テスト用関数
export async function testGeminiAPI(): Promise<{ success: boolean; message: string; response: string }> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        message: 'APIキーが設定されていません。環境変数VITE_GEMINI_API_KEYを確認してください。',
        response: ''
      };
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 100,
      }
    });

    const prompt = "こんにちは、簡単なテストメッセージです。「Gemini API接続テスト成功」と返してください。";
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      message: 'Gemini APIへの接続に成功しました。',
      response: text
    };
  } catch (error) {
    console.error('Gemini API接続テストエラー:', error);
    
    let errorMessage = 'Gemini APIへの接続中にエラーが発生しました。';
    if (error instanceof Error) {
      errorMessage += ' ' + error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      response: ''
    };
  }
}