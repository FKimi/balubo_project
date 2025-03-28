import { supabase } from '../lib/supabase';
import { supabaseAdmin, fetchWorksWithAdmin } from '../lib/supabase-admin';

// 分析結果の型定義
export interface AnalysisResult {
  success: boolean;
  data?: {
    originality?: {
      summary: string;
    };
    quality?: {
      summary: string;
    };
    expertise?: {
      summary: string;
    };
    engagement?: {
      summary: string;
    };
    specialties?: string[];
    interests?: {
      areas?: string[];
      topics?: string[];
    };
    design_styles?: string[];
    clusters?: Array<{
      name: string;
      tags: string[];
    }>;
  };
  error?: string;
}

/**
 * タグ分析結果の型定義
 */
export interface TagAnalysisResult {
  originality: {
    summary: string;
  };
  quality: {
    summary: string;
  };
  expertise: {
    summary: string;
  };
  engagement: {
    summary: string;
  };
  tag_frequency: Record<string, number>;
}

// ユーザーインサイト結果の型定義
export interface UserInsightsResult {
  success: boolean;
  data?: {
    originality: {
      summary: string;
    };
    quality: {
      summary: string;
    };
    expertise: {
      summary: string;
    };
    engagement: {
      summary: string;
    };
    overall_insight: {
      summary: string;
      future_potential: string;
    };
    specialties: string[];
    interests: {
      areas: string[];
      topics: string[];
    };
    design_styles: string[];
    tag_frequency?: { [key: string]: number };
  };
  error?: string;
}

// 作品のタグを自動生成するAPIエンドポイント
export const generateTagsForWork = async (workId: string): Promise<{ success: boolean; tags?: string[]; error?: string }> => {
  try {
    // 作品データを取得
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .single();

    if (workError || !work) {
      console.error('Error fetching work:', workError);
      return { success: false, error: 'Failed to fetch work data' };
    }

    // タグを生成
    // 注: この実装ではダミーのタグを返しています。実際の実装ではAI APIを使用します。
    const generatedTags: string[] = ['デザイン', 'UI/UX', 'ウェブ開発', 'クリエイティブ'];
    
    // 生成されたタグをデータベースに保存
    await saveTagsToDatabase(workId, generatedTags);

    return { success: true, tags: generatedTags };
  } catch (error) {
    console.error('Error generating tags:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
};

/**
 * ユーザーのタグを分析するAPI
 * @param userId ユーザーID
 * @returns 分析結果
 */
export async function analyzeUserTagsApi(userId: string): Promise<UserInsightsResult> {
  try {
    console.log(`ユーザー ${userId} のタグを分析します...`);
    
    // 環境変数の詳細なログ出力 (デバッグ用)
    console.log('環境変数状態:');
    console.log('環境モード:', import.meta.env.MODE);
    console.log('VITE_SUPABASE_URL=', typeof import.meta.env.VITE_SUPABASE_URL, 
      import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.substring(0, 10) + '...' : 'undefined');
    console.log('VITE_SUPABASE_ANON_KEY=', typeof import.meta.env.VITE_SUPABASE_ANON_KEY,
      import.meta.env.VITE_SUPABASE_ANON_KEY ? 'exists' : 'undefined');
    
    // 常にクライアント権限で作品を取得するように変更
    console.log('クライアント権限でユーザー作品を取得します');
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('user_id', userId);
    
    // 詳細なエラーログ
    if (error) {
      console.error('ユーザー作品の取得に失敗:', error);
      console.error('エラー詳細:', JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }));
      return { success: false, error: `ユーザー作品の取得に失敗しました: ${error.message}` };
    }
    
    console.log(`ユーザー ${userId} の作品データ:`, data);
    
    // 作品が見つからない場合はエラーを返す
    if (!data || data.length === 0) {
      console.log('ユーザーの作品が見つかりません');
      return { success: false, error: 'ユーザーの作品が見つかりません。作品を追加してから再度お試しください。' };
    }
    
    // 作品データを使用して分析を実行 (クライアント権限での分析に変更)
    return await analyzeUserWorksWithClientAuth(data, userId);
  } catch (error) {
    console.error('Error analyzing user tags:', error);
    return { success: false, error: 'タグ分析中にエラーが発生しました' };
  }
}

