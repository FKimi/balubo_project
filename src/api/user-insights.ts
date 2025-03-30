import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';

/**
 * ユーザーインサイト用の型定義
 */
interface InsightItem {
  summary: string;
  topics?: string[];
  details?: Record<string, unknown>;
}

/**
 * ユーザーインサイトを保存する関数
 * @param userId ユーザーID
 * @param insights ユーザーインサイト
 * @returns 保存結果
 */
export async function saveUserInsights(
  userId: string,
  insights: {
    originality?: InsightItem;
    quality?: InsightItem;
    expertise?: InsightItem;
    engagement?: InsightItem;
    specialties?: string[];
    design_styles?: string[];
    overall_insight?: {
      summary: string;
      future_potential?: string;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 既存のレコードを確認
    const { data: existingRecord, error: selectError } = await supabase
      .from('user_insights')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (selectError) {
      console.error('Error checking existing user insights:', selectError);
      return { success: false, error: selectError.message };
    }
    
    let error;
    
    // データベーススキーマに合わせてフィールドをマッピング
    const expertiseData = insights.expertise || null;
    const engagementData = insights.engagement || null;
    
    if (existingRecord) {
      // 既存レコードがある場合は更新（サービスロールを使用）
      const { error: updateError } = await supabaseAdmin
        .from('user_insights')
        .update({
          expertise: expertiseData,
          engagement: engagementData,
          specialties: insights.specialties || [],
          design_styles: insights.design_styles || [],
          overall_insight: insights.overall_insight || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
      
      error = updateError;
    } else {
      // 新規レコードを作成（サービスロールを使用）
      const { error: insertError } = await supabaseAdmin
        .from('user_insights')
        .insert({
          user_id: userId,
          expertise: expertiseData,
          engagement: engagementData,
          specialties: insights.specialties || [],
          design_styles: insights.design_styles || [],
          overall_insight: insights.overall_insight || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      error = insertError;
    }
    
    if (error) {
      console.error('Error saving user insights:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in saveUserInsights:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * ユーザーインサイトを取得する関数
 * @param userId ユーザーID
 * @returns 取得結果
 */
export async function getUserInsightsApi(
  userId: string
): Promise<{
  success: boolean;
  data?: {
    originality?: InsightItem;
    quality?: InsightItem;
    expertise?: InsightItem;
    engagement?: InsightItem;
    overall_insight?: {
      summary: string;
      future_potential?: string;
    };
    specialties?: string[];
    design_styles?: string[];
    clusters?: Array<{
      name: string;
      tags: string[];
    }>;
  };
  error?: string;
}> {
  try {
    console.log('Fetching user insights for user:', userId);

    const { data, error } = await supabase
      .from('user_insights')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // 0行または1行を取得

    // Supabase の予期せぬエラー処理
    if (error) {
      // PGRST116 (行が見つからない) エラーは無視し、データなしとして扱う
      // SupabaseError 型をインポートする必要があるかもしれないが、まずは code プロパティで判定
      // @ts-ignore // 型エラーを一時的に無視
      if (error.code === 'PGRST116') {
          console.log('No insights found for user (PGRST116):', userId);
          // データが存在しない場合は、エラーではなく成功として扱い、データが空であることを示す
          return { success: true, data: undefined };
      }
      // その他の DB エラー
      console.error('Error fetching user insights:', error);
      return { success: false, error: error.message };
    }

    // データが存在しない場合の処理 (maybeSingle で data が null になる)
    if (!data) {
      console.log('No insights found for user (data is null):', userId);
      // データが存在しない場合は、エラーではなく成功として扱い、データが空であることを示す
      return { success: true, data: undefined };
    }

    console.log('User insights fetched successfully:', data);

    // データを整形して返す (既存のロジックを維持しつつ、null チェックを追加)
    return {
      success: true,
      data: {
        originality: data.originality || { summary: '' },
        quality: data.quality || { summary: '' },
        expertise: data.expertise || { summary: '' },
        engagement: data.engagement || { summary: '' },
        overall_insight: data.overall_insight || {
          summary: '分析データがまだありません。', // デフォルト値を設定
          future_potential: '作品を追加すると分析が開始されます。' // デフォルト値を設定
        },
        specialties: data.specialties || [],
        design_styles: data.design_styles || [],
        clusters: data.clusters || []
      }
    };
  } catch (error) {
    console.error('Error in getUserInsightsApi:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
