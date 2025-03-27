import { createClient } from '@supabase/supabase-js';
import { debugLog } from './debug-logger';

// 環境変数の戻り値の型を定義
interface EnvVarResult {
  value: string;
  source: string;
}

// 環境変数からSupabaseの設定を取得（Vite環境とNode.js環境の両方に対応）
const getEnvVar = (viteKey: string, nodeKey: string, fallback: string = ''): EnvVarResult => {
  // ソース情報を記録する変数
  let source = '';
  
  // Vite環境（ブラウザ）
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envValue = import.meta.env[viteKey] as string | undefined;
    if (envValue) {
      source = `Vite ENV: ${viteKey}`;
      return { value: envValue, source };
    }
  }
  
  // Node.js環境（サーバーサイド）
  if (typeof process !== 'undefined' && process.env) {
    const envValue = process.env[nodeKey];
    if (envValue) {
      source = `Node ENV: ${nodeKey}`;
      return { value: envValue, source };
    }
  }
  
  if (fallback) {
    source = 'Fallback';
    return { value: fallback, source };
  }
  
  return { value: '', source: 'Not Found' };
};

// 環境変数の取得とデバッグ情報
const { value: supabaseUrl, source: supabaseUrlSource } = getEnvVar(
  'VITE_SUPABASE_URL', 
  'SUPABASE_URL', 
  'https://rlzznpekhaxmwexstghf.supabase.co'
);

const { value: supabaseServiceKey, source: supabaseServiceKeySource } = getEnvVar(
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  '' // 空の文字列をデフォルト値として渡す
);

// 環境変数の存在チェックとデバッグ情報の出力
debugLog('Supabase Admin URL', supabaseUrl, `Source: ${supabaseUrlSource}`);
debugLog('Supabase Admin Service Key', 
  supabaseServiceKey ? '***[設定済み]' : '[未設定]', 
  `Source: ${supabaseServiceKeySource}, Length: ${supabaseServiceKey ? supabaseServiceKey.length : 0}`
);

// 環境変数が存在しない場合の警告
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(' Supabase管理者環境変数が不足しています');
  console.warn('- VITE_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.warn('- VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定');
}

// Supabase管理者クライアントの作成
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey
    }
  }
});

// エラーハンドリングのためのラッパー関数
const handleAdminError = (error: any) => {
  if (error && error._suppressLogging) {
    // ログ抑制フラグを削除して詳細を表示
    const { _suppressLogging, ...errorDetails } = error;
    return errorDetails;
  }
  return error;
};

// エクスポート - 両方のエクスポート名を維持して後方互換性を確保
export { supabaseAdmin };
export default supabaseAdmin;

