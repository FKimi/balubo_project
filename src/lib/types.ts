export interface Tag {
  id: string;
  name: string;
  created_at?: string;
}

export interface Work {
  id: string;
  title: string;
  description: string;
  source_url: string;
  thumbnail_url: string;
  work_type: string;
  is_public: boolean;
  user_id: string;
  tags?: string[];
  roles?: string[];
  published_date?: string; // 掲載月 (例: 2025-04)
  created_at: string;
  // 他の必要なフィールドもここに追加
}

// --- カテゴリ管理 ---
export interface UserCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// --- 作品とカテゴリの中間テーブル ---
export interface WorkCategory {
  id: string;
  work_id: string;
  category_id: string;
}