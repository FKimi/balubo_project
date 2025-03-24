import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// APIキーが設定されていない場合の警告
if (!GEMINI_API_KEY) {
  console.warn('Missing Gemini API key. Please set VITE_GEMINI_API_KEY in your environment.');
}

// タグ生成用の入力インターフェース
export interface TagGenerationInput {
  title: string;
  description?: string | null;
  url?: string;
  content?: string;
}

// タグ分析結果のインターフェース
export interface TagAnalysisResult {
  tags: Array<{
    name: string;
    relevance: number; // 0-100のスコア
    category?: string; // タグのカテゴリ（オプション）
  }>;
  clusters: Array<{
    name: string; // クラスター名
    tags: string[]; // クラスターに含まれるタグ名
    relevance: number; // クラスターの関連性スコア
  }>;
  summary: string; // タグ分析の要約
}

// Gemini 2.0 Flashのモデル設定
const generationConfig = {
  temperature: 0.7, // タグ生成は少し創造性を抑える
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 4096,
};

/**
 * コンテンツからタグを自動生成する関数
 * @param input タグ生成のための入力データ
 * @returns タグ分析結果
 */
export async function generateTags(input: TagGenerationInput): Promise<TagAnalysisResult> {
  try {
    // APIキーがない場合はフォールバック分析を返す
    if (!GEMINI_API_KEY) {
      console.warn('No Gemini API key provided, returning fallback tags');
      return getFallbackTagAnalysis();
    }

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    try {
      // モデル初期化前にログを追加
      console.log("Initializing Gemini 2.0 Flash model...");
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig,
      });

      // タグ生成用のプロンプト
      const prompt = `
        あなたはコンテンツ分析とタグ付けの専門家です。
        以下のコンテンツを分析し、関連性の高いタグを生成してください。
        
        タイトル: ${input.title}
        ${input.description ? `説明: ${input.description}` : ''}
        ${input.url ? `URL: ${input.url}` : ''}
        ${input.content ? `本文: ${input.content}` : ''}
        
        以下の指示に従って分析してください：
        
        1. 最も関連性の高いタグを20個生成してください。各タグには0-100の関連性スコアを付けてください。
        2. 生成したタグをクラスターに分類してください。各クラスターには名前と関連性スコアを付けてください。
        3. タグ分析の要約を100文字以内で作成してください。
        
        マークダウン形式やコードブロック、余分なテキストなしで、有効なJSONオブジェクトのみで応答してください。
        JSONの構造は以下の通りにしてください：
        
        {
          "tags": [
            {"name": "タグ名", "relevance": 90, "category": "カテゴリ名"}
          ],
          "clusters": [
            {
              "name": "クラスター名",
              "tags": ["タグ名1", "タグ名2"],
              "relevance": 85
            }
          ],
          "summary": "タグ分析の要約"
        }
        
        すべての応答は日本語で提供してください。
      `;

      try {
        console.log("Gemini API - Starting tag generation with 2.0-flash model...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini API - Tag generation successful with 2.0-flash model");

        try {
          // Extract JSON from the response if it's wrapped in markdown code blocks
          let jsonText = text;
          
          // Check if the response is wrapped in markdown code blocks
          const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
          const match = text.match(jsonRegex);
          
          if (match && match[1]) {
            jsonText = match[1].trim();
          }
          
          // Try to parse the response as JSON
          const tagAnalysis = JSON.parse(jsonText);

          // Validate the analysis structure
          if (!tagAnalysis.tags || !tagAnalysis.clusters || !tagAnalysis.summary) {
            console.error('Invalid tag analysis structure:', tagAnalysis);
            throw new Error('Invalid tag analysis structure');
          }

          return tagAnalysis;
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', parseError);
          console.error('Raw response:', text);
          // パースエラーの場合はフォールバック分析を返す
          console.warn('Falling back to pre-defined tags due to parse error');
          return getFallbackTagAnalysis();
        }
      } catch (apiError) {
        console.error('Gemini API error with 2.0-flash model:', apiError);
        // APIエラーの詳細をログに記録
        if (apiError instanceof Error) {
          console.error('Error details:', apiError.message, apiError.stack);
        } else {
          console.error('Unknown error type:', typeof apiError);
        }
        // フォールバックモデルを試す
        throw apiError;
      }
    } catch (modelError) {
      console.error('Error initializing or using Gemini 2.0 Flash model:', modelError);
      console.warn('Falling back to gemini-1.0-pro model...');
      
      // フォールバック: gemini-1.0-proを使用
      try {
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-1.0-pro",
          generationConfig,
        });
        
        // 同じプロンプトを使用
        const prompt = `
          あなたはコンテンツ分析とタグ付けの専門家です。
          以下のコンテンツを分析し、関連性の高いタグを生成してください。
          
          タイトル: ${input.title}
          ${input.description ? `説明: ${input.description}` : ''}
          ${input.url ? `URL: ${input.url}` : ''}
          ${input.content ? `本文: ${input.content}` : ''}
          
          以下の指示に従って分析してください：
          
          1. 最も関連性の高いタグを20個生成してください。各タグには0-100の関連性スコアを付けてください。
          2. 生成したタグをクラスターに分類してください。各クラスターには名前と関連性スコアを付けてください。
          3. タグ分析の要約を100文字以内で作成してください。
          
          マークダウン形式やコードブロック、余分なテキストなしで、有効なJSONオブジェクトのみで応答してください。
          JSONの構造は以下の通りにしてください：
          
          {
            "tags": [
              {"name": "タグ名", "relevance": 90, "category": "カテゴリ名"}
            ],
            "clusters": [
              {
                "name": "クラスター名",
                "tags": ["タグ名1", "タグ名2"],
                "relevance": 85
              }
            ],
            "summary": "タグ分析の要約"
          }
          
          すべての応答は日本語で提供してください。
        `;
        
        console.log("Gemini API - Starting tag generation with fallback 1.0-pro model...");
        const fallbackResult = await fallbackModel.generateContent(prompt);
        const fallbackResponse = await fallbackResult.response;
        const fallbackText = fallbackResponse.text();
        console.log("Gemini API - Tag generation successful with fallback model");
        
        try {
          // Extract JSON from the response if it's wrapped in markdown code blocks
          let jsonText = fallbackText;
          
          // Check if the response is wrapped in markdown code blocks
          const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
          const match = fallbackText.match(jsonRegex);
          
          if (match && match[1]) {
            jsonText = match[1].trim();
          }
          
          // Try to parse the response as JSON
          const tagAnalysis = JSON.parse(jsonText);
          
          // Validate the analysis structure
          if (!tagAnalysis.tags || !tagAnalysis.clusters || !tagAnalysis.summary) {
            console.error('Invalid tag analysis structure from fallback model:', tagAnalysis);
            throw new Error('Invalid tag analysis structure from fallback model');
          }
          
          return tagAnalysis;
        } catch (fallbackParseError) {
          console.error('Failed to parse fallback Gemini response:', fallbackParseError);
          console.error('Raw fallback response:', fallbackText);
          // 最終的にフォールバック分析を返す
          return getFallbackTagAnalysis();
        }
      } catch (fallbackError) {
        console.error('Error with fallback Gemini model:', fallbackError);
        // すべてのAPIアプローチが失敗した場合、フォールバック分析を返す
        return getFallbackTagAnalysis();
      }
    }
  } catch (error) {
    console.error('Unhandled error in generateTags:', error);
    // 最終的なフォールバック
    return getFallbackTagAnalysis();
  }
}

