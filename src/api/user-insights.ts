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
  error?: string 
}> {
  try {
    console.log('Fetching user insights for user:', userId);
    
    // ユーザーインサイトを取得
    const { data, error } = await supabase
      .from('user_insights')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user insights:', error);
      return { success: false, error: error.message };
    }
    
    if (!data) {
      console.log('No insights found for user:', userId);
      return { 
        success: false, 
        error: 'No insights found for this user' 
      };
    }
    
    console.log('User insights fetched successfully:', data);
    
    // データを整形して返す
    return { 
      success: true, 
      data: {
        originality: data.originality || { summary: '' },
        quality: data.quality || { summary: '' },
        expertise: data.expertise || { summary: '' },
        engagement: data.engagement || { summary: '' },
        overall_insight: data.overall_insight || {
          summary: 'これらの要素は相互に関連し合い、クリエイターとしての総合的な価値を形成しています。一つの要素が他の要素を強化し、全体として独自の魅力を生み出しています。あなたの作品は、専門性と創造性のバランスが取れており、読者に新たな視点や価値を提供しています。',
          future_potential: 'あなたの創造性と情熱は、今後さらに多くの可能性を広げていくでしょう。新たな挑戦や異なる分野との融合を通じて、クリエイターとしての価値をさらに高めていくことができます。自分の強みを活かしながら、好奇心を持って探求を続けることが、長期的な成長につながります。'
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
