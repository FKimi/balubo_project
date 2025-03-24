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
 * ユーザーのすべての作品のタグを分析するAPIエンドポイント
 * @param userId ユーザーID
 * @returns タグ分析結果
 */
export async function analyzeUserTags(userId: string): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
  try {
    // ユーザーの作品を取得
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('id, title, description, source_url')
      .eq('user_id', userId);

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return { success: false, error: 'Failed to fetch user works' };
    }

    if (!works || works.length === 0) {
      return { success: false, error: 'No works found for this user' };
    }

    // すべての作品からタグを収集
    const allTags: Record<string, number> = {};
    
    // 各作品のタグを取得
    for (const work of works) {
      const { data: workTags, error: tagsError } = await supabase
        .from('work_tags')
        .select('tags(name)')
        .eq('work_id', work.id);
      
      if (tagsError) {
        console.error(`Error fetching tags for work ${work.id}:`, tagsError);
        continue;
      }
      
      if (workTags && workTags.length > 0) {
        workTags.forEach((item: { tags?: { name: string } }) => {
          const tagName = item.tags?.name;
          if (tagName) {
            allTags[tagName] = (allTags[tagName] || 0) + 1;
          }
        });
      }
    }

    // タグが見つからない場合
    if (Object.keys(allTags).length === 0) {
      return { 
        success: true, 
        data: {
          expertise: { summary: "まだ十分なデータがないため、専門性を分析できません。作品にタグを追加してください。" },
          content_style: { summary: "まだ十分なデータがないため、コンテンツスタイルを分析できません。作品にタグを追加してください。" },
          uniqueness: { summary: "まだ十分なデータがないため、作品のユニークさを分析できません。作品にタグを追加してください。" },
          specialties: [],
          interests: { topics: [] }
        } 
      };
    }

    // タグを頻度順にソート
    const sortedTags = Object.entries(allTags)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // 上位のタグを抽出
    const topTags = sortedTags.slice(0, 15).map(tag => tag.name);

    // Gemini APIを使用してタグ分析を行う
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // プロンプトを作成
    const prompt = `
以下のタグリストは、あるクリエイターの作品に付けられたタグです。これらのタグを分析して、クリエイターの特徴を3つの観点から分析してください。

タグリスト: ${topTags.join(', ')}

以下の3つの観点から分析し、それぞれ100-150文字程度の日本語で簡潔に説明してください:

1. 専門性: このクリエイターの専門分野や得意とする領域は何か
2. コンテンツスタイル: このクリエイターの表現方法や作品の特徴的なスタイルは何か
3. 作品のユニークさ: このクリエイターの作品が持つ独自性や他と差別化できる点は何か

回答はJSON形式で以下のように構造化してください:
{
  "expertise": {
    "summary": "専門性の分析結果"
  },
  "content_style": {
    "summary": "コンテンツスタイルの分析結果"
  },
  "uniqueness": {
    "summary": "作品のユニークさの分析結果"
  }
}
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSONを抽出して解析
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonText = jsonMatch[0];
        const analysisData = JSON.parse(jsonText);
        
        // 専門分野タグを抽出（上位10件）
        const specialties = sortedTags.slice(0, 10).map(tag => tag.name);
        
        // 興味関心タグを抽出（11-20件）
        const interests = {
          topics: sortedTags.slice(10, 20).map(tag => tag.name)
        };
        
        return { 
          success: true, 
          data: {
            ...analysisData,
            specialties,
            interests
          } 
        };
      } else {
        console.error('Failed to extract JSON from AI response');
        return { 
          success: true, 
          data: {
            expertise: { summary: "タグに基づく専門性の分析に失敗しました。" },
            content_style: { summary: "タグに基づくコンテンツスタイルの分析に失敗しました。" },
            uniqueness: { summary: "タグに基づく作品のユニークさの分析に失敗しました。" },
            specialties: sortedTags.slice(0, 10).map(tag => tag.name),
            interests: { topics: sortedTags.slice(10, 20).map(tag => tag.name) }
          } 
        };
      }
    } catch (error) {
      console.error('Error analyzing tags with Gemini:', error);
      
      // AI分析に失敗した場合のフォールバック
      return { 
        success: true, 
        data: {
          expertise: { summary: "タグから抽出された専門性: " + topTags.slice(0, 3).join(', ') },
          content_style: { summary: "タグから抽出されたコンテンツスタイル: " + topTags.slice(3, 6).join(', ') },
          uniqueness: { summary: "タグから抽出された作品のユニークさ: " + topTags.slice(6, 9).join(', ') },
          specialties: sortedTags.slice(0, 10).map(tag => tag.name),
          interests: { topics: sortedTags.slice(10, 20).map(tag => tag.name) }
        } 
      };
    }
  } catch (error) {
    console.error('Error in analyzeUserTags:', error);
    return { success: false, error: 'Failed to analyze user tags' };
  }
}

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
