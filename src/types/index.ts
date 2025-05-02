/**
 * 共通型定義ファイル
 * プロジェクト全体で使用される型定義を集約
 */

// ユーザープロフィール関連
export interface UserProfile {
  id: string;
  full_name: string;  // データベースのフィールド名
  name?: string;      // 互換性のために残す
  about: string;      // データベースのフィールド名
  bio?: string;       // 互換性のために残す
  avatar_url?: string;
  profile_image_url?: string; // プロフィール画像URL
  website_url?: string;
  created_at: string;
  background_image_url?: string;
  twitter_username?: string;
  instagram_username?: string;
  facebook_username?: string;
  headline?: string;
  location?: string;
  industry?: string;
  skills?: string[];
  connections?: number;
  is_featured?: boolean; // 追加: 特集クリエイター判定用
  // プラン情報を追加
  plan?: 'free' | 'premium';
  // SNSリンクを追加（URL形式で保持）
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

// ユーザーカテゴリ関連
export interface UserCategory {
  id: string;
  name: string;
}

// タグ関連
export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface WorkTag {
  id: string;
  work_id: string;
  tag_id: string;
  created_at: string;
  tag_name?: string;
}

// Workに紐づくタグ名のみを持つ型
export interface WorkTagWithName {
  tag_name: string;
}

// タグカテゴリ情報を追加
export type TagCategory = string;

// 作品関連
export interface Work {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  thumbnail_url?: string;  // サムネイル用URL
  url?: string;
  source_url?: string; // 追加
  created_at: string;
  updated_at?: string;
  user_id: string;
  views?: number;
  comment_count?: number;
  tags?: string[];
  type?: string; // 作品ジャンル（例: 'writing', 'design' など）
  categoryIds?: string[]; // カスタムカテゴリID（複数）
  tagCategories?: TagCategory[]; // タグカテゴリ情報を追加
  published_date?: string; // 公開月（例: 2025-04）
}

// キャリア情報関連
export interface Career {
  id: string;
  user_id: string;
  company: string;
  position: string;
  department?: string;
  start_date: string;
  end_date?: string;
  is_current_position: boolean;
  description?: string; // 職務内容説明（UI実装・保存済みのため追加）
  created_at: string;
  updated_at?: string;
}

// AI分析結果関連
export interface AIAnalysisResult {
  originality: { summary: string };
  quality: { summary: string };
  expertise: { summary: string };
  engagement: { summary: string };
  // uniquenessフィールドはengagementに置き換え
  overall_insight: {
    summary: string;
    future_potential?: string;
  };
  specialties?: string[];
  design_styles?: string[];
  interests?: {
    areas?: string[];
    topics?: string[];
  };
  tag_frequency?: Record<string, number>;
}

// 表示用AI分析結果（互換性のために残す）
export type DisplayAIAnalysisResult = AIAnalysisResult;

// UI関連
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// 発注者（企業）関連
export interface Client {
  id: number;
  user_id: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  email: string;
  website?: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at?: string;
}

// 案件関連
export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  status: 'draft' | 'published' | 'closed' | 'completed';
  required_skills?: string[];
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

// 応募関連
export interface Application {
  id: string;
  project_id: string;
  user_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string;
  profiles?: UserProfile; // ユーザープロフィール情報を型安全なUserProfile型へ
}

// 契約関連
export interface Contract {
  id: string;
  project_id: string;
  client_id: string;
  creator_id: string;
  status: 'draft' | 'sent' | 'accepted' | 'completed' | 'cancelled';
  amount: number;
  start_date: string;
  end_date?: string;
  terms?: string;
  created_at: string;
  updated_at?: string;
}
