import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { UserProfile, Work, UserCategory } from '../../types';

// 必要なimportを明示的に復活
import ProfileHeader from './portfolio/ProfileHeader';
import TabNavigation from './portfolio/TabNavigation';
import WorksSection from './portfolio/WorksSection';
import AiAnalysisSection from './portfolio/AiAnalysisSection';
import ShareDialog from './portfolio/ShareDialog';
import CareerSection from './portfolio/CareerSection';
import RelatedWorksSection from './portfolio/RelatedWorksSection';
import ProfileAboutEditInline from './portfolio/ProfileAboutEditInline';
import ProfileSkillsEditInline from './portfolio/ProfileSkillsEditInline';
import TagFrequencyDisplay from './portfolio/TagFrequencyDisplay';
import { fetchWorkPostActivityByMonth } from "../../api/services/activity";
import { ActivityMonthChart, ActivityMonthData } from "./portfolio/ActivityChart";

const Portfolio: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userWorks, setUserWorks] = useState<Work[]>([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [categoryTab, setCategoryTab] = useState<string>('all'); // 'all' or category.id
  const [selectedTab, setSelectedTab] = useState<string>("works");

  type AiAnalysis = {
    gemini: { originality?: { summary?: string } };
    ruleBased: {
      expertise?: { summary?: string };
      engagement?: { summary?: string };
      overall_insight?: { summary?: string; future_potential?: string };
    };
  };
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);

  // 型明示でanyを排除
  const [careers, setCareers] = useState<{
    id: string;
    company: string;
    position: string;
    department: string;
    start_date: string;
    end_date?: string;
    is_current_position: boolean;
    description?: string;
  }[]>([]);
  const [relatedWorks, setRelatedWorks] = useState<Work[]>([]);

  const navigate = useNavigate();
  const params = useParams();

  // ユーザーの作品一覧を取得する関数
  const fetchUserWorks = useCallback(async (userId: string) => {
    try {
      if (!userId) {
        console.error('ユーザーIDがありません');
        return;
      }
      
      console.log('作品を取得するユーザーID:', userId);
      
      // 作品データを取得
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('*, work_tags(tag_id, tags(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (worksError) {
        console.error('Error fetching works:', worksError);
        console.log('Error details:', worksError.details);
        console.log('Error hint:', worksError.hint);
        console.log('Error code:', worksError.code);
        
        // エラーが発生した場合でも、他のユーザーのプロフィールを表示している場合は空の配列を設定
        if (!isCurrentUser) {
          console.log('他のユーザーのプロフィール表示中: 空の作品リストを表示');
          setUserWorks([]);
        }
        return;
      }
      
      console.log('取得した作品データ:', worksData);
      
      // データが空の場合
      if (!worksData || worksData.length === 0) {
        console.log('作品データが空です');
        setUserWorks([]);
        return;
      }
      
      // --- 作品IDリストを取得 ---
      const workIds: string[] = worksData.map((work: { id: string }) => work.id);
      const workCategoriesMap: Record<string, string[]> = {};
      if (workIds.length > 0) {
        // work_categoriesからカテゴリIDを取得
        const { data: workCategories, error: workCategoriesError } = await supabase
          .from('work_categories')
          .select('work_id, category_id')
          .in('work_id', workIds);
        if (!workCategoriesError && workCategories) {
          workCategories.forEach((row: { work_id: string, category_id: string }) => {
            if (!workCategoriesMap[row.work_id]) workCategoriesMap[row.work_id] = [];
            workCategoriesMap[row.work_id].push(row.category_id);
          });
        }
      }

      // タグ情報・カテゴリ情報を整形
      const worksWithTagsAndCategories = worksData.map((work: Record<string, unknown>) => {
        const workTags = work.work_tags as Array<Record<string, unknown>> || [];
        const tags = workTags.filter((wt) => wt.tags).map((wt) => (wt.tags as Record<string, string>).name);
        const imageUrl = (work.thumbnail_url as string) || '';
        return {
          id: work.id as string,
          title: work.title as string,
          description: work.description as string || '',
          thumbnail_url: imageUrl,
          created_at: work.created_at as string,
          updated_at: work.updated_at as string || '',
          user_id: work.user_id as string,
          tags,
          type: work.type as string,
          categoryIds: workCategoriesMap[work.id as string] || []
        } as Work;
      });

      setUserWorks(worksWithTagsAndCategories);
    } catch {
      console.error('Error in fetchUserWorks:');
      
      // エラーが発生した場合でも、他のユーザーのプロフィールを表示している場合は空の配列を設定
      if (!isCurrentUser) {
        console.log('エラー発生時: 他のユーザーのプロフィール表示中のため空の作品リストを表示');
        setUserWorks([]);
      }
    } finally {
      console.log('fetchUserWorks 処理完了');
    }
  }, [isCurrentUser]);

  // ユーザーの職歴を取得する関数
  const fetchUserCareers = useCallback(async (userId: string) => {
    try {
      if (!userId) return;
      const { data: careersData, error: careersError } = await supabase
        .from('careers')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      if (!careersError) setCareers(careersData || []);
      else setCareers([]);
    } catch {
      setCareers([]);
    }
  }, []);

  // AI分析データ取得
  const fetchUserInsights = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        setAiAnalysis(null);
        return;
      }
      setAiAnalysis(data);
    } catch {
      setAiAnalysis(null);
    }
  }, []);

  // ユーザープロファイルの取得
  const fetchUserProfile = useCallback(async () => {
    try {
      // URLパラメータからIDを取得、なければ現在のユーザーのIDを使用
      const profileId = params.id;
      let userIdToFetch: string | null = null;
      let isFetchingOwnProfile = false;

      console.log('プロフィールを取得するID (params.id):', profileId);
      
      if (profileId) {
        // 他のユーザーのプロフィールを表示する場合
        userIdToFetch = profileId;
        setIsCurrentUser(false);
        console.log('他のユーザーのプロフィールをフェッチします。');
      } else {
        // 自分のプロフィールを表示する場合
        console.log('自分のプロフィールをフェッチします。');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ ユーザーセッションの取得エラー:', userError);
          if (window.location.pathname !== '/login') navigate('/login');
          return;
        }

        if (!user) {
          console.error('❌ ログインしていません。ログインページにリダイレクトします。');
          if (window.location.pathname !== '/login') navigate('/login');
          return;
        }

        userIdToFetch = user.id;
        isFetchingOwnProfile = true;
        setIsCurrentUser(true);
      }

      if (!userIdToFetch) {
        console.error('❌ フェッチ対象のユーザーIDが不明です。');
        if (window.location.pathname !== '/login') navigate('/login');
        return;
      }

      console.log('Supabaseクエリを実行 (profiles): id =', userIdToFetch);
      // .maybeSingle() を使用してデータが存在しない場合にエラーではなく null を返すようにする
      const { data: profileData, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userIdToFetch)
        .maybeSingle(); // ★ .single() から .maybeSingle() に変更
          
      // select時のエラー詳細ログ
      if (selectError) {
        console.error('❌ プロフィール取得エラー (select):', selectError);
        console.error('   エラーコード:', selectError.code);
        console.error('   メッセージ:', selectError.message);
        console.error('   詳細:', selectError.details);
        console.error('   ヒント:', selectError.hint);
        if (window.location.pathname !== '/login') navigate('/login');
        return; 
      }
        
      // プロフィールデータが取得できた場合
      if (profileData) {
        console.log('✅ プロフィール取得成功:', profileData);
        setUserProfile(profileData);

        // 他のユーザーの場合、または自分のプロフィールでデータがあった場合は、作品等も取得
        if (!isFetchingOwnProfile || (isFetchingOwnProfile && profileData)) {
          await Promise.all([
            fetchUserWorks(userIdToFetch),
            fetchUserCareers(userIdToFetch),
            fetchUserInsights(userIdToFetch),
          ]);
          console.log('関連データ取得完了 (Works, Careers, Insights)');
        }
      } 
      // プロフィールデータがなく、かつ自分のプロフィールを取得しようとしている場合 (新規ユーザー)
      else if (isFetchingOwnProfile && !profileData) {
        console.log('ℹ️ プロフィールが存在しないため、新規作成します。');
        const { data: { user } } = await supabase.auth.getUser(); // ユーザー情報を再取得 (念のため)
        if (!user) {
          console.error('❌ 新規プロフィール作成時にユーザー情報が見つかりません。');
          if (window.location.pathname !== '/login') navigate('/login');
          return;
        }

        const newProfile: UserProfile = {
          id: user.id,
          // Googleログインの場合、user_metadata から取得 (なければ空文字)
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          about: '',
          created_at: new Date().toISOString(),
          profile_image_url: user.user_metadata?.avatar_url || '', // Googleの avatar_url を使う
          website_url: ''
          // 他の必須フィールドがあれば初期値を設定
        };
        
        console.log('挿入する新しいプロフィールデータ:', newProfile);

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);
            
        // insert時のエラー詳細ログ
        if (insertError) {
          console.error('❌ 新規プロフィール作成エラー (insert):', insertError);
          console.error('   エラーコード:', insertError.code);
          console.error('   メッセージ:', insertError.message);
          console.error('   詳細:', insertError.details);
          console.error('   ヒント:', insertError.hint);
          if (window.location.pathname !== '/login') navigate('/login');
          return; 
        } else {
          console.log('✅ 新規プロフィール作成成功');
          setUserProfile(newProfile);
          // 新規作成時は Works, Careers, Insights は空なのでフェッチ不要
        }
      }
      // 他のユーザーのプロフィールが見つからなかった場合
      else if (!isFetchingOwnProfile && !profileData) {
        console.error('❌ 指定されたIDのプロフィールが見つかりません。');
        if (window.location.pathname !== '/login') navigate('/login');
        return;
      }

    } catch {
      console.error('❌ fetchUserProfile 関数内で予期せぬエラー:');
      if (window.location.pathname !== '/login') navigate('/login');
    } finally {
      console.log('fetchUserProfile 処理完了');
    }
  // 依存配列を修正: fetchUserWorks, fetchUserCareers, fetchUserInsights を追加
  }, [navigate, params.id, fetchUserCareers, fetchUserWorks, fetchUserInsights]);

  // コンポーネントの初期化
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log('🚀 ポートフォリオコンポーネントを初期化しています...');
        
        // URLパラメータからIDを取得
        const profileId = params.id;
        
        if (profileId) {
          console.log('📌 他のユーザーのプロフィールを表示します:', profileId);
          // 他のユーザーのプロフィールを表示する場合
          await fetchUserProfile();
        } else {
          // 自分のプロフィールを表示する場合、ログイン状態を確認
          console.log('🔍 ログイン状態を確認しています...');
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ セッション取得エラー:', error);
            if (window.location.pathname !== '/login') navigate('/login');
            return;
          }
          
          if (!data.session) {
            console.error('❌ セッションがありません - ログイン必要');
            
            // Google認証プロセス中の場合、エラーメッセージは表示しない
            const isGoogleAuthInProgress = localStorage.getItem('google_auth_in_progress') === 'true';
            if (isGoogleAuthInProgress) {
              console.log('ℹ️ Google認証処理中のため、リダイレクトのみを行います');
              
              // 2分以上経過していてはタイムアウト扱いにする
              const timestamp = Number(localStorage.getItem('google_auth_timestamp') || '0');
              const elapsed = Date.now() - timestamp;
              if (elapsed > 2 * 60 * 1000) {  // 2分
                console.log('⚠️ 認証タイムアウト - 経過時間:', elapsed / 1000, '秒');
                localStorage.removeItem('google_auth_in_progress');
                localStorage.removeItem('google_auth_timestamp');
                
                if (window.location.pathname !== '/login') navigate('/login');
              }
            } else {
              // 通常のログインエラー
              if (window.location.pathname !== '/login') navigate('/login');
            }
            
            return;
          }
          
          console.log('✅ ログイン済み - ユーザーID:', data.session.user.id);
          
          // ログインしている場合は自分のプロフィールを取得
          await fetchUserProfile();
        }
      } catch {
        console.error('❌ コンポーネント初期化エラー:');
        
        if (window.location.pathname !== '/login') navigate('/login');
      }
    };
    
    initializeComponent();
  }, [fetchUserProfile, navigate, params.id]);

  // カテゴリー初期取得 & イベント監視
  const fetchCategories = useCallback(async () => {
    if (!userProfile?.id) return;
    const { data, error } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: true });
    if (!error && data) setUserCategories(data as UserCategory[]);
  }, [userProfile]);

  useEffect(() => {
    if (isCurrentUser && userProfile?.id) fetchCategories();
    // カスタムイベント監視でカテゴリ一覧を即時リフレッシュ
    const handler = () => {
      if (isCurrentUser && userProfile?.id) fetchCategories();
    };
    window.addEventListener('category-updated', handler);
    return () => window.removeEventListener('category-updated', handler);
  }, [isCurrentUser, userProfile, fetchCategories]);

  // toggleShareDialog関数の実装
  const toggleShareDialog = () => setShowShareDialog(prev => !prev);

  // タグ頻度計算
  useEffect(() => {
    if (!userWorks || userWorks.length === 0) {
      setRelatedWorks([]);
      return;
    }
    // 関連作品（タグが2つ以上一致するものを優先）
    if (userWorks.length > 1) {
      const mainTags = userWorks[0]?.tags || [];
      const related = userWorks.filter(w => w.id !== userWorks[0].id && w.tags?.some((t: string) => mainTags.includes(t)));
      setRelatedWorks(related);
    } else {
      setRelatedWorks([]);
    }
  }, [userWorks]);

  // プランバッジの仮UI（UserProfileにplan, is_premium等がある前提）
  const planBadge = userProfile?.plan ? (
    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${userProfile.plan === 'premium' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
      {userProfile.plan === 'premium' ? 'プレミアム' : 'フリープラン'}
    </span>
  ) : null;

  // 空状態ガイドUI（作品・キャリア・AI分析）
  const isWorksEmpty = userWorks.length === 0;
  const isCareersEmpty = careers.length === 0;
  const isAiAnalysisEmpty = !aiAnalysis;

  // 作品追加ボタン押下時の遷移先をWorkCreateWebに固定
  const handleWorkAdd = () => {
    navigate('/user/works/create');
  };

  // --- state追加 ---
  const [aboutEditing, setAboutEditing] = useState(false);
  const [skillsEditing, setSkillsEditing] = useState(false);
  const [aboutLoading, setAboutLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  // --- 追加: キャリア編集用の状態 ---
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [careerForm, setCareerForm] = useState({
    company: '',
    position: '',
    department: '',
    start_date: '',
    end_date: '',
    is_current_position: false,
    description: ''
  });
  const [careerError, setCareerError] = useState<string | null>(null);
  const [editCareerLoading, setEditCareerLoading] = useState(false);

  // --- 編集ボタン押下時 ---
  const handleEditCareer = (careerId: string) => {
    const target = careers.find(c => c.id === careerId);
    if (target) {
      setCareerForm({
        company: target.company || '',
        position: target.position || '',
        department: target.department || '',
        start_date: target.start_date || '',
        end_date: target.end_date || '',
        is_current_position: target.is_current_position || false,
        description: target.description || ''
      });
      setEditingCareerId(careerId);
      setCareerError(null);
    }
  };

  // --- 保存 ---
  const handleSaveCareer = async () => {
    setCareerError(null);
    setEditCareerLoading(true);
    if (!careerForm.company || !careerForm.position || !careerForm.start_date) {
      setCareerError('会社名・役職・開始日は必須です');
      setEditCareerLoading(false);
      return;
    }
    const { error } = await supabase.from('careers').update({
      company: careerForm.company,
      position: careerForm.position,
      department: careerForm.department,
      start_date: careerForm.start_date,
      end_date: careerForm.end_date,
      is_current_position: careerForm.is_current_position,
      description: careerForm.description
    }).eq('id', editingCareerId!);
    setEditCareerLoading(false);
    if (error) {
      setCareerError('保存に失敗しました');
      return;
    }
    setCareers(prev => prev.map(c => c.id === editingCareerId ? { ...c, ...careerForm } : c));
    setEditingCareerId(null);
  };

  // --- キャンセル ---
  const handleCancelCareer = () => {
    setEditingCareerId(null);
    setCareerError(null);
  };

  // --- タグ頻度データ生成 ---
  const tagFrequencies = (() => {
    const freq: Record<string, number> = {};
    userWorks.forEach(work => {
      (work.tags || []).forEach((tag: string) => {
        freq[tag] = (freq[tag] || 0) + 1;
      });
    });
    return Object.entries(freq).map(([tag, count]) => ({ tag, count }));
  })();

  // --- 年月ごとの投稿履歴 ---
  const [activityMonthData, setActivityMonthData] = useState<ActivityMonthData[]>([]);
  const [activityMonthLoading, setActivityMonthLoading] = useState(false);
  useEffect(() => {
    if (!userProfile?.id) return;
    setActivityMonthLoading(true);
    fetchWorkPostActivityByMonth(userProfile.id, 12).then(data => {
      setActivityMonthData(data);
      setActivityMonthLoading(false);
    });
  }, [userProfile?.id]);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 w-full max-w-screen-lg mx-auto px-4 md:px-8">
          {/* プロフィールヘッダー */}
          <ProfileHeader
            userProfile={userProfile}
            isCurrentUser={isCurrentUser}
            onEditProfile={() => navigate('/profile/edit')}
            onShare={() => setShowShareDialog(true)}
          />
          {/* プランバッジ表示 */}
          <div className="flex justify-end mr-4 mt-2">{planBadge}</div>

          {/* タブナビゲーション */}
          <TabNavigation
            tabs={[
              { label: 'プロフィール', value: 'profile' },
              { label: '作品一覧', value: 'works' },
            ]}
            selectedTab={selectedTab}
            onChange={setSelectedTab}
          />

          {/* タブごとのコンテンツ切り替え */}
          <div className="max-w-screen-lg mx-auto">
            {selectedTab === 'profile' && (
              <>
                {/* --- 自己紹介 --- */}
                <div className="mb-10">
                  <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900">自己紹介</h3>
                      {isCurrentUser && !aboutEditing && (
                        <button className="ml-2 px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-200 font-semibold shadow transition flex items-center gap-1" onClick={() => setAboutEditing(true)}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17v-4z"/></svg>
                          編集
                        </button>
                      )}
                    </div>
                    {aboutEditing ? (
                      <ProfileAboutEditInline
                        about={userProfile?.about || ''}
                        onSave={async (about: string) => {
                          setAboutLoading(true);
                          setAboutError(null);
                          const { error } = await supabase.from('profiles').update({ about }).eq('id', userProfile?.id);
                          if (!error) {
                            setUserProfile(prev => prev ? { ...prev, about } : prev);
                            setAboutEditing(false);
                          } else {
                            setAboutError('保存に失敗しました');
                          }
                          setAboutLoading(false);
                        }}
                        onCancel={() => setAboutEditing(false)}
                        loading={aboutLoading}
                      />
                    ) : (
                      <div className="text-gray-800 whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[48px]">
                        {userProfile?.about ? userProfile.about : '自己紹介文が登録されていません。'}
                      </div>
                    )}
                    {aboutError && <div className="text-red-500 text-xs mt-1">{aboutError}</div>}
                  </div>
                </div>
                {/* --- できること --- */}
                <div className="mb-10">
                  <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6M12 4v6m8 6a8 8 0 11-16 0 8 8 0 0116 0z"/></svg>
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900">できること</h3>
                      {isCurrentUser && !skillsEditing && (
                        <button className="ml-2 px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 hover:bg-blue-200 font-semibold shadow transition flex items-center gap-1" onClick={() => setSkillsEditing(true)}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17v-4z"/></svg>
                          編集
                        </button>
                      )}
                    </div>
                    {skillsEditing ? (
                      <ProfileSkillsEditInline
                        skills={userProfile?.skills || []}
                        onSave={async (skills) => {
                          setSkillsLoading(true);
                          setSkillsError(null);
                          const { error } = await supabase.from('profiles').update({ skills }).eq('id', userProfile?.id);
                          if (!error) {
                            setUserProfile(prev => prev ? { ...prev, skills } : prev);
                            setSkillsEditing(false);
                          } else {
                            setSkillsError('保存に失敗しました');
                          }
                          setSkillsLoading(false);
                        }}
                        onCancel={() => setSkillsEditing(false)}
                        loading={skillsLoading}
                      />
                    ) : (
                      userProfile?.skills && userProfile.skills.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {userProfile.skills.map((skill: string, idx: number) => (
                            <li key={`${skill}-${idx}`} className="rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 px-3 py-1 text-xs font-semibold shadow">
                              {skill}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-400">できること（スキル）が登録されていません。</div>
                      )
                    )}
                    {skillsError && <div className="text-red-500 text-xs mt-1">{skillsError}</div>}
                  </div>
                </div>
                {/* --- キャリア --- */}
                <div className="mb-10">
                  <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18V6a2 2 0 012-2h8a2 2 0 012 2v12M6 18h12M6 18v2a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900">職歴・キャリア</h3>
                      {isCurrentUser && (
                        <button className="ml-2 px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-200 font-semibold shadow transition flex items-center gap-1" onClick={() => navigate('/profile/edit')}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17v-4z"/></svg>
                          編集
                        </button>
                      )}
                    </div>
                    {isCareersEmpty ? (
                      <div className="text-center text-gray-400 py-8">まだ職歴が登録されていません。</div>
                    ) : (
                      <CareerSection
                        careers={careers}
                        isCurrentUser={isCurrentUser}
                        editingCareerId={editingCareerId}
                        editError={careerError}
                        onEdit={handleEditCareer}
                        onSave={handleSaveCareer}
                        onCancel={handleCancelCareer}
                        editLoading={editCareerLoading}
                      />
                    )}
                  </div>
                </div>
                {/* --- タグ・アクティビティ・AI分析まとめ表示 --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 7v2a4 4 0 004 4h10a4 4 0 004-4V7"/><path d="M7 21h10"/><path d="M12 17v4"/></svg>
                      </span>
                      <h3 className="text-lg font-bold text-indigo-700">よく使用するタグ</h3>
                    </div>
                    <TagFrequencyDisplay tagFrequencies={tagFrequencies} />
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18"/><path d="M12 3v18"/></svg>
                      </span>
                      <h3 className="text-lg font-bold text-blue-700">作品投稿アクティビティ（月別）</h3>
                    </div>
                    {activityMonthLoading ? (
                      <div className="h-40 flex items-center justify-center text-gray-400">読み込み中...</div>
                    ) : activityMonthData && activityMonthData.length > 0 ? (
                      <ActivityMonthChart data={activityMonthData} />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-gray-400">投稿履歴がありません</div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                    </span>
                    <h3 className="text-lg font-bold text-green-700">AIによるクリエイター分析</h3>
                  </div>
                  {isAiAnalysisEmpty ? (
                    <div className="text-center text-gray-400 py-8">まだAI分析はありません。<br />
                      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow transition">AI分析を実行する</button>
                    </div>
                  ) : (
                    <AiAnalysisSection />
                  )}
                </div>
              </>
            )}
            {selectedTab === 'works' && (
              <div className="mt-8">
                {isWorksEmpty ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                    </span>
                    <p className="text-gray-400 text-lg mb-4">まだ作品が登録されていません。</p>
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow transition text-base font-semibold" onClick={handleWorkAdd}>作品を追加する</button>
                  </div>
                ) : (
                  <WorksSection
                    userWorks={userWorks}
                    userCategories={userCategories}
                    categoryTab={categoryTab}
                    setCategoryTab={setCategoryTab}
                    isCurrentUser={isCurrentUser}
                    onWorkClick={(id: string) => {
                      if (id === 'create') {
                        handleWorkAdd();
                      } else {
                        // 作品詳細ページへ遷移
                        navigate(`/user/works/${id}`);
                      }
                    }}
                  />
                )}
              </div>
            )}
            {selectedTab === 'works' && relatedWorks.length > 0 && (
              <div className="mt-8">
                <RelatedWorksSection works={relatedWorks} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* モーダル類 */}
      <ShareDialog
        open={showShareDialog}
        profileUrl={`${window.location.origin}/profile/${userProfile?.id}`}
        onCopy={() => {}}
        onClose={toggleShareDialog}
      />
    </div>
  );
};

export default Portfolio;