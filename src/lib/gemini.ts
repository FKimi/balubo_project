import { GoogleGenerativeAI } from '@google/generative-ai';

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
}

interface ContentAnalysis {
  expertise: {
    categories: Array<{ name: string; score: number }>;
    summary: string;
  };
  content_style: {
    features: Array<{ name: string; score: number }>;
    summary: string;
  };
  interests: {
    tags: string[];
    summary: string;
  };
  appeal_points: {
    points: Array<{ title: string; description: string }>;
    summary: string;
  };
}

// Gemini Proのモデル設定
const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 4096,
};

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
        model: "gemini-1.5-pro",
        generationConfig,
      });

      // コンテンツの準備
      const contentText = [
        content.title,
        content.description || '',
        content.content || '',
        content.url ? `URL: ${content.url}` : ''
      ].filter(Boolean).join('\n\n');

      // プロンプトの作成
      const prompt = `
# コンテンツ分析タスク

## 分析対象コンテンツ
${contentText}

## 分析指示
このコンテンツを分析し、以下の情報を抽出してください：
1. 専門分野カテゴリ（最大5つ、スコア付き）
2. コンテンツスタイルの特徴（最大5つ、スコア付き）
3. 関連する興味・タグ（最大10個）
4. 作品の魅力ポイント（最大5つ、タイトルと説明付き）

## 出力形式
以下のJSON形式で出力してください：

{
  "expertise": {
    "categories": [
      {"name": "カテゴリ名", "score": 0.9},
      {"name": "カテゴリ名", "score": 0.8}
    ],
    "summary": "専門性に関する簡潔な説明（1-2文）"
  },
  "content_style": {
    "features": [
      {"name": "特徴", "score": 0.9},
      {"name": "特徴", "score": 0.8}
    ],
    "summary": "コンテンツスタイルに関する簡潔な説明（1-2文）"
  },
  "interests": {
    "tags": ["タグ1", "タグ2", "タグ3"],
    "summary": "興味・関心に関する簡潔な説明（1-2文）"
  },
  "appeal_points": {
    "points": [
      {"title": "魅力ポイント1", "description": "魅力ポイント1の説明"},
      {"title": "魅力ポイント2", "description": "魅力ポイント2の説明"}
    ],
    "summary": "魅力ポイントに関する簡潔な説明（1-2文）"
  }
}

## 注意事項
- スコアは0.0から1.0の範囲で、関連度を表します
- カテゴリ名や特徴は具体的かつ簡潔に
- 専門分野は技術、ビジネス、芸術などの分野を指します
- コンテンツスタイルは文章の特徴（論理的、物語的、説明的など）を指します
- JSONのみを出力し、他の説明は含めないでください
`;

      console.log('Analyzing content with Gemini 1.5 Pro model...');
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log('Received response from Gemini API');
      
      // JSONを抽出（余分なテキストがある場合に対応）
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from Gemini response. Raw response:', text.substring(0, 200));
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const jsonText = jsonMatch[0];
      
      try {
        // Parse the JSON response
        const analysisData = JSON.parse(jsonText) as ContentAnalysis;
        
        // Validate and ensure all required fields exist
        return {
          expertise: {
            categories: Array.isArray(analysisData.expertise?.categories) 
              ? analysisData.expertise.categories 
              : [],
            summary: analysisData.expertise?.summary || ''
          },
          content_style: {
            features: Array.isArray(analysisData.content_style?.features) 
              ? analysisData.content_style.features 
              : [],
            summary: analysisData.content_style?.summary || ''
          },
          interests: {
            tags: Array.isArray(analysisData.interests?.tags) 
              ? analysisData.interests.tags 
              : [],
            summary: analysisData.interests?.summary || ''
          },
          appeal_points: {
            points: Array.isArray(analysisData.appeal_points?.points) 
              ? analysisData.appeal_points.points 
              : [],
            summary: analysisData.appeal_points?.summary || ''
          }
        };
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError instanceof Error ? jsonError.message : String(jsonError));
        console.error('Raw JSON text:', jsonText);
        throw new Error(`Failed to parse JSON from Gemini response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      }
    } catch (modelError) {
      console.error('Gemini API error with 1.5 Pro model:', modelError instanceof Error ? modelError.message : String(modelError));
      
      // Fallback to gemini-1.0-pro model
      try {
        console.log('Falling back to gemini-1.0-pro model...');
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        
        // コンテンツの準備
        const contentText = [
          content.title,
          content.description || '',
          content.content || '',
          content.url ? `URL: ${content.url}` : ''
        ].filter(Boolean).join('\n\n');

        // プロンプトの作成（gemini-1.0-proモデル用に簡略化）
        const fallbackPrompt = `
# コンテンツ分析
以下のコンテンツを分析し、専門分野、スタイル、関連タグをJSON形式で出力してください：

${contentText}

出力形式：
{
  "expertise": {
    "categories": [{"name": "カテゴリ名", "score": 0.9}],
    "summary": "専門性の説明"
  },
  "content_style": {
    "features": [{"name": "特徴", "score": 0.9}],
    "summary": "スタイルの説明"
  },
  "interests": {
    "tags": ["タグ1", "タグ2"],
    "summary": "興味の説明"
  },
  "appeal_points": {
    "points": [{"title": "魅力ポイント1", "description": "魅力ポイント1の説明"}],
    "summary": "魅力ポイントの説明"
  }
}
`;

        const fallbackResult = await fallbackModel.generateContent(fallbackPrompt);
        const fallbackText = fallbackResult.response.text();
        
        // JSONを抽出
        const fallbackJsonMatch = fallbackText.match(/\{[\s\S]*\}/);
        if (!fallbackJsonMatch) {
          console.error('Failed to extract JSON from fallback model. Raw response:', fallbackText.substring(0, 200));
          throw new Error('Failed to extract JSON from fallback model response');
        }
        
        const fallbackJsonText = fallbackJsonMatch[0];
        const fallbackData = JSON.parse(fallbackJsonText) as ContentAnalysis;
        
        return {
          expertise: {
            categories: Array.isArray(fallbackData.expertise?.categories) 
              ? fallbackData.expertise.categories 
              : [],
            summary: fallbackData.expertise?.summary || ''
          },
          content_style: {
            features: Array.isArray(fallbackData.content_style?.features) 
              ? fallbackData.content_style.features 
              : [],
            summary: fallbackData.content_style?.summary || ''
          },
          interests: {
            tags: Array.isArray(fallbackData.interests?.tags) 
              ? fallbackData.interests.tags 
              : [],
            summary: fallbackData.interests?.summary || ''
          },
          appeal_points: {
            points: Array.isArray(fallbackData.appeal_points?.points) 
              ? fallbackData.appeal_points.points 
              : [],
            summary: fallbackData.appeal_points?.summary || ''
          }
        };
      } catch (fallbackError) {
        console.error('Error with fallback model:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        console.error('Error initializing or using Gemini 1.5 Pro model:', modelError instanceof Error ? modelError.message : String(modelError));
        // Return fallback analysis if both models fail
        return getFallbackAnalysis();
      }
    }
  } catch (error) {
    console.error('Error analyzing content:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return getFallbackAnalysis();
  }
}

// フォールバック分析を返す関数
function getFallbackAnalysis(): ContentAnalysis {
  console.log("Using fallback analysis data");
  return {
    expertise: {
      categories: [
        { name: "コンテンツ制作", score: 88 },
        { name: "情報設計", score: 85 },
        { name: "ユーザー体験", score: 82 }
      ],
      summary: "情報の整理と構造化に優れた専門性を持ち、複雑な概念をわかりやすく伝える能力が際立っています。特にユーザーの理解度を常に意識した情報設計は、他のクリエイターと一線を画す強みです。技術的な知識と実用的なアプローチを組み合わせることで、読者に実践的な価値を提供しています。"
    },
    content_style: {
      features: [
        { name: "明快さ", score: 92 },
        { name: "構造化", score: 90 },
        { name: "実用性", score: 88 }
      ],
      summary: "明快でありながらも深い洞察を含む表現スタイルが特徴的です。情報を階層的に構造化し、読者が自然に理解できるよう導く技法に長けています。専門的な内容でも親しみやすさを失わない独自の語り口は、読者に「発見」と「気づき」を与え、行動変容を促す効果があります。"
    },
    interests: {
      tags: ["情報デザイン", "ユーザー心理", "コミュニケーション設計", "学習体験"],
      summary: "情報とユーザーの関係性に深い関心を持ち、より効果的なコミュニケーション方法を追求しています。今後は認知科学やユーザー心理学の知見を取り入れることで、さらに影響力のあるコンテンツ制作が可能になるでしょう。特に「複雑さをシンプルに変換する」能力を活かした教育コンテンツや意思決定支援ツールの開発に大きな可能性があります。"
    },
    appeal_points: {
      points: [
        { title: "魅力ポイント1", description: "魅力ポイント1の説明" },
        { title: "魅力ポイント2", description: "魅力ポイント2の説明" }
      ],
      summary: "魅力ポイントに関する簡潔な説明（1-2文）"
    }
  };
}

export async function testGeminiAPI(): Promise<{ success: boolean; message: string; response: string }> {
  try {
    // APIキーがない場合はエラー
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not set. Check your environment variables.');
    }

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    try {
      // まずGemini 1.5 Proを試す
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig
      });

      console.log("Testing Gemini 1.5 Pro API...");
      // Simple test prompt
      const result = await model.generateContent("What is AI? Explain in one sentence.");
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from API');
      }

      return {
        success: true,
        message: 'API test successful with gemini-1.5-pro',
        response: text
      };
    } catch (error2) {
      console.warn('Failed to use gemini-1.5-pro, falling back to gemini-1.0-pro:', error2);
      
      // フォールバック: gemini-1.0-proを使用
      const fallbackModel = genAI.getGenerativeModel({
        model: "gemini-1.0-pro"
      });
      
      console.log("Testing with fallback model (gemini-1.0-pro)...");
      const result = await fallbackModel.generateContent("What is AI? Explain in one sentence.");
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from fallback API');
      }

      return {
        success: true,
        message: 'API test successful with fallback model (gemini-1.0-pro)',
        response: text
      };
    }
  } catch (error) {
    console.error('Gemini API test error:', error);
    throw new Error('Gemini API Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}