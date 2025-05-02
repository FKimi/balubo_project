import { supabase } from '@/lib/supabase';
import { getUserInsights, saveUserInsights, analyzeUserTagsDirectly } from '@/lib/tag-analysis';

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
  tags: string[];
  categories: string[];
  summary: string;
}

/**
 * 作品のタグを自動生成するAPIエンドポイント
 * @param workId 作品ID
 * @returns 生成されたタグ
 */
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
 * ユーザーのタグを分析し、DBと連携して返すAPI
 * @param userId ユーザーID
 * @returns 分析結果
 */
export const analyzeUserTagsApi = async (userId: string): Promise<{
  success: boolean;
  data?: {
    originality: { summary: string };
    quality: { summary: string };
    engagement: { summary: string };
    specialties: string[];
    interests: { areas: string[]; topics: string[] };
    design_styles: string[];
    tag_frequency: Record<string, number>;
    overall_insight: { summary: string; future_potential: string };
    clusters: Array<{ name: string; tags: string[] }>;
  };
  error?: string;
}> => {
  // 1. まずDBから取得
  const { data: dbData, error: dbError } = await getUserInsights(userId);
  if (dbData) {
    // --- undefinedを空配列・空オブジェクトで補完し型エラー防止 ---
    const safeData = {
      originality: dbData.originality ?? { summary: '' },
      quality: dbData.quality ?? { summary: '' },
      engagement: dbData.engagement ?? { summary: '' },
      specialties: dbData.specialties ?? [],
      interests: dbData.interests ?? { areas: [], topics: [] },
      design_styles: dbData.design_styles ?? [],
      tag_frequency: dbData.tag_frequency ?? {},
      overall_insight: {
        summary: dbData.overall_insight?.summary ?? '',
        future_potential: dbData.overall_insight?.future_potential ?? '',
      },
      clusters: dbData.clusters ?? [],
    };
    return { success: true, data: safeData };
  }

  // 2. なければAI分析生成用のタグ頻度データを取得
  const { data: works, error: worksError } = await supabase
    .from('works')
    .select('id, work_tags(tags(name))')
    .eq('user_id', userId);
  if (worksError || !works) {
    return { success: false, error: worksError?.message || '作品データの取得に失敗しました' };
  }

  // タグ頻度集計
  const tagFrequency: Record<string, number> = {};
  for (const work of works as { work_tags?: { tags?: { name: string }[] }[] }[]) {
    const tags = (work.work_tags || []).flatMap((wt) => (wt.tags || []).map((t) => t.name));
    for (const tag of tags) {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    }
  }

  // 3. AI分析生成
  const analysis = await analyzeUserTagsDirectly(tagFrequency);
  if (analysis.success && analysis.data) {
    await saveUserInsights(userId, { user_id: userId, ...analysis.data });
    return { success: true, data: {
      originality: analysis.data.originality ?? { summary: '' },
      quality: analysis.data.quality ?? { summary: '' },
      engagement: analysis.data.engagement ?? { summary: '' },
      specialties: analysis.data.specialties ?? [],
      interests: analysis.data.interests ?? { areas: [], topics: [] },
      design_styles: analysis.data.design_styles ?? [],
      tag_frequency: analysis.data.tag_frequency ?? {},
      overall_insight: {
        summary: analysis.data.overall_insight?.summary ?? '',
        future_potential: analysis.data.overall_insight?.future_potential ?? '',
      },
      clusters: analysis.data.clusters ?? [],
    }};
  }

  return { success: false, error: analysis.error || dbError || '分析データが取得できませんでした' };
};

/**
 * 特定のタグに関連する作品を取得するAPIエンドポイント
 * @param tagName タグ名
 * @returns タグに関連する作品のリスト
 */
