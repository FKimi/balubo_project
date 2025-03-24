// Netlify Function: analyze-tags
// タグ分析を行うNetlify Function

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabaseクライアントの初期化
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google Gemini APIキー
const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// CORSヘッダー設定
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // OPTIONSリクエスト（プリフライト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // POSTリクエスト以外は拒否
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // リクエストボディの解析
    const requestBody = JSON.parse(event.body);
    const { userId } = requestBody;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // ユーザーの作品を取得
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('id, title, description, source_url')
      .eq('user_id', userId);

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch user works' })
      };
    }

    if (!works || works.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No works found for this user' })
      };
    }

    // 各作品のタグを取得
    const worksWithTags = await Promise.all(works.map(async (work) => {
      const { data: tags, error: tagsError } = await supabase
        .from('work_tags_with_names')
        .select('tag_name')
        .eq('work_id', work.id);

      if (tagsError) {
        console.error(`Error fetching tags for work ${work.id}:`, tagsError);
        return { ...work, tags: [] };
      }

      return {
        ...work,
        tags: tags ? tags.map(tag => tag.tag_name) : []
      };
    }));

    // タグの出現頻度を計算
    const tagFrequency = {};
    worksWithTags.forEach(work => {
      if (work.tags && work.tags.length > 0) {
        work.tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      }
    });

    // タグの分析データを準備
    const tagAnalysisData = {
      works: worksWithTags,
      tagFrequency,
      totalWorks: worksWithTags.length
    };

    // Google Gemini APIを使用してタグを分析
    const prompt = `
あなたはクリエイターのポートフォリオを分析するAIアシスタントです。
以下のデータはユーザーの作品とそれに関連するタグのリストです。
このデータを分析して、以下の観点からユーザーの特徴を抽出してください。

作品データ:
${JSON.stringify(tagAnalysisData, null, 2)}

以下の形式でJSON形式で回答してください:
{
  "expertise": {
    "summary": "ユーザーの専門性に関する分析（200文字以内）"
  },
  "uniqueness": {
    "summary": "ユーザーの作品の個性や独自性に関する分析（200文字以内）"
  },
  "talent": {
    "summary": "ユーザーのコンテンツスタイルや才能に関する分析（200文字以内）"
  },
  "specialties": ["専門分野1", "専門分野2", "専門分野3"],
  "interests": {
    "topics": ["興味・関心のある分野1", "興味・関心のある分野2", "興味・関心のある分野3"]
  },
  "clusters": [
    {
      "name": "クラスター1の名前",
      "tags": ["タグ1", "タグ2", "タグ3"]
    },
    {
      "name": "クラスター2の名前",
      "tags": ["タグ4", "タグ5", "タグ6"]
    }
  ]
}

必ず有効なJSON形式で回答してください。日本語で回答してください。
`;

    // Gemini APIリクエスト
    const geminiResponse = await fetch(`${geminiApiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      return {
        statusCode: geminiResponse.status,
        headers,
        body: JSON.stringify({ error: 'Failed to analyze tags with AI' })
      };
    }

    const geminiData = await geminiResponse.json();
    
    // Gemini APIからの応答を解析
    let analysisResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      // JSONブロックを抽出
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        responseText.match(/{[\s\S]*?}/);
                        
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
      analysisResult = JSON.parse(jsonText.replace(/```/g, '').trim());
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse AI analysis result' })
      };
    }

    // 分析結果をデータベースに保存
    try {
      const { error: saveError } = await supabase
        .from('user_insights')
        .upsert({
          user_id: userId,
          expertise: analysisResult.expertise,
          talent: analysisResult.talent,
          uniqueness: analysisResult.uniqueness,
          specialties: analysisResult.specialties || [],
          interests: analysisResult.interests,
          design_styles: [],
          updated_at: new Date().toISOString()
        });

      if (saveError) {
        console.error('Error saving user insights:', saveError);
      }
    } catch (saveError) {
      console.error('Error in saving user insights:', saveError);
    }

    // 成功レスポンスを返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: analysisResult
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
