import { supabase } from './supabase';

/**
 * 指定ユーザーの「よく使用するタグ」ランキングを取得（SQL直クエリ版）
 * @param userId 対象ユーザーID
 * @param limit 最大取得数（デフォルト7件）
 */
interface TagRankingRow {
  tag_id: string;
  tags: { name: string } | { name: string }[] | null;
  work_id: string;
  works: { user_id: string }[];
}

export async function getUserTagRanking(userId: string, limit = 7): Promise<Array<{ name: string; value: number }>> {
  if (!userId) return [];

  // work_tags, works, tagsをJOINして集計
  const { data, error } = await supabase
    .from('work_tags')
    .select(`tag_id, tags(name), work_id, works(user_id)`) // リレーションで取得
    .eq('works.user_id', userId);

  if (error) {
    console.error('タグランキング取得エラー:', error);
    return [];
  }

  // タグ名ごとに集計
  const tagCountMap: Record<string, number> = {};
  (data as TagRankingRow[] | null || []).forEach((row) => {
    if (Array.isArray(row.tags)) {
      row.tags.forEach(tagObj => {
        const tagName = tagObj?.name;
        if (tagName) tagCountMap[tagName] = (tagCountMap[tagName] || 0) + 1;
      });
    } else if (row.tags && typeof row.tags === 'object') {
      const tagName = row.tags.name;
      if (tagName) tagCountMap[tagName] = (tagCountMap[tagName] || 0) + 1;
    }
  });

  // 降順ソートして上位のみ返す
  return Object.entries(tagCountMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