/**
 * タグの関連性を分析する関数
 * @param tagNames 分析対象のタグ名配列
 * @returns 関連性スコアを含むタグ配列
 */
export async function analyzeTagRelevance(tagNames: string[]): Promise<Array<{name: string; relevance: number}>> {
  try {
    // タグの出現頻度を取得
    const { data: tagCounts, error } = await supabase
      .from('work_tags')
      .select('tag_id, tags(name)')
      .in('tags.name', tagNames);

    if (error) {
      console.error('Error fetching tag counts:', error);
      return tagNames.map(name => ({ name, relevance: 50 }));
    }

    // タグの出現回数をカウント
    const counts: Record<string, number> = {};
    tagCounts.forEach((item: { tag_id: string; tags: { name: string }[] }) => {
      const tagName = item.tags?.[0]?.name;
      if (tagName) {
        counts[tagName] = (counts[tagName] || 0) + 1;
      }
    });

    // 最大出現回数を取得
    const maxCount = Math.max(...Object.values(counts), 1);

    // 関連性スコアを計算（出現頻度に基づく）
    return tagNames.map(name => ({
      name,
      relevance: Math.round((counts[name] || 0) / maxCount * 100)
    }));
  } catch (error) {
    console.error('Error in analyzeTagRelevance:', error);
    return tagNames.map(name => ({ name, relevance: 50 }));
  }
}

