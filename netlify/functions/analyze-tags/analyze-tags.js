// Netlify Function: analyze-tags
// ユーザーのタグを分析するNetlify Function
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*', // 本番環境では 'https://balubo.netlify.app' などの特定ドメインに制限することを推奨
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // OPTIONSリクエスト（プリフライトリクエスト）への対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // 環境変数からSupabase設定を取得（複数の方法で試行）
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    let geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    console.log('環境変数の詳細情報:');
    console.log('SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み (最初の10文字: ' + supabaseServiceKey.substring(0, 10) + '...)' : '未設定');
    console.log('GEMINI_API_KEY 設定状況:', geminiApiKey ? '設定済み (最初の10文字: ' + geminiApiKey.substring(0, 10) + '...)' : '未設定');
    console.log('環境変数一覧:', Object.keys(process.env).join(', '));
    
    // 環境変数が設定されているか確認
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase環境変数が設定されていません');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Supabase環境変数が設定されていません',
          details: {
            supabaseUrl: supabaseUrl ? '設定済み' : '未設定',
            supabaseServiceKey: supabaseServiceKey ? '設定済み' : '未設定'
          }
        })
      };
    }
    
    // Supabaseクライアントの初期化（サービスロールキーを使用）
    console.log('Supabaseクライアントを初期化します (サービスロールキー使用)...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // テスト接続
    console.log('Supabase接続テスト実行中...');
    const { data: testData, error: testError } = await supabase
      .from('tags')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Supabase接続テストに失敗:', testError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `Supabase接続テストに失敗: ${testError.message}`,
          details: testError
        })
      };
    }
    
    console.log('Supabase接続テスト成功:', testData);

    // リクエストボディの解析
    const { body } = event;
    let requestData;
    
    try {
      requestData = JSON.parse(body);
      console.log('リクエストデータ:', requestData);
    } catch (error) {
      console.error('リクエストボディの解析に失敗:', error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'リクエストボディの解析に失敗しました' })
      };
    }

    // ユーザーIDの取得
    const { userId } = requestData;
    
    if (!userId) {
      console.error('ユーザーIDが指定されていません');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ユーザーIDは必須です' })
      };
    }

    // ユーザーのタグを取得
    console.log(`ユーザー ${userId} のタグを取得中...`);
    
    // ユーザーの作品に関連付けられたタグを取得
    const { data: userWorks, error: worksError } = await supabase
      .from('works')
      .select('id')
      .eq('user_id', userId);
    
    if (worksError) {
      console.error('ユーザー作品の取得中にエラーが発生しました:', worksError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `ユーザー作品の取得中にエラーが発生しました: ${worksError.message}`,
          details: worksError
        })
      };
    }
    
    if (!userWorks || userWorks.length === 0) {
      console.log(`ユーザー ${userId} の作品が見つかりませんでした`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No works found for this user' })
      };
    }
    
    console.log(`${userWorks.length} 件のユーザー作品が見つかりました`);
    
    // 作品IDのリストを作成
    const workIds = userWorks.map(work => work.id);
    
    // 作品に関連付けられたタグを取得
    const { data: workTags, error: workTagsError } = await supabase
      .from('work_tags')
      .select('tag_id')
      .in('work_id', workIds);
    
    if (workTagsError) {
      console.error('作品タグの取得中にエラーが発生しました:', workTagsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `作品タグの取得中にエラーが発生しました: ${workTagsError.message}`,
          details: workTagsError
        })
      };
    }
    
    if (!workTags || workTags.length === 0) {
      console.log('ユーザーの作品にタグが見つかりませんでした');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'No tags found for this user\'s works',
          message: 'タグが見つかりませんでした。作品にタグを追加してから再度お試しください。'
        })
      };
    }
    
    // タグIDのリストを作成（重複を排除）
    const tagIds = [...new Set(workTags.map(item => item.tag_id))];
    console.log(`${tagIds.length} 件のユニークなタグIDが見つかりました`);
    
    // タグ情報を取得
    const { data: userTags, error: tagsError } = await supabase
      .from('tags')
      .select('id, name, category')
      .in('id', tagIds);
    
    if (tagsError) {
      console.error('タグ情報の取得中にエラーが発生しました:', tagsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `タグ情報の取得中にエラーが発生しました: ${tagsError.message}`,
          details: tagsError
        })
      };
    }
    
    console.log(`${userTags.length} 件のユーザータグが見つかりました`);
    
    // タグをカテゴリごとに分類
    const tagsByCategory = {};
    userTags.forEach(userTag => {
      const tag = userTag;
      if (tag) {
        if (!tagsByCategory[tag.category]) {
          tagsByCategory[tag.category] = [];
        }
        tagsByCategory[tag.category].push(tag.name);
      }
    });
    
    console.log('カテゴリ別タグ:', tagsByCategory);
    
    // ユーザーの作品を取得
    console.log(`ユーザー ${userId} の作品を取得中...`);
    const { data: userWorksData, error: worksDataError } = await supabase
      .from('works')
      .select('id, title, description')
      .eq('user_id', userId);
    
    if (worksDataError) {
      console.error('ユーザー作品の取得中にエラーが発生しました:', worksDataError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `ユーザー作品の取得中にエラーが発生しました: ${worksDataError.message}`,
          details: worksDataError
        })
      };
    }
    
    if (!userWorksData || userWorksData.length === 0) {
      console.log(`ユーザー ${userId} の作品が見つかりませんでした`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No works found for this user' })
      };
    }
    
    console.log(`${userWorksData.length} 件のユーザー作品が見つかりました`);
    
    // タグの分析
    const tagAnalysisPrompt = `
あなたはライターやクリエイターのタグを分析するAIアシスタントです。
以下のタグリストを分析して、ユーザーの「専門性」「コンテンツスタイル」「作品のユニークさ」を日本語で詳細に分析してください。

【タグリスト】
${Object.entries(tagsByCategory)
  .map(([category, tags]) => `${category}: ${tags.join(', ')}`)
  .join('\n')}

【作品情報】
${userWorksData.map(work => `タイトル: ${work.title}\n説明: ${work.description || 'なし'}`).join('\n\n')}

以下の3つの観点から分析し、JSONフォーマットで回答してください：

1. 専門性: ユーザーの専門知識や得意分野を分析
2. コンテンツスタイル: ユーザーの表現スタイルや文章の特徴を分析
3. 作品のユニークさ: ユーザーの作品が持つ独自性や特徴を分析

回答は以下のJSON形式で返してください：
{
  "expertise": "専門性の詳細な分析（1つの文章）",
  "contentStyle": "コンテンツスタイルの詳細な分析（1つの文章）",
  "uniqueness": "作品のユニークさの詳細な分析（1つの文章）"
}
`;

    // Gemini APIキーが設定されているか確認
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEYが設定されていません - ハードコードされた値を使用します（開発環境のみ）');
      // 開発環境用のフォールバック値（本番環境では使用しないでください）
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        geminiApiKey = 'AIzaSyBiWIbXXRT0wDqHl8VdChfLmmBN_VKuseQ';
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'GEMINI_API_KEYが設定されていません' })
        };
      }
    }

    // Gemini APIを呼び出して分析
    console.log('Gemini APIを呼び出して分析中...');
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: tagAnalysisPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini APIの呼び出しに失敗:', errorText);
      console.error('Gemini APIステータス:', geminiResponse.status, geminiResponse.statusText);
      console.error('Gemini API URL:', 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent');
      console.error('Gemini APIキーの長さ:', geminiApiKey ? geminiApiKey.length : 0);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `Gemini APIの呼び出しに失敗: ${geminiResponse.status} ${geminiResponse.statusText}`,
          details: errorText
        })
      };
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API レスポンス:', JSON.stringify(geminiData, null, 2));
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('Gemini APIからの応答が空です');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Gemini APIからの応答が空です' })
      };
    }

    // Gemini APIのレスポンスからテキスト部分を抽出
    const responseText = geminiData.candidates[0].content.parts[0].text;
    console.log('分析結果テキスト:', responseText);
    
    // JSON部分を抽出して解析
    let insights;
    try {
      // テキストからJSON部分を抽出
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSONが見つかりませんでした');
      }
    } catch (error) {
      console.error('分析結果の解析に失敗:', error);
      
      // JSONの解析に失敗した場合は、デフォルトの構造を作成
      insights = {
        expertise: "タグ情報からユーザーの専門性を判断できませんでした。",
        contentStyle: "タグ情報からコンテンツスタイルを判断できませんでした。",
        uniqueness: "タグ情報から作品のユニークさを判断できませんでした。"
      };
      
      // テキストを行ごとに分割して、カテゴリに振り分ける
      const lines = responseText.split('\n');
      let currentCategory = null;
      
      for (const line of lines) {
        if (line.includes('専門性')) {
          currentCategory = 'expertise';
          continue;
        } else if (line.includes('コンテンツスタイル') || line.includes('スタイル')) {
          currentCategory = 'contentStyle';
          continue;
        } else if (line.includes('作品のユニークさ') || line.includes('ユニークさ') || line.includes('独自性')) {
          currentCategory = 'uniqueness';
          continue;
        }
        
        if (currentCategory && line.trim()) {
          // 行頭の記号や番号を削除
          const cleanedLine = line.replace(/^[•\-\d\.\s]+/, '').trim();
          if (cleanedLine) {
            insights[currentCategory] = cleanedLine;
          }
        }
      }
    }
    
    console.log('分析結果:', insights);
    
    // ユーザーインサイトを保存
    console.log(`ユーザー ${userId} のインサイトを保存中...`);
    console.log('保存するデータ:', {
      user_id: userId,
      expertise: {
        summary: insights.expertise
      },
      content_style: {
        summary: insights.contentStyle
      },
      uniqueness: {
        summary: insights.uniqueness
      }
    });
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('user_insights')
      .upsert({
        user_id: userId,
        expertise: {
          summary: insights.expertise
        },
        content_style: {
          summary: insights.contentStyle
        },
        uniqueness: {
          summary: insights.uniqueness
        },
        updated_at: new Date().toISOString()
      });
    
    if (upsertError) {
      console.error('インサイトの保存中にエラーが発生しました:', upsertError);
      console.error('エラーの詳細:', JSON.stringify(upsertError, null, 2));
      // インサイトの保存に失敗しても、分析結果は返す
      console.log('インサイトの保存に失敗しましたが、分析結果を返します');
    } else {
      console.log('インサイトが正常に保存されました:', upsertData);
    }
    
    // 分析結果を返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: '分析が完了しました',
        data: {
          expertise: {
            summary: insights.expertise
          },
          content_style: {
            summary: insights.contentStyle
          },
          uniqueness: {
            summary: insights.uniqueness
          }
        }
      })
    };
  } catch (error) {
    console.error('予期せぬエラーが発生しました:', error);
    // エラーオブジェクトの詳細情報を取得
    const errorDetails = {
      message: error.message || '不明なエラー',
      stack: error.stack,
      name: error.name,
      code: error.code,
      // エラーオブジェクトの全プロパティを取得
      properties: Object.getOwnPropertyNames(error).reduce((obj, prop) => {
        try {
          obj[prop] = error[prop];
        } catch (e) {
          obj[prop] = 'アクセスできないプロパティ';
        }
        return obj;
      }, {})
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `予期せぬエラーが発生しました: ${error.message || '不明なエラー'}`,
        details: errorDetails
      })
    };
  }
};
