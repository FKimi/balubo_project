import React, { useState, useEffect, useCallback, FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import type { UserProfile, Work, UserCategory } from '../../../types';

// 必要なimportを明示的に復活
import ProfileHeader from './ProfileHeader';
import TabNavigation from './TabNavigation';
import WorksSection from './WorksSection';
import ShareDialog from './ShareDialog';
import ProfileAboutEditInline from './ProfileAboutEditInline';
import ProfileSkillsEditInline from './ProfileSkillsEditInline';
import { fetchWorkPostActivityByMonth } from "../../../api/services/activity";
import { ActivityMonthData } from "./ActivityChart";
import FeaturedWorks from './FeaturedWorks'; // 追加: 代表作品コンポーネント
import AiAnalysisTab from './AiAnalysisTab'; // AI分析タブコンポーネント
import CareerSection from './CareerSection'; // キャリアセクションコンポーネント
import { AiAnalysis } from './AiAnalysisTab'; // タイプをインポート
import CareerEditInline from './CareerEditInline'; // 追加: キャリア編集用コンポーネント

// Career型の定義（CareerEditInlineと共通）
type Career = {
  id: string;
  company: string;
  position: string;
  department: string;
  start_date: string;
  end_date?: string;
  is_current_position: boolean;
  description?: string;
};

const Portfolio: FC = () => {
  // --- 状態定義 ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userWorks, setUserWorks] = useState<Work[]>([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [categoryTab, setCategoryTab] = useState<string>('all'); // 'all' or category.id
  const [selectedTab, setSelectedTab] = useState<string>("works");
  // 追加: 代表作品の状態
  const [featuredWorks, setFeaturedWorks] = useState<Work[]>([]);

  // --- AI分析関連の状態 ---
  const [isAiAnalysisEmpty, setIsAiAnalysisEmpty] = useState(true);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // フォロー関連の状態を追加
  const [followCount, setFollowCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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
  const [, setRelatedWorks] = useState<Work[]>([]);

  // AI分析データを保持するためのstate
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);

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
        .order('published_date', { ascending: false, nullsFirst: false })
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

  // 追加: 代表作品を取得する関数
  const fetchFeaturedWorks = useCallback(async (userId: string) => {
    try {
      if (!userId) return;
      
      // プロフィールから代表作品IDの配列を取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('featured_work_ids')
        .eq('id', userId)
        .single();
      
      if (profileError || !profileData || !profileData.featured_work_ids) {
        // 代表作品が設定されていなければ空配列を設定
        setFeaturedWorks([]);
        return;
      }
      
      const featuredWorkIds = profileData.featured_work_ids as string[];
      if (featuredWorkIds.length === 0) {
        setFeaturedWorks([]);
        return;
      }
      
      // 代表作品のデータを取得
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('*, work_tags(tag_id, tags(name))')
        .in('id', featuredWorkIds);
      
      if (worksError || !worksData) {
        console.error('代表作品取得エラー:', worksError);
        setFeaturedWorks([]);
        return;
      }
      
      // タグ情報を整形
      const worksWithTags = worksData.map((work: Record<string, unknown>) => {
        const workTags = work.work_tags as Array<Record<string, unknown>> || [];
        const tags = workTags.filter((wt) => wt.tags).map((wt) => (wt.tags as Record<string, string>).name);
        return {
          id: work.id as string,
          title: work.title as string,
          description: work.description as string || '',
          thumbnail_url: work.thumbnail_url as string || '',
          created_at: work.created_at as string,
          updated_at: work.updated_at as string || '',
          user_id: work.user_id as string,
          tags,
          type: work.type as string,
        } as Work;
      });
      
      // featuredWorkIdsの順序を保持するようにソート
      const sortedWorks = featuredWorkIds
        .map(id => worksWithTags.find((work) => work.id === id))
        .filter((work): work is Work => work !== undefined);
      
      setFeaturedWorks(sortedWorks);
    } catch (error) {
      console.error('代表作品取得エラー:', error);
      setFeaturedWorks([]);
    }
  }, []);

  // 代表作品を更新する関数

  // 代表作品の編集ダイアログを表示

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
        setIsAiAnalysisEmpty(true);
        return;
      }
      
      setIsAiAnalysisEmpty(!data); // データがなければtrue、あればfalse
      
      // データが取得できた場合、AiAnalysis型に変換して保存
      if (data) {
        // user_insightsテーブルのデータ構造をAiAnalysis型に変換
        const convertedData: AiAnalysis = {
          id: data.id || '',
          user_id: data.user_id,
          features: {
            creativity: {
              id: 'creativity',
              title: '創造性',
              description: data.originality?.summary || '独自の視点と表現力で、他にはない価値あるコンテンツを生み出す能力があります。',
              icon: 'creativity'
            },
            expertise: {
              id: 'expertise',
              title: '専門性',
              description: data.quality?.summary || '特定分野における深い知識と洞察力を持ち、説得力のある質の高いコンテンツを提供しています。',
              icon: 'expertise'
            },
            influence: {
              id: 'influence',
              title: '影響力',
              description: data.engagement?.summary || '読者・視聴者の感情や思考に響き、行動変容を促す力を持っています。',
              icon: 'influence'
            }
          },
          overall_strength: data.overall_insight?.summary?.substring(0, 30) || "創造的な表現者",
          creator_type: "創造的な専門家",
          creator_type_description: data.overall_insight?.summary || "専門性と独自の視点を組み合わせた「創造的な表現者」タイプのクリエイターです。",
          future_potential: data.overall_insight?.future_potential || "専門性をさらに深めつつ、より広い読者層にリーチする新しい表現方法への挑戦が期待されます。",
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          analysis_version: 1
        };
        
        setAiAnalysis(convertedData);
      } else {
        setAiAnalysis(null);
      }
    } catch {
      setIsAiAnalysisEmpty(true);
      setAiAnalysis(null);
    }
  }, []);

  // AI分析実行関数
  const handleRunAiAnalysis = async () => {
    if (!userProfile?.id) return;
    
    setIsAiAnalysisLoading(true);
    setAiAnalysisError(null);
    
    try {
      // 1. まずユーザーの作品データを確認
      const { data: works, error: worksError } = await supabase
        .from('works')
        .select('id, title, work_tags(tag_id, tags(id, name, category))')
        .eq('user_id', userProfile.id);
      
      if (worksError) {
        console.error("作品データ取得エラー:", worksError);
        setAiAnalysisError("作品データの取得に失敗しました");
        setIsAiAnalysisLoading(false);
        return;
      }
      
      if (!works || works.length === 0) {
        setAiAnalysisError("分析するには少なくとも1つの作品が必要です。作品を追加してから再度お試しください。");
        setIsAiAnalysisLoading(false);
        return;
      }
      
      // 2. タグデータをチェック
      let hasTags = false;
      for (const work of works) {
        if (work.work_tags && work.work_tags.length > 0) {
          hasTags = true;
          break;
        }
      }
      
      if (!hasTags) {
        setAiAnalysisError("AI分析には作品にタグが設定されている必要があります。タグを追加してから再度お試しください。");
        setIsAiAnalysisLoading(false);
        return;
      }
      
      // 3. AI分析APIを呼び出し
      const { analyzeUserTagsApi } = await import('../../../api/services/tag-analysis-api');
      console.log("AI分析を開始します...");
      
      const result = await analyzeUserTagsApi(userProfile.id);
      if (result.success && result.data) {
        console.log("AI分析成功:", result.data);
        // 成功したら分析データを更新
        await fetchUserInsights(userProfile.id);
        setIsAiAnalysisEmpty(false);
        
        // 成功メッセージを表示（一時的）
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successMessage.textContent = 'AI分析が完了しました！';
        document.body.appendChild(successMessage);
        
        // 3秒後にメッセージを削除
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
      } else {
        console.error("AI分析失敗:", result.error);
        setAiAnalysisError(result.error || "AI分析に失敗しました。タグが設定された作品が必要です。");
      }
    } catch (error) {
      console.error("AI分析実行エラー:", error);
      setAiAnalysisError("AI分析処理中にエラーが発生しました。再度お試しください。");
    } finally {
      setIsAiAnalysisLoading(false);
    }
  };

  // フォロー数とフォロワー数を取得する関数
  const fetchFollowCounts = useCallback(async (userId: string) => {
    try {
      if (!userId) return;
      
      // フォロー数を取得（自分がフォローしている人の数）
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (followingError) {
        console.error('フォロー数取得エラー:', followingError);
        return;
      }
      
      // フォロワー数を取得（自分をフォローしている人の数）
      const { count: followerCount, error: followerError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', userId);
      
      if (followerError) {
        console.error('フォロワー数取得エラー:', followerError);
        return;
      }
      
      setFollowCount(followingCount || 0);
      setFollowerCount(followerCount || 0);
      
    } catch (error) {
      console.error('フォロー数・フォロワー数取得エラー:', error);
    }
  }, []);

  // フォロー状態を確認する関数
  const checkIsFollowing = useCallback(async (currentUserId: string, profileUserId: string) => {
    try {
      if (currentUserId === profileUserId) {
        return;
      }
      
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('followed_id', profileUserId)
        .maybeSingle();
      
      if (error) {
        console.error('フォロー状態確認エラー:', error);
        return;
      }
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('フォロー状態確認中のエラー:', error);
    }
  }, []);

  // フォロー機能を実装
  const handleFollow = async () => {
    try {
      if (!userProfile?.id) return;
      
      setFollowLoading(true);
      
      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('ユーザー認証情報の取得に失敗しました');
        setFollowLoading(false);
        return;
      }
      
      // 自分自身をフォローしようとしている場合は何もしない
      if (user.id === userProfile.id) {
        setFollowLoading(false);
        return;
      }
      
      // すでにフォローしている場合は何もしない
      if (isFollowing) {
        setFollowLoading(false);
        return;
      }
      
      // フォローレコードを挿入
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id, // フォローする人（自分）
          followed_id: userProfile.id, // フォローされる人（プロフィールのユーザー）
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('フォロー処理エラー:', error);
        setFollowLoading(false);
        return;
      }
      
      // フォロー状態を更新
      setIsFollowing(true);
      setFollowerCount((prev: number) => prev + 1);
      
    } catch (error) {
      console.error('フォロー処理中のエラー:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  
  // アンフォロー機能を実装
  const handleUnfollow = async () => {
    try {
      if (!userProfile?.id) return;
      
      setFollowLoading(true);
      
      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('ユーザー認証情報の取得に失敗しました');
        setFollowLoading(false);
        return;
      }
      
      // 自分自身をアンフォローしようとしている場合は何もしない
      if (user.id === userProfile.id) {
        setFollowLoading(false);
        return;
      }
      
      // フォローしていない場合は何もしない
      if (!isFollowing) {
        setFollowLoading(false);
        return;
      }
      
      // フォローレコードを削除
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', userProfile.id);
      
      if (error) {
        console.error('アンフォロー処理エラー:', error);
        setFollowLoading(false);
        return;
      }
      
      // フォロー状態を更新
      setIsFollowing(false);
      setFollowerCount((prev: number) => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('アンフォロー処理中のエラー:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  // ユーザープロファイルの取得
  const fetchUserProfile = useCallback(async () => {
    try {
      // URLパラメータからIDを取得、なければ現在のユーザーのIDを使用
      const profileId = params.id;
      let userIdToFetch: string | null = null;
      let currentUserId: string | null = null;
      let isFetchingOwnProfile = false;

      console.log('プロフィールを取得するID (params.id):', profileId);
      
      // 現在ログイン中のユーザーIDを取得
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ ユーザーセッションの取得エラー:', authError);
        if (window.location.pathname !== '/login') navigate('/login');
        return;
      }
      
      if (user) {
        currentUserId = user.id;
      }
      
      if (profileId) {
        // 他のユーザーのプロフィールを表示する場合
        userIdToFetch = profileId;
        setIsCurrentUser(false);
        console.log('他のユーザーのプロフィールをフェッチします。');
      } else {
        // 自分のプロフィールを表示する場合
        console.log('自分のプロフィールをフェッチします。');
        
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

        // フォロー数・フォロワー数を取得
        await fetchFollowCounts(userIdToFetch);

        // 自分以外のプロフィールを見ている場合、フォロー状態を確認
        if (!isFetchingOwnProfile && currentUserId) {
          await checkIsFollowing(currentUserId, userIdToFetch);
        }

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
  }, [
    params.id, 
    navigate, 
    fetchUserWorks, 
    fetchUserCareers, 
    fetchUserInsights, 
    fetchFollowCounts,
    checkIsFollowing
  ]);

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

  // イベント監視でカテゴリ一覧を即時リフレッシュ
  useEffect(() => {
    if (isCurrentUser && userProfile?.id) fetchCategories();
    // カスタムイベント監視でカテゴリ一覧を即時リフレッシュ
    const handler = () => {
      if (isCurrentUser && userProfile?.id) fetchCategories();
    };
    window.addEventListener('category-updated', handler);
    return () => window.removeEventListener('category-updated', handler);
  }, [isCurrentUser, userProfile, fetchCategories]);

  // カテゴリ追加ダイアログの状態管理
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // カテゴリ追加処理
  const handleAddCategory = async () => {
    if (!userProfile?.id) return;
    if (!newCategoryName.trim()) {
      setCategoryError('カテゴリ名を入力してください');
      return;
    }

    setIsAddingCategory(true);
    setCategoryError(null);

    try {
      const { data, error } = await supabase
        .from('user_categories')
        .insert({
          user_id: userProfile.id,
          name: newCategoryName.trim(),
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('カテゴリ追加エラー:', error);
        setCategoryError(error.message);
        return;
      }

      // 成功したら状態を更新して通知
      if (data && data.length > 0) {
        setUserCategories((prev: UserCategory[]) => [...prev, data[0]]);
        setNewCategoryName('');
        setShowAddCategoryDialog(false);
        
        // カテゴリ更新イベントを発火
        window.dispatchEvent(new Event('category-updated'));

        // 成功メッセージを表示
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successMessage.textContent = 'カテゴリを追加しました';
        document.body.appendChild(successMessage);

        // 3秒後にメッセージを削除
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('カテゴリ追加処理エラー:', error);
      setCategoryError('カテゴリの追加に失敗しました');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // 初期データ取得時に代表作品も取得
  useEffect(() => {
    if (userProfile?.id) {
      fetchFeaturedWorks(userProfile.id);
    }
  }, [userProfile?.id, fetchFeaturedWorks]);

  // toggleShareDialog関数の実装
  const toggleShareDialog = () => setShowShareDialog((prev: boolean) => !prev);

  // タグ頻度計算
  useEffect(() => {
    if (!userWorks || userWorks.length === 0) {
      setRelatedWorks([]);
      return;
    }
    // 関連作品（タグが2つ以上一致するものを優先）
    if (userWorks.length > 1) {
      const mainTags = userWorks[0]?.tags || [];
      const related = userWorks.filter((w: Work) => w.id !== userWorks[0].id && w.tags?.some((t: string) => mainTags.includes(t)));
      setRelatedWorks(related);
    } else {
      setRelatedWorks([]);
    }
  }, [userWorks]);

  // 作品空判定、AI分析空判定

  // 作品追加ボタン押下時の遷移先をWorkCreateWebに固定
  const handleWorkAdd = () => {
    navigate('/user/works/create');
  };

  // --- 追加: キャリア編集用の状態 ---
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [isAddingCareer, setIsAddingCareer] = useState(false);
  const [careerForm, setCareerForm] = useState<Omit<Career, "id">>({
    company: '',
    position: '',
    department: '',
    start_date: '',
    end_date: '',
    is_current_position: false,
    description: ''
  });
  const [careerError, setCareerError] = useState<string | null>(null);
  const [careerLoading, setCareerLoading] = useState(false);

  // --- 編集ボタン押下時 ---
  const handleEditCareer = (careerId: string) => {
    const target = careers.find((c: Career) => c.id === careerId);
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
      setIsAddingCareer(false);
    }
  };

  // --- 新規追加ボタン押下時 ---
  const handleAddCareer = () => {
    setCareerForm({
      company: '',
      position: '',
      department: '',
      start_date: '',
      end_date: '',
      is_current_position: false,
      description: ''
    });
    setEditingCareerId(null);
    setCareerError(null);
    setIsAddingCareer(true);
  };

  // --- 保存 ---
  const handleSaveCareer = async (formData?: Omit<Career, "id">) => {
    setCareerError(null);
    setCareerLoading(true);
    
    // CareerEditInlineコンポーネントから渡されたデータがある場合は使用
    const dataToSave = formData || careerForm;
    
    if (!dataToSave.company || !dataToSave.position || !dataToSave.start_date) {
      setCareerError('会社名・役職・開始日は必須です');
      setCareerLoading(false);
      return;
    }
    
    try {
      if (editingCareerId) {
        // 既存のキャリア編集
        const { error } = await supabase.from('careers').update({
          company: dataToSave.company,
          position: dataToSave.position,
          department: dataToSave.department,
          start_date: dataToSave.start_date,
          end_date: dataToSave.end_date,
          is_current_position: dataToSave.is_current_position,
          description: dataToSave.description
        }).eq('id', editingCareerId);
        
        if (error) {
          console.error('キャリア更新エラー:', error);
          setCareerError('保存に失敗しました');
          setCareerLoading(false);
          return;
        }
        
        // 成功したらステートを更新
        setCareers((prev: Career[]) => prev.map((c: Career) => c.id === editingCareerId ? { 
          ...c, 
          company: dataToSave.company,
          position: dataToSave.position,
          department: dataToSave.department,
          start_date: dataToSave.start_date,
          end_date: dataToSave.end_date,
          is_current_position: dataToSave.is_current_position,
          description: dataToSave.description
        } : c));
        
      } else if (isAddingCareer) {
        // 新規キャリア追加
        const { data, error } = await supabase.from('careers').insert({
          user_id: userProfile?.id,
          company: dataToSave.company,
          position: dataToSave.position,
          department: dataToSave.department,
          start_date: dataToSave.start_date,
          end_date: dataToSave.end_date,
          is_current_position: dataToSave.is_current_position,
          description: dataToSave.description
        }).select();
        
        if (error) {
          console.error('キャリア追加エラー:', error);
          setCareerError('追加に失敗しました');
          setCareerLoading(false);
          return;
        }
        
        // 成功したらステートを更新
        if (data && data.length > 0) {
          // 新しいキャリア情報を追加
          setCareers((prev: Career[]) => [data[0], ...prev]);
        }
      }
      
      // 編集・追加状態を終了
      setEditingCareerId(null);
      setIsAddingCareer(false);
      setCareerError(null);
      
      // 成功メッセージを表示
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = '保存しました！';
      document.body.appendChild(successMessage);
      
      // 3秒後にメッセージを削除
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
    } catch (error) {
      console.error('キャリア保存エラー:', error);
      setCareerError('保存処理中にエラーが発生しました');
    } finally {
      setCareerLoading(false);
    }
  };

  // --- キャンセル ---
  const handleCancelCareer = () => {
    setEditingCareerId(null);
    setIsAddingCareer(false);
    setCareerError(null);
  };

  // --- キャリア削除 ---
  const handleDeleteCareer = async (careerId: string) => {
    if (!confirm('このキャリア情報を削除しますか？')) return;
    
    try {
      const { error } = await supabase.from('careers').delete().eq('id', careerId);
      
      if (error) {
        console.error('キャリア削除エラー:', error);
        alert('削除に失敗しました');
        return;
      }
      
      // 成功したらステートを更新
      setCareers((prev: Career[]) => prev.filter((c: Career) => c.id !== careerId));
    } catch (error) {
      console.error('キャリア削除エラー:', error);
      alert('削除処理中にエラーが発生しました');
    }
  };

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

  // カテゴリでフィルタリングした作品リスト
  const filteredWorks = userWorks.filter((work: Work) => 
    categoryTab === 'all' || work.categoryIds?.includes(categoryTab)
  );

  // --- About保存 ---
  const handleSaveAbout = async (value: string) => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ about: value })
        .eq('id', userProfile.id);

      if (error) {
        throw error;
      }

      // 保存成功したら、userProfileを更新
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          about: value
        });
      }
      
      // 成功メッセージを表示
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = '自己紹介を保存しました！';
      document.body.appendChild(successMessage);
      
      // 3秒後にメッセージを削除
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
      return Promise.resolve();
    } catch (error) {
      console.error('自己紹介の保存に失敗しました:', error);
      return Promise.reject(error);
    }
  };

  // --- Skills保存 ---
  const handleSaveSkills = async (value: string) => {
    if (!userProfile?.id) return;
    
    try {
      // スキルをJSON文字列として保存
      const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
      
      const { error } = await supabase
        .from('profiles')
        .update({ skills: skillsArray })
        .eq('id', userProfile.id);

      if (error) {
        throw error;
      }
      
      // 保存成功したら、userProfileを更新
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          skills: skillsArray
        });
      }
      
      // 成功メッセージを表示
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'スキルを保存しました！';
      document.body.appendChild(successMessage);
      
      // 3秒後にメッセージを削除
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
      return Promise.resolve();
    } catch (error) {
      console.error('スキルの保存に失敗しました:', error);
      return Promise.reject(error);
    }
  };

  // 追加: アクティビティの色を決定する関数
  function getActivityColorClass(count: number): string {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-indigo-100';
    if (count <= 5) return 'bg-indigo-200';
    if (count <= 10) return 'bg-indigo-300';
    return 'bg-indigo-400';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader
        userProfile={userProfile}
        isCurrentUser={isCurrentUser}
        onEditProfile={() => navigate('/profile/edit')}
        onShare={toggleShareDialog}
        followCount={followCount}
        followerCount={followerCount}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        isFollowLoading={followLoading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">        
        <div className="pt-6">
          <TabNavigation
            tabs={[
              { label: '作品', value: 'works' },
              { label: 'キャリア', value: 'career' },
              { label: 'AI分析', value: 'ai-analysis' }
            ]}
            selectedTab={selectedTab}
            onChange={setSelectedTab}
          />
        </div>

        {/* フォローボタン - 自分のページでは表示しない */}
        {!isCurrentUser && (
          <div className="flex justify-end my-4">
            <button
              className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                isFollowing
                  ? 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={isFollowing ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                  </svg>
                  <span>{isFollowing ? 'フォロー中' : 'フォローする'}</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-6">
          {/* 作品タブコンテンツ */}
          {selectedTab === 'works' && (
            <>
              {/* 代表作品セクション */}
              {featuredWorks.length > 0 && (
                <section className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                  </div>
                  <FeaturedWorks
                    works={featuredWorks}
                    onEditFeaturedWorks={() => navigate('/profile/edit')}
                    isCurrentUser={isCurrentUser}
                    onWorkClick={(id: string) => navigate(`/user/works/${id}`)}
                  />
                </section>
              )}

              {/* WorksSection - 作品一覧コンポーネント */}
              <WorksSection
                userWorks={filteredWorks}
                userCategories={userCategories}
                categoryTab={categoryTab}
                setCategoryTab={setCategoryTab}
                isCurrentUser={isCurrentUser}
                onWorkClick={(id: string) => id === 'create' ? handleWorkAdd() : navigate(`/user/works/${id}`)}
                onAddCategory={() => setShowAddCategoryDialog(true)}
              />

              {/* カテゴリ追加ダイアログ */}
              {showAddCategoryDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <h3 className="text-lg font-semibold mb-4">新しいカテゴリを追加</h3>
                    <input
                      type="text"
                      className="w-full border rounded p-2 mb-4"
                      placeholder="カテゴリ名"
                      value={newCategoryName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)}
                    />
                    {categoryError && (
                      <p className="text-red-500 text-sm mb-4">{categoryError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={() => {
                          setShowAddCategoryDialog(false);
                          setNewCategoryName('');
                          setCategoryError(null);
                        }}
                        disabled={isAddingCategory}
                      >
                        キャンセル
                      </button>
                      <button
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        onClick={handleAddCategory}
                        disabled={isAddingCategory}
                      >
                        {isAddingCategory ? '追加中...' : '追加'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* プロフィールタブコンテンツ */}
          {selectedTab === 'career' && (
            <>
              {/* 自己紹介 */}
              <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100 mb-8">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">自己紹介</h2>
                  <div className="border-t border-gray-100 pt-4">
                    {isCurrentUser ? (
                      <ProfileAboutEditInline
                        about={userProfile?.about || ''}
                        onSave={handleSaveAbout}
                        onCancel={() => {}}
                        loading={false}
                        error={null}
                      />
                    ) : (
                      <div className="prose max-w-none">
                        {userProfile?.about ? (
                          <div className="whitespace-pre-line text-gray-600">{userProfile.about}</div>
                        ) : (
                          <p className="text-gray-400 italic">自己紹介はまだ登録されていません</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* できること（スキル） */}
              <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">できること</h2>
                  <div className="border-t border-gray-100 pt-4">
                    {isCurrentUser ? (
                      <ProfileSkillsEditInline 
                        skills={userProfile?.skills ? userProfile.skills.join(', ') : ''}
                        onSave={handleSaveSkills}
                        onCancel={() => {}}
                        loading={false}
                        error={null}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {userProfile?.skills && userProfile.skills.length > 0 ? (
                          userProfile.skills.map((skill: string, index: number) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-400 italic">スキルはまだ登録されていません</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* キャリア */}
              <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">キャリア</h2>
                  {isCurrentUser && (
                    <button
                      onClick={handleAddCareer}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5 font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      キャリアを追加
                    </button>
                  )}
                </div>
                
                {/* 新規追加フォーム */}
                {isAddingCareer && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">新規キャリア追加</h3>
                    <CareerEditInline
                      career={{
                        id: 'new',
                        company: careerForm.company,
                        position: careerForm.position,
                        department: careerForm.department,
                        start_date: careerForm.start_date,
                        end_date: careerForm.end_date,
                        is_current_position: careerForm.is_current_position,
                        description: careerForm.description
                      }}
                      onSave={async (form: Omit<Career, "id">) => {
                        await handleSaveCareer(form);
                      }}
                      onCancel={handleCancelCareer}
                      loading={careerLoading}
                      error={careerError}
                    />
                  </div>
                )}
                
                <CareerSection
                  careers={careers}
                  isCurrentUser={isCurrentUser}
                  editingCareerId={editingCareerId}
                  onEdit={handleEditCareer}
                  onSave={(_careerId: string, form: Omit<Career, "id">) => handleSaveCareer(form)}
                  onCancel={handleCancelCareer}
                  editLoading={careerLoading}
                  editError={careerError}
                  onDelete={handleDeleteCareer}
                />
              </div>

              {/* よく使用するタグ */}
              <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100 mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">よく使用するタグ</h2>
                <div className="flex flex-wrap gap-2">
                  {userWorks.length > 0 ? (
                    (() => {
                      // タグの頻度を計算
                      const tagCounts: Record<string, number> = {};
                      userWorks.forEach((work: Work) => {
                        work.tags?.forEach((tag: string) => {
                          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                      });
                      
                      // 頻度でソートし、上位10個を表示
                      return Object.entries(tagCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([tag, count], index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700"
                          >
                            {tag} <span className="ml-1 text-indigo-500 text-xs font-semibold">({count})</span>
                          </span>
                        ));
                    })()
                  ) : (
                    <p className="text-gray-400 italic">作品がまだありません</p>
                  )}
                </div>
              </div>

              {/* アクティビティ */}
              <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100 mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">アクティビティ</h2>
                <div>
                  {activityMonthLoading ? (
                    <div className="flex justify-center py-4">
                      <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : activityMonthData.length > 0 ? (
                    <div className="grid grid-cols-12 gap-1">
                      {activityMonthData.map((month: ActivityMonthData, index: number) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className={`w-full h-16 rounded ${getActivityColorClass(month.count)}`}
                            title={`${month.ym}: ${month.count}件の投稿`}
                          />
                          <span className="text-xs text-gray-500 mt-1">{month.ym.split('-')[1]}月</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">アクティビティデータがありません</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* AI分析タブコンテンツ */}
          {selectedTab === 'ai-analysis' && (
            <div className="space-y-8">
              {isCurrentUser && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">AIによるあなたの分析</h3>
                    <p className="text-gray-600 text-sm">
                      あなたの作品から特徴や強み、傾向を分析します。作品が5個以上あるとより正確な分析ができます。
                    </p>
                  </div>
                  <button
                    onClick={handleRunAiAnalysis}
                    disabled={isAiAnalysisLoading || userWorks.length === 0}
                    className={`px-5 py-2.5 rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-medium text-sm whitespace-nowrap
                      ${isAiAnalysisLoading 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : userWorks.length === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700'
                      }`}
                  >
                    {isAiAnalysisLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        分析中...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AIで分析する
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <AiAnalysisTab
                isCurrentUser={isCurrentUser}
                isAiAnalysisEmpty={isAiAnalysisEmpty}
                isAiAnalysisLoading={isAiAnalysisLoading}
                aiAnalysisError={aiAnalysisError}
                handleRunAiAnalysis={handleRunAiAnalysis}
                aiAnalysis={aiAnalysis}
              />
            </div>
          )}
        </div>

        {/* シェアダイアログ */}
        {showShareDialog && (
          <ShareDialog 
            open={showShareDialog}
            profileUrl={`${window.location.origin}/profile/${userProfile?.id}`}
            onClose={toggleShareDialog} 
          />
        )}
      </div>
    </div>
  );
};

export default Portfolio;