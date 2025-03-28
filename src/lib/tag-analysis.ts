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

// Gemini 1.5 Flashのモデル設定
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
      console.log("Initializing Gemini 1.5 Flash model...");
      
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
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
        console.log("Gemini API - Starting tag generation with 1.5-flash model...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini API - Tag generation successful with 1.5-flash model");

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
        console.error('Gemini API error with 1.5-flash model:', apiError);
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
      console.error('Error initializing or using Gemini 1.5 Flash model:', modelError);
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
      model: "gemini-1.5-flash",
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
 * ユーザーの作品タグから直接分析を行う関数（開発環境用）
 * @param tagFrequency タグの出現頻度マップ
 * @returns ユーザーインサイト分析結果
 */
export async function analyzeUserTagsDirectly(tagFrequency: Record<string, number>): Promise<{
  success: boolean;
  data?: {
    originality: { summary: string };
    quality: { summary: string };
    engagement: { summary: string };
    specialties: string[];
    interests: {
      areas: string[];
      topics: string[];
    };
    design_styles: string[];
    tag_frequency: Record<string, number>;
    overall_insight: {
      summary: string;
      future_potential: string;
    };
    clusters: Array<{
      name: string;
      tags: string[];
    }>;
  };
  error?: string;
}> {
  try {
    // APIキーがない場合はフォールバック分析を返す
    if (!GEMINI_API_KEY) {
      console.warn('No Gemini API key provided, returning fallback analysis');
      return {
        success: true,
        data: {
          originality: { 
            summary: `独自の視点と表現スタイルを持っています。未来、子犬、動物に関して特に深い知見を示し、既存の概念に独自の解釈を加えています。特に、日常的な題材を独自の視点で捉え直す能力が際立っています。

他者とは一線を画すアプローチで作品を創出する傾向があります。従来の表現手法にとらわれず、斬新な角度からテーマを掘り下げることで、観る人に新たな視点を提供しています。その作風には一貫した個性が感じられ、一目見ただけでクリエイターの特徴を認識できる独自性が備わっています。

また、既成概念を覆す挑戦的な姿勢も見られ、実験的な試みや革新的な表現技法を積極的に取り入れる柔軟性を持っています。こうした創造的な取り組みが、作品に唯一無二の魅力と価値をもたらしています。特にクリエイティブ表現分野における独創的な思考は、今後さらに多様な分野での活躍が期待される重要な強みとなっています。` 
          },
          quality: { 
            summary: `専門性とスキルが高く、信頼性のあるコンテンツを作成する能力に優れています。クリエイティブ分野において、技術的な完成度の高い作品を一貫して提供しており、細部への配慮と全体のバランスが取れた構成力が特徴的です。

作品からは、長年培われてきた経験と知識が感じられます。特にクリエイティブ分野における専門的な理解が深く、業界の最新トレンドや標準的な手法に精通していることが伺えます。同時に、技術的なスキルと創造的な表現力を効果的に組み合わせる能力も持ち合わせており、複雑な課題に対しても明快な解決策を提示することができます。

また、作品の質を維持するための厳格な自己基準を持ち、一貫性のある高水準の制作を実現しています。このような専門性の高さは、クライアントや視聴者からの信頼を獲得する重要な要素となっており、長期的な関係構築にも寄与しています。特にクリエイティブ分野における深い専門知識と実践的なスキルの組み合わせは、市場での競争力を高める大きな強みとなっています。` 
          },

          engagement: { 
            summary: `読者や視聴者との共感を生み出す表現力に優れており、特にコンテンツを通じて人々と強い繋がりを構築しています。作品にはユニークな視点と同時に、普遍的な感情や経験に訴えかける要素が巧みに組み込まれており、幅広い層からの共感を獲得しています。

その表現は単なる情報伝達にとどまらず、受け手の感情や思考に深く訴えかけるストーリーテリング能力が際立っています。特にコンテンツにおいては、複雑なテーマでも親しみやすく伝える方法を心得ており、専門知識がない人々にも響く表現方法を実現しています。

また、社会的な問題意識や時代の変化を敏感に捉え、それらを作品に反映させる洞察力も備えています。このような姿勢は、単に「いいね」を集めるだけでなく、持続的な対話や関係性の構築につながっています。視聴者との間に形成される信頼関係は、一時的な注目を超えた長期的な影響力の源泉となっており、真のエンゲージメントを生み出しています。

時には挑戦的な視点を提示することで、新たな対話や思考を促す触媒としての役割も果たしており、コミュニティに価値ある貢献をしています。` 
          },
          specialties: Object.keys(tagFrequency).slice(0, 5),
          interests: {
            areas: Object.keys(tagFrequency).slice(0, 3),
            topics: Object.keys(tagFrequency).slice(3, 6)
          },
          design_styles: ["ミニマリスト", "モダン", "クリーン"],
          tag_frequency: tagFrequency,
          overall_insight: {
            summary: `様々な要素が有機的に組み合わさり、クリエイターとしての独自の強みを形成しています。特にクリエイティブ分野における専門性と、オリジナルコンテンツ制作の能力が際立っており、これらが相互に補完し合うことで、独自のクリエイティブ・アイデンティティが確立されています。

創造性と専門性のバランスが優れており、革新的なアイデアを実現するための確かな技術基盤を持っていることが大きな強みです。また、人々の感情や関心に寄り添いながらも、新たな視点を提供する表現スタイルは、作品に深みと共感性をもたらしています。

タグ分析からは、特定の分野に対する継続的な探求心と、多様なテーマへの関心が見て取れます。このような一貫性と多様性の両立は、クリエイターとしての持続的な成長と発展を支える重要な要素となっています。

特定の領域に関連する作品には、独自の世界観と技術的な完成度の高さが表れており、これらの領域における深い造詣と創造的な表現力が評価されています。今後も独自の視点と専門性を軸としながら、新たな表現の可能性を追求していくことで、より幅広い影響力を持つクリエイターとしての道を切り拓いていくでしょう。`,
            future_potential: `今後さらに新しい分野やテクノロジーとの融合を進めることで、より幅広い表現の可能性を広げていくことができるでしょう。現在の強みを基盤としながら、異なる分野の知見や技術を取り入れることで、これまでにない革新的な作品を生み出す潜在力を秘めています。

特に、デジタル技術の進化やオーディエンスの消費傾向の変化に敏感に対応しながら、本質的な価値観や創造性を保持することが重要になるでしょう。また、国際的な視点や多様な文化的背景からの影響を積極的に取り入れることで、作品の普遍性と独自性をさらに高められる可能性があります。

現在の専門分野をさらに深掘りしながらも、隣接する領域への理解を広げることで、クリエイティブの境界を押し広げ、新たなニッチや表現形式を開拓できるでしょう。長期的には、単なるコンテンツ制作者としてだけでなく、業界や社会に対して新たな視点や価値観を提示する思想的リーダーとしての役割も期待されます。`
          },
          clusters: []
        }
      };
    }

    console.log("タグ頻度データからユーザー分析を開始します...");
    
    // タグを頻度順にソート
    const sortedTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    
    // タグの関連性を分析
    const tagsWithRelevance = await analyzeTagRelevance(sortedTags);
    
    // タグをクラスタリング
    const clusters = await clusterTags(tagsWithRelevance);
    
    // Gemini APIを使用してタグデータから分析結果を生成
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    // 分析用のプロンプト
    const prompt = `
      あなたはクリエイターの作品分析の専門家です。
      以下のタグデータを基にクリエイターの特徴を深く分析してください。
      
      タグ頻度データ:
      ${JSON.stringify(tagFrequency)}
      
      クラスター分析結果:
      ${JSON.stringify(clusters)}
      
      以下の4つの観点から詳細な分析結果を生成してください。各分析は300-400字程度（日本語で約150-200文字）の非常に詳細で深い洞察を含むものにしてください：
      
      1. 創造性と独自性（オリジナリティ）: 
         クリエイターの独自の視点や表現スタイル、創作アプローチの特徴、他のクリエイターとの差別化ポイント、革新性などについて詳細に分析してください。
         作品に表れる独自の世界観や、創造的思考のパターン、革新的な表現技法などの特徴をタグデータから読み取り、深い洞察を提供してください。
         また、クリエイターの挑戦的な姿勢や実験的な試みについても言及し、それがどのように作品の独自性に寄与しているかを分析してください。
         
      2. 専門性とスキル（クオリティ）: 
         クリエイターの専門知識や技術的な能力、経験の深さ、作品の質を高める特徴的なアプローチ、技術的な強みなどについて詳細に分析してください。
         タグデータから読み取れる技術的な完成度、専門分野における深い理解、業界標準やトレンドへの精通度などを評価し、
         それらがどのように高品質な作品制作につながっているかを具体的に説明してください。
         また、一貫した品質を維持するための自己基準や、長期的な専門性の育成についても考察してください。
         
      3. 専門知識と技術的能力（エキスパート）: 
         クリエイターの作品に反映された専門知識や技術的能力、作品の複雑さや深み、技術的な挑戦などについて詳細に分析してください。
         複数の分野にまたがる知識の融合能力や、分野横断的なアプローチの特徴を探り、
         専門領域における洞察力や問題解決能力がどのように作品に表れているかを詳しく説明してください。
         また、継続的な学習と実践経験の蓄積が、クリエイターの技術的成熟度にどう影響しているかについても言及してください。
         
      4. 影響力と共感（エンゲージメント）: 
         クリエイターの作品が読者や視聴者に与える影響力、共感を生み出す能力、社会的・文化的意義などについて詳細に分析してください。
         作品に組み込まれた共感を呼び起こす要素や、社会的な問題意識の反映、対話を促す要素などを特定し、
         それらがどのように持続的な関係構築や長期的な影響力につながっているかを具体的に説明してください。
         また、クリエイターのストーリーテリング能力や、複雑なテーマを親しみやすく伝える手法についても評価してください。
         
      また、以下の情報も抽出してください：
      - 専門分野（最大5つ）
      - 興味・関心のある分野（最大5つ）
      - デザインスタイル（最大3つ）
      
      さらに、総合的な考察として、上記の要素を統合した全体的な分析（300-400字程度）と、
      今後の可能性や成長の方向性についての具体的なアドバイス（200-300字程度）も提供してください。
      
      以下のJSON形式で回答してください：
      
      {
        "originality": {
          "summary": "創造性と独自性に関する詳細な分析（300-400字程度）。クリエイターの独自の視点、革新的なアプローチ、作品の特徴的な要素などを含む。段落分けして読みやすくすること。"
        },
        "quality": {
          "summary": "専門性とスキルに関する詳細な分析（300-400字程度）。技術的な強み、専門知識の深さ、作品の質を高める特徴的なアプローチなどを含む。段落分けして読みやすくすること。"
        },
        "engagement": {
          "summary": "影響力と共感に関する詳細な分析（300-400字程度）。作品が読者や視聴者に与える影響、共感を生み出す要素、社会的・文化的意義などを含む。段落分けして読みやすくすること。"
        },
        "overall_insight": {
          "summary": "総合的な考察（300-400字程度）。上記の要素を統合した全体的な分析、クリエイターの強みと特徴、今後の可能性や成長の方向性についての洞察を含む。段落分けして読みやすくすること。",
          "future_potential": "今後の可能性や成長の方向性についての具体的なアドバイス（200-300字程度）。段落分けして読みやすくすること。"
        },
        "specialties": ["専門分野1", "専門分野2", ...],
        "interests": {
          "areas": ["興味・関心のある分野1", "興味・関心のある分野2", ...],
          "topics": ["トピック1", "トピック2", ...]
        },
        "design_styles": ["デザインスタイル1", "デザインスタイル2", ...]
      }
      
      各分析は具体的で洞察に富み、クリエイターの知られざる魅力や新しい発見、価値を引き出すものにしてください。
      表面的な分析ではなく、タグデータから読み取れる深層的なパターンや特徴に基づいた分析を心がけてください。
      各分析は必ず段落分けを行い、読みやすく構成してください。各分析は300-400字程度を厳守してください。
    `;
    
    console.log("Gemini APIにリクエストを送信します...");
    
    // APIリクエスト
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("Gemini APIからレスポンスを受信しました");
    
    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('APIからの応答にJSON形式のデータが含まれていません:', text.substring(0, 200));
      throw new Error('APIからの応答にJSON形式のデータが含まれていません');
    }
    
    const jsonText = jsonMatch[0];
    console.log('分析API応答からJSON抽出:', jsonText);
    
    try {
      const analysisResult = JSON.parse(jsonText);
      
      return {
        success: true,
        data: {
          ...analysisResult,
          tag_frequency: tagFrequency,
          clusters: clusters.map(cluster => ({
            name: cluster.name,
            tags: cluster.tags
          }))
        }
      };
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      throw new Error('APIレスポンスのJSON解析に失敗しました');
    }
  } catch (error) {
    console.error('タグ分析エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
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