export const getWorksByTag = async (tagName: string): Promise<{ success: boolean; works?: { id: string; title: string; description: string; source_url: string }[]; error?: string }> => {
  try {
    // タグIDを取得
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();
    
    if (tagError || !tagData) {
      console.error('Error fetching tag:', tagError);
      return { success: false, error: 'Tag not found' };
    }
    
    // タグに関連する作品IDを取得
    const { data: workTags, error: workTagsError } = await supabase
      .from('work_tags')
      .select('work_id')
      .eq('tag_id', tagData.id);
    
    if (workTagsError) {
      console.error('Error fetching work tags:', workTagsError);
      return { success: false, error: 'Failed to fetch works for tag' };
    }
    
    if (!workTags || workTags.length === 0) {
      return { success: true, works: [] };
    }
    
    // 作品IDのリストを作成
    const workIds = (workTags as { work_id: string }[]).map((wt) => wt.work_id);
    
    // 作品データを取得
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .in('id', workIds);
    
    if (worksError) {
      console.error('Error fetching works:', worksError);
      return { success: false, error: 'Failed to fetch work data' };
    }
    
    return { success: true, works: works || [] };
  } catch (error) {
    console.error('Error in getWorksByTag:', error);
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
export const getRelatedTags = async (tagName: string, limit: number = 10): Promise<{ success: boolean; data?: { id: string; name: string; count: number }[]; error?: string }> => {
  try {
    // タグIDを取得
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();

    if (tagError) {
      console.error('Error fetching tag:', tagError);
      return { success: false, error: 'Tag not found' };
    }

    if (!tag) {
      return { success: false, error: 'Tag not found' };
    }

    // タグに関連する作品を取得
    const { data: workTags, error: workTagsError } = await supabase
      .from('work_tags')
      .select('work_id')
      .eq('tag_id', tag.id);

    if (workTagsError) {
      console.error('Error fetching work tags:', workTagsError);
      return { success: false, error: 'Failed to fetch related works' };
    }

    if (!workTags || workTags.length === 0) {
      return { success: true, data: [] };
    }

    // 作品IDを抽出
    const workIds = (workTags as { work_id: string }[]).map((item) => item.work_id);

    // 関連する作品に付けられた他のタグを取得
    const { data: relatedWorkTags, error: relatedTagsError } = await supabase
      .from('work_tags')
      .select('tag_id, tags(name)')
      .in('work_id', workIds)
      .neq('tag_id', tag.id);

    if (relatedTagsError) {
      console.error('Error fetching related tags:', relatedTagsError);
      return { success: false, error: 'Failed to fetch related tags' };
    }

    if (!relatedWorkTags || relatedWorkTags.length === 0) {
      return { success: true, data: [] };
    }

    // タグの出現回数をカウント
    const tagCounts: Record<string, { id: string; name: string; count: number }> = {};
    
    if (relatedWorkTags && Array.isArray(relatedWorkTags)) {
      // 型安全に処理するため、unknown経由で変換
      (relatedWorkTags as unknown[]).forEach((item) => {
        // 型ガードを使用して安全に処理
        const tagItem = item as WorkTagItem;
        const tagId = tagItem.tag_id;
        let tagName: string | undefined;
        
        const tags = tagItem.tags;
        if (tags) {
          // 配列の場合は最初の要素を使用
          const firstTag = tags[0];
          tagName = firstTag?.name;
        }
        
        if (tagId && tagName) {
          if (tagCounts[tagId]) {
            tagCounts[tagId].count += 1;
          } else {
            tagCounts[tagId] = { id: tagId, name: tagName, count: 1 };
          }
        }
      });
    }
    
    // 出現回数でソートし、上位のタグを返す
    const sortedTags = Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return { success: true, data: sortedTags };
  } catch (error) {
    console.error('Error in getRelatedTags:', error);
    return { success: false, error: 'Failed to get related tags' };
  }
};

/**
 * 人気のタグを取得するAPIエンドポイント
 * @param limit 取得するタグの数
 * @returns 人気タグの配列
 */
export const getPopularTags = async (limit: number = 20): Promise<{ success: boolean; data?: { id: string; name: string; count: number }[]; error?: string }> => {
  try {
    // タグの使用回数を集計するクエリ
    const { data, error } = await supabase
      .rpc('get_tag_counts')
      .limit(limit);

    if (error) {
      console.error('Error fetching popular tags:', error);
      return { success: false, error: 'Failed to fetch popular tags' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getPopularTags:', error);
    return { success: false, error: 'Failed to get popular tags' };
  }
};

// 型定義
interface WorkTagItem {
  tag_id: string;
  tags: { name: string }[];
}

/**
 * 既存のタグ名を抽出する
 * @param existingTags 既存のタグ情報
 * @returns タグ名の配列
 */
const extractExistingTagNames = (existingTags: unknown): string[] => {
  const existingTagNames: string[] = [];
  
  if (Array.isArray(existingTags)) {
    // 型安全に処理するため、unknown経由で変換
    (existingTags as unknown[]).forEach((item) => {
      // 型ガードを使用して安全に処理
      const tagItem = item as WorkTagItem;
      const tags = tagItem.tags;
      
      if (tags && Array.isArray(tags) && tags.length > 0) {
        // 配列の場合は最初の要素を使用
        const firstTag = tags[0];
        if (firstTag && firstTag.name) {
          existingTagNames.push(firstTag.name);
        }
      }
    });
  }
  
  return existingTagNames;
};

/**
 * タグをデータベースに保存する関数
 * @param workId 作品ID
 * @param tags タグの配列
 */
export const saveTagsToDatabase = async (workId: string, tags: string[]): Promise<{ success: boolean; error?: string }> => {
  try {
    // 既存のタグを取得
    const { data: existingTags, error: fetchError } = await supabase
      .from('work_tags')
      .select('tag_id, tags(name)')
      .eq('work_id', workId);
    
    if (fetchError) {
      console.error('Error fetching existing tags:', fetchError);
      return { success: false, error: 'Failed to fetch existing tags' };
    }
    
    // 既存のタグ名を抽出
    const existingTagNames = extractExistingTagNames(existingTags);
    
    // 新しいタグのみを抽出
    const newTags = tags.filter(tag => !existingTagNames.includes(tag));
    
    // 新しいタグがなければ成功を返す
    if (newTags.length === 0) {
      return { success: true };
    }
    
    // 新しいタグを保存
    for (const tagName of newTags) {
      // タグが存在するか確認
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();
      
      let tagId: string;
      
      if (tagError || !tagData) {
        // タグが存在しない場合は新規作成
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
        
        if (createError || !newTag) {
          console.error('Error creating tag:', createError);
          continue; // 次のタグへ
        }
        
        tagId = newTag.id;
      } else {
        tagId = tagData.id;
      }
      
      // work_tagsテーブルに関連付けを保存
      const { error: linkError } = await supabase
        .from('work_tags')
        .insert({ work_id: workId, tag_id: tagId });
      
      if (linkError) {
        console.error('Error linking tag to work:', linkError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in saveTagsToDatabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
};
