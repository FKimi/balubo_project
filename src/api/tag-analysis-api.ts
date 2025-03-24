import { supabase } from '../lib/supabase';
import { 
  TagGenerationInput, 
  TagAnalysisResult, 
  generateTags,
  saveTagAnalytics
} from '../lib/tag-analysis';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * 作品のタグを自動生成するAPIエンドポイント
 * @param workId 作品ID
 * @returns タグ分析結果
 */
export async function generateTagsForWork(workId: string): Promise<{ success: boolean; data?: TagAnalysisResult; error?: string }> {
  try {
    // 作品の詳細を取得
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .single();

    if (workError) {
      console.error('Error fetching work:', workError);
      return { success: false, error: 'Failed to fetch work details' };
    }

    if (!work) {
      return { success: false, error: 'Work not found' };
    }

    // タグ生成の入力を準備
    const input: TagGenerationInput = {
      title: work.title,
      description: work.description,
      url: work.source_url,
      // contentはここでは含まれていないため、省略
    };

    // タグを生成
    const tagAnalysis = await generateTags(input);

    // 生成されたタグをデータベースに保存
    await saveTagsToDatabase(workId, tagAnalysis.tags);

    // ユーザーのタグ分析結果を更新
    if (work.user_id) {
      await saveTagAnalytics(work.user_id, tagAnalysis);
    }

    return { success: true, data: tagAnalysis };
  } catch (error) {
    console.error('Error in generateTagsForWork:', error);
    return { success: false, error: 'Failed to generate tags' };
  }
}

/**
 * ユーザーのタグを分析する
 * @param userId ユーザーID
 * @returns 分析結果
 */
export const analyzeUserTagsApi = async (userId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Netlify Functionを呼び出す
    const response = await fetch('/.netlify/functions/analyze-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from analyze-tags function:', errorData);
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error in analyzeUserTagsApi:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました',
    };
  }
};

/**
 * タグをデータベースに保存する関数
 * @param workId 作品ID
 * @param tags タグ配列
 */
async function saveTagsToDatabase(
  workId: string, 
  tags: Array<{name: string; relevance: number; category?: string}>
): Promise<void> {
  try {
    // 1. 既存のタグを確認または作成
    for (const tag of tags) {
      // タグが存在するか確認
      const { data: existingTags, error: fetchError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tag.name)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching tag:', fetchError);
        continue;
      }

      let tagId;

      if (existingTags && existingTags.length > 0) {
        // 既存のタグを使用
        tagId = existingTags[0].id;
      } else {
        // 新しいタグを作成
        const { data: newTag, error: insertError } = await supabase
          .from('tags')
          .insert({ name: tag.name })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error creating tag:', insertError);
          continue;
        }

        tagId = newTag?.id;
      }

      if (tagId) {
        // 2. work_tagsテーブルに関連付けを保存
        const { error: linkError } = await supabase
          .from('work_tags')
          .upsert({
            work_id: workId,
            tag_id: tagId,
            created_at: new Date().toISOString()
          }, { onConflict: 'work_id,tag_id' });

        if (linkError) {
          console.error('Error linking tag to work:', linkError);
        }
      }
    }
  } catch (error) {
    console.error('Error saving tags to database:', error);
  }
}

/**
 * 特定のタグに関連する作品を取得するAPIエンドポイント
 * @param tagName タグ名
 * @returns 関連する作品の配列
 */
export async function getWorksByTag(tagName: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
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
    const workIds = workTags.map(item => item.work_id);

    // 作品の詳細を取得
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .in('id', workIds);

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return { success: false, error: 'Failed to fetch work details' };
    }

    return { success: true, data: works || [] };
  } catch (error) {
    console.error('Error in getWorksByTag:', error);
    return { success: false, error: 'Failed to get works by tag' };
  }
}

/**
 * 関連タグを取得するAPIエンドポイント
 * @param tagName タグ名
 * @param limit 取得する関連タグの数
 * @returns 関連タグの配列
 */
export async function getRelatedTags(tagName: string, limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
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
    const workIds = workTags.map(item => item.work_id);

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
    
    relatedWorkTags.forEach((item: { tag_id: string; tags?: { name: string } }) => {
      const tagId = item.tag_id;
      const tagName = item.tags?.name;
      
      if (tagId && tagName) {
        if (!tagCounts[tagId]) {
          tagCounts[tagId] = { id: tagId, name: tagName, count: 0 };
        }
        
        tagCounts[tagId].count += 1;
      }
    });
    
    // 出現回数でソートし、上位のタグを返す
    const sortedTags = Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return { success: true, data: sortedTags };
  } catch (error) {
    console.error('Error in getRelatedTags:', error);
    return { success: false, error: 'Failed to get related tags' };
  }
}

/**
 * 人気のタグを取得するAPIエンドポイント
 * @param limit 取得するタグの数
 * @returns 人気タグの配列
 */
export async function getPopularTags(limit: number = 20): Promise<{ success: boolean; data?: any[]; error?: string }> {
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
}
