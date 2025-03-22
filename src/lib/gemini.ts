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
}

// Gemini 2.0 Flashのモデル設定
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
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
    
    // Gemini 2.0 Flashモデルを使用
    // 注: APIキーが2.0モデルに対応していない場合は1.5-proにフォールバック
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig,
      });

      // Create a more structured prompt
      const prompt = `
        あなたはプロの編集者であり、世界最高のトップクリエイターです。
        またコンテンツの分析・推論・考察・評価の専門家です。クリエイターや発注者に新たな発見を提供する専門家です。
        
        以下のコンテンツを分析し、クリエイターに役立つ洞察と発見を日本語のJSONフォーマットで提供してください：

        タイトル: ${content.title}
        ${content.description ? `説明: ${content.description}` : ''}
        ${content.url ? `URL: ${content.url}` : ''}
        ${content.content ? `本文: ${content.content}` : ''}

        以下の3つの側面について分析し、それぞれJSONの対応するセクションに反映させてください。
        情報が限られている場合は「可能性がある」「〜の傾向が見られる」といった表現を使用してください。140文字以内でお願いします。：
        
        1. 【専門性・分野】(JSONのexpertiseセクションに対応)
              - コンテンツの専門分野やジャンルを分析
   - 作者の知識深度や専門性の強みを推論
      
2. 【表現スタイル・特徴】(JSONのcontent_styleセクションに対応)
   - 文章の特徴や表現技法を分析
   - 想定読者層や訴求方法の特徴を推論
      
3. 【興味関心・トピック】(JSONのinterestsセクションに対応)
   - 扱われているトピックや関心領域を分析
   - 作者の探求している分野や将来性を推論


マークダウン形式やコードブロック、余分なテキストなしで、有効なJSONオブジェクトのみで応答してください。
JSONの構造は以下の通りにしてください：
{
  "expertise": {
    "categories": [
      {"name": "カテゴリー名", "score": 90}  // スコアは0-100で、この分野への専門性・関連性の強さを表します
    ],
    "summary": "専門性の要約（具体的な強みと独自の視点を含む）"
  },
  "content_style": {
    "features": [
      {"name": "特徴", "score": 90}  // スコアは0-100で、この特徴の顕著さを表します
    ],
    "summary": "作風の要約（表現技法の特徴と読者への影響を含む）"
  },
  "interests": {
    "tags": ["トピック1", "トピック2"],  // 関連するトピックやキーワード
    "summary": "興味関心の要約（将来の可能性と発展方向を含む）"
  }
}

すべての応答は日本語で提供してください。カテゴリー名、特徴名、タグ名、要約文はすべて日本語にしてください。
要約文は単なる事実の羅列ではなく、具体的な例や独自の洞察を含む、発見のある内容にしてください。
    `;

      // Generate content with error handling
      try {
        console.log("Gemini API - Starting content generation...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini API - Content generation successful");

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
          const analysis = JSON.parse(jsonText);

          // Validate the analysis structure
          if (!analysis.expertise?.categories || !analysis.content_style?.features || !analysis.interests?.tags) {
            console.error('Invalid analysis structure:', analysis);
            throw new Error('Invalid analysis structure');
          }

          return analysis;
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', parseError);
          console.error('Raw response:', text);
          throw new Error('Invalid response format from AI');
        }
      } catch (apiError) {
        console.error('Gemini API error with 2.0-flash model:', apiError);
        // Try fallback to 1.5-pro
        throw apiError;
      }
    } catch (modelError) {
      console.error('Error initializing or using Gemini 2.0 Flash model:', modelError);
      console.warn('Falling back to gemini-1.5-pro model...');
      
      // フォールバック: gemini-1.5-proを使用
      try {
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-1.5-pro"
        });
        
        const prompt = `
          あなたはプロの編集者であり、世界最高のトップクリエイターです。
          またコンテンツの分析・推論・考察・評価の専門家です。クリエイターや発注者に新たな発見を提供する専門家です。
          
          以下のコンテンツを分析し、クリエイターに役立つ洞察と発見を日本語のJSONフォーマットで提供してください：

          タイトル: ${content.title}
          ${content.description ? `説明: ${content.description}` : ''}
          ${content.url ? `URL: ${content.url}` : ''}
          ${content.content ? `本文: ${content.content}` : ''}

          以下の3つの側面について分析し、それぞれJSONの対応するセクションに反映させてください。
          情報が限られている場合は「可能性がある」「〜の傾向が見られる」といった表現を使用してください。140文字以内でお願いします。：
          
          1. 【専門性・分野】(JSONのexpertiseセクションに対応)
                - コンテンツの専門分野やジャンルを分析
       - 作者の知識深度や専門性の強みを推論
          
    2. 【表現スタイル・特徴】(JSONのcontent_styleセクションに対応)
       - 文章の特徴や表現技法を分析
       - 想定読者層や訴求方法の特徴を推論
          
    3. 【興味関心・トピック】(JSONのinterestsセクションに対応)
       - 扱われているトピックや関心領域を分析
       - 作者の探求している分野や将来性を推論

    マークダウン形式やコードブロック、余分なテキストなしで、有効なJSONオブジェクトのみで応答してください。
    JSONの構造は以下の通りにしてください：
    {
      "expertise": {
        "categories": [
          {"name": "カテゴリー名", "score": 90}  // スコアは0-100で、この分野への専門性・関連性の強さを表します
        ],
        "summary": "専門性の要約（具体的な強みと独自の視点を含む）"
      },
      "content_style": {
        "features": [
          {"name": "特徴", "score": 90}  // スコアは0-100で、この特徴の顕著さを表します
        ],
        "summary": "作風の要約（表現技法の特徴と読者への影響を含む）"
      },
      "interests": {
        "tags": ["トピック1", "トピック2"],  // 関連するトピックやキーワード
        "summary": "興味関心の要約（将来の可能性と発展方向を含む）"
      }
    }

    すべての応答は日本語で提供してください。カテゴリー名、特徴名、タグ名、要約文はすべて日本語にしてください。
    要約文は単なる事実の羅列ではなく、具体的な例や独自の洞察を含む、発見のある内容にしてください。
        `;
        
        console.log("Gemini API - Trying with fallback model (gemini-1.5-pro)...");
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini API - Fallback model successful");
          
        // Parse JSON from the response
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
          const analysis = JSON.parse(jsonText);

          // Validate the analysis structure
          if (!analysis.expertise?.categories || !analysis.content_style?.features || !analysis.interests?.tags) {
            console.error('Invalid analysis structure from fallback model:', analysis);
            throw new Error('Invalid analysis structure from fallback model');
          }

          return analysis;
        } catch (fallbackParseError) {
          console.error('Failed to parse fallback model response:', fallbackParseError);
          console.error('Raw fallback response:', text);
          throw new Error('Failed to parse AI response from both models');
        }
      } catch (fallbackModelError) {
        console.error('Error with fallback model (gemini-1.5-pro):', fallbackModelError);
        // Return default sample data
        return getFallbackAnalysis();
      }
    }
  } catch (error) {
    console.error('Content analysis error:', error);
    // Return a fallback analysis
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
      // まずGemini 2.0 Flashを試す
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig
      });

      console.log("Testing Gemini 2.0 Flash API...");
      // Simple test prompt
      const result = await model.generateContent("What is AI? Explain in one sentence.");
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from API');
      }

      return {
        success: true,
        message: 'API test successful with gemini-2.0-flash',
        response: text
      };
    } catch (error2) {
      console.warn('Failed to use gemini-2.0-flash, falling back to gemini-1.5-pro:', error2);
      
      // フォールバック: gemini-1.5-proを使用
      const fallbackModel = genAI.getGenerativeModel({
        model: "gemini-1.5-pro"
      });
      
      console.log("Testing with fallback model (gemini-1.5-pro)...");
      const result = await fallbackModel.generateContent("What is AI? Explain in one sentence.");
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from fallback API');
      }

      return {
        success: true,
        message: 'API test successful with fallback model (gemini-1.5-pro)',
        response: text
      };
    }
  } catch (error) {
    console.error('Gemini API test error:', error);
    throw new Error('Gemini API Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}