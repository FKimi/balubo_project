import { createClient } from '@supabase/supabase-js';
import { Client, Project, Application, Contract, UserProfile } from '../../types';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 企業（クライアント）関連のAPI
 */
export async function getClientProfile(userId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('企業プロフィール取得エラー:', error);
    return null;
  }
  
  return data as Client;
}

export async function updateClientProfile(client: Partial<Client>): Promise<Client | null> {
  const { data, error } = await supabase
    .from('client_profiles')
    .update(client)
    .eq('user_id', client.user_id)
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('企業プロフィール更新エラー:', error);
    return null;
  }
  
  return data as Client;
}

/**
 * 案件関連のAPI
 */
export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('案件取得エラー:', error);
    return [];
  }
  
  return data as Project[];
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) {
    console.error('案件取得エラー:', error);
    return null;
  }
  
  return data as Project;
}

export async function createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  
  if (error) {
    console.error('案件作成エラー:', error);
    return null;
  }
  
  return data as Project;
}

export async function updateProject(project: Partial<Project>): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .update(project)
    .eq('id', project.id)
    .select()
    .single();
  
  if (error) {
    console.error('案件更新エラー:', error);
    return null;
  }
  
  return data as Project;
}

/**
 * 応募関連のAPI
 */
export async function getApplicationsByProject(projectId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('応募取得エラー:', error);
    return [];
  }
  
  // プロファイル情報なしでアプリケーションデータを返す
  return data as Application[];
}

export async function updateApplicationStatus(
  applicationId: string, 
  status: 'pending' | 'accepted' | 'rejected'
): Promise<Application | null> {
  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single();
  
  if (error) {
    console.error('応募ステータス更新エラー:', error);
    return null;
  }
  
  return data as Application;
}

/**
 * 契約関連のAPI
 */
export async function getContracts(clientId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      projects:project_id (*),
      creators:creator_id (
        id,
        full_name,
        profile_image_url,
        headline
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('契約取得エラー:', error);
    return [];
  }
  
  // profile_image_urlをavatar_urlとしてマッピング
  return data.map(contract => ({
    ...contract,
    creators: contract.creators ? {
      ...contract.creators,
      avatar_url: contract.creators.profile_image_url
    } : null
  }));
}

/**
 * クリエイター検索API
 */
export async function searchCreators(query: string): Promise<(UserProfile & { avatar_url: string })[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%, about.ilike.%${query}%, headline.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('クリエイター検索エラー:', error);
    return [];
  }

  // profile_image_urlをavatar_urlとしてマッピング
  return (data || []).map((profile) => ({
    ...(profile as UserProfile),
    avatar_url: (profile as UserProfile).profile_image_url || '',
  }));
}

/**
 * おすすめクリエイター取得API
 */
export async function getRecommendedCreators(): Promise<(UserProfile & { avatar_url: string })[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('profile_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('おすすめクリエイター取得エラー:', error);
    return [];
  }

  // profile_image_urlをavatar_urlとしてマッピング
  return (data || []).map((profile) => ({
    ...(profile as UserProfile),
    avatar_url: (profile as UserProfile).profile_image_url || '',
  }));
} 