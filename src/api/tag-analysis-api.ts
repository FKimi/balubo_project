import { supabase } from '../lib/supabase';

// 分析結果の型定義
export interface AnalysisResult {
  success: boolean;
  data?: {
    expertise?: {
      summary: string;
    };
    talent?: {
      summary: string;
    };
    uniqueness?: {
      summary: string;
    };
    content_style?: {
      summary: string;
    };
    specialties?: string[];
    interests?: {
      areas?: string[];
      topics?: string[];
    };
    design_styles?: string[];
    tag_frequency?: { [key: string]: number };
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
  expertise: {
    summary: string;
  };
  talent: {
    summary: string;
  };
  uniqueness: {
    summary: string;
  };
  tag_frequency: Record<string, number>;
}

// ユーザーインサイト結果の型定義
export interface UserInsightsResult {
  success: boolean;
  data?: {
    expertise: {
      summary: string;
    };
    talent: {
      summary: string;
    };
    uniqueness: {
      summary: string;
    };
    content_style: {
      summary: string;
    };
    specialties: string[];
    interests: {
      areas: string[];
      topics: string[];
    };
    design_styles: string[];
    clusters: Array<{
      name: string;
      tags: string[];
    }>;
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
export const analyzeUserTags = async (userId: string): Promise<{
  success: boolean;
  data?: {
    expertise: { summary: string };
    talent: { summary: string };
    uniqueness: { summary: string };
    content_style: { summary: string };
    specialties: string[];
    interests: { 
      areas?: string[];
      topics?: string[];
    };
    design_styles: string[];
    tag_frequency: { [key: string]: number };
    clusters: Array<{
      name: string;
      tags: string[];
    }>;
  };
  error?: string;
}> => {
  try {
    // ユーザーの作品に関連するタグを取得
    const { data: userTags, error: tagsError } = await supabase
      .from('user_tags')
      .select('tags(name, category)')
      .eq('user_id', userId);

    if (tagsError) {
      console.error('Error fetching user tags:', tagsError);
      return { success: false, error: 'Failed to fetch user tags' };
    }

    if (!userTags || userTags.length === 0) {
      return { 
        success: false, 
        error: 'No tags found for this user' 
      };
    }

    // タグの頻度を計算
    const tagFrequency: { [key: string]: number } = {};
    userTags.forEach((tagItem: { tags: { name: string } }) => {
      const tagName = tagItem.tags.name;
      tagFrequency[tagName] = (tagFrequency[tagName] || 0) + 1;
    });

    // 分析結果を生成
    // 注: この実装ではダミーの分析結果を返しています。実際の実装ではAI APIを使用します。
    const analysisResult = {
      expertise: { summary: 'ウェブ開発とデザインに強みがあります。' },
      talent: { summary: 'UI/UXデザインとフロントエンド開発に特に才能があります。' },
      uniqueness: { summary: 'デザインとコーディングの両方のスキルを持つ点が特徴的です。' },
      content_style: { summary: 'コンテンツのスタイルは主にビジュアルに重点を置いています。' },
      specialties: ['ウェブデザイン', 'フロントエンド開発', 'UI/UX'],
      interests: {
        areas: ['テクノロジー', 'デザイン', 'アート'],
        topics: ['ウェブ技術', 'ユーザー体験', 'クリエイティブコーディング']
      },
      design_styles: ['ミニマリスト', 'モダン', 'フラットデザイン'],
      tag_frequency: tagFrequency,
      clusters: [
        {
          name: 'デザイン関連',
          tags: ['UI', 'UX', 'デザイン', 'グラフィック']
        },
        {
          name: '開発関連',
          tags: ['コーディング', 'プログラミング', 'ウェブ開発']
        }
      ]
    };

    return { success: true, data: analysisResult };
  } catch (error) {
    console.error('Error analyzing user tags:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
};

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

    relatedWorkTags.forEach((rwt: { tags?: { id: string; name: string } }) => {
      if (rwt.tags) {
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

    data.forEach((item: { tags?: { id: string; name: string } }) => {
      if (item.tags) {
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
 * ユーザーのタグを分析するAPI呼び出し
 * @param userId ユーザーID
 * @returns 分析結果
 */
export async function analyzeUserTagsApi(userId: string): Promise<UserInsightsResult> {
  try {
    console.log(`ユーザー ${userId} のタグを分析します...`);
    
    // 環境に応じたベースURLを設定
    const baseUrl = import.meta.env.PROD
      ? 'https://balubo.netlify.app/.netlify/functions'
      : 'http://localhost:8888/.netlify/functions';
    
    console.log('Netlify Functions URL:', `${baseUrl}/analyze-tags`);
    console.log('環境変数:', {
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE
    });
    
    // 開発環境では直接Supabaseを使用する代替手段を提供
    if (!import.meta.env.PROD) {
      try {
        // 開発環境での代替実装
        console.log('開発環境では直接Supabaseを使用して分析を試みます');
        const mockResult = {
          expertise: { summary: "ライティングとコンテンツ制作に特化したクリエイターで、特に記事執筆、編集、校正の分野で豊富な経験を持っています。幅広いジャンルに対応できる柔軟性と、読者を惹きつける魅力的な文章構成力が強みです。" },
          talent: { summary: "言葉を通じて読者の心に響くストーリーを紡ぎ出す才能があります。複雑な概念を簡潔に説明する能力と、読者の興味を引き付ける文章構成力に優れています。" },
          uniqueness: { summary: "一般的なトピックでも独自の視点や切り口を見つけ出し、オリジナリティのある作品を生み出す能力があります。読者の共感を得やすい親しみやすい文体と、信頼性を感じさせる根拠に基づいた内容のバランスが取れています。" },
          content_style: { summary: "簡潔でありながら情報量が豊富な文章スタイルが特徴で、専門的な内容をわかりやすく伝える能力に優れています。読者の興味を引く導入部から、論理的に展開される本文、そして明確な結論へと導く構成力があります。" },
          specialties: ["ライティング", "編集", "校正"],
          interests: { 
            areas: ["ビジネス", "ライフスタイル", "テクノロジー"],
            topics: ["生産性向上", "自己啓発", "デジタルトランスフォーメーション"]
          },
          design_styles: ["ミニマリスト", "モダン", "クリーン"],
          tag_frequency: { 
            "ライティング": 5,
            "編集": 3,
            "校正": 2,
            "ビジネス": 4,
            "ライフスタイル": 3,
            "テクノロジー": 2
          },
          clusters: [
            {
              name: "コンテンツ制作",
              tags: ["ライティング", "編集", "校正"]
            },
            {
              name: "専門分野",
              tags: ["ビジネス", "ライフスタイル", "テクノロジー"]
            }
          ]
        };
        return {
          success: true,
          data: mockResult
        };
      } catch (mockError) {
        console.error('開発環境での代替実装に失敗:', mockError);
        // 失敗した場合は通常のNetlify Functions呼び出しを試みる
      }
    }
    
    const response = await fetch(`${baseUrl}/analyze-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to analyze user tags:', errorText);
      return {
        success: false,
        error: `Failed to call Netlify Function: ${response.status} ${response.statusText}`
      };
    }

    const result = await response.json();
    console.log('分析結果:', result);
    
    if (result.error) {
      return {
        success: false,
        error: result.error
      };
    }
    
    // 新しいレスポンス形式に対応
    if (result.data) {
      return {
        success: true,
        data: result.data
      };
    }
    
    // 古い形式のレスポンスに対応（互換性のため）
    if (result.insights) {
      return {
        success: true,
        data: {
          expertise: {
            summary: result.insights.expertise || ''
          },
          talent: {
            summary: result.insights.talent || ''
          },
          uniqueness: {
            summary: result.insights.uniqueness || '独自の視点と表現スタイルを持っています'
          },
          content_style: {
            summary: result.insights.contentStyle || ''
          },
          specialties: [],
          interests: {
            areas: [],
            topics: []
          },
          design_styles: [],
          clusters: []
        }
      };
    }
    
    return {
      success: false,
      error: '不明なレスポンス形式です'
    };
  } catch (error) {
    console.error('Error analyzing user tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

/**
 * ユーザーの分析結果を取得するAPI呼び出し
 * @param userId ユーザーID
 * @returns 分析結果
 */
export async function getUserInsightsApi(userId: string): Promise<UserInsightsResult> {
  try {
    console.log(`ユーザー ${userId} のインサイトを取得します...`);
    
    const { data, error } = await supabase
      .from('user_insights')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('インサイト取得エラー:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    if (!data) {
      console.log('インサイトが見つかりません');
      return {
        success: false,
        error: 'インサイトが見つかりません'
      };
    }
    
    return {
      success: true,
      data: {
        expertise: {
          summary: Array.isArray(data.expertise) ? data.expertise.join('\n') : data.expertise?.summary || ''
        },
        talent: {
          summary: Array.isArray(data.style) ? data.style.join('\n') : data.talent?.summary || ''
        },
        uniqueness: {
          summary: data.uniqueness?.summary || '独自の視点と表現スタイルを持っています'
        },
        content_style: {
          summary: Array.isArray(data.style) ? data.style.join('\n') : data.content_style?.summary || ''
        },
        specialties: Array.isArray(data.expertise) ? data.expertise : data.specialties || [],
        interests: {
          areas: Array.isArray(data.interests) ? data.interests : data.interests?.areas || [],
          topics: data.interests?.topics || []
        },
        design_styles: Array.isArray(data.style) ? data.style : data.design_styles || [],
        clusters: data.clusters || []
      }
    };
  } catch (error) {
    console.error('インサイト取得中にエラーが発生しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}
