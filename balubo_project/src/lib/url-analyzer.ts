import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { supabase } from './supabase';
import { scrapeUrl } from './url-scraper';

// Gemini APIの初期化
const getGeminiAPI = () => {
  // 環境変数からAPIキーを取得
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBiWIbXXRT0wDqHl8VdChfLmmBN_VKuseQ';
  
  if (!apiKey) {
    console.error('Gemini API key is not set');
    throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
  }
  
  console.log('Initializing Gemini API with key:', apiKey.substring(0, 5) + '...');
  return new GoogleGenerativeAI(apiKey);
};

// メタデータの型定義
export interface UrlMetadata {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
}

// タグの型定義
export interface Tag {
  name: string;
  relevance: number;
  category?: string;
}

// 分析結果の型定義
export interface AnalysisResult {
  summary: string;
  tags: Tag[];
}

// URL分析結果の型定義
export interface UrlAnalysisResult {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  tags: Tag[];
}

/**
 * URLからメタデータとコンテンツを取得する
 * @param url 分析対象のURL
 * @returns メタデータとコンテンツ
 */
export const fetchUrlContent = async (url: string): Promise<{ metadata: UrlMetadata, content: string }> => {
  try {
    console.log('Fetching content from URL:', url);
    
    // URLにプロトコルがない場合は追加
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    
    // Puppeteerを使用してURLからデータを取得
    const scrapingResult = await scrapeUrl(url);
    
    // スクレイピング結果をURLアナライザーの形式に変換
    const metadata: UrlMetadata = {
      title: scrapingResult.metadata.title,
      description: scrapingResult.metadata.description,
      imageUrl: scrapingResult.metadata.thumbnail_url,
      url: scrapingResult.metadata.url || url,
    };
    
    const content = scrapingResult.main_content;
    
    console.log('Successfully fetched content from URL:', url);
    return { metadata, content };
  } catch (error) {
    console.error('Error in fetchUrlContent:', error);
    throw error;
  }
};

/**
 * Gemini APIを使用してコンテンツを分析する
 * @param metadata URLメタデータ
 * @param content コンテンツ本文
 * @returns 分析結果（要約とタグ）
 */
export const analyzeContentWithGemini = async (
  metadata: UrlMetadata,
  content: string
): Promise<AnalysisResult> => {
  try {
    console.log('Analyzing content with Gemini API');
    const genAI = getGeminiAPI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    // コンテンツが長すぎる場合は切り詰める
    const truncatedContent = content.length > 10000 ? content.substring(0, 10000) + '...' : content;

    // プロンプトの作成
    const prompt = `
# コンテンツ分析タスク

## 分析対象
タイトル: ${metadata.title}
説明: ${metadata.description}
URL: ${metadata.url}

## 本文コンテンツ
${truncatedContent}

## 分析指示
1. 上記コンテンツの要約を200字程度で作成してください。
2. コンテンツに関連するタグを5つ抽出し、各タグの関連度（0.0〜1.0）を設定してください。
3. タグはスキルや技術に関連するものを優先してください。

## 出力形式
以下のJSON形式で出力してください：
{
  "summary": "コンテンツの要約（200字程度）",
  "tags": [
    {"name": "タグ1", "relevance": 0.9},
    {"name": "タグ2", "relevance": 0.8},
    {"name": "タグ3", "relevance": 0.7},
    {"name": "タグ4", "relevance": 0.6},
    {"name": "タグ5", "relevance": 0.5}
  ]
}

## 特別な指示
- JSONのみを出力し、他の説明は一切含めないでください
- タグは関連度が高い順に並べてください
- タグの関連度は0.0〜1.0の範囲で設定してください
`;

    // Gemini APIにリクエスト
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings,
    });

    const response = result.response;
    const text = response.text();

    // JSONを抽出（余分なテキストがある場合に対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini API response');
    }

    const jsonText = jsonMatch[0];
    const analysisResult = JSON.parse(jsonText) as AnalysisResult;

    // 必須フィールドの確認と設定
    return {
      summary: analysisResult.summary || '要約を生成できませんでした。',
      tags: Array.isArray(analysisResult.tags) ? analysisResult.tags : [],
    };
  } catch (error) {
    console.error('Error in analyzeContentWithGemini:', error);
    throw error;
  }
};

/**
 * URLを分析して結果を返す
 * @param url 分析対象のURL
 * @returns 分析結果
 */
export const analyzeUrl = async (url: string): Promise<UrlAnalysisResult> => {
  try {
    // 1. URLからメタデータとコンテンツを取得
    const { metadata, content } = await fetchUrlContent(url);
    
    // 2. コンテンツを分析
    const analysisData = await analyzeContentWithGemini(metadata, content);
    
    // 3. 結果を整形
    const result: UrlAnalysisResult = {
      url: metadata.url,
      title: metadata.title,
      description: analysisData.summary || metadata.description,
      imageUrl: metadata.imageUrl,
      tags: analysisData.tags || []
    };
    
    return result;
  } catch (error) {
    console.error('Error in analyzeUrl:', error);
    throw error;
  }
};

/**
 * 分析結果をデータベースに保存する
 * @param userId ユーザーID
 * @param analysis 分析結果
 * @returns 作品ID
 */
export const saveAnalysisToDatabase = async (
  userId: string,
  analysis: UrlAnalysisResult
): Promise<string> => {
  try {
    console.log('Saving analysis to database for user:', userId);
    
    // 1. worksテーブルに作品情報を保存
    const { data: workData, error: workError } = await supabase
      .from('works')
      .insert([
        {
          user_id: userId,
          title: analysis.title,
          description: analysis.description,
          image_url: analysis.imageUrl,
          url: analysis.url,
          created_at: new Date().toISOString(),
        }
      ])
      .select();
    
    if (workError) {
      console.error('Error inserting work:', workError);
      throw new Error(`Failed to save work: ${workError.message}`);
    }
    
    if (!workData || workData.length === 0) {
      throw new Error('No work data returned after insert');
    }
    
    const workId = workData[0].id;
    console.log('Work saved with ID:', workId);
    
    // 2. tagsテーブルにタグ情報を保存
    if (analysis.tags && analysis.tags.length > 0) {
      // タグの一括挿入用の配列
      const tagInserts = analysis.tags.map(tag => ({
        work_id: workId,
        name: tag.name,
        relevance: tag.relevance,
        category: tag.category || null,
      }));
      
      const { error: tagError } = await supabase
        .from('tags')
        .insert(tagInserts);
      
      if (tagError) {
        console.error('Error inserting tags:', tagError);
        // タグの挿入エラーは致命的ではないので、警告のみ
        console.warn(`Tags were not saved for work ${workId}: ${tagError.message}`);
      } else {
        console.log(`Saved ${tagInserts.length} tags for work ${workId}`);
      }
    }
    
    return workId;
  } catch (error) {
    console.error('Error in saveAnalysisToDatabase:', error);
    throw error;
  }
};