/**
 * タグをクラスタリングする関数
 * @param tags タグ配列
 * @returns クラスタリング結果
 */
export async function clusterTags(tags: Array<{name: string; relevance: number}>): Promise<Array<{name: string; tags: string[]; relevance: number}>> {
  try {
    if (!GEMINI_API_KEY) {
      console.warn('No Gemini API key provided, returning simple clustering');
      return simpleClusterTags(tags);
    }

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2, // クラスタリングは創造性を抑える
        maxOutputTokens: 4096,
      },
    });

    // タグ配列をJSON文字列に変換
    const tagsJson = JSON.stringify(tags);

    // クラスタリング用のプロンプト
    const prompt = `
      あなたはタグのクラスタリングの専門家です。
      以下のタグリストを意味的な関連性に基づいて3〜5個のクラスターに分類してください。
      
      タグリスト:
      ${tagsJson}
      
      各クラスターには以下の情報を含めてください：
      1. クラスター名：そのクラスターを最もよく表す短い名前
      2. 含まれるタグ：クラスターに属するタグ名の配列
      3. 関連性スコア：クラスター全体の関連性を表す0-100のスコア
      
      マークダウン形式やコードブロック、余分なテキストなしで、有効なJSONオブジェクトのみで応答してください。
      JSONの構造は以下の通りにしてください：
      
      [
        {
          "name": "クラスター名",
          "tags": ["タグ名1", "タグ名2"],
          "relevance": 85
        }
      ]
      
      すべての応答は日本語で提供してください。
    `;

    try {
      console.log("Gemini API - Starting tag clustering...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Gemini API - Tag clustering successful");

      try {
        // Extract JSON from the response if it's wrapped in markdown code blocks
        let jsonText = text;
        
        // Check if the response is wrapped in markdown code blocks
        const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = text.match(jsonRegex);
        
        if (match && match[1]) {
          jsonText = match[1].trim();
        }
        
        // Try to parse the response as JSON
        const clusters = JSON.parse(jsonText);

        // Validate the clusters structure
        if (!Array.isArray(clusters)) {
          console.error('Invalid clusters structure:', clusters);
          throw new Error('Invalid clusters structure');
        }

        return clusters;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.error('Raw response:', text);
        return simpleClusterTags(tags);
      }
    } catch (apiError) {
      console.error('Gemini API error with clustering:', apiError);
      return simpleClusterTags(tags);
    }
  } catch (error) {
    console.error('Error in clusterTags:', error);
    return simpleClusterTags(tags);
  }
}

/**
 * シンプルなタグクラスタリング（APIが使用できない場合のフォールバック）
 * @param tags タグ配列
 * @returns クラスタリング結果
 */
