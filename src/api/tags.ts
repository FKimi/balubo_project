import { supabase } from '../lib/supabase';

// Netlify FunctionsのURL
const NETLIFY_FUNCTIONS_BASE_URL = import.meta.env.PROD 
  ? 'https://eclectic-queijadas-227e9b.netlify.app/.netlify/functions'
  : '/.netlify/functions';

/**
 * タグを作成する関数
 * @param name タグ名
 * @param category タグカテゴリ（デフォルト: 'user_generated'）
 * @returns 作成されたタグ
 */
export async function createTag(name: string, category: string = 'user_generated'): Promise<{ id: string; name: string; category: string }> {
  try {
    console.log(`createTag関数が呼び出されました: name=${name}, category=${category}`);
    console.log('環境変数の確認:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '設定済み' : '未設定',
      supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '設定済み' : '未設定'
    });
    
    // 1. まず既存のタグを確認
    console.log('既存のタグを検索中...');
    const { data: existingTags, error: fetchError } = await supabase
      .from('tags')
      .select('id, name, category')
      .eq('name', name)
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching existing tag:', fetchError);
      throw new Error(`タグの検索中にエラーが発生しました: ${fetchError.message}`);
    }
    
    // 既存のタグが見つかった場合はそれを返す
    if (existingTags && existingTags.length > 0) {
      console.log('既存のタグが見つかりました:', existingTags[0]);
      return existingTags[0];
    }
    
    // 2. 類似タグを検索（完全一致がない場合）
    console.log('類似タグを検索中...');
    const { data: similarTags, error: similarError } = await supabase
      .from('tags')
      .select('id, name, category')
      .ilike('name', `%${name}%`)
      .limit(5);
    
    if (similarError) {
      console.error('Error fetching similar tags:', similarError);
      // エラーがあっても処理を続行（新しいタグを作成する）
    }
    
    // 類似タグが見つかった場合は最も類似度の高いものを返す
    // ここでは単純に最初のものを返す（将来的には類似度計算を実装可能）
    if (similarTags && similarTags.length > 0) {
      console.log(`類似タグを使用: "${similarTags[0].name}" (元のタグ: "${name}")`);
      return similarTags[0];
    }
    
    // 3. 新しいタグを作成（Netlify Functionsを使用）
    console.log('新しいタグを作成中（Netlify Functions使用）...');
    const tagData = { 
      name, 
      category
    };
    console.log('作成するタグデータ:', tagData);
    
    // Netlify Functionsを使用してタグを作成
    const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/create-tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error creating tag with Netlify Function: ${response.status}`, errorData);
      throw new Error(`タグの作成中にエラーが発生しました: ${errorData.error || response.statusText}`);
    }
    
    const newTag = await response.json();
    
    if (!newTag || !newTag.id) {
      console.error('タグ作成結果が空です');
      throw new Error('タグの作成に失敗しました: レスポンスが空です');
    }
    
    console.log('新しいタグが正常に作成されました:', newTag);
    return newTag;
  } catch (error) {
    console.error('Error in createTag function:', error);
    throw error;
  }
}
