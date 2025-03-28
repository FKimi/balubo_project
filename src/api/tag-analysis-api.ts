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
    const tagCategories: { [key: string]: string } = {}; // タグのカテゴリを保存
    
    if (workTagsData && workTagsData.length > 0) {
      workTagsData.forEach((tagItem: any) => {
        if (tagItem.tags && tagItem.tags.name) {
          const tagName = tagItem.tags.name;
          const tagCategory = tagItem.tags.category || 'uncategorized';
          
          tagFrequency[tagName] = (tagFrequency[tagName] || 0) + 1;
          allTags.push(tagName);
          
          // タグのカテゴリ情報を保存
          if (!tagCategories[tagName]) {
            tagCategories[tagName] = tagCategory;
          }
        }
      });
    }
    
    console.log('計算されたタグ頻度:', tagFrequency);
    console.log('タグカテゴリ:', tagCategories);
    
    // 専門分野を抽出（頻度の高い上位5つのタグ）
    const specialties = Object.entries(tagFrequency)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([tag]) => tag);
      
    // 興味・関心領域を抽出
    const interestAreas = [...new Set(allTags)].slice(0, 8);
    const interestTopics = [...new Set(allTags)].slice(0, 4);
    
    // カテゴリごとのタグを集計
    const categorizedTags: { [key: string]: string[] } = {};
    Object.entries(tagCategories).forEach(([tagName, category]) => {
      if (!categorizedTags[category]) {
        categorizedTags[category] = [];
      }
      categorizedTags[category].push(tagName);
    });
    
    console.log('カテゴリ別タグ:', categorizedTags);
    
    // デザインスタイルの抽出 (デザイン関連カテゴリからのタグ)
    const designRelatedCategories = ['design', 'style', 'visual', 'art', 'graphic'];
    const designStyleTags: string[] = [];
    
    Object.entries(categorizedTags).forEach(([category, tags]) => {
      if (designRelatedCategories.some(term => category.toLowerCase().includes(term))) {
        designStyleTags.push(...tags);
      }
    });
    
    // デザインスタイルがない場合は上位タグから抽出
    const designStyles = designStyleTags.length > 0 ? 
      designStyleTags.slice(0, 4) : 
      ["ミニマリスト", "モダン", "クリーン", "機能的"];
    
    // 作品の分析から得られた洞察に基づいて動的コメントを生成
    const generateDynamicComment = (tags: string[], specialtyTags: string[]) => {
      // トップタグに基づいて特性を判断
      const topTags = specialtyTags.slice(0, 3);
      const allTagsText = topTags.join('、');
      
      // タグの数に基づく特性
      const tagDiversity = allTags.length > 10 ? '多様な' : '特定の';
      const focusLevel = allTags.length < 8 ? '専門的で深い' : '幅広い';
      
      // タグの種類から特性を判断
      const isTechnical = topTags.some(tag => 
        ['プログラミング', 'コーディング', '開発', 'エンジニアリング', 'テクニカル'].some(term => 
          tag.toLowerCase().includes(term)
        )
      );
      
      const isCreative = topTags.some(tag => 
        ['デザイン', 'クリエイティブ', 'アート', '創作', '表現'].some(term => 
          tag.toLowerCase().includes(term)
        )
      );
      
      const isAnalytical = topTags.some(tag => 
        ['分析', 'データ', '調査', 'リサーチ', '評価'].some(term => 
          tag.toLowerCase().includes(term)
        )
      );
      
      // 特性に基づいた説明文生成
      let originalitySummary = `独自の視点と表現スタイルを持っています。${allTagsText}に関して特に深い知見を示し、既存の概念に独自の解釈を加えています。`;
      
      if (isCreative) {
        originalitySummary += `クリエイティブな発想力と${tagDiversity}表現手法が特徴的です。`;
      } else if (isTechnical) {
        originalitySummary += `技術的なアプローチと実装における独自の工夫が見られます。`;
      } else if (isAnalytical) {
        originalitySummary += `データと洞察に基づいた説得力のある視点を提供しています。`;
      } else {
        originalitySummary += `特に、日常的な題材を独自の視点で捉え直す能力が際立っています。`;
      }
      
      // 将来の可能性についてのコメント
      let futurePotential = `今後、異なる分野の知識を組み合わせることで、さらに独自性を高める可能性があります。`;
      
      if (isCreative) {
        futurePotential += `新たな表現技法や媒体の探究が魅力をさらに高めるでしょう。`;
      } else if (isTechnical) {
        futurePotential += `新しい技術やフレームワークの習得により、さらに可能性が広がるでしょう。`;
      } else if (isAnalytical) {
        futurePotential += `より高度な分析手法の導入により、さらに深い洞察を提供できるようになるでしょう。`;
      } else {
        futurePotential += `新たな表現方法の探求も魅力を高めます。`;
      }
      
      // 質に関するコメント
      let qualitySummary = `${focusLevel}専門性とスキルを持ち、信頼性のあるコンテンツを作成できます。`;
      
      if (isCreative) {
        qualitySummary += `視覚的要素と表現の質が高く、オリジナリティと完成度のバランスが取れています。`;
      } else if (isTechnical) {
        qualitySummary += `技術的な正確さと効率性を重視した実装が特徴で、高品質な成果物を生み出します。`;
      } else if (isAnalytical) {
        qualitySummary += `情報の正確性と深さが読者に安心感を与え、専門知識を持つ読者からも評価される内容です。`;
      } else {
        qualitySummary += `文章の構成が論理的で、主張と根拠のバランスが取れています。`;
      }
      
      // エンゲージメントに関するコメント
      let engagementSummary = `読者の共感を得やすい親しみやすい文体と、信頼性を感じさせる根拠に基づいた内容のバランスが取れています。`;
      
      if (isCreative) {
        engagementSummary += `視覚的魅力と感情に訴える表現で、閲覧者の関心を引きつけます。`;
      } else if (isTechnical) {
        engagementSummary += `複雑な概念をわかりやすく説明する能力があり、専門家と初心者の両方に価値を提供します。`;
      } else if (isAnalytical) {
        engagementSummary += `データに裏付けられた洞察と明確な説明で、読者の知的好奇心を刺激します。`;
      } else {
        engagementSummary += `感情に訴えかける表現と、知的好奇心を刺激する情報提供が効果的に組み合わされています。`;
      }
      
      return {
        originality: originalitySummary,
        future: futurePotential,
        quality: qualitySummary,
        engagement: engagementSummary
      };
    };
    
    // 動的コメントの生成
    const dynamicComments = generateDynamicComment(allTags, specialties);
    
    // 分析結果オブジェクトを作成
    const analysisResult = {
      // 1. 創造性と独自性 (オリジナリティ)
      // 新しいアイデアや表現方法を生み出す能力
      originality: { 
        summary: dynamicComments.originality
      },
      // 2. 専門性とスキル (クオリティ)
      // 作品の技術的完成度や専門的な深さ
      quality: { 
        summary: dynamicComments.quality
      },
      // サポート情報
      expertise: { 
        summary: "データに基づいた分析と創造的な表現を組み合わせた独自のアプローチが特徴です。" 
      },
      // 3. 影響力と共感 (エンゲージメント)
      // 読者・視聴者との結びつきを作る能力
      engagement: { 
        summary: dynamicComments.engagement
      },
      // 総合的な考察
      overall_insight: {
        summary: "これらの要素は相互に関連し合い、クリエイターとしての総合的な価値を形成しています。独自の視点と専門性の高さが作品の質を高め、読みやすい文体と共感を呼ぶ内容が読者との強い結びつきを生み出しています。特に、専門的な内容を親しみやすく伝える能力は、このクリエイターの最大の強みと言えるでしょう。",
        future_potential: dynamicComments.future
      },
      specialties: specialties,
      interests: { 
        areas: interestAreas,
        topics: interestTopics
      },
      design_styles: designStyles,
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
    
    // 将来の可能性に関するコメントを生成するヘルパー関数
    const generateFuturePotential = (data: any) => {
      const specialties = getArrayValue(data.specialties);
      const topSpecialties = specialties.slice(0, 3);
      
      // 特定のキーワードに基づいて異なるコメントを生成
      const isCreative = topSpecialties.some(tag => 
        ['デザイン', 'クリエイティブ', 'アート', '創作', '表現'].some(term => 
          tag.toLowerCase().includes(term)
        )
      );
      
      const isTechnical = topSpecialties.some(tag => 
        ['プログラミング', 'コーディング', '開発', 'エンジニアリング', 'テクニカル'].some(term => 
          tag.toLowerCase().includes(term)
        )
      );
      
      const isAnalytical = topSpecialties.some(tag => 
        ['分析', 'データ', '調査', 'リサーチ', '評価'].some(term => 
          tag.toLowerCase().includes(term)
        )
      );
      
      // ベースとなるコメント
      let futurePotential = '今後、異なる分野の知識を組み合わせることで、さらに独自性を高める可能性があります。';
      
      // 特性に基づいた追加コメント
      if (isCreative) {
        futurePotential += '新たな表現技法や媒体の探究が魅力をさらに高めるでしょう。多様な創作活動を通じて、より幅広いオーディエンスに届けられる可能性があります。';
      } else if (isTechnical) {
        futurePotential += '新しい技術やフレームワークの習得により、さらに可能性が広がるでしょう。技術の深化とともに、より複雑な課題に取り組める専門性を高められます。';
      } else if (isAnalytical) {
        futurePotential += 'より高度な分析手法の導入により、さらに深い洞察を提供できるようになるでしょう。データの関連性を見出す能力は、様々な分野で価値を生み出します。';
      } else {
        futurePotential += '新たな表現方法の探求も魅力を高めます。自分の強みを活かしながら、好奇心を持って探求を続けることが、長期的な成長につながります。';
      }
      
      return futurePotential;
    };
    
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
          future_potential: data.overall_insight?.future_potential || generateFuturePotential(data)
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