function simpleClusterTags(tags: Array<{name: string; relevance: number}>): Array<{name: string; tags: string[]; relevance: number}> {
  // 関連性スコアでタグをソート
  const sortedTags = [...tags].sort((a, b) => b.relevance - a.relevance);
  
  // 上位のタグを取得
  const topTags = sortedTags.slice(0, Math.min(5, sortedTags.length));
  const remainingTags = sortedTags.slice(Math.min(5, sortedTags.length));
  
  // シンプルなクラスターを作成
  const clusters = [
    {
      name: "主要トピック",
      tags: topTags.map(tag => tag.name),
      relevance: Math.round(topTags.reduce((sum, tag) => sum + tag.relevance, 0) / topTags.length)
    }
  ];
  
  // 残りのタグを2つのクラスターに分割
  if (remainingTags.length > 0) {
    const midPoint = Math.floor(remainingTags.length / 2);
    
    const secondaryTags = remainingTags.slice(0, midPoint);
    clusters.push({
      name: "関連トピック",
      tags: secondaryTags.map(tag => tag.name),
      relevance: Math.round(secondaryTags.reduce((sum, tag) => sum + tag.relevance, 0) / secondaryTags.length)
    });
    
    const tertiaryTags = remainingTags.slice(midPoint);
    if (tertiaryTags.length > 0) {
      clusters.push({
        name: "周辺トピック",
        tags: tertiaryTags.map(tag => tag.name),
        relevance: Math.round(tertiaryTags.reduce((sum, tag) => sum + tag.relevance, 0) / tertiaryTags.length)
      });
    }
  }
  
  return clusters;
}

/**
 * タグの時系列変化を分析する関数
 * @param userId ユーザーID
 * @returns 時系列分析結果
 */
export async function analyzeTagTimeline(userId: string): Promise<Array<{period: string; tags: Array<{name: string; count: number}>}>> {
  try {
    // ユーザーの作品を取得
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (worksError) {
      console.error('Error fetching works:', worksError);
      return [];
    }
    
    // 作品がない場合は空配列を返す
    if (!works || works.length === 0) {
      return [];
    }
    
    // 作品IDを配列に格納
    const workIds = works.map(work => work.id);
    
    // 作品に関連するタグを取得
    const { data: workTags, error: tagsError } = await supabase
      .from('work_tags')
      .select('work_id, tag_id, tags(name), works(created_at)')
      .in('work_id', workIds);
    
    if (tagsError) {
      console.error('Error fetching work tags:', tagsError);
      return [];
    }
    
    // 作品の作成日時でグループ化
    const tagsByMonth: Record<string, Record<string, number>> = {};
    
    workTags.forEach((item: { work_id: string; tag_id: string; tags: { name: string }[]; works: { created_at: string }[] }) => {
      const createdAt = item.works?.[0]?.created_at;
      const tagName = item.tags?.[0]?.name;
      
      if (createdAt && tagName) {
        // 年月のフォーマット（例：2025-03）
        const date = new Date(createdAt);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!tagsByMonth[yearMonth]) {
          tagsByMonth[yearMonth] = {};
        }
        
        tagsByMonth[yearMonth][tagName] = (tagsByMonth[yearMonth][tagName] || 0) + 1;
      }
    });
    
    // 結果を整形
    const timeline = Object.entries(tagsByMonth).map(([period, tags]) => {
      return {
        period,
        tags: Object.entries(tags).map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10) // 上位10個のタグのみを含める
      };
    }).sort((a, b) => a.period.localeCompare(b.period));
    
    return timeline;
  } catch (error) {
    console.error('Error in analyzeTagTimeline:', error);
    return [];
  }
}

// Netlify FunctionsのURL
const NETLIFY_FUNCTIONS_BASE_URL = import.meta.env.PROD 
  ? 'https://eclectic-queijadas-227e9b.netlify.app/.netlify/functions'
  : '/.netlify/functions';

/**
 * タグ分析結果をデータベースに保存する関数
 * @param userId ユーザーID
 * @param tagAnalysis タグ分析結果
 * @returns 保存結果
 */
