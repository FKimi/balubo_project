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
}

// 作品関連
export interface Work {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  thumbnail_url?: string;  // サムネイル用URL
  url?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  views?: number;
  comment_count?: number;
  tags?: string[];
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
  created_at: string;
  updated_at?: string;
}

// AI分析結果関連
export interface AIAnalysisResult {
  expertise?: {
    summary: string;
  };
  talent?: {
    summary: string;
  };
  uniqueness?: {
    summary: string;
  };
  content_style?: {
    summary: string;
  };
  specialties?: string[];
  interests?: {
    areas?: string[];
    topics?: string[];
    summary?: string;
  };
  design_styles?: string[];
  tag_frequency?: { [key: string]: number };
  clusters?: Array<{ name: string; tags: string[] }>;
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
