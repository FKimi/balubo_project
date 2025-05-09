import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Edit,
  PlusCircle,
  FileText,
  Share2,
  Star
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
import { 
  getUserInsightsApi 
} from '../../api/tag-analysis-api';
import { getPopularTags } from '../../api/tag-analysis-api';
import { 
  UserProfile, 
  Work, 
  Career, 
  AIAnalysisResult, 
  UserCategory 
} from '../../types';
import UserSidebar from './UserSidebar';
import FollowListModal from '../ui/FollowListModal';
import { TagRankingList } from "./TagRankingList";
import { InputLogCard, InputLog, InputLogType } from "./InputLogCard";
import { extractUrlMetadata } from "../../lib/url-metadata";
import { formatYearMonth } from '../../app/lib/utils/dateFormat';

const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const Portfolio: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userWorks, setUserWorks] = useState<Work[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [stats, setStats] = useState({ monthly: Array(12).fill(0) });
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddWorkMenu, setShowAddWorkMenu] = useState(false);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  
  const navigate = useNavigate();
  const params = useParams();
  const addWorkButtonRef = useRef<HTMLDivElement>(null); 

  // ユーザーのフォロー数とフォロワー数を取得する関数
  const fetchFollowCounts = useCallback(async (userId: string) => {
    try {
      // フォロー数: 自分がフォローしている人数
      const { count: following, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true})
        .eq('follower_id', userId);
      if (!followingError && typeof following === 'number') setFollowingCount(following);
      // フォロワー数: 自分をフォローしている人数
      const { count: followers, error: followerError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true})
        .eq('followed_id', userId);
      if (!followerError && typeof followers === 'number') setFollowerCount(followers);
    } catch {
      setFollowingCount(0); setFollowerCount(0);
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
          navigate('/login');
          return;
        }

        if (!user) {
          console.error('❌ ログインしていません。ログインページにリダイレクトします。');
          navigate('/login');
          return;
        }

        userIdToFetch = user.id;
        isFetchingOwnProfile = true;
        setIsCurrentUser(true);
      }

      if (!userIdToFetch) {
        console.error('❌ フェッチ対象のユーザーIDが不明です。');
        navigate('/login');
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
        navigate('/login');
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
            fetchFollowCounts(userIdToFetch)
          ]);
          console.log('関連データ取得完了 (Works, Careers, Insights, FollowCounts)');
        }
      } 
      // プロフィールデータがなく、かつ自分のプロフィールを取得しようとしている場合 (新規ユーザー)
      else if (isFetchingOwnProfile && !profileData) {
        console.log('ℹ️ プロフィールが存在しないため、新規作成します。');
        const { data: { user } } = await supabase.auth.getUser(); // ユーザー情報を再取得 (念のため)
        if (!user) {
          console.error('❌ 新規プロフィール作成時にユーザー情報が見つかりません。');
          navigate('/login');
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
          navigate('/login');
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
        navigate('/login');
        return;
      }

    } catch {
      console.error('❌ fetchUserProfile 関数内で予期せぬエラー:');
      navigate('/login');
    } finally {
      console.log('fetchUserProfile 処理完了');
    }
  // 依存配列から循環参照となっている関数を削除
  }, [params.id, navigate, fetchFollowCounts]);

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
          setStats({
            monthly: Array(12).fill(0)
          });
        }
        return;
      }
      
      console.log('取得した作品データ:', worksData);
      
      // データが空の場合
      if (!worksData || worksData.length === 0) {
        console.log('作品データが空です');
        setUserWorks([]);
        setStats({
          monthly: Array(12).fill(0)
        });
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
      
      // 月間投稿統計を計算
      const monthlyStats = Array(12).fill(0);
      worksWithTagsAndCategories.forEach((work: Work) => {
        const date = new Date(work.created_at);
        const month = date.getMonth();
        monthlyStats[month]++;
      });
      
      setStats({
        monthly: monthlyStats
      });
    } catch {
      console.error('Error in fetchUserWorks:');
      
      // エラーが発生した場合でも、他のユーザーのプロフィールを表示している場合は空の配列を設定
      if (!isCurrentUser) {
        console.log('エラー発生時: 他のユーザーのプロフィール表示中のため空の作品リストを表示');
        setUserWorks([]);
        setStats({
          monthly: Array(12).fill(0)
        });
      }
    } finally {
      console.log('fetchUserWorks 処理完了');
    }
  }, [isCurrentUser]);

  // ユーザーの職歴を取得する関数
  const fetchUserCareers = useCallback(async (userId: string) => {
    try {
      if (!userId) {
        console.error('ユーザーIDがありません');
        return;
      }
      
      console.log('職歴を取得するユーザーID:', userId);
      
      const { data: careersData, error: careersError } = await supabase
        .from('careers')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      
      if (careersError) {
        console.error('Error fetching careers:', careersError);
        console.log('Error details:', careersError.details);
        console.log('Error hint:', careersError.hint);
        console.log('Error code:', careersError.code);
        
        // エラーが発生した場合でも、他のユーザーのプロフィールを表示している場合は空の配列を設定
        if (!isCurrentUser) {
          console.log('他のユーザーのプロフィール表示中: 空の職歴リストを表示');
          setCareers([]);
        }
        return;
      }
      
      console.log('取得した職歴データ:', careersData);
      
      // データが空の場合でも空の配列を設定
      setCareers(careersData || []);
      
    } catch {
      console.error('Error in fetchUserCareers:');
      
      // エラーが発生した場合でも、他のユーザーのプロフィールを表示している場合は空の配列を設定
      if (!isCurrentUser) {
        console.log('エラー発生時: 他のユーザーのプロフィール表示中のため空の職歴リストを表示');
        setCareers([]);
      }
    }
  }, [isCurrentUser]);

  // ユーザーのAI分析情報を取得
  const fetchUserInsights = useCallback(async (userId: string) => {
    try {
      const result = await getUserInsightsApi(userId);
      
      if (result.data) {
        console.log('✅ ユーザーインサイト取得成功:', result.data);
        
        // テキストを整形して、適切な文の終わりで切る関数
        const formatText = (text: string | undefined, maxLength: number = 200): string => {
          if (!text) return "";
          
          // 最大文字数以内なら、そのまま返す
          if (text.length <= maxLength) return text;
          
          // 最大文字数まで切り取る
          let truncated = text.substring(0, maxLength);
          
          // 最後に適切な句読点があるか探す（「。」「！」「？」のいずれか）
          const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('。'),
            truncated.lastIndexOf('！'),
            truncated.lastIndexOf('？'),
            truncated.lastIndexOf('.')
          );
          
          // 句読点が見つかった場合、そこで切る
          if (lastSentenceEnd !== -1) {
            truncated = truncated.substring(0, lastSentenceEnd + 1);
          }
          
          return truncated;
        };
        
        // 各テキストフィールドを文の終わりで適切に切る
        const limitedResult = {
          ...result.data,
          originality: {
            ...result.data.originality,
            summary: formatText(result.data.originality?.summary)
          },
          quality: {
            ...result.data.quality,
            summary: formatText(result.data.quality?.summary)
          },
          expertise: {
            ...result.data.expertise,
            summary: formatText(result.data.expertise?.summary)
          },
          engagement: {
            ...result.data.engagement,
            summary: formatText(result.data.engagement?.summary)
          },
          overall_insight: {
            ...result.data.overall_insight,
            summary: formatText(result.data.overall_insight?.summary),
            future_potential: formatText(result.data.overall_insight?.future_potential, 100)
          }
        };
        
        setAiAnalysisResult(limitedResult);
      } else {
        console.log('ℹ️ ユーザーインサイトがまだありません');
      }
    } catch {
      console.error('❌ ユーザーインサイト取得エラー:');
    }
  }, []);

  // コンポーネントの初期化
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log('🚀 ポートフォリオコンポーネントを初期化しています...');
        
        // URLパラメータからプロフィールIDを取得
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
            navigate('/login');
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
                
                navigate('/login');
              }
            } else {
              // 通常のログインエラー
              navigate('/login');
            }
            
            return;
          }
          
          console.log('✅ ログイン済み - ユーザーID:', data.session.user.id);
          
          // ログインしている場合は自分のプロフィールを取得
          await fetchUserProfile();
        }
      } catch {
        console.error('❌ コンポーネント初期化エラー:');
        
        navigate('/login');
      }
    };
    
    initializeComponent();
  }, [fetchUserProfile, navigate, params.id]);

  // プロフィール情報が取得できたら、作品と職歴を取得
  useEffect(() => {
    if (params.id) {
      // URLパラメータがある場合は、そのIDを使用
      console.log('URLパラメータからのID:', params.id);
      // fetchUserWorksなどはfetchUserProfile内で呼び出すため、ここでは呼び出さない
    } else if (userProfile?.id) {
      // URLパラメータがない場合は、現在のユーザーのIDを使用
      console.log('現在のユーザーのID:', userProfile.id);
      fetchUserWorks(userProfile.id);
      fetchUserCareers(userProfile.id);
      fetchUserInsights(userProfile.id);
    }
  }, [params.id, userProfile, fetchUserWorks, fetchUserCareers, fetchUserInsights]);

  // URLをコピーする関数
  const copyProfileUrl = () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${userProfile?.id}`;
      
      // 標準のクリップボードAPIをまず試す
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(profileUrl)
          .then(() => {
            console.log('URLをコピーしました');
          })
          .catch((err) => {
            console.error('クリップボードコピーエラー:', err);
            // フォールバック処理
          });
      } else {
        // セキュアコンテキストでない場合やClipboard APIが利用できない場合のフォールバック
      }
    } catch {
      console.error('URLコピーエラー:');
    }
  };

  // --- タグランキングデータ取得用ステート ---
  const [tagRankingData, setTagRankingData] = useState<{ name: string; value: number }[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  // タグランキングデータ取得
  useEffect(() => {
    setTagLoading(true);
    setTagError(null);
    getPopularTags(10)
      .then((res) => {
        if (res.success && res.data) {
          // {id, name, count}[] → {name, value}[] へ変換
          setTagRankingData(res.data.map(tag => ({ name: tag.name, value: tag.count })));
        } else {
          setTagError(res.error || 'タグランキングの取得に失敗しました');
        }
      })
      .catch(() => {
        setTagError('タグランキングの取得に失敗しました');
      })
      .finally(() => setTagLoading(false));
  }, []);

  // --- タグデータの重複統合ユーティリティ ---
  function mergeDuplicateTags(data: { name: string; value: number }[]) {
    const map = new Map<string, number>();
    data.forEach(({ name, value }) => {
      map.set(name, (map.get(name) || 0) + value);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  // --- インプット記録管理 ---
  const [inputLogs, setInputLogs] = useState<InputLog[]>([]);
  const [inputType, setInputType] = useState<InputLogType>("本");
  const [inputUrl, setInputUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [inputTitle, setInputTitle] = useState("");
  const [inputAuthor, setInputAuthor] = useState("");
  const [inputComment, setInputComment] = useState("");
  // 追加: URL/画像/説明/タグ
  const [inputImageUrl, setInputImageUrl] = useState<string | undefined>(undefined);
  const [inputDescription, setInputDescription] = useState("");
  const [inputTags, setInputTags] = useState<string[]>([]);
  // カスタムジャンル
  const [customGenres] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState("");

  // ジャンル候補リスト
  const genreOptions: string[] = [
    "本", "映画", "漫画", "アニメ", "ドラマ", "音声", "動画", ...customGenres
  ];

  // --- URLメタデータ自動取得 ---
  const handleUrlBlur = async () => {
    if (!inputUrl.trim()) return;
    setUrlLoading(true);
    setUrlError(null);
    try {
      const meta = await extractUrlMetadata(inputUrl.trim());
      setInputTitle(meta.title || "");
      setInputDescription(meta.description || "");
      setInputImageUrl(meta.image);
      // タグ自動生成（meta.tags優先、なければkeywords）
      setInputTags(meta.tags && meta.tags.length > 0 ? meta.tags : (meta.keywords || []));
    } catch {
      setUrlError("メタデータの取得に失敗しました");
    } finally {
      setUrlLoading(false);
    }
  };

  // 追加処理
  const handleAddInputLog = () => {
    if (!inputTitle.trim()) return;
    setInputLogs([
      {
        id: `${Date.now()}`,
        type: inputType,
        title: inputTitle,
        author: inputAuthor,
        comment: inputComment,
        createdAt: new Date().toISOString(),
        imageUrl: inputImageUrl,
        tags: inputTags,
        description: inputDescription,
        url: inputUrl,
      },
      ...inputLogs,
    ]);
    setInputTitle("");
    setInputAuthor("");
    setInputComment("");
    setInputUrl("");
    setInputImageUrl(undefined);
    setInputDescription("");
    setInputTags([]);
  };

  // ダミー分析（ジャンル集計）
  const genreStats = inputLogs.reduce((acc, cur) => {
    acc[cur.type] = (acc[cur.type] || 0) + 1;
    return acc;
  }, {} as Record<InputLogType, number>);

  // --- タグ入力：チップUI用の追加state ---
  const [tagInput, setTagInput] = useState("");

  // タグ追加ハンドラ
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!inputTags.includes(tagInput.trim())) {
        setInputTags([...inputTags, tagInput.trim()]);
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && inputTags.length > 0) {
      setInputTags(inputTags.slice(0, -1));
    }
  };
  const handleRemoveTag = (idx: number) => {
    setInputTags(inputTags.filter((_, i) => i !== idx));
  };

  // --- 入力欄フォーカス制御 ---
  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      titleRef.current?.focus();
    }
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      authorRef.current?.focus();
    }
  };
  const handleAuthorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      descriptionRef.current?.focus();
    }
  };
  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commentRef.current?.focus();
    }
  };
  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      tagRef.current?.focus();
    }
  };
  const handleTagInputKeyDownWithAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleTagInputKeyDown(e);
    if (e.key === "Enter") {
      handleAddInputLog();
    }
  };

  // --- 入力中プレビュー用ダミーInputLog ---
  const previewLog: InputLog = {
    id: "preview",
    type: inputType,
    title: inputTitle,
    author: inputAuthor,
    comment: inputComment,
    createdAt: new Date().toISOString(),
    imageUrl: inputImageUrl,
    tags: inputTags,
    description: inputDescription,
    url: inputUrl,
  };

  // --- 最近使ったジャンル・タグサジェスト ---
  const recentGenres = Array.from(new Set(inputLogs.map(l => l.type))).slice(-5);
  const recentTags = Array.from(new Set(inputLogs.flatMap(l => l.tags || []))).slice(-5);

  // --- タブナビゲーション用の状態 ---
  const [selectedTab, setSelectedTab] = useState<string>("works");

  // カスタムカテゴリ管理用 state
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [categoryTab, setCategoryTab] = useState<string>('all'); // 'all' or category.id
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // カスタムカテゴリ管理セクション
  // --- カテゴリー追加関数を削除 ---

  const handleEditCategory = (categoryId: string) => {
    const category = userCategories.find(c => c.id === categoryId);
    if (!category) return;
    setEditingCategoryId(categoryId);
    setEditingCategoryName(category.name);
  };

  // --- カテゴリー管理用 Supabase CRUD ---
  const fetchCategories = useCallback(async () => {
    if (!userProfile?.id) return;
    const { data, error } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: true });
    if (!error && data) setUserCategories(data as UserCategory[]);
  }, [userProfile]);

  const addCategory = async () => {
    if (!newCategoryName.trim() || !userProfile?.id) return;
    const { data, error } = await supabase
      .from('user_categories')
      .insert([{ user_id: userProfile.id, name: newCategoryName.trim() }])
      .select();
    if (!error && data) setUserCategories(prev => [...prev, ...data]);
    setNewCategoryName('');
  };

  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm('本当に削除しますか？')) return;
    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('id', categoryId);
    if (!error) setUserCategories(prev => prev.filter(c => c.id !== categoryId));
  };

  // --- カテゴリー初期取得 & イベント監視 ---
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

  // --- モーダルの状態管理 ---
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'following' | 'followers'>('following');

  // --- フォロー数クリックでモーダルを開く ---
  const handleOpenFollowModal = (tab: 'following' | 'followers') => {
    setFollowModalTab(tab);
    setIsFollowModalOpen(true);
  };

  // --- 作品タイプを選択して作品追加ページに遷移 ---
  const handleAddWorkType = (type: string) => {
    if (type === 'design') {
      navigate('/works/create?type=design');
    } else {
      navigate(`/works/new?type=${type}`);
    }
    setShowAddWorkMenu(false);
  };

  // --- 作品追加メニューの表示・非表示を切り替える ---
  const toggleAddWorkMenu = () => {
    setShowAddWorkMenu(prev => !prev);
  };

  // --- 外部クリックでメニューを閉じる ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addWorkButtonRef.current && !addWorkButtonRef.current.contains(event.target as Node)) {
        setShowAddWorkMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- ページタイトルをセット ---
  useEffect(() => {
    // URLパラメータからプロフィールIDを取得
    const profileId = params.id;
    
    if (profileId) {
      document.title = userProfile?.full_name || 'プロフィール | Balubo';
    } else {
      // 自分のポートフォリオの場合
      document.title = 'ポートフォリオ | Balubo';
    }
  }, [params.id, userProfile]);

  // --- 日付フォーマット関数 ---
  const formatDate = (dateString?: string) => {
    return formatYearMonth(dateString);
  };

  // --- 作品詳細画面への遷移 ---
  const handleWorkClick = (workId: string) => {
    navigate(`/works/${workId}`);
  };

  // --- InputLog入力フォーム小コンポーネント化 ---
  const InputLogForm = ({
    inputType,
    setInputType,
    genreOptions,
    recentGenres,
    inputUrl,
    setInputUrl,
    urlLoading,
    urlError,
    handleUrlBlur,
    handleUrlKeyDown,
    inputTitle,
    setInputTitle,
    titleRef,
    handleTitleKeyDown,
    inputAuthor,
    setInputAuthor,
    authorRef,
    handleAuthorKeyDown,
    inputDescription,
    setInputDescription,
    descriptionRef,
    handleDescriptionKeyDown,
    inputComment,
    setInputComment,
    commentRef,
    handleCommentKeyDown,
    inputTags,
    setInputTags,
    tagInput,
    setTagInput,
    tagRef,
    handleTagInputKeyDownWithAdd,
    handleRemoveTag,
    recentTags,
    showImageEdit,
    handleImageEditToggle,
    inputImageUrl,
    handleImageUrlChange,
    handleAddInputLog
  }: {
    inputType: InputLogType;
    setInputType: (v: InputLogType) => void;
    genreOptions: string[];
    recentGenres: string[];
    inputUrl: string;
    setInputUrl: (v: string) => void;
    urlLoading: boolean;
    urlError: string;
    handleUrlBlur: () => void;
    handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputTitle: string;
    setInputTitle: (v: string) => void;
    titleRef: React.RefObject<HTMLInputElement>;
    handleTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputAuthor: string;
    setInputAuthor: (v: string) => void;
    authorRef: React.RefObject<HTMLInputElement>;
    handleAuthorKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputDescription: string;
    setInputDescription: (v: string) => void;
    descriptionRef: React.RefObject<HTMLInputElement>;
    handleDescriptionKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputComment: string;
    setInputComment: (v: string) => void;
    commentRef: React.RefObject<HTMLInputElement>;
    handleCommentKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputTags: string[];
    setInputTags: (v: string[]) => void;
    tagInput: string;
    setTagInput: (v: string) => void;
    tagRef: React.RefObject<HTMLInputElement>;
    handleTagInputKeyDownWithAdd: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleRemoveTag: (idx: number) => void;
    recentTags: string[];
    showImageEdit: boolean;
    handleImageEditToggle: () => void;
    inputImageUrl: string;
    handleImageUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAddInputLog: () => void;
  }) => {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6 flex flex-col sm:flex-col md:flex-row gap-3 items-end">
        {/* --- ジャンル選択 --- */}
        <div>
          <label className="flex text-xs font-bold text-gray-600 mb-1 items-center gap-1">
            <span className="inline-block">ジャンル</span>
            <span className="inline-block text-indigo-400">🔗</span>
            <span className="inline-block text-xs text-indigo-400">自動取得</span>
          </label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-base"
            value={inputType}
            onChange={e => setInputType(e.target.value as InputLogType)}
          >
            {genreOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {/* 最近ジャンルサジェスト */}
          {recentGenres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {recentGenres.map(g => (
                <button key={g} type="button" className="text-xs bg-gray-100 rounded px-2 py-0.5 hover:bg-indigo-100" onClick={() => setInputType(g as InputLogType)}>{g}</button>
              ))}
            </div>
          )}
        </div>
        {/* URL入力欄 */}
        <div className="flex-1 min-w-[180px]">
          <label className="flex text-xs font-bold text-gray-600 mb-1 items-center gap-1">
            <span className="inline-block">URL</span>
            <span className="inline-block text-indigo-400">🔗</span>
            <span className="inline-block text-xs text-indigo-400">自動取得</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded px-2 py-1 text-base"
            type="url"
            placeholder="作品や記事のURLを入力（自動でタイトル・説明・タグ取得）"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onBlur={handleUrlBlur}
            onKeyDown={handleUrlKeyDown}
          />
          {urlLoading && <div className="text-xs text-indigo-500 mt-1">メタデータ取得中...</div>}
          {urlError && <div className="text-xs text-red-500 mt-1">{urlError}</div>}
        </div>
        {/* タイトル入力欄 */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">タイトル</label>
          <input
            ref={titleRef}
            className="w-full border border-gray-300 rounded px-2 py-1 text-base"
            type="text"
            placeholder="タイトルを入力"
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
          />
        </div>
        {/* 著者/監督欄 */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">{inputType === "映画" ? "監督" : "著者"}</label>
          <input
            ref={authorRef}
            className="w-full border border-gray-300 rounded px-2 py-1 text-base"
            type="text"
            placeholder={inputType === "映画" ? "監督名" : "著者名"}
            value={inputAuthor}
            onChange={e => setInputAuthor(e.target.value)}
            onKeyDown={handleAuthorKeyDown}
          />
        </div>
        {/* 説明欄 */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">説明</label>
          <input
            ref={descriptionRef}
            className="w-full border border-gray-300 rounded px-2 py-1 text-base"
            type="text"
            placeholder="説明や概要（自動取得可・任意）"
            value={inputDescription}
            onChange={e => setInputDescription(e.target.value)}
            onKeyDown={handleDescriptionKeyDown}
          />
        </div>
        {/* コメント欄 */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">コメント・感想</label>
          <input
            ref={commentRef}
            className="w-full border border-gray-300 rounded px-2 py-1 text-base"
            type="text"
            placeholder="コメントや感想を入力（任意）"
            value={inputComment}
            onChange={e => setInputComment(e.target.value)}
            onKeyDown={handleCommentKeyDown}
          />
        </div>
        {/* タグ編集欄（チップUI） */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-bold text-gray-600 mb-1">タグ（カンマまたはEnterで追加）</label>
          <div className="flex flex-wrap gap-1 items-center border border-gray-300 rounded px-2 py-1 bg-white">
            {inputTags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs mr-1">
                {tag}
                <button type="button" className="ml-1 text-blue-500 hover:text-red-500" onClick={() => handleRemoveTag(idx)} aria-label="タグ削除">×</button>
              </span>
            ))}
            <input
              ref={tagRef}
              className="outline-none flex-1 min-w-[50px] text-xs bg-transparent"
              type="text"
              placeholder={inputTags.length === 0 ? "例: SF, ファンタジー" : "タグ追加（カンマまたはEnterで追加）"}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDownWithAdd}
            />
            {/* 最近タグサジェスト */}
            {recentTags.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-2">
                {recentTags.map(tag => (
                  <button key={tag} type="button" className="text-xs bg-gray-100 rounded px-2 py-0.5 hover:bg-blue-100" onClick={() => !inputTags.includes(tag) && setInputTags([...inputTags, tag])}>{tag}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* サムネイル画像手動変更 */}
        <div className="flex-1 min-w-[120px]">
          <label className="flex text-xs font-bold text-gray-600 mb-1 items-center gap-1">画像</label>
          <div className="flex gap-1 items-center">
            <button type="button" className="text-xs bg-gray-100 rounded px-2 py-0.5 hover:bg-indigo-100" onClick={handleImageEditToggle}>{showImageEdit ? '閉じる' : '画像URL手動設定'}</button>
            {showImageEdit && (
              <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-xs" placeholder="画像URLを手動入力" value={inputImageUrl} onChange={handleImageUrlChange} />
            )}
          </div>
          {inputImageUrl && (
            <img src={inputImageUrl} alt="サムネイル" className="mt-1 w-20 h-12 object-cover rounded border" />
          )}
        </div>
        <button
          className="px-4 py-2 bg-indigo-500 text-white rounded-md font-semibold hover:bg-indigo-600 transition whitespace-nowrap flex items-center gap-1"
          onClick={handleAddInputLog}
        >
          <span className="text-lg">＋</span>追加
        </button>
      </div>
    );
  };

  // --- テンプレート適用用のダミー定義（必要に応じて上部で定義・実装を拡張してください） ---
  const inputTemplates = useMemo(() => [
    { label: '本テンプレ', data: { type: '本', title: '', author: '', description: '', tags: [] } },
    { label: '映画テンプレ', data: { type: '映画', title: '', author: '', description: '', tags: [] } },
  ], []);

  const applyTemplate = useCallback((data: { type: string; title: string; author: string; description: string; tags: string[] }) => {
    setInputType(data.type);
    setInputTitle(data.title);
    setInputAuthor(data.author);
    setInputDescription(data.description);
    setInputTags(data.tags);
  }, [setInputType, setInputTitle, setInputAuthor, setInputDescription, setInputTags]);

  // --- スキル編集用state追加 ---
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [saveSkillsLoading, setSaveSkillsLoading] = useState(false);
  const [saveSkillsError, setSaveSkillsError] = useState<string | null>(null);

  // --- スキル編集モード開始 ---
  const handleEditSkills = () => {
    setEditSkills(userProfile?.skills || []);
    setIsEditingSkills(true);
    setSaveSkillsError(null);
  };

  // --- スキル編集キャンセル ---
  const handleCancelEditSkills = () => {
    setIsEditingSkills(false);
    setSaveSkillsError(null);
  };

  // --- スキル保存処理 ---
  const handleSaveSkills = async () => {
    setSaveSkillsLoading(true);
    setSaveSkillsError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ skills: editSkills })
        .eq('id', userProfile?.id);
      if (error) throw error;
      setUserProfile((prev) => prev ? { ...prev, skills: editSkills } : prev);
      setIsEditingSkills(false);
    } catch (e) {
      setSaveSkillsError('保存に失敗しました: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setSaveSkillsLoading(false);
    }
  };

  // --- タグ追加用inputのref ---
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagInputValue, setTagInputValue] = useState("");

  // タグ追加
  const handleAddSkillTag = () => {
    const newTag = tagInputValue.trim();
    if (!newTag || editSkills.includes(newTag) || editSkills.length >= 10) return;
    setEditSkills([...editSkills, newTag]);
    setTagInputValue("");
  };

  // エンター/カンマで追加
  const handleSkillTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkillTag();
    }
  };

  // タグ削除
  const handleRemoveSkillTag = (idx: number) => {
    setEditSkills(editSkills.filter((_, i) => i !== idx));
  };

  return (
    <div className="relative min-h-screen">
      {/* 左サイドバー */}
      <div className="hidden md:block">
        <UserSidebar isOpen={false} onClose={function (): void {
          throw new Error('Function not implemented.');
        } } />
      </div>
      
      {/* メインコンテンツ */}
      <div className="flex-1 md:ml-64 px-4 sm:px-6">
        {/* プロフィールヘッダー */}
        <div className="bg-white border-b border-gray-200">
          {/* 背景画像エリア */}
          <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
            {userProfile?.background_image_url && (
              <img 
                className="h-full w-full object-cover"
                src={userProfile.background_image_url} 
                alt="背景画像"
              />
            )}
          </div>
          {/* プロフィール情報：背景画像の下に配置し、重なりを解消 */}
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 mt-0 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-center sm:space-x-5 w-full sm:w-auto">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-4 border-white shadow-md -mt-10 sm:-mt-12">
                  {userProfile?.profile_image_url ? (
                    <img
                      src={userProfile.profile_image_url}
                      alt={userProfile?.name || userProfile?.full_name || "ユーザー"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left mt-2 sm:mt-0 w-full sm:w-auto">
                  <h1 className="text-xl sm:text-2xl font-bold">{userProfile?.name || userProfile?.full_name || "ユーザー名"}</h1>
                  <p className="text-gray-500 text-sm sm:text-base max-w-2xl">{userProfile?.about || "自己紹介文がありません"}</p>
                  {/* 所在地 */}
                  {(userProfile?.location) && (
                    <div className="flex justify-center sm:justify-start items-center text-xs sm:text-sm text-gray-500 mt-1">
                      {userProfile.location && <span>{userProfile.location}</span>}
                    </div>
                  )}
                  {/* SNSリンク */}
                  <div className="mt-3 flex justify-center sm:justify-start space-x-3">
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
                        className="text-gray-600 hover:text-pink-400"
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
              </div>
              {/* プロフィール編集ボタンとシェアボタン */}
              <div className="flex space-x-2 w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0">
                {/* シェアボタン */}
                <button
                  onClick={toggleShareDialog}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="プロフィールをシェア"
                >
                  <Share2 className="mr-2 h-4 w-4" />シェア
                </button>
                {/* プロフィール編集ボタン */}
                {isCurrentUser && (
                  <a 
                    href="/profile/edit" 
                    className="inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Edit className="mr-2 h-4 w-4" />プロフィール編集
                  </a>
                )}
              </div>
            </div>
            <div className="flex justify-center sm:justify-start gap-6 mt-2">
              <button
                className="font-bold hover:underline focus:outline-none"
                onClick={() => handleOpenFollowModal('following')}
                aria-label="フォロー中一覧を表示"
                type="button"
              >
                {followingCount}
              </button> <span className="text-sm sm:text-base">フォロー中</span>
              <button
                className="font-bold hover:underline focus:outline-none"
                onClick={() => handleOpenFollowModal('followers')}
                aria-label="フォロワー一覧を表示"
                type="button"
              >
                {followerCount}
              </button> <span className="text-sm sm:text-base">フォロワー</span>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <nav className="flex overflow-x-auto whitespace-nowrap space-x-2 mb-3 sm:mb-4 pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "profile", label: "プロフィール" },
            { key: "works", label: "作品一覧" },
            { key: "input", label: "インプット記録" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${selectedTab === tab.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"}`}
              onClick={() => setSelectedTab(tab.key)}
              aria-selected={selectedTab === tab.key}
              tabIndex={0}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* タブごとのコンテンツ切り替え */}
        {selectedTab === "profile" && (
          // プロフィールセクション
          <section className="space-y-6 sm:space-y-8">
            {/* 1. できること・スキルセット（最重要） */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2" />できること・スキルセット
                </h2>
                {isCurrentUser && !isEditingSkills && (
                  <button
                    className="px-3 sm:px-4 py-1 bg-yellow-50 border border-yellow-600 text-yellow-700 rounded font-semibold text-xs sm:text-sm hover:bg-yellow-100 w-full sm:w-auto"
                    onClick={handleEditSkills}
                  >編集</button>
                )}
              </div>
              {isEditingSkills ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                    {editSkills.map((tag, idx) => (
                      <span key={idx} className="flex items-center bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        {tag}
                        <button
                          type="button"
                          className="ml-1 text-yellow-500 hover:text-red-500 focus:outline-none"
                          aria-label="タグ削除"
                          onClick={() => handleRemoveSkillTag(idx)}
                          disabled={saveSkillsLoading}
                        >×</button>
                      </span>
                    ))}
                    {/* タグ追加input */}
                    {editSkills.length < 10 && (
                      <input
                        ref={tagInputRef}
                        type="text"
                        className="border px-2 py-1 rounded text-sm min-w-[120px]"
                        placeholder="新しいスキルを追加"
                        value={tagInputValue}
                        onChange={e => setTagInputValue(e.target.value)}
                        onKeyDown={handleSkillTagInputKeyDown}
                        disabled={saveSkillsLoading}
                        maxLength={20}
                      />
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-4 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                      onClick={handleSaveSkills}
                      disabled={saveSkillsLoading}
                    >{saveSkillsLoading ? '保存中...' : '保存'}</button>
                    <button
                      className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      onClick={handleCancelEditSkills}
                      disabled={saveSkillsLoading}
                    >キャンセル</button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">最大10件まで。エンターまたはカンマで追加</div>
                  {saveSkillsError && <div className="text-red-500 text-sm mt-1">{saveSkillsError}</div>}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {userProfile?.skills && userProfile.skills.length > 0 ? (
                    userProfile.skills.map((skill, i) => (
                      <span key={i} className="rounded-full bg-yellow-50 px-3 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm text-yellow-800 border border-yellow-200">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">スキル・専門領域が登録されていません。</span>
                  )}
                </div>
              )}
              {/* 今後拡張: スキル詳細・レベル・関連実績リンク */}
              {/*
              <div className="mt-4">
                <SkillDetailList skills={skillsDetail} />
              </div>
              */}
            </div>

            {/* 2. 実績・キャリア（プロジェクト・成果重視） */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-teal-500 mr-2" />実績・キャリア
                </h2>
                <button className="px-3 sm:px-4 py-1 bg-teal-50 border border-teal-600 text-teal-700 rounded font-semibold text-xs sm:text-sm hover:bg-teal-100 w-full sm:w-auto">職歴を追加</button>
              </div>
              {careers && careers.length > 0 ? (
                <ul className="flex flex-col gap-4 sm:gap-6 mt-2">
                  {careers.map((career, i) => (
                    <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b pb-3 sm:pb-4 last:border-b-0 last:pb-0">
                      <div className="hidden sm:flex flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 items-center justify-center text-gray-400">
                        <span className="material-icons text-lg sm:text-xl">work</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base sm:text-lg text-gray-900">{career.company || '会社名未登録'}</div>
                        <div className="text-xs sm:text-sm text-gray-700 mb-1">{career.position || '役職未登録'} <span className="ml-2 text-xs text-gray-400">{formatDate(career.start_date)}〜{career.end_date || '現在'}</span></div>
                        {/* --- ここから発注者向け情報強化 --- */}
                        <div className="text-xs sm:text-sm text-gray-600">
                          {/* TODO: career.role, career.project, career.achievement など拡張（現状はダミー） */}
                          <span className="block"><b>担当プロジェクト:</b> 例）新規Webアプリ開発PJ</span>
                          <span className="block"><b>主な役割:</b> UI/UX設計・プロジェクトリード</span>
                          <span className="block"><b>成果:</b> 例）CVRを30%向上・グッドデザイン賞受賞</span>
                        </div>
                        {/* --- 詳細は今後モーダルやリンクで拡張可 --- */}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">キャリア情報が登録されていません。</p>
              )}
            </div>

            {/* --- よく使用するタグランキングリスト＆アクティビティ 2カラム --- */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6">
              {/* よく使用するタグランキングリストカード */}
              <div className="flex-1 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 flex flex-col relative">
                <div className="flex items-center mb-2 gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-tr from-pink-400 via-yellow-300 to-blue-300 shadow mr-2 sm:mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.35 15.5c-3.51 0-6.35-2.84-6.35-6.35S8.14 4.8 11.65 4.8s6.35 2.84 6.35 6.35-2.84 6.35-6.35 6.35zm0-13c-3.31 0-6 1.79-6 4s1.79 4 4 4 6-1.79 6-4-1.79-4-4-4z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">よく使用するタグ</h2>
                    <span className="text-xs text-gray-400 block sm:inline-block">ランキング上位7件</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 relative min-h-[180px] sm:min-h-[240px]">
                  {tagLoading ? (
                    <div className="text-gray-400 py-12">タグデータを取得中...</div>
                  ) : tagError ? (
                    <div className="text-red-500 py-12">{tagError}</div>
                  ) : tagRankingData.length === 0 ? (
                    <div className="text-gray-400 py-12">タグデータがありません</div>
                  ) : (
                    <TagRankingList tags={mergeDuplicateTags(tagRankingData).sort((a, b) => b.value - a.value).slice(0, 7)} />
                  )}
                  {/* 合計件数 */}
                  {!tagLoading && !tagError && tagRankingData.length > 0 && (
                    <div className="mt-4 sm:mt-6 text-xs text-gray-400 text-center w-full">合計 {mergeDuplicateTags(tagRankingData).sort((a, b) => b.value - a.value).slice(0, 7).reduce((acc, cur) => acc + cur.value, 0)} 件</div>
                  )}
                </div>
              </div>
              {/* アクティビティカード（右側・同様にモダン化） */}
              <div className="flex-1 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="flex items-center mb-2 gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-tr from-indigo-400 via-emerald-300 to-yellow-400 shadow mr-2 sm:mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.35 15.5c-3.51 0-6.35-2.84-6.35-6.35S8.14 4.8 11.65 4.8s6.35 2.84 6.35 6.35-2.84 6.35-6.35 6.35zm0-13c-3.31 0-6 1.79-6 4s1.79 4 4 4 6-1.79 6-4-1.79-4-4-4z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">アクティビティ</h2>
                    <span className="text-xs text-gray-400 block sm:inline-block">直近1年の投稿推移</span>
                  </div>
                </div>
                <div className="h-40 sm:h-48 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={MONTHS.map((month, index) => ({ name: month, 投稿数: stats.monthly[index] || 0 }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{fontSize: 10}} />
                      <YAxis allowDecimals={false} tick={{fontSize: 10}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="投稿数" stroke="#6366f1" fill="#c7d2fe" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-400 text-center">※直近1年間の投稿数を表示しています。継続的な活動の目安です。</div>
              </div>
            </div>
            {/* --- AI分析セクション（復元） --- */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 mt-4 sm:mt-6">
              <div className="flex items-center mb-3 sm:mb-4 gap-2">
                <span className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-tr from-indigo-400 via-purple-300 to-green-300 shadow mr-2 sm:mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-indigo-700">AIによるクリエイター分析</h2>
              </div>
              {aiAnalysisResult ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {/* オリジナリティ */}
                  <div className="bg-indigo-50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-indigo-700 mb-1">オリジナリティ</h3>
                    <p className="text-gray-700 text-xs sm:text-sm mb-2">{aiAnalysisResult.originality?.summary || 'まだ分析されていません。'}</p>
                  </div>
                  {/* クオリティ */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-700 mb-1">クオリティ</h3>
                    <p className="text-gray-700 mb-2">{aiAnalysisResult.quality?.summary || 'まだ分析されていません。'}</p>
                  </div>
                  {/* エンゲージメント */}
                  <div className="bg-pink-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-pink-700 mb-1">影響力・共感（エンゲージメント）</h3>
                    <p className="text-gray-700 mb-2">{aiAnalysisResult.engagement?.summary || 'まだ分析されていません。'}</p>
                  </div>
                  {/* 総合的な考察 */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-700 mb-1 flex items-center"><span className="mr-2">総合的な考察</span><span role="img" aria-label="lightbulb">💡</span></h3>
                    <p className="text-gray-700 mb-1">{aiAnalysisResult.overall_insight?.summary || 'まだ分析されていません。'}</p>
                    {aiAnalysisResult.overall_insight?.future_potential && (
                      <p className="text-xs text-green-600 mt-2">将来の可能性: {aiAnalysisResult.overall_insight.future_potential}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 py-8 text-center">まだ分析されていません。</div>
              )}
            </div>
          </section>
        )}
        {selectedTab === "works" && (
          // 作品一覧セクション
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            {/* 作品ジャンル用タブナビゲーション */}
            <nav className="flex overflow-x-auto whitespace-nowrap space-x-2 mb-3 sm:mb-4 pb-1 sm:pb-0 scrollbar-none">
              <button
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${categoryTab === 'all' ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"}`}
                onClick={() => setCategoryTab('all')}
                aria-selected={categoryTab === 'all'}
                tabIndex={0}
                type="button"
              >全て</button>
              {userCategories.map(cat => (
                <button
                  key={cat.id}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${categoryTab === cat.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"}`}
                  onClick={() => setCategoryTab(cat.id)}
                  aria-selected={categoryTab === cat.id}
                  tabIndex={0}
                  type="button"
                >{cat.name}</button>
              ))}
              {isCurrentUser && (
                <button
                  className="flex items-center px-2 sm:px-4 py-1 sm:py-1.5 ml-2 sm:ml-4 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium border border-gray-200"
                  onClick={() => setSelectedTab('category-edit')}
                  type="button"
                >
                  <span className="hidden sm:inline">カテゴリーを編集</span><span className="sm:hidden">編集</span> <Edit className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </button>
              )}
            </nav>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">作品一覧</h2>
              {isCurrentUser && (
                <div ref={addWorkButtonRef} className="relative inline-block text-left">
                  <button
                    onClick={toggleAddWorkMenu}
                    className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />作品を追加
                  </button>
                  {showAddWorkMenu && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 sm:w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleAddWorkType('writing')}
                          className="flex items-center w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                            <FileText className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="text-left">
                            <span className="font-medium">ウェブ</span>
                            <p className="text-xs text-gray-500">記事・ブログなど</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleAddWorkType('design')}
                          className="flex items-center w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.35 15.5c-3.51 0-6.35-2.84-6.35-6.35S8.14 4.8 11.65 4.8s6.35 2.84 6.35 6.35-2.84 6.35-6.35 6.35zm0-13c-3.31 0-6 1.79-6 4s1.79 4 4 4 6-1.79 6-4-1.79-4-4-4z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <span className="font-medium">画像 & ファイル</span>
                            <p className="text-xs text-gray-500">デザイン・イラスト等</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* 作品リスト: カスタムカテゴリでフィルタリング */}
            {userWorks.filter(work => categoryTab === 'all' || work.categoryIds?.includes(categoryTab)).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {userWorks
                  .filter(work => categoryTab === 'all' || work.categoryIds?.includes(categoryTab))
                  .map((work) => (
                    <div 
                      key={work.id} 
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handleWorkClick(work.id)}
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
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">No Image</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                          {work.title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {work.description}
                        </p>
                        {work.tags && work.tags.length > 0 && (
                          <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1">
                            {work.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center bg-gray-100 text-gray-800 rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {work.tags.length > 3 && (
                              <span className="inline-flex items-center bg-gray-100 text-gray-800 rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium">
                                +{work.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-gray-500">
                          <span>
                            {formatDate(work.published_date || work.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="flex flex-col items-center">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <h3 className="mt-1.5 sm:mt-2 text-base sm:text-lg font-medium text-gray-900">作品がありません</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    「作品を追加」ボタンをクリックして、最初の作品を追加しましょう
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {selectedTab === "input" && (
          // インプット記録セクション
          <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">インプット記録</h2>
            <p className="text-sm text-gray-500 mb-4">本・映画・漫画・アニメなどのインプットを記録し、興味・関心傾向を分析します</p>

            {/* --- 分析サマリー --- */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-700 mb-1">興味・関心の傾向（ダミー）</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(genreStats).length === 0 ? (
                  <span className="text-gray-400">まだインプットがありません</span>
                ) : (
                  Object.entries(genreStats).map(([type, count]) => (
                    <span key={type} className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                      {type}：{count}件
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* --- 入力フォーム --- */}
            <InputLogForm
              inputType={inputType}
              setInputType={setInputType}
              genreOptions={genreOptions}
              recentGenres={recentGenres}
              inputUrl={inputUrl}
              setInputUrl={setInputUrl}
              urlLoading={urlLoading}
              urlError={urlError ?? ""}
              handleUrlBlur={handleUrlBlur}
              handleUrlKeyDown={handleUrlKeyDown}
              inputTitle={inputTitle}
              setInputTitle={setInputTitle}
              titleRef={titleRef as React.RefObject<HTMLInputElement>}
              handleTitleKeyDown={handleTitleKeyDown}
              inputAuthor={inputAuthor}
              setInputAuthor={setInputAuthor}
              authorRef={authorRef as React.RefObject<HTMLInputElement>}
              handleAuthorKeyDown={handleAuthorKeyDown}
              inputDescription={inputDescription}
              setInputDescription={setInputDescription}
              descriptionRef={descriptionRef as React.RefObject<HTMLInputElement>}
              handleDescriptionKeyDown={handleDescriptionKeyDown}
              inputComment={inputComment}
              setInputComment={setInputComment}
              commentRef={commentRef as React.RefObject<HTMLInputElement>}
              handleCommentKeyDown={handleCommentKeyDown}
              inputTags={inputTags}
              setInputTags={setInputTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              tagRef={tagRef as React.RefObject<HTMLInputElement>}
              handleTagInputKeyDownWithAdd={handleTagInputKeyDownWithAdd}
              handleRemoveTag={handleRemoveTag}
              recentTags={recentTags}
              showImageEdit={false}
              handleImageEditToggle={() => {}}
              inputImageUrl={inputImageUrl ?? ""}
              handleImageUrlChange={() => {}}
              handleAddInputLog={handleAddInputLog}
            />
            {/* --- ジャンル追加 --- */}
            <div className="flex gap-2 mt-2">
              <input type="text" value={newGenre} onChange={e => setNewGenre(e.target.value)} placeholder="ジャンル追加" className="border px-2 py-1 rounded" />
              <button type="button" className="bg-gray-200 px-2 py-1 rounded flex items-center gap-1">
                <span className="text-lg">＋</span><span>ジャンル追加</span>
              </button>
            </div>

            {/* --- インプット記録リスト --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inputLogs.length === 0 ? (
                <div className="text-gray-400 col-span-full">まだインプットがありません</div>
              ) : (
                inputLogs.map(log => <InputLogCard key={log.id} log={log} />)
              )}
            </div>
          </section>
        )}
        {selectedTab === "category-edit" && isCurrentUser && (
          // カテゴリー編集セクション
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-xl mx-auto">
            <h2 className="text-xl font-bold mb-4">カテゴリー管理</h2>
            <ul className="mb-4">
              {userCategories.map(cat => (
                <li key={cat.id} className="flex items-center gap-2">
                  {editingCategoryId === cat.id ? (
                    <>
                      <input
                        type="text"
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-2"
                        value={editingCategoryName}
                        onChange={e => setEditingCategoryName(e.target.value)}
                        style={{ minWidth: 80 }}
                        autoFocus
                      />
                      <button
                        className="text-indigo-600 hover:underline focus:outline-none text-xs mr-2"
                        onClick={addCategory}
                      >保存</button>
                      <button className="text-gray-500" onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }}>キャンセル</button>
                    </>
                  ) : (
                    <>
                      <span>{cat.name}</span>
                      <button className="text-blue-500" onClick={() => handleEditCategory(cat.id)}>編集</button>
                      <button className="text-red-500" onClick={() => deleteCategory(cat.id)}>削除</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                placeholder="新しいカテゴリー名"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button
                className="bg-indigo-600 text-white px-4 py-1 rounded"
                onClick={addCategory}
              >追加</button>
            </div>
          </div>
        )}
        {selectedTab === "input" && (
          // --- 入力中プレビュー ---
          <div className="mt-6 mb-4">
            <div className="text-xs text-gray-400 mb-1">入力中プレビュー</div>
            <InputLogCard log={previewLog} />
          </div>
        )}
      </div>
      <FollowListModal
        userId={userProfile?.id || ''}
        open={isFollowModalOpen}
        onOpenChange={setIsFollowModalOpen}
        initialTab={followModalTab}
      />
      {/* URLシェアダイアログ */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium">プロフィールをシェア</h3>
              <button
                onClick={toggleShareDialog}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2">以下のURLをコピーしてシェアできます：</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <input
                type="text"
                value={`${window.location.origin}/profile/${userProfile?.id}`}
                readOnly
                className="flex-1 p-2 border border-gray-300 sm:rounded-l-md rounded-md sm:rounded-r-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-md sm:rounded-l-none sm:rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-xs sm:text-sm"
                onClick={copyProfileUrl}
              >
                コピー
              </button>
            </div>
            <div className="mt-4 flex justify-center sm:justify-end">
              <button
                onClick={toggleShareDialog}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-xs sm:text-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- テンプレ一発記録 --- */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
        {(inputTemplates ?? []).map((tpl: { label: string; data: { type: string; title: string; author: string; description: string; tags: string[] } }) => (
          <button key={tpl.label} type="button" className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 rounded px-2 sm:px-3 py-0.5 sm:py-1 hover:bg-indigo-100 border border-indigo-200" onClick={() => applyTemplate(tpl.data)}>{tpl.label}</button>
        ))}
      </div>
      
      {/* モバイル用ボトムナビゲーション */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex items-center justify-around py-2 z-10">
        <button 
          onClick={() => setSelectedTab("profile")} 
          className={`flex flex-col items-center justify-center px-3 py-1 ${selectedTab === "profile" ? "text-indigo-600" : "text-gray-500"}`}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">プロフィール</span>
        </button>
        <button 
          onClick={() => setSelectedTab("works")} 
          className={`flex flex-col items-center justify-center px-3 py-1 ${selectedTab === "works" ? "text-indigo-600" : "text-gray-500"}`}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <span className="text-xs">作品</span>
        </button>
        <button 
          onClick={() => setSelectedTab("input")} 
          className={`flex flex-col items-center justify-center px-3 py-1 ${selectedTab === "input" ? "text-indigo-600" : "text-gray-500"}`}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">インプット</span>
        </button>
        {isCurrentUser && (
          <a 
            href="/profile/edit" 
            className="flex flex-col items-center justify-center px-3 py-1 text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span className="text-xs">編集</span>
          </a>
        )}
      </div>
      
      {/* モバイルボトムナビのための余白 */}
      <div className="md:hidden h-16"></div>
    </div>
  );
}

export default Portfolio;