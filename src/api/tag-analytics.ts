import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';
import { TagAnalysisResult } from '../lib/tag-analysis';

/**
 * タグ分析結果をデータベースに保存するAPI関数
 * RLSポリシーを回避するためのサーバーサイド関数
 * 
 * @param userId ユーザーID
 * @param tagAnalysis タグ分析結果
 * @returns 保存結果
 */
export async function saveTagAnalyticsToDatabase(
  userId: string,
  tagAnalysis: TagAnalysisResult
): Promise<{ success: boolean; error?: string }> {
  try {
    // タグトレンド（タグの出現頻度）
    const tagTrends = {
      tags: tagAnalysis.tags.map(tag => ({
        name: tag.name,
        relevance: tag.relevance
      }))
    };
    
    // タグクラスター
    const tagClusters = {
      clusters: tagAnalysis.clusters
    };
    
    // タイムライン（空のオブジェクト、後で別の関数で更新）
    const tagTimeline = {};
    
    // まず既存のレコードを確認
    const { data: existingRecord, error: selectError } = await supabase
      .from('tag_analytics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (selectError) {
      console.error('Error checking existing tag analytics:', selectError);
      return { success: false, error: selectError.message };
    }
    
    let error;
    
    if (existingRecord) {
      // 既存レコードがある場合は更新（サービスロールを使用）
      const { error: updateError } = await supabaseAdmin
        .from('tag_analytics')
        .update({
          tag_trends: tagTrends,
          tag_clusters: tagClusters,
          tag_timeline: tagTimeline,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
      
      error = updateError;
    } else {
      // 新規レコードを作成（サービスロールを使用）
      const { error: insertError } = await supabaseAdmin
        .from('tag_analytics')
        .insert({
          user_id: userId,
          tag_trends: tagTrends,
          tag_clusters: tagClusters,
          tag_timeline: tagTimeline,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      error = insertError;
    }
    
    if (error) {
      console.error('Error saving tag analytics:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in saveTagAnalyticsToDatabase:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