// Supabase管理者接続をテストする関数
export async function testSupabaseAdminConnection() {
  try {
    console.log('Supabase Admin接続テスト開始...');
    console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : '未設定');
    console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 5)}...` : '未設定');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: '必要な環境変数が設定されていません',
        diagnostics: {
          url: supabaseUrl ? 'OK' : 'Missing',
          key: supabaseServiceKey ? 'OK' : 'Missing'
        }
      };
    }
    
    // 簡単なクエリを実行してみる
    const { data, error, count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Supabase Admin接続エラー:', handleAdminError(error));
      return {
        success: false,
        error: handleAdminError(error).message,
        diagnostics: {
          code: handleAdminError(error).code,
          details: handleAdminError(error).details,
          hint: handleAdminError(error).hint,
          url: supabaseUrl
        }
      };
    }
    
    return {
      success: true,
      message: 'Supabase Admin接続成功',
      count,
      diagnostics: {
        url: supabaseUrl,
        keyLength: supabaseServiceKey.length
      }
    };
  } catch (error) {
    console.error('Supabase Admin接続テスト例外:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
      diagnostics: {
        type: typeof error,
        stack: error instanceof Error ? error.stack : undefined
      }
    };
  }
}

// ユーザーを管理者として作成・更新する関数
export async function createOrUpdateUser(id: string, email: string) {
  try {
    // ユーザー情報を更新
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id,
        email,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (userError) throw handleAdminError(userError);
    
    // 関連するプロフィール情報も更新
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (profileError) throw handleAdminError(profileError);
    
    return { user: userData, profile: profileData };
  } catch (error) {
    console.error('ユーザー作成/更新エラー:', error);
    throw error;
  }
}

// 管理者権限でタグを作成する関数
export async function createTagWithAdmin(name: string, category: string = 'user_generated'): Promise<{ id: string; name: string; category: string }> {
  try {
    // まず既存のタグを検索
    const { data: existingTags, error: fetchError } = await supabaseAdmin
      .from('tags')
      .select('*')
      .eq('name', name)
      .eq('category', category)
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching existing tag:', handleAdminError(fetchError));
      throw new Error(`タグの検索中にエラーが発生しました: ${handleAdminError(fetchError).message}`);
    }
    
    // 既存のタグが見つかった場合はそれを返す
    if (existingTags && existingTags.length > 0) {
      console.log('既存のタグを返します:', existingTags[0]);
      return existingTags[0];
    }
    
    // 新しいタグを作成
    const { data: newTag, error: insertError } = await supabaseAdmin
      .from('tags')
      .insert({
        name,
        category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating tag with admin client:', handleAdminError(insertError));
      throw new Error(`タグの作成中にエラーが発生しました: ${handleAdminError(insertError).message}`);
    }
    
    if (!newTag) {
      throw new Error('タグの作成に成功しましたが、作成されたタグの情報を取得できませんでした');
    }
    
    console.log('新しいタグを作成しました:', newTag);
    return newTag;
  } catch (error) {
    console.error('タグ作成エラー:', error);
    throw error;
  }
}

// 管理者権限でプロフィールデータを取得する関数
export const fetchProfileWithAdmin = async (userId: string) => {
  try {
    console.log('管理者権限でプロフィールデータを取得:', userId);
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        about,
        website_url,
        profile_image_url,
        headline,
        location,
        industry,
        background_image_url
      `)
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('管理者権限でのプロフィール取得エラー:', handleAdminError(error));
      return { data: null, error: handleAdminError(error) };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('管理者権限でのプロフィール取得例外:', err);
    return { data: null, error: err };
  }
};

// 管理者権限で作品データを取得する関数
export const fetchWorksWithAdmin = async (userId: string) => {
  try {
    console.log('管理者権限で作品データを取得:', userId);
    
    const { data, error } = await supabaseAdmin
      .from('works')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('管理者権限での作品取得エラー:', handleAdminError(error));
      return { data: [], error: handleAdminError(error) };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('管理者権限での作品取得例外:', err);
    return { data: [], error: err };
  }
};

// 管理者権限で職歴データを取得する関数
export const fetchCareersWithAdmin = async (userId: string) => {
  try {
    console.log('管理者権限で職歴データを取得:', userId);
    
    const { data, error } = await supabaseAdmin
      .from('careers')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
      
    if (error) {
      console.error('管理者権限での職歴取得エラー:', handleAdminError(error));
      return { data: [], error: handleAdminError(error) };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('管理者権限での職歴取得例外:', err);
    return { data: [], error: err };
  }
};

// 管理者権限でAI分析データを取得する関数
export const fetchAIAnalysisWithAdmin = async (userId: string) => {
  try {
    console.log('管理者権限でAI分析データを取得:', userId);
    
    const { data, error } = await supabaseAdmin
      .from('user_insights')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // 分析結果がまだない場合
        return { 
          data: {
            expertise: 'このユーザーはまだAI分析を実行していません。',
            talent: 'AI分析が実行されると、ユーザーの才能や特徴が表示されます。',
            uniqueness: '独自の視点と表現スタイルを持っています',
            content_style: 'AI分析が実行されると、コンテンツスタイルが表示されます。',
            specialties: ['ライティング', 'コンテンツ制作', 'クリエイティブ'],
            design_styles: ['シンプル', '明快', '効果的'],
            interests: { areas: ['コンテンツマーケティング', 'デジタルメディア', 'クリエイティブ表現'] }
          }, 
          error: null 
        };
      }
      console.error('管理者権限でのAI分析取得エラー:', handleAdminError(error));
      return { data: null, error: handleAdminError(error) };
    }
    
    // データを文字列形式に変換
    const formattedData = {
      expertise: typeof data.expertise === 'object' ? 
        (data.expertise?.summary || '専門性の分析結果がまだありません') : 
        (data.expertise || '専門性の分析結果がまだありません'),
      
      talent: typeof data.talent === 'object' ? 
        (data.talent?.summary || 'タレントの分析結果がまだありません') : 
        (data.talent || 'タレントの分析結果がまだありません'),
      
      uniqueness: typeof data.uniqueness === 'object' ? 
        (data.uniqueness?.summary || 'ユニークさの分析結果がまだありません') : 
        (data.uniqueness || 'ユニークさの分析結果がまだありません'),
      
      content_style: typeof data.content_style === 'object' ? 
        (data.content_style?.summary || 'コンテンツスタイルの分析結果がまだありません') : 
        (data.content_style || 'コンテンツスタイルの分析結果がまだありません'),
      
      // タグデータを追加
      specialties: data.specialties || [],
      design_styles: data.design_styles || [],
      interests: data.interests || { areas: [] }
    };
    
    return { data: formattedData, error: null };
  } catch (err) {
    console.error('管理者権限でのAI分析取得例外:', err);
    return { data: null, error: err };
  }
};