export async function saveTagAnalytics(userId: string, tagAnalysis: TagAnalysisResult): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`saveTagAnalytics関数が呼び出されました: userId=${userId}`);
    
    // Netlify Functionsを使用してタグ分析結果を保存
    try {
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/save-tag-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          tagAnalysis 
        }),
      });
      
      if (!response.ok) {
        // APIエンドポイントからのエラーレスポンスを処理
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error saving tag analytics via Netlify Function: ${response.status}`, errorData);
        
        // フォールバック: 直接データベースに保存を試みる
        console.log('フォールバック処理を実行: 直接データベースに保存を試みます');
        return await fallbackSaveTagAnalytics(userId, tagAnalysis);
      }
      
      console.log('タグ分析結果を正常に保存しました');
      // 成功レスポンスを返す
      return { success: true };
    } catch (apiError) {
      console.error('Error calling save-tag-analytics Function:', apiError);
      
      // APIエンドポイントが利用できない場合は直接データベースに保存を試みる
      console.log('フォールバック処理を実行: 直接データベースに保存を試みます');
      return await fallbackSaveTagAnalytics(userId, tagAnalysis);
    }
  } catch (error) {
    console.error('Error in saveTagAnalytics:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * タグ分析結果をデータベースに直接保存するフォールバック関数
 * APIエンドポイントが利用できない場合に使用
 * @param userId ユーザーID
 * @param tagAnalysis タグ分析結果
 * @returns 保存結果
 */
async function fallbackSaveTagAnalytics(userId: string, tagAnalysis: TagAnalysisResult): Promise<{ success: boolean; error?: string }> {
  try {
    // タグトレンド（タグの出現頻度）
    const tagTrends = {
      tags: tagAnalysis.tags.map(tag => ({
        name: tag.name,
        relevance: tag.relevance
      }))
    };
    
    // タグクラスター
    const tagClusters = {
      clusters: tagAnalysis.clusters
    };
    
    // タイムライン（空のオブジェクト、後で別の関数で更新）
    const tagTimeline = {};
    
    // まず既存のレコードを確認
    const { data: existingRecord, error: selectError } = await supabase
      .from('tag_analytics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (selectError) {
      console.error('Error checking existing tag analytics:', selectError);
      return { success: false, error: selectError.message };
    }
    
    let error;
    
    if (existingRecord) {
      // 既存レコードがある場合は更新
      const { error: updateError } = await supabase
        .from('tag_analytics')
        .update({
          tag_trends: tagTrends,
          tag_clusters: tagClusters,
          tag_timeline: tagTimeline,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
      
      error = updateError;
    } else {
      // 新規レコードを作成
      const { error: insertError } = await supabase
        .from('tag_analytics')
        .insert({
          user_id: userId,
          tag_trends: tagTrends,
          tag_clusters: tagClusters,
          tag_timeline: tagTimeline,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      error = insertError;
    }
    
    if (error) {
      console.error('Error saving tag analytics:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in fallbackSaveTagAnalytics:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * フォールバックのタグ分析結果を返す関数
 * @returns フォールバックのタグ分析結果
 */
function getFallbackTagAnalysis(): TagAnalysisResult {
  return {
    tags: [
      { name: "テクノロジー", relevance: 95, category: "トピック" },
      { name: "プログラミング", relevance: 90, category: "スキル" },
      { name: "ウェブ開発", relevance: 85, category: "分野" },
      { name: "AI", relevance: 80, category: "トピック" },
      { name: "データ分析", relevance: 75, category: "スキル" },
      { name: "UX", relevance: 70, category: "分野" },
      { name: "デザイン思考", relevance: 65, category: "アプローチ" },
      { name: "フロントエンド", relevance: 60, category: "専門" },
      { name: "React", relevance: 55, category: "技術" },
      { name: "TypeScript", relevance: 50, category: "言語" }
    ],
    clusters: [
      {
        name: "開発技術",
        tags: ["プログラミング", "ウェブ開発", "フロントエンド", "React", "TypeScript"],
        relevance: 85
      },
      {
        name: "先端技術",
        tags: ["テクノロジー", "AI", "データ分析"],
        relevance: 80
      },
      {
        name: "デザイン",
        tags: ["UX", "デザイン思考"],
        relevance: 70
      }
    ],
    summary: "テクノロジーとプログラミングを中心に、ウェブ開発とAIに強い関心を持つコンテンツです。UXデザインの要素も含まれています。"
  };
}
