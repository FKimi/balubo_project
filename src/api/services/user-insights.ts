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
    expertise?: InsightItem;
    uniqueness?: InsightItem;
    interests?: InsightItem;
    talent?: InsightItem;
    specialties?: string[];
    design_styles?: string[];
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
    
    if (existingRecord) {
      // 既存レコードがある場合は更新（サービスロールを使用）
      const { error: updateError } = await supabaseAdmin
        .from('user_insights')
        .update({
          expertise: insights.expertise || null,
          uniqueness: insights.uniqueness || null,
          interests: insights.interests || null,
          talent: insights.talent || null,
          specialties: insights.specialties || [],
          design_styles: insights.design_styles || [],
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
          expertise: insights.expertise || null,
          uniqueness: insights.uniqueness || null,
          interests: insights.interests || null,
          talent: insights.talent || null,
          specialties: insights.specialties || [],
          design_styles: insights.design_styles || [],
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