// 管理者権限で単一の作品データを取得する関数
export const fetchWorkWithAdmin = async (workId: string) => {
  try {
    console.log('管理者権限で作品データを取得:', workId);
    
    const { data, error } = await supabaseAdmin
      .from('works')
      .select('*')
      .eq('id', workId)
      .single();
      
    if (error) {
      console.error('管理者権限での作品取得エラー:', handleAdminError(error));
      return { data: null, error: handleAdminError(error) };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('管理者権限での作品取得例外:', err);
    return { data: null, error: err };
  }
};

// 管理者権限で作品のタグデータを取得する関数
export const fetchWorkTagsWithAdmin = async (workId: string) => {
  try {
    console.log('管理者権限で作品タグデータを取得:', workId);
    
    const { data, error } = await supabaseAdmin
      .from('work_tags')
      .select('tag_id, tags(id, name)')
      .eq('work_id', workId);
      
    if (error) {
      console.error('管理者権限での作品タグ取得エラー:', handleAdminError(error));
      return { data: [], error: handleAdminError(error) };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('管理者権限での作品タグ取得例外:', err);
    return { data: [], error: err };
  }
};

// 管理者権限で作品の分析データを取得する関数
export const fetchWorkAnalysisWithAdmin = async (workId: string) => {
  try {
    console.log('管理者権限で作品分析データを取得:', workId);
    
    const { data, error } = await supabaseAdmin
      .from('work_analysis')
      .select('*')
      .eq('work_id', workId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // 分析結果がまだない場合
        return { data: null, error: null };
      }
      console.error('管理者権限での作品分析取得エラー:', handleAdminError(error));
      return { data: null, error: handleAdminError(error) };
    }
    
    // データを文字列形式に変換
    if (data && data.result) {
      const formattedResult = {
        expertise: typeof data.result.expertise === 'object' ? 
          (data.result.expertise.summary || '専門性の分析結果がまだありません') : 
          (data.result.expertise || '専門性の分析結果がまだありません'),
        
        content_style: typeof data.result.content_style === 'object' ? 
          (data.result.content_style.summary || 'スタイルの分析結果がまだありません') : 
          (data.result.content_style || 'スタイルの分析結果がまだありません'),
        
        uniqueness: typeof data.result.uniqueness === 'object' ? 
          (data.result.uniqueness.summary || 'ユニークさの分析結果がまだありません') : 
          (data.result.uniqueness || 'ユニークさの分析結果がまだありません'),
        
        interests: typeof data.result.interests === 'object' ? 
          (data.result.interests.summary || '興味の分析結果がまだありません') : 
          (data.result.interests || '興味の分析結果がまだありません'),
        
        appeal_points: typeof data.result.appeal_points === 'object' ? 
          (data.result.appeal_points.summary || 'アピールポイントの分析結果がまだありません') : 
          (data.result.appeal_points || 'アピールポイントの分析結果がまだありません')
      };
      
      return { data: { ...data, result: formattedResult }, error: null };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('管理者権限での作品分析取得例外:', err);
    return { data: null, error: err };
  }
};

// 管理者権限で関連作品データを取得する関数
export const fetchRelatedWorksWithAdmin = async (userId: string, currentWorkId: string, limit: number = 3) => {
  try {
    console.log('管理者権限で関連作品データを取得:', userId, currentWorkId);
    
    // まず現在の作品のタグを取得
    const { data: tagData, error: tagError } = await supabaseAdmin
      .from('work_tags')
      .select('tag_id')
      .eq('work_id', currentWorkId);
      
    if (tagError) {
      console.error('管理者権限での作品タグ取得エラー:', handleAdminError(tagError));
      // タグが取得できない場合は従来通り同じユーザーの作品を返す
      const { data, error } = await supabaseAdmin
        .from('works')
        .select('*')
        .eq('user_id', userId)
        .neq('id', currentWorkId)
        .limit(limit);
        
      if (error) {
        console.error('管理者権限での関連作品取得エラー:', handleAdminError(error));
        return { data: [], error: handleAdminError(error) };
      }
      
      return { data: data || [], error: null };
    }
    
    // タグIDのリストを作成
    const tagIds = tagData.map(tag => tag.tag_id);
    
    if (tagIds.length === 0) {
      // タグがない場合は従来通り同じユーザーの作品を返す
      const { data, error } = await supabaseAdmin
        .from('works')
        .select('*')
        .eq('user_id', userId)
        .neq('id', currentWorkId)
        .limit(limit);
        
      if (error) {
        console.error('管理者権限での関連作品取得エラー:', handleAdminError(error));
        return { data: [], error: handleAdminError(error) };
      }
      
      return { data: data || [], error: null };
    }
    
    // タグに基づいて関連作品を検索
    // 1. 同じタグを持つ作品IDを取得
    const { data: relatedWorkIds, error: relatedError } = await supabaseAdmin
      .from('work_tags')
      .select('work_id')
      .in('tag_id', tagIds)
      .neq('work_id', currentWorkId);
      
    if (relatedError) {
      console.error('管理者権限での関連タグ作品取得エラー:', handleAdminError(relatedError));
      // エラーの場合は従来通り同じユーザーの作品を返す
      const { data, error } = await supabaseAdmin
        .from('works')
        .select('*')
        .eq('user_id', userId)
        .neq('id', currentWorkId)
        .limit(limit);
        
      if (error) {
        console.error('管理者権限での関連作品取得エラー:', handleAdminError(error));
        return { data: [], error: handleAdminError(error) };
      }
      
      return { data: data || [], error: null };
    }
    
    // 重複を除去して作品IDのリストを作成
    const uniqueWorkIds = [...new Set(relatedWorkIds.map(item => item.work_id))];
    
    // 関連作品が見つからない場合は従来通り同じユーザーの作品を返す
    if (uniqueWorkIds.length === 0) {
      const { data, error } = await supabaseAdmin
        .from('works')
        .select('*')
        .eq('user_id', userId)
        .neq('id', currentWorkId)
        .limit(limit);
        
      if (error) {
        console.error('管理者権限での関連作品取得エラー:', handleAdminError(error));
        return { data: [], error: handleAdminError(error) };
      }
      
      return { data: data || [], error: null };
    }
    
    // 2. 作品IDに基づいて作品データを取得
    const { data: relatedWorks, error: worksError } = await supabaseAdmin
      .from('works')
      .select('*')
      .in('id', uniqueWorkIds)
      .limit(limit);
      
    if (worksError) {
      console.error('管理者権限での関連作品データ取得エラー:', handleAdminError(worksError));
      // エラーの場合は従来通り同じユーザーの作品を返す
      const { data, error } = await supabaseAdmin
        .from('works')
        .select('*')
        .eq('user_id', userId)
        .neq('id', currentWorkId)
        .limit(limit);
        
      if (error) {
        console.error('管理者権限での関連作品取得エラー:', handleAdminError(error));
        return { data: [], error: handleAdminError(error) };
      }
      
      return { data: data || [], error: null };
    }
    
    // 関連作品が少ない場合は、同じユーザーの他の作品で補完
    if (relatedWorks.length < limit) {
      const remainingLimit = limit - relatedWorks.length;
      const existingIds = [...relatedWorks.map(work => work.id), currentWorkId];
      
      const { data: additionalWorks, error: additionalError } = await supabaseAdmin
        .from('works')
        .select('*')
        .eq('user_id', userId)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .limit(remainingLimit);
        
      if (!additionalError && additionalWorks) {
        return { data: [...relatedWorks, ...additionalWorks], error: null };
      }
    }
    
    return { data: relatedWorks || [], error: null };
  } catch (err) {
    console.error('管理者権限での関連作品取得例外:', err);
    return { data: [], error: err };
  }
};
