import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';

// アプリケーション全体の状態を定義
interface AppState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

// コンテキストの作成
const AppContext = createContext<AppState | undefined>(undefined);

// コンテキストプロバイダーのプロパティ
interface AppProviderProps {
  children: ReactNode;
}

// コンテキストプロバイダーコンポーネント
export function AppProvider({ children }: AppProviderProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ユーザープロフィールの取得
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserProfile(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        throw error;
      }
      
      setUserProfile(data as UserProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('プロフィールの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザープロフィールの更新
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // 更新後にプロフィールを再取得
      await fetchUserProfile();
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 初回マウント時にユーザープロフィールを取得
  useEffect(() => {
    fetchUserProfile();
    
    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // コンテキスト値の作成
  const value: AppState = {
    userProfile,
    isLoading,
    error,
    updateUserProfile,
    refreshUserProfile: fetchUserProfile
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// カスタムフック
export function useApp() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
}
