import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/hooks/useToast';
import { 
  LogOut, 
  PlusCircle, 
  Edit, 
  Star, 
  Brush, 
  Compass, 
  AlertCircle, 
  Loader2, 
  Zap,
  Share2,
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { analyzeUserTagsApi } from '../api/tag-analysis-api';
import { UserProfile, Work, Career, DisplayAIAnalysisResult } from '../types';

const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const Mypage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCareerDialog, setShowCareerDialog] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrentPosition, setIsCurrentPosition] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<DisplayAIAnalysisResult | null>(null);
  const [stats, setStats] = useState({
    totalWorks: 0,
    monthlyWorks: Array(12).fill(0),
  });
  const [showShareUrl, setShowShareUrl] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // URLシェアダイアログを表示する関数
  const toggleShareDialog = () => {
    setShowShareUrl(!showShareUrl);
  };

  // ユーザープロファイルを取得する関数
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        return;
      }
      
      if (!userData.user) {
        console.error('User not found');
        return;
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }
      
      setUserProfile({
        id: profileData.id,
        full_name: profileData.full_name || '',
        about: profileData.about || '',
        avatar_url: profileData.avatar_url || '',
        website_url: profileData.website_url || '',
        created_at: profileData.created_at,
        background_image_url: profileData.background_image_url,
        twitter_username: profileData.twitter_username,
        instagram_username: profileData.instagram_username,
        facebook_username: profileData.facebook_username,
        headline: profileData.headline,
        location: profileData.location,
        industry: profileData.industry
      });

      // プロフィール更新完了を通知
      console.log('Profile fetched and updated in state');
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ユーザーのAI分析結果を取得
  const fetchUserInsights = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();
      
      if (error) {
        console.error('Error fetching user insights:', error);
        return;
      }

      if (data) {
        // 分析結果をパース
        const insightData = {
          expertise: data.expertise || { summary: '' },
          talent: data.talent || { summary: '' },
          uniqueness: data.uniqueness || { summary: '' },
          specialties: data.specialties || [],
          interests: {
            areas: data.interests?.areas || [],
            topics: data.interests?.topics || []
          },
          design_styles: data.design_styles || [],
          tag_frequency: data.tag_frequency || {},
          clusters: data.clusters || []
        };

        // 分析結果をステートに設定
        setAiAnalysisResult({
          expertise: {
            summary: insightData.expertise?.summary || ''
          },
          talent: {
            summary: insightData.talent?.summary || ''
          },
          uniqueness: {
            summary: insightData.uniqueness?.summary || ''
          },
          specialties: insightData.specialties || [],
          interests: {
            areas: insightData.interests?.areas || [],
            topics: insightData.interests?.topics || []
          },
          design_styles: insightData.design_styles || [],
          tag_frequency: Object.keys(insightData.tag_frequency || {}).reduce((acc, key) => ({ ...acc, [key]: Number(insightData.tag_frequency[key]) }), {}),
          clusters: insightData.clusters || []
        });
        setHasAnalysis(true);
      }
    } catch (error) {
      console.error('Error in fetchUserInsights:', error);
    }
  }, [userProfile]);

  // ユーザーのタグを分析
  const analyzeUserTagsLocal = useCallback(async () => {
    if (!userProfile || works.length === 0) {
      toast({
        title: '分析できません',
        description: '作品がありません。作品を追加してから再度お試しください。',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      
      // タグの出現頻度を計算
      const tagFrequency: { [key: string]: number } = {};
      works.forEach(work => {
        if (work.tags) {
          work.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        }
      });
      
      // タグ分析APIを呼び出し
      const result = await analyzeUserTagsApi(userProfile.id);
      
      if (!result.success || !result.data) {
        console.error('Failed to analyze user tags:', result.error);
        toast({
          title: 'タグ分析に失敗しました',
          description: result.error || '不明なエラーが発生しました',
          variant: 'destructive'
        });
        return;
      }
      
      // 分析結果をステートに設定
      setAiAnalysisResult({
        expertise: {
          summary: result.data?.expertise?.summary || ''
        },
        talent: {
          summary: result.data?.talent?.summary || ''
        },
        uniqueness: {
          summary: result.data?.uniqueness?.summary || ''
        },
        specialties: result.data?.specialties || [],
        interests: {
          areas: result.data?.interests?.areas || [],
          topics: result.data?.interests?.topics || []
        },
        design_styles: result.data?.design_styles || [],
        tag_frequency: result.data && result.data.tag_frequency ? 
          Object.entries(result.data.tag_frequency).reduce((acc, [key, value]) => ({ 
            ...acc, 
            [key]: typeof value === 'number' ? value : 0
          }), {}) : tagFrequency,
        clusters: result.data?.clusters || []
      });
      
      // 分析結果をデータベースに保存
      try {
        const { error } = await supabase
          .from('user_insights')
          .upsert({
            user_id: userProfile.id,
            expertise: result.data?.expertise,
            talent: result.data?.talent,
            uniqueness: result.data?.uniqueness,
            specialties: result.data?.specialties,
            interests: result.data?.interests,
            design_styles: result.data?.design_styles,
            tag_frequency: result.data?.tag_frequency || tagFrequency,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error saving user insights:', error);
        }
      } catch (saveError) {
        console.error('Error in saving user insights:', saveError);
      }
      
      toast({
        title: 'タグ分析が完了しました',
        description: '分析結果が更新されました',
        variant: 'success'
      });
      
    } catch (error) {
      console.error('Error in analyzeUserTagsLocal:', error);
      toast({
        title: 'タグ分析中にエラーが発生しました',
        description: '時間をおいて再度お試しください',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [userProfile, works, setIsAnalyzing, setAiAnalysisResult, toast]);

  // ユーザーの作品一覧を取得する関数
  const fetchUserWorks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('ユーザーセッションがありません');
        return;
      }
      
      // 作品データを取得
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('*, work_tags(tag_id, tags(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (worksError) {
        console.error('Error fetching works:', worksError);
        return;
      }
      
      // タグ情報を整形
      const worksWithTags = worksData.map((work: Record<string, unknown>) => {
        const workTags = work.work_tags as Array<Record<string, unknown>> || [];
        const tags = workTags
          .filter((wt) => wt.tags)
          .map((wt) => (wt.tags as Record<string, string>).name);
        
        // 画像URLの処理
        const imageUrl = (work.thumbnail_url as string) || '';
        
        return {
          id: work.id as string,
          title: work.title as string,
          description: work.description as string || '',
          thumbnail_url: imageUrl,
          created_at: work.created_at as string,
          updated_at: work.updated_at as string || '',
          user_id: work.user_id as string,
          tags
        } as Work;
      });
      
      setWorks(worksWithTags);
      
      // 月間投稿統計を計算
      const monthlyStats = Array(12).fill(0);
      worksWithTags.forEach((work: Work) => {
        const date = new Date(work.created_at);
        const month = date.getMonth();
        monthlyStats[month]++;
      });
      
      setStats({
        totalWorks: worksWithTags.length,
        monthlyWorks: monthlyStats
      });
      
    } catch (error) {
      console.error('Error in fetchUserWorks:', error);
    }
  }, []);

  // ユーザーの職歴を取得する関数
  const fetchUserCareers = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const { data: careersData, error: careersError } = await supabase
        .from('careers')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('start_date', { ascending: false });
      
      if (careersError) {
        console.error('Error fetching careers:', careersError);
        return;
      }
      
      setCareers(careersData || []);
      
    } catch (error) {
      console.error('Error in fetchUserCareers:', error);
    }
  }, [userProfile]);

  // AIによるタグ分析を実行
  const runAIAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    
    if (works.length === 0) {
      toast({
        title: '作品がありません',
        description: 'AI分析を実行するには、まず作品を追加してください。',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await analyzeUserTagsLocal();
    } catch (error) {
      console.error('Error in runAIAnalysis:', error);
      toast({
        title: 'エラーが発生しました',
        description: '分析中にエラーが発生しました。時間をおいて再度お試しください。',
        variant: 'destructive'
      });
    }
  }, [isAnalyzing, works, analyzeUserTagsLocal, toast]);

  // キャリア編集ダイアログを開く関数
  const openCareerEditDialog = useCallback((career?: Career) => {
    if (career) {
      setEditingCareer(career);
      setCompanyName(career.company);
      setPosition(career.position);
      setDepartment(career.department || '');
      setStartDate(career.start_date);
      setIsCurrentPosition(career.is_current_position);
      if (!career.is_current_position && career.end_date) {
        setEndDate(career.end_date);
      } else {
        setEndDate('');
      }
    } else {
      setEditingCareer(null);
      setCompanyName('');
      setPosition('');
      setDepartment('');
      setStartDate('');
      setEndDate('');
      setIsCurrentPosition(false);
    }
    setShowCareerDialog(true);
  }, []);

  // キャリア情報を保存する関数
  const saveCareer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('ユーザーセッションがありません');
        return;
      }
      
      // UUIDを生成する関数
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const newCareer: Career = {
        id: editingCareer?.id || generateUUID(),
        user_id: user.id,
        company: companyName,
        position,
        department,
        start_date: startDate,
        end_date: isCurrentPosition ? undefined : endDate || undefined,
        is_current_position: isCurrentPosition,
        created_at: new Date().toISOString()
      };

      if (editingCareer) {
        // 既存のキャリアを更新
        const { error } = await supabase
          .from('careers')
          .update(newCareer)
          .eq('id', editingCareer.id);
          
        if (error) {
          console.error('キャリア更新エラー:', error);
          return;
        }
        
        // ローカルステートを更新
        const updatedCareers = careers.map(c => 
          c.id === editingCareer.id ? newCareer : c
        );
        setCareers(updatedCareers);
      } else {
        // 新しいキャリアを追加
        const { error } = await supabase
          .from('careers')
          .insert([newCareer]);
          
        if (error) {
          console.error('キャリア追加エラー:', error);
          return;
        }
        
        // ローカルステートを更新
        setCareers([...careers, newCareer]);
      }

      setShowCareerDialog(false);
    } catch (error) {
      console.error('キャリア保存エラー:', error);
    }
  };

  // 作品詳細ページに移動する関数
  const navigateToWorkDetail = useCallback((workId: string) => {
    navigate(`/works/${workId}`);
  }, [navigate]);

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      navigate('/login');
    } catch (error) {
      console.error('Error in handleLogout:', error);
    }
  }, [navigate]);

  // フォーム入力ハンドラ
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(e.target.value);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepartment(e.target.value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleIsCurrentPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCurrentPosition(e.target.checked);
  };

  // プロフィール画像のURLを取得
  const getProfileImageUrl = useCallback(() => {
    if (!userProfile) return '';
    
    // avatar_urlが存在する場合はそれを使用
    if (userProfile.avatar_url) {
      return userProfile.avatar_url;
    }
    
    // デフォルトのアバター画像を返さない（何も表示しない）
    return '';
  }, [userProfile]);

  // 初回レンダリング時にユーザープロファイルを取得
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // ユーザープロファイルが取得できたら作品一覧と職歴を取得
  useEffect(() => {
    if (userProfile) {
      fetchUserWorks();
      fetchUserCareers();
      fetchUserInsights(); // AI分析結果を取得
    }
  }, [userProfile, fetchUserInsights, fetchUserWorks, fetchUserCareers]);

  // プロフィール更新イベントのリスナーを設定
  useEffect(() => {
    // プロフィール更新イベントのハンドラー
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile update event received:', event.detail);
      if (event.detail && event.detail.profile) {
        // プロフィールデータを更新
        setUserProfile(event.detail.profile);
      } else {
        // イベントにプロフィールデータがない場合は再取得
        fetchUserProfile();
      }
    };

    // プロフィール保存完了イベントのハンドラー
    const handleProfileSaveComplete = () => {
      console.log('Profile save complete event detected, refreshing profile...');
      fetchUserProfile();
    };

    // イベントリスナーを追加
    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    window.addEventListener('profile-save-complete', handleProfileSaveComplete as EventListener);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
      window.removeEventListener('profile-save-complete', handleProfileSaveComplete as EventListener);
    };
  }, [fetchUserProfile]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ローディング表示 */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="mt-2 text-lg font-medium text-gray-700">読み込み中...</p>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16 items-center px-4">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/" className="text-xl font-bold text-indigo-600">Balubo</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/works/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                作品を追加
              </a>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* プロフィールバナーセクション */}
      <div className="w-full bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          {/* カバー画像エリア */}
          <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
            {userProfile?.background_image_url && (
              <img 
                className="h-full w-full object-cover"
                src={userProfile.background_image_url} 
                alt="背景画像"
              />
            )}
          </div>
          
          <div className="px-6 pb-6 relative">
            {/* プロフィール画像 */}
            <div className="absolute -top-16 left-6 border-4 border-white rounded-full overflow-hidden shadow-lg"
                 style={{ width: '8rem', height: '8rem' }}>
              <img
                src={getProfileImageUrl()}
                alt="プロフィール画像"
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* ユーザー情報 */}
            <div className="ml-36 pt-2 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-component-name="Mypage">{userProfile?.full_name || "ユーザー名"}</h1>
                <p className="text-gray-500 max-w-2xl" data-component-name="Mypage">{userProfile?.about || "自己紹介文がありません"}</p>
                
                {/* ヘッドラインを表示 */}
                {userProfile?.headline && (
                  <p className="text-gray-700 font-medium mt-1">{userProfile.headline}</p>
                )}
                
                {/* 所在地と業界を表示 */}
                {(userProfile?.location || userProfile?.industry) && (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    {userProfile.location && <span>{userProfile.location}</span>}
                    {userProfile.location && userProfile.industry && <span className="mx-1">•</span>}
                    {userProfile.industry && <span>{userProfile.industry}</span>}
                  </div>
                )}
                
                {/* SNSリンク */}
                <div className="mt-3 flex space-x-3">
                  {userProfile?.twitter_username && (
                    <a
                      href={`https://twitter.com/${userProfile.twitter_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8v-9H6V5h9v-1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1z" />
                      </svg>
                    </a>
                  )}
                  {userProfile?.instagram_username && (
                    <a
                      href={`https://instagram.com/${userProfile.instagram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-pink-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.35 15.5c-3.51 0-6.35-2.84-6.35-6.35S8.14 4.8 11.65 4.8s6.35 2.84 6.35 6.35-2.84 6.35-6.35 6.35zm0-13c-3.31 0-6 1.79-6 4s1.79 4 4 4 6-1.79 6-4-1.79-4-4-4z" />
                      </svg>
                    </a>
                  )}
                  {userProfile?.facebook_username && (
                    <a
                      href={`https://facebook.com/${userProfile.facebook_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                      </svg>
                    </a>
                  )}
                  {userProfile?.website_url && (
                    <a
                      href={userProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-green-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              
              {/* プロフィール編集ボタンとシェアボタン */}
              <div className="flex space-x-2">
                {/* シェアボタン */}
                <button
                  onClick={toggleShareDialog}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="プロフィールをシェア"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  シェア
                </button>
                
                {/* プロフィール編集ボタン */}
                <a 
                  href="/profile/edit" 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  プロフィール編集
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 月間投稿グラフ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold">アクティビティ</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MONTHS.map((month, index) => {
                  return {
                    name: month,
                    投稿数: stats.monthlyWorks[index] || 0,
                  };
                })}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="投稿数"
                  stroke="#3B82F6"
                  fill="#93C5FD"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 職歴セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">職歴</h2>
            <button 
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => openCareerEditDialog()}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              追加
            </button>
          </div>
          <div className="space-y-6">
            {careers.map((career) => (
              <div key={career.id} className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-3 before:h-3 before:bg-indigo-500 before:rounded-full before:z-10">
                <div className="absolute left-[5.5px] top-5 bottom-0 w-0.5 bg-gray-200 -z-10"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{career.company}</h3>
                    <p className="text-gray-700">{career.position} {career.department && `/ ${career.department}`}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {career.start_date} - {career.is_current_position ? '現在' : career.end_date}
                    </p>
                  </div>
                  <button 
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => openCareerEditDialog(career)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    編集
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI分析セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">AI分析</h2>
            <button
              onClick={runAIAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  AI分析を実行
                </>
              )}
            </button>
          </div>
            
          {hasAnalysis ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                  <h4 className="text-md font-semibold">AI分析について</h4>
                </div>
                <p className="text-sm text-gray-600">
                  この分析結果はあなたの作品から抽出したタグに基づいて生成されています。
                  より正確な分析のためには、作品にタグを追加してください。
                </p>
              </div>

              {/* 専門性 */}
              {aiAnalysisResult?.expertise?.summary && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <h4 className="text-md font-semibold">専門性</h4>
                  </div>
                  <p className="text-sm text-gray-600">{aiAnalysisResult.expertise.summary}</p>
                </div>
              )}

              {/* スタイル */}
              {aiAnalysisResult?.talent?.summary && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Brush className="h-5 w-5 text-orange-500 mr-2" />
                    <h4 className="text-md font-semibold">スタイル</h4>
                  </div>
                  <p className="text-sm text-gray-600">{aiAnalysisResult.talent.summary}</p>
                </div>
              )}

              {/* 興味・関心 */}
              {aiAnalysisResult?.uniqueness?.summary && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Compass className="h-5 w-5 text-indigo-500 mr-2" />
                    <h4 className="text-md font-semibold">興味・関心</h4>
                  </div>
                  <p className="text-sm text-gray-600">{aiAnalysisResult.uniqueness.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center">
                <FileText className="h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">作品がありません</h3>
                <p className="text-sm text-gray-500">
                  「作品を追加」ボタンをクリックして、最初の作品を追加しましょう
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 作品一覧セクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">作品一覧</h2>
            <a
              href="/works/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              作品を追加
            </a>
          </div>

          {works.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work) => (
                <div 
                  key={work.id} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigateToWorkDetail(work.id)}
                >
                  <div className="relative pb-[56.25%] bg-gray-100"> 
                    {work.thumbnail_url ? (
                      <img
                        src={work.thumbnail_url}
                        alt={work.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          // 画像読み込みエラー時のフォールバック
                          console.error(`Image load error for ${work.title}:`, e.target);
                          console.error(`Failed URL: ${work.thumbnail_url}`);
                          e.currentTarget.onerror = null;
                          // インラインSVGプレースホルダー画像を設定
                          e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                        }}
                        onLoad={() => {
                          // 画像読み込み成功時のログ
                          console.log(`Image loaded successfully for ${work.title}: ${work.thumbnail_url}`);
                        }}
                      />
                    ) : (
                      // 画像がない場合のプレースホルダー
                      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-100">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="48" 
                          height="48" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="text-gray-400"
                        >
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">No Image</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                      {work.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {work.description}
                    </p>
                    {work.tags && work.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {work.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {work.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{work.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <span>
                        {new Date(work.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <FileText className="h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">作品がありません</h3>
                <p className="text-sm text-gray-500">
                  「作品を追加」ボタンをクリックして、最初の作品を追加しましょう
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* URLシェアダイアログ */}
      {showShareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">プロフィールをシェア</h3>
              <button 
                onClick={toggleShareDialog}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-2">以下のURLをコピーしてシェアできます：</p>
            <div className="flex">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="bg-indigo-600 text-white px-4 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  const input = document.querySelector('input[type="text"][value="' + window.location.href + '"]') as HTMLInputElement;
                  if (input) {
                    input.select();
                    document.execCommand('copy');
                    alert('URLをコピーしました');
                  }
                }}
              >
                選択
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={toggleShareDialog}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャリア編集ダイアログ */}
      {showCareerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCareer ? 'キャリア情報を編集' : '新しいキャリアを追加'}
              </h3>
              <button
                onClick={() => setShowCareerDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); saveCareer(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社名 *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={handleCompanyNameChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    役職 *
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={handlePositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={handleDepartmentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日 *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isCurrentPosition"
                    checked={isCurrentPosition}
                    onChange={handleIsCurrentPositionChange}
                    className="mr-2"
                  />
                  <label htmlFor="isCurrentPosition" className="text-sm font-medium text-gray-700">
                    現在の職場
                  </label>
                </div>
                {!isCurrentPosition && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      終了日
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCareerDialog(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    保存
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mypage;