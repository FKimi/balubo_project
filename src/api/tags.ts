import { supabase } from '../lib/supabase';
import { createTagWithAdmin, testSupabaseAdminConnection } from '../lib/supabase-admin';

// Netlify FunctionsのURL
const NETLIFY_FUNCTIONS_BASE_URL = import.meta.env.PROD 
  ? 'https://stupendous-llama-975208.netlify.app/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions';

// 開発環境かどうかを判定
const isDevelopment = !import.meta.env.PROD;

// 環境変数の値をログに出力（デバッグ用）
console.log('環境変数の確認:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.substring(0, 10) + '...' : '未設定',
  VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '設定済み（長さ: ' + import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY.length + '）' : '未設定',
  isDevelopment
});

// Supabase管理者接続をテスト
if (isDevelopment) {
  testSupabaseAdminConnection()
    .then(isConnected => {
      console.log('Supabase管理者接続テスト結果:', isConnected ? '成功' : '失敗');
    })
    .catch(error => {
      console.error('Supabase管理者接続テスト中にエラー:', error);
    });
}

/**
 * タグを作成する関数
 * @param name タグ名
 * @param category タグカテゴリ（デフォルト: 'user_generated'）
 * @returns 作成されたタグ
 */
export async function createTag(name: string, category: string = 'user_generated'): Promise<{ id: string; name: string; category: string }> {
  try {
    console.log(`createTag関数が呼び出されました: name=${name}, category=${category}`);
    
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
    
    // 3. 新しいタグを作成
    console.log('新しいタグを作成中...');
    
    // 開発環境では直接Supabaseを使用し、本番環境ではNetlify Functionsを使用
    if (isDevelopment) {
      console.log('開発環境: 管理者クライアントを使用してタグを作成します');
      const newTag = await createTagWithAdmin(name, category);
      console.log('管理者クライアントでタグが正常に作成されました:', newTag);
      return newTag;
    } else {
      // 本番環境: Netlify Functionsを使用
      return await createTagWithNetlifyFunction(name, category);
    }
  } catch (error) {
    console.error('Error in createTag function:', error);
    throw error;
  }
}

/**
 * Netlify Functionsを使用してタグを作成する関数
 * @param name タグ名
 * @param category タグカテゴリ
 * @returns 作成されたタグ
 */
async function createTagWithNetlifyFunction(name: string, category: string): Promise<{ id: string; name: string; category: string }> {
  console.log('Netlify Functionsを使用してタグを作成します');
  const tagData = { 
    name, 
    category
  };
  
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/create-tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating tag with Netlify Function: ${response.status}`, errorText);
      throw new Error(`タグの作成中にエラーが発生しました: ${response.status} ${errorText}`);
    }
    
    const newTag = await response.json();
    console.log('Netlify Functionsでタグが正常に作成されました:', newTag);
    return newTag;
  } catch (error) {
    console.error('Error creating tag with Netlify Function:', error);
    throw new Error(`Netlify Functionsでのタグ作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}