/**
 * クライアント権限での作品分析関数
 * supabaseAdminの代わりにsupabaseクライアントを使用
 */
async function analyzeUserWorksWithClientAuth(userWorks: any[], userId: string) {
  try {
    // 作品IDのリストを作成
    const workIds = userWorks.map((work: any) => work.id);
    
    // クライアント権限で作品に関連するタグを取得
    const { data: workTagsData, error: workTagsError } = await supabase
      .from('work_tags')
      .select('tag_id, tags!inner(id, name, category)')
      .in('work_id', workIds);
      
    if (workTagsError) {
      console.error('作品タグの取得に失敗:', workTagsError);
      return { success: false, error: '作品タグの取得に失敗しました' };
    }
    
    if (!workTagsData || workTagsData.length === 0) {
      console.log('タグデータが見つかりません');
      return { success: false, error: 'タグデータが見つかりません。作品にタグを追加してから再度お試しください。' };
    }
    
    console.log('作品タグデータ:', workTagsData);
    
    // タグの頻度を計算
    const tagFrequency: { [key: string]: number } = {};
    const allTags: string[] = [];
    
    if (workTagsData && workTagsData.length > 0) {
      workTagsData.forEach((tagItem: any) => {
        if (tagItem.tags && tagItem.tags.name) {
          const tagName = tagItem.tags.name;
          tagFrequency[tagName] = (tagFrequency[tagName] || 0) + 1;
          allTags.push(tagName);
        }
      });
    }
    
    console.log('計算されたタグ頻度:', tagFrequency);
    
    // 専門分野を抽出（頻度の高い上位5つのタグ）
    const specialties = Object.entries(tagFrequency)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([tag]) => tag);
      
    // 興味・関心領域を抽出
    const interestAreas = [...new Set(allTags)].slice(0, 8);
    const interestTopics = [...new Set(allTags)].slice(0, 4);
    
    // 分析結果オブジェクトを作成
    const analysisResult = {
      // 1. 創造性と独自性 (オリジナリティ)
      // 新しいアイデアや表現方法を生み出す能力
      originality: { 
        summary: "独自の視点と表現スタイルを持っています。テーマや題材に対して新しいアプローチを取り入れ、既存の概念に独自の解釈を加えています。特に、日常的な題材を独自の視点で捉え直す能力が際立っています。"
      },
      // 2. 専門性とスキル (クオリティ)
      // 作品の技術的完成度や専門的な深さ
      quality: { 
        summary: "専門性とスキルが高く、信頼性のあるコンテンツを作成できます。文章の構成が論理的で、主張と根拠のバランスが取れています。情報の正確性と深さが読者に安心感を与え、専門知識を持つ読者からも評価される内容です。"
      },
      // サポート情報
      expertise: { 
        summary: "データに基づいた分析と創造的な表現を組み合わせた独自のアプローチが特徴です。" 
      },
      // 3. 影響力と共感 (エンゲージメント)
      // 読者・視聴者との結びつきを作る能力
      engagement: { 
        summary: "読者の共感を得やすい親しみやすい文体と、信頼性を感じさせる根拠に基づいた内容のバランスが取れています。感情に訴えかける表現と、知的好奇心を刺激する情報提供が効果的に組み合わされており、幅広い読者層に響く内容となっています。"
      },
      // 総合的な考察
      overall_insight: {
        summary: "これらの要素は相互に関連し合い、クリエイターとしての総合的な価値を形成しています。独自の視点と専門性の高さが作品の質を高め、読みやすい文体と共感を呼ぶ内容が読者との強い結びつきを生み出しています。特に、専門的な内容を親しみやすく伝える能力は、このクリエイターの最大の強みと言えるでしょう。",
        future_potential: "今後は、さらに多様なテーマに挑戦することで表現の幅を広げ、より多くの読者層にアプローチできる可能性があります。また、視覚的要素や対話型コンテンツなど、異なるメディア形式との融合も検討すると、クリエイターとしての価値をさらに高められるでしょう。"
      },
      specialties: specialties,
      interests: { 
        areas: interestAreas,
        topics: interestTopics
      },
      design_styles: ["ミニマリスト", "モダン", "クリーン", "機能的"],
      tag_frequency: tagFrequency
    };
    
    // クライアント権限でユーザーインサイトをSupabaseに保存を試みる
    try {
      const { error: saveError } = await supabase
        .from('user_insights')
        .upsert({
          user_id: userId,
          originality: analysisResult.originality,
          quality: analysisResult.quality,
          expertise: analysisResult.expertise,
          engagement: analysisResult.engagement,
          overall_insight: analysisResult.overall_insight,
          specialties: analysisResult.specialties,
          interests: analysisResult.interests,
          design_styles: analysisResult.design_styles,
          tag_frequency: analysisResult.tag_frequency,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        
      if (saveError) {
        console.error('インサイト保存に失敗 (権限エラーの可能性):', saveError);
        console.log('インサイトはローカルでのみ利用可能です');
      } else {
        console.log('分析インサイトをデータベースに保存しました');
      }
    } catch (saveErr) {
      console.error('インサイト保存中にエラーが発生:', saveErr);
    }
    
    return {
      success: true,
      data: analysisResult
    };
  } catch (error) {
    console.error('タグ分析中にエラーが発生:', error);
    return { success: false, error: 'タグ分析中にエラーが発生しました' };
  }
}

/**
 * 型定義
 */
export interface WorkTagItem {
  tag_id: string;
  tags: { name: string }[];
  name: string;
}

/**
 * 既存のタグ名を抽出する
 * @param existingTags 既存のタグ情報
 * @returns タグ名の配列
 */
function extractExistingTagNames(existingTags: unknown): string[] {
  if (!existingTags || !Array.isArray(existingTags)) {
    return [];
  }

  const tagNames: string[] = [];
  
  existingTags.forEach((item: { tags?: { name: string }; name?: string }) => {
    if (item.tags && item.tags.name) {
      tagNames.push(item.tags.name);
    } else if (item.name) {
      tagNames.push(item.name);
    }
  });

  return tagNames;
}

/**
 * タグをデータベースに保存する関数
 * @param workId 作品ID
 * @param tags タグの配列
 */
async function saveTagsToDatabase(workId: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    // 既存のタグを取得
    const { data: existingWorkTags, error: fetchError } = await supabase
      .from('work_tags')
      .select('tags(name)')
      .eq('work_id', workId);

    if (fetchError) {
      console.error('Error fetching existing work tags:', fetchError);
      return { success: false, error: 'Failed to fetch existing work tags' };
    }

    // 既存のタグ名を抽出
    const existingTagNames = extractExistingTagNames(existingWorkTags);
    
    // 新しいタグのみをフィルタリング
    const newTags = tags.filter(tag => !existingTagNames.includes(tag));
    
    if (newTags.length === 0) {
      // 新しいタグがない場合は早期リターン
      return { success: true };
    }

    // 各タグをデータベースに保存
    for (const tagName of newTags) {
      // 1. まずタグテーブルにタグが存在するか確認
      const { data: existingTags, error: tagFetchError } = await supabase
        .from('tags')
        .select('id, name')
        .eq('name', tagName)
        .limit(1);

      if (tagFetchError) {
        console.error(`Error fetching tag "${tagName}":`, tagFetchError);
        continue; // エラーがあっても次のタグの処理を続行
      }

      let tagId: string;

      if (existingTags && existingTags.length > 0) {
        // 既存のタグを使用
        tagId = existingTags[0].id;
      } else {
        // 新しいタグを作成
        const { data: newTag, error: createTagError } = await supabase
          .from('tags')
          .insert([{ name: tagName, category: 'auto_generated' }])
          .select('id')
          .single();

        if (createTagError || !newTag) {
          console.error(`Error creating tag "${tagName}":`, createTagError);
          continue; // エラーがあっても次のタグの処理を続行
        }

        tagId = newTag.id;
      }

      // 2. work_tagsテーブルに関連付けを保存
      const { error: linkError } = await supabase
        .from('work_tags')
        .insert([{ work_id: workId, tag_id: tagId }]);

      if (linkError) {
        console.error(`Error linking tag "${tagName}" to work:`, linkError);
        // エラーがあっても次のタグの処理を続行
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving tags to database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

/**
 * 特定のタグに関連する作品を取得するAPIエンドポイント
 * @param tagName タグ名
 * @returns タグに関連する作品のリスト
 */
export const getWorksByTag = async (tagName: string): Promise<{
  success: boolean;
  works?: { id: string; title: string; description: string; source_url: string }[];
  error?: string;
}> => {
  try {
    // まずタグIDを取得
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();

    if (tagError || !tagData) {
      console.error('Error fetching tag:', tagError);
      return { success: false, error: 'Tag not found' };
    }

    const tagId = tagData.id;

    // タグに関連する作品を取得
    const { data: workTags, error: workTagsError } = await supabase
      .from('work_tags')
      .select('work_id')
      .eq('tag_id', tagId);

    if (workTagsError) {
      console.error('Error fetching work tags:', workTagsError);
      return { success: false, error: 'Failed to fetch works with this tag' };
    }

    if (!workTags || workTags.length === 0) {
      return { success: true, works: [] };
    }

    // 作品IDを抽出
    const workIds = workTags.map(wt => wt.work_id);

    // 作品の詳細情報を取得
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('id, title, description, source_url')
      .in('id', workIds);

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return { success: false, error: 'Failed to fetch work details' };
    }

    return { success: true, works: works || [] };
  } catch (error) {
    console.error('Error getting works by tag:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
};

/**
 * 関連タグを取得するAPIエンドポイント
 * @param tagName タグ名
 * @param limit 取得する関連タグの数
 * @returns 関連タグの配列
 */
export const getRelatedTags = async (
  tagName: string,
  limit: number = 10
): Promise<{
  success: boolean;
  data?: { id: string; name: string; count: number }[];
  error?: string;
}> => {
  try {
    // まずタグIDを取得
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();

    if (tagError || !tagData) {
      console.error('Error fetching tag:', tagError);
      return { success: false, error: 'Tag not found' };
    }

    const tagId = tagData.id;

    // このタグが付いている作品のIDを取得
    const { data: workTags, error: workTagsError } = await supabase
      .from('work_tags')
      .select('work_id')
      .eq('tag_id', tagId);

    if (workTagsError) {
      console.error('Error fetching work tags:', workTagsError);
      return { success: false, error: 'Failed to fetch works with this tag' };
    }

    if (!workTags || workTags.length === 0) {
      return { success: true, data: [] };
    }

    // 作品IDを抽出
    const workIds = workTags.map(wt => wt.work_id);

    // これらの作品に付いている他のタグを取得（元のタグを除く）
    const { data: relatedWorkTags, error: relatedError } = await supabase
      .from('work_tags')
      .select('tag_id, tags(id, name)')
      .in('work_id', workIds)
      .neq('tag_id', tagId);

    if (relatedError) {
      console.error('Error fetching related tags:', relatedError);
      return { success: false, error: 'Failed to fetch related tags' };
    }

    if (!relatedWorkTags || relatedWorkTags.length === 0) {
      return { success: true, data: [] };
    }

    // タグの出現回数をカウント
    const tagCounts: { [key: string]: { id: string; name: string; count: number } } = {};

    relatedWorkTags.forEach((rwt: { tag_id?: any; tags: { id: any; name: any; }[] | { id: string; name: string; } }) => {
      // tagsが配列の場合
      if (Array.isArray(rwt.tags)) {
        rwt.tags.forEach(tag => {
          const tagId = tag.id;
          const tagName = tag.name;
          
          if (!tagCounts[tagId]) {
            tagCounts[tagId] = { id: tagId, name: tagName, count: 0 };
          }
          
          tagCounts[tagId].count += 1;
        });
      } 
      // tagsが単一オブジェクトの場合
      else if (rwt.tags) {
        const tagId = rwt.tags.id;
        const tagName = rwt.tags.name;
        
        if (!tagCounts[tagId]) {
          tagCounts[tagId] = { id: tagId, name: tagName, count: 0 };
        }
        
        tagCounts[tagId].count += 1;
      }
    });

    // 出現回数でソートして上位のタグを返す
    const sortedTags = Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { success: true, data: sortedTags };
  } catch (error) {
    console.error('Error getting related tags:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
};

/**
 * 人気のタグを取得するAPIエンドポイント
 * @param limit 取得するタグの数
 * @returns 人気タグの配列
 */
export const getPopularTags = async (
  limit: number = 20
): Promise<{
  success: boolean;
  data?: { id: string; name: string; count: number }[];
  error?: string;
}> => {
  try {
    // タグの使用回数を集計するクエリ
    const { data, error } = await supabase
      .from('work_tags')
      .select('tag_id, tags(id, name)')
      .limit(500); // 集計用に多めに取得

    if (error) {
      console.error('Error fetching tags:', error);
      return { success: false, error: 'Failed to fetch tags' };
    }

    // タグの出現回数をカウント
    const tagCounts: { [key: string]: { id: string; name: string; count: number } } = {};

    data.forEach((item: { tag_id?: any; tags: { id: any; name: any; }[] | { id: string; name: string; } }) => {
      // tagsが配列の場合
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          const tagId = tag.id;
          const tagName = tag.name;
          
          if (!tagCounts[tagId]) {
            tagCounts[tagId] = { id: tagId, name: tagName, count: 0 };
          }
          
          tagCounts[tagId].count += 1;
        });
      } 
      // tagsが単一オブジェクトの場合
      else if (item.tags) {
        const tagId = item.tags.id;
        const tagName = item.tags.name;
        
        if (!tagCounts[tagId]) {
          tagCounts[tagId] = { id: tagId, name: tagName, count: 0 };
        }
        
        tagCounts[tagId].count += 1;
      }
    });

    // 出現回数でソートして上位のタグを返す
    const popularTags = Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { success: true, data: popularTags };
  } catch (error) {
    console.error('Error getting popular tags:', error);
    return { success: false, error: 'Failed to get popular tags' };
  }
};

/**
 * ユーザーの分析結果を取得するAPI呼び出し
 * @param userId ユーザーID
 * @returns 分析結果
 */
export async function getUserInsightsApi(userId: string): Promise<UserInsightsResult> {
  try {
    console.log(`ユーザー ${userId} のインサイトを取得します...`);
    
    // 環境変数のデバッグ情報
    console.log('環境変数状態:');
    console.log('環境モード:', import.meta.env.MODE);
    console.log('VITE_SUPABASE_URL=', typeof import.meta.env.VITE_SUPABASE_URL, 
      import.meta.env.VITE_SUPABASE_URL ? 'exists' : 'undefined');
    console.log('VITE_SUPABASE_ANON_KEY=', typeof import.meta.env.VITE_SUPABASE_ANON_KEY,
      import.meta.env.VITE_SUPABASE_ANON_KEY ? 'exists' : 'undefined');
    
    // クライアント権限でインサイトを取得
    const { data, error } = await supabase
      .from('user_insights')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('インサイト取得エラー:', error);
      console.error('エラー詳細:', JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }));
      
      // インサイトが見つからない場合は分析を実行
      if (error.code === 'PGRST116') {
        console.log('インサイトが見つからないため、分析を実行します');
        return await analyzeUserTagsApi(userId);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
    
    if (!data) {
      console.log('インサイトが見つかりません');
      return {
        success: false,
        error: 'No insights found for this user'
      };
    }
    
    console.log('データベースから取得した生のインサイトデータ:', data);
    
    // データ形式の正規化 - 3つの主要指標を強調
    const normalizedData = {
      success: true,
      data: {
        // 1. 創造性と独自性 (オリジナリティ)
        // 新しいアイデアや表現方法を生み出す能力
        originality: {
          summary: getSummary(data, 'originality', 'uniqueness', 
            "独自の視点と表現スタイルを持っています。テーマや題材に対して新しいアプローチを取り入れ、既存の概念に独自の解釈を加えています。特に、日常的な題材を独自の視点で捉え直す能力が際立っています。")
        },
        // 2. 専門性とスキル (クオリティ)
        // 作品の技術的完成度や専門的な深さ
        quality: {
          summary: getSummary(data, 'quality', 'talent',
            "専門性とスキルが高く、信頼性のあるコンテンツを作成できます。文章の構成が論理的で、主張と根拠のバランスが取れています。情報の正確性と深さが読者に安心感を与え、専門知識を持つ読者からも評価される内容です。")
        },
        // 3. 影響力と共感 (エンゲージメント)
        // 読者・視聴者との結びつきを作る能力
        engagement: {
          summary: getSummary(data, 'engagement', 'uniqueness',
            "読者の共感を得やすい親しみやすい文体と、信頼性を感じさせる根拠に基づいた内容のバランスが取れています。感情に訴えかける表現と、知的好奇心を刺激する情報提供が効果的に組み合わされており、幅広い読者層に響く内容となっています。")
        },
        // サポート情報
        expertise: {
          summary: getSummary(data, 'expertise', '',
            "データに基づいた分析と創造的な表現を組み合わせた独自のアプローチが特徴です。")
        },
        overall_insight: {
          summary: getOverallSummary(data,
            "これらの要素は相互に関連し合い、クリエイターとしての総合的な価値を形成しています。独自の視点と専門性の高さが作品の質を高め、読みやすい文体と共感を呼ぶ内容が読者との強い結びつきを生み出しています。特に、専門的な内容を親しみやすく伝える能力は、このクリエイターの最大の強みと言えるでしょう。"),
          future_potential: getFuturePotential(data,
            "今後は、さらに多様なテーマに挑戦することで表現の幅を広げ、より多くの読者層にアプローチできる可能性があります。また、視覚的要素や対話型コンテンツなど、異なるメディア形式との融合も検討すると、クリエイターとしての価値をさらに高められるでしょう。")
        },
        specialties: getArrayValue(data.specialties),
        interests: {
          areas: getArrayValue(data.interests?.areas || data.interests),
          topics: getArrayValue(data.interests?.topics)
        },
        design_styles: getArrayValue(data.design_styles),
        tag_frequency: typeof data.tag_frequency === 'object' && data.tag_frequency !== null
          ? data.tag_frequency
          : {}
      }
    };
    
    console.log('正規化したインサイトデータ:', normalizedData);
    
    return normalizedData;
  } catch (error) {
    console.error('インサイト取得中にエラーが発生しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

/**
 * データからサマリー情報を取得するヘルパー関数
 * 複数のフィールド名に対応し、データの形式による分岐を統一
 */
function getSummary(data: any, primaryField: string, alternativeField: string = '', defaultValue: string = ''): string {
  // primaryFieldが存在する場合
  if (data[primaryField]) {
    if (typeof data[primaryField] === 'object' && data[primaryField] !== null) {
      return data[primaryField].summary || defaultValue;
    }
    if (Array.isArray(data[primaryField])) {
      return data[primaryField].join('\n');
    }
    if (typeof data[primaryField] === 'string') {
      return data[primaryField];
    }
  }
  
  // alternativeFieldが存在し、指定されている場合
  if (alternativeField && data[alternativeField]) {
    if (typeof data[alternativeField] === 'object' && data[alternativeField] !== null) {
      return data[alternativeField].summary || defaultValue;
    }
    if (Array.isArray(data[alternativeField])) {
      return data[alternativeField].join('\n');
    }
    if (typeof data[alternativeField] === 'string') {
      return data[alternativeField];
    }
  }
  
  return defaultValue;
}

/**
 * 全体的な洞察のサマリーを取得するヘルパー関数
 */
function getOverallSummary(data: any, defaultValue: string): string {
  if (typeof data.overall_insight === 'object' && data.overall_insight !== null) {
    return data.overall_insight.summary || defaultValue;
  }
  return defaultValue;
}

/**
 * 将来の可能性に関する情報を取得するヘルパー関数
 */
function getFuturePotential(data: any, defaultValue: string): string {
  if (typeof data.overall_insight === 'object' && data.overall_insight !== null) {
    return data.overall_insight.future_potential || defaultValue;
  }
  return defaultValue;
}

/**
 * 配列データを正規化するヘルパー関数
 */
function getArrayValue(value: any): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value);
  }
  return [];
}
