import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/hooks/useToast';
import { 
  Edit,
  PlusCircle,
  Loader2,
  Zap,
  FileText,
  Share2,
  Star,
  Brush,
  AlertCircle,
  LogOut,
  FileType,
  Image,
  Lightbulb} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { analyzeUserTagsApi } from '../../api/tag-analysis-api';
import { getUserInsightsApi } from '../../api/tag-analysis-api';
// 型定義をインポート
import { UserProfile, Work, Career, AIAnalysisResult } from '../../types';
import { Loader2 as Spinner } from "lucide-react";

// 最初のimport文の直後にデバッグログを追加
console.log('🔍 マイページコンポーネントのコードが読み込まれました');

const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const Mypage: React.FC = () => {
  console.log('🔍 マイページコンポーネントが初期化されました');
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hasAnalysis, setHasAnalysis] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult>({
    originality: { summary: '' },
    quality: { summary: '' },
    expertise: { summary: '' },
    engagement: { summary: '' },
    specialties: [],
    interests: {
      areas: [],
      topics: []
    },
    design_styles: [],
    overall_insight: { summary: '', future_potential: '' }
  });
  const [stats, setStats] = useState<Record<string, number[]>>({
    monthly: Array(12).fill(0)
  });
  const [showCareerDialog, setShowCareerDialog] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrentPosition, setIsCurrentPosition] = useState(false);
  const [showShareUrl, setShowShareUrl] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showAddWorkMenu, setShowAddWorkMenu] = useState(false); 
  const addWorkButtonRef = useRef<HTMLDivElement>(null); 
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const [, setIsLoadingInsights] = useState<boolean>(false); // ★ インサイト読み込み状態を追加

  // ユーザープロファイルの取得
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
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
          toast({ title: 'エラー', description: 'ユーザー情報の取得に失敗しました。再度ログインしてください。', variant: 'destructive' });
          navigate('/login');
          return;
        }

        if (!user) {
          console.error('❌ ログインしていません。ログインページにリダイレクトします。');
          toast({ title: 'ログインが必要です', description: 'プロフィールを表示するにはログインしてください。', variant: 'destructive' });
          navigate('/login');
          return;
        }
        userIdToFetch = user.id;
        isFetchingOwnProfile = true;
        setIsCurrentUser(true);
      }

      if (!userIdToFetch) {
        console.error('❌ フェッチ対象のユーザーIDが不明です。');
        toast({ title: 'エラー', description: 'ユーザー情報の取得に失敗しました。', variant: 'destructive' });
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
        toast({
          title: 'エラー',
          description: `プロフィールの取得に失敗しました: ${selectError.message}`,
          variant: 'destructive'
        });
        // maybeSingle を使っているので、特定のエラーコード(PGRST116等)で処理を続ける必要はない
        // 致命的なエラーとして処理を中断
        setIsLoading(false);
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
            fetchUserInsights(userIdToFetch)
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
          // 409 Conflict の場合は特にログ出力
          if (insertError.code === '23505') { // PostgreSQL の unique_violation コード
            console.error('   => 原因: 同じIDのプロフィールが既に存在します (一意性制約違反)。競合が発生した可能性があります。');
          } else {
             console.error('   => 原因: データベースエラーまたはRLSポリシーの問題の可能性があります。');
          }
          toast({
            title: 'エラー',
            description: `プロフィールの作成に失敗しました: ${insertError.message}`,
            variant: 'destructive'
          });
          // エラーが発生しても、最低限のプロフィール情報をステートに設定して表示を試みる
          setUserProfile(newProfile); 
        } else {
          console.log('✅ 新規プロフィール作成成功');
          setUserProfile(newProfile);
          // 新規作成時は Works, Careers, Insights は空なのでフェッチ不要
        }
      }
      // 他のユーザーのプロフィールが見つからなかった場合
      else if (!isFetchingOwnProfile && !profileData) {
        console.error('❌ 指定されたIDのプロフィールが見つかりません。');
        toast({
          title: 'エラー',
          description: '指定されたプロフィールが見つかりません。',
          variant: 'destructive'
        });
        // エラーページに遷移するか、前のページに戻るなどの処理が必要かも
        navigate(-1); // 例: 前のページに戻る
      }

    } catch (error) {
      console.error('❌ fetchUserProfile 関数内で予期せぬエラー:', error);
      toast({
        title: 'エラー',
        description: 'プロフィールの取得中に予期せぬエラーが発生しました',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      console.log('fetchUserProfile 処理完了');
    }
  // 依存配列を修正: fetchUserWorks, fetchUserCareers, fetchUserInsights を削除
  }, [navigate, toast, params.id]);

  // ユーザーの作品一覧を取得する関数
  const fetchUserWorks = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      
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
          setWorks([]);
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
        setWorks([]);
        setStats({
          monthly: Array(12).fill(0)
        });
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
        monthly: monthlyStats
      });
      
    } catch (error) {
      console.error('Error in fetchUserWorks:', error);
      console.log('Error details:', error);
      
      // エラーが発生した場合でも、他のユーザーのプロフィールを表示している場合は空の配列を設定
      if (!isCurrentUser) {
        console.log('エラー発生時: 他のユーザーのプロフィール表示中のため空の作品リストを表示');
        setWorks([]);
        setStats({
          monthly: Array(12).fill(0)
        });
      }
    } finally {
      setIsLoading(false);
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
      
    } catch (error) {
      console.error('Error in fetchUserCareers:', error);
      console.log('Error details:', error);
      
      // エラーが発生した場合でも、他のユーザーのプロフィールを表示している場合は空の配列を設定
      if (!isCurrentUser) {
        console.log('エラー発生時: 他のユーザーのプロフィール表示中のため空の職歴リストを表示');
        setCareers([]);
      }
    }
  }, [isCurrentUser]);

  // ユーザーのAI分析結果を取得
  const fetchUserInsights = useCallback(async (userIdToFetch: string) => {
    setIsLoadingInsights(true); // ローディング開始
    console.log('ユーザーインサイトの取得を開始します - ユーザーID:', userIdToFetch);

    try {
      const result = await getUserInsightsApi(userIdToFetch);

      // API 呼び出し成功の場合
      if (result.success) {
        // データが存在する場合 (result.data が null や undefined でない)
        if (result.data) {
          console.log('取得したユーザーインサイト:', result.data);
          const insightData = result.data;

          // 分析結果をステートに設定
          const analysisResult: AIAnalysisResult = {
            originality: { summary: insightData.originality?.summary || '不明' },
            quality: { summary: insightData.quality?.summary || '不明' },
            expertise: { summary: insightData.expertise?.summary || '不明' },
            engagement: { summary: insightData.engagement?.summary || '不明' },
            specialties: insightData.specialties || [],
            // interests の整形ロジック（specialties から生成）
            interests: {
              areas: insightData.specialties?.slice(0, 3) || [],
              topics: insightData.specialties?.slice(3, 6) || []
            },
            design_styles: insightData.design_styles || [],
            overall_insight: {
              summary: insightData.overall_insight?.summary || '分析データがまだありません。',
              future_potential: insightData.overall_insight?.future_potential || '作品を追加すると分析が開始されます。'
            }
          };
          setAiAnalysisResult(analysisResult);
          setHasAnalysis(true); // 分析結果あり
        } else {
          // データが存在しない場合 (API が success: true, data: undefined を返した場合)
          console.log('ユーザーにはまだインサイトデータがありません。AI分析結果を初期化します。');
          // データがない場合の初期値を設定
          setAiAnalysisResult({
            originality: { summary: '-' }, // 分析前を示す表示
            quality: { summary: '-' },
            expertise: { summary: '-' },
            engagement: { summary: '-' },
            specialties: [],
            interests: { areas: [], topics: [] },
            design_styles: [],
            overall_insight: {
              summary: 'AI分析はまだ実行されていません。作品を追加・公開すると、あなたの特徴が分析されます。',
              future_potential: 'ポートフォリオを充実させて、AIによるインサイトを得ましょう。'
            }
          });
          setHasAnalysis(false); // 分析結果なし
        }
      } else {
        // API 呼び出し失敗の場合 (success: false)
        console.error('Error fetching user insights:', result.error);
        toast({
          title: 'インサイト取得エラー',
          description: result.error || 'AI分析結果の取得中に不明なエラーが発生しました。',
          variant: 'destructive'
        });
        // エラー時も初期値を設定して表示を安定させる
        setAiAnalysisResult({
          originality: { summary: 'エラー' },
          quality: { summary: 'エラー' },
          expertise: { summary: 'エラー' },
          engagement: { summary: 'エラー' },
          specialties: [],
          interests: { areas: [], topics: [] },
          design_styles: [],
          overall_insight: {
            summary: 'インサイト情報の取得中にエラーが発生しました。',
            future_potential: '時間をおいて再度お試しください。'
          }
        });
        setHasAnalysis(false); // 分析結果なし
      }
    } catch (error) { // fetchUserInsights 関数自体のエラー
      console.error('Critical error in fetchUserInsights function:', error);
      toast({
        title: '重大なエラー',
        description: 'インサイト情報の処理中に予期せぬ問題が発生しました。',
        variant: 'destructive'
      });
      // エラー時も初期値を設定
      setAiAnalysisResult({
          originality: { summary: 'エラー' },
          quality: { summary: 'エラー' },
          expertise: { summary: 'エラー' },
          engagement: { summary: 'エラー' },
          specialties: [],
          interests: { areas: [], topics: [] },
          design_styles: [],
          overall_insight: {
            summary: 'インサイト情報の取得中にエラーが発生しました。',
            future_potential: '時間をおいて再度お試しください。'
          }
      });
      setHasAnalysis(false);
    } finally {
      setIsLoadingInsights(false); // ローディング終了
      console.log('ユーザーインサイトの取得処理が完了しました。');
    }
  // 依存配列を確認・修正 (getUserInsightsApi を追加)
  }, [toast, getUserInsightsApi]);

  // コンポーネントの初期化
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log('🚀 マイページコンポーネントを初期化しています...');
        
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
            toast.error({
              title: 'セッションエラー',
              description: 'ログイン状態の確認中にエラーが発生しました。再度ログインしてください。'
            });
            navigate('/login');
            return;
          }
          
          if (!data.session) {
            console.error('❌ セッションがありません - ログイン必要');
            
            // Google認証プロセス中の場合、エラーメッセージは表示しない
            const isGoogleAuthInProgress = localStorage.getItem('google_auth_in_progress') === 'true';
            if (isGoogleAuthInProgress) {
              console.log('ℹ️ Google認証処理中のため、リダイレクトのみを行います');
              
              // 2分以上経過している場合はタイムアウト扱いにする
              const timestamp = Number(localStorage.getItem('google_auth_timestamp') || '0');
              const elapsed = Date.now() - timestamp;
              if (elapsed > 2 * 60 * 1000) {  // 2分
                console.log('⚠️ 認証タイムアウト - 経過時間:', elapsed / 1000, '秒');
                localStorage.removeItem('google_auth_in_progress');
                localStorage.removeItem('google_auth_timestamp');
                
                toast.error({
                  title: '認証タイムアウト',
                  description: 'Google認証処理がタイムアウトしました。再度ログインしてください。'
                });
              }
            } else {
              // 通常のログインエラー
              toast.error({
                title: 'ログインが必要です',
                description: 'マイページを表示するにはログインしてください'
              });
            }
            
            navigate('/login');
            return;
          }
          
          console.log('✅ ログイン済み - ユーザーID:', data.session.user.id);
          
          // ログインしている場合は自分のプロフィールを取得
          await fetchUserProfile();
        }
      } catch (error) {
        console.error('❌ コンポーネント初期化エラー:', error);
        
        toast.error({
          title: 'エラーが発生しました',
          description: 'ページの読み込み中にエラーが発生しました。再度お試しください。'
        });
        
        navigate('/login');
      }
    };
    
    initializeComponent();
  }, [fetchUserProfile, navigate, params.id, toast]);

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

  // URLシェアダイアログを表示する関数
  const toggleShareDialog = () => {
    setShowShareUrl(!showShareUrl);
  };

  // ユーザーのタグを分析
  const analyzeUserTagsLocal = useCallback(async () => {
    if (!userProfile) {
      toast.error({
        title: '分析できません',
        description: 'プロフィール情報が取得できません。再度ログインしてお試しください。'
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      console.log('AI分析を開始します - ユーザーID:', userProfile.id);
      
      // 作品がない場合はエラーメッセージを表示
      if (works.length === 0) {
        console.error('分析エラー: 作品が存在しません');
        toast.error({
          title: '分析できません',
          description: '作品がありません。作品を追加してから再度お試しください。'
        });
        setIsAnalyzing(false);
        return;
      }
      
      // タグの出現頻度を計算
      const tagFrequency: { [key: string]: number } = {};
      let totalTags = 0;
      
      works.forEach(work => {
        if (work.tags && work.tags.length > 0) {
          work.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            totalTags++;
          });
        }
      });
      
      // タグがない場合はエラーメッセージを表示
      if (totalTags === 0) {
        console.error('分析エラー: 作品にタグが存在しません');
        toast.error({
          title: '分析できません',
          description: '作品にタグがありません。作品にタグを追加してから再度お試しください。'
        });
        setIsAnalyzing(false);
        return;
      }
      
      console.log('タグの出現頻度:', tagFrequency);
      console.log('タグの総数:', totalTags);
      
      // サービスロールキーの存在を確認（デバッグ用）
      const hasServiceKey = !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      console.log('サービスロールキーの存在:', hasServiceKey);
      console.log('APIを使用して分析を実行します');
      
      // 常にAPIを使用する（改良版APIはサービスロールキーがなくても動作する）
      console.log('analyzeUserTagsApi関数を実行します（ユーザーID:', userProfile.id, '）');
      let result;
      
      try {
        // API関数を使用
        result = await analyzeUserTagsApi(userProfile.id);
        console.log('API関数の実行結果:', result);
      } catch (apiError) {
        console.error('API実行中に例外が発生:', apiError);
        if (apiError instanceof Error) {
          console.error('エラーメッセージ:', apiError.message);
          console.error('スタックトレース:', apiError.stack);
        } else {
          console.error('不明なエラー型:', typeof apiError);
        }
        
        // エラー処理
        toast.error({
          title: 'API実行エラー',
          description: apiError instanceof Error ? apiError.message : '不明なエラーが発生しました'
        });
        setIsAnalyzing(false);
        return;
      }
      
      if (!result.success || !result.data) {
        console.error('タグ分析に失敗しました:', result.error);
        
        toast.error({
          title: 'タグ分析に失敗しました',
          description: result.error || '不明なエラーが発生しました'
        });
        setIsAnalyzing(false);
        return;
      }
      
      console.log('タグ分析結果:', result.data);
      
      // 分析結果をステートに設定
      const resultData: AIAnalysisResult = {
        originality: {
          summary: result.data?.originality?.summary || 'データに基づいた分析と創造的な表現を組み合わせた独自のアプローチが特徴です。'
        },
        quality: {
          summary: result.data?.quality?.summary || '明確で簡潔な表現スタイルで、読者に伝わりやすい文章を作成します。'
        },
        expertise: {
          summary: result.data?.expertise?.summary || 'データに基づいた分析と創造的な表現を組み合わせた独自のアプローチが特徴です。'
        },
        engagement: {
          summary: result.data?.engagement?.summary || '独自の視点と表現スタイルを持ち、読者に新たな価値を提供します。'
        },
        specialties: result.data?.specialties || ['ライティング', 'コンテンツ制作', 'クリエイティブ'],
        interests: {
          areas: result.data?.interests?.areas || ['コンテンツマーケティング', 'デジタルメディア', 'クリエイティブ表現'],
          topics: result.data?.interests?.topics || []
        },
        design_styles: result.data?.design_styles || ['シンプル', '明快', '効果的'],
        overall_insight: {
          summary: result.data?.overall_insight?.summary || 'これらの要素は相互に関連し合い、クリエイターとしての総合的な価値を形成しています。一つの要素が他の要素を強化し、全体として独自の魅力を生み出しています。あなたの作品は、専門性と創造性のバランスが取れており、読者に新たな視点や価値を提供しています。',
          future_potential: result.data?.overall_insight?.future_potential || 'あなたの創造性と情熱は、今後さらに多くの可能性を広げていくでしょう。新たな挑戦や異なる分野との融合を通じて、クリエイターとしての価値をさらに高めていくことができます。自分の強みを活かしながら、好奇心を持って探求を続けることが、長期的な成長につながります。'
        }
      };
      
      console.log('分析結果をUIに反映します:', resultData);
      setAiAnalysisResult(resultData);
      
      setHasAnalysis(true);
      // ユーザーが明示的に「AI分析を実行」ボタンを押した場合のみポップアップを表示
      // このトーストメッセージは初期ロード時には表示せず、ユーザーが明示的に分析を要求した場合のみ表示
      if (isAnalyzing) {
        toast({
          title: 'タグ分析が完了しました',
          description: 'あなたの作品のタグに基づいて専門性やスタイルを分析しました'
        });
      }
    } catch (error) {
      console.error('タグ分析エラー:', error);
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message);
        console.error('スタックトレース:', error.stack);
      } else {
        console.error('不明なエラー型:', typeof error);
      }
      
      toast.error({
        title: 'タグ分析に失敗しました',
        description: error instanceof Error ? error.message : '不明なエラーが発生しました'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [userProfile, works, toast, isAnalyzing]);

  // AI分析を実行する関数
  const runAIAnalysis = useCallback(() => {
    if (isAnalyzing) return;
    
    // 環境変数のデバッグ情報を出力
    console.log('===== AI分析環境情報 =====');
    console.log('環境モード:', import.meta.env.MODE);
    console.log('VITE_SUPABASE_URL存在:', !!import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY存在:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    console.log('VITE_SUPABASE_SERVICE_ROLE_KEY存在:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
    
    if (import.meta.env.VITE_SUPABASE_URL) {
      console.log('VITE_SUPABASE_URL値:', import.meta.env.VITE_SUPABASE_URL.substring(0, 10) + '...(省略)');
    }
    
    if (userProfile) {
      console.log('ユーザープロフィールID:', userProfile.id);
      console.log('ユーザー名:', userProfile.full_name || userProfile.name);
    } else {
      console.log('ユーザープロフィール: 未取得');
    }
    
    console.log('作品数:', works.length);
    console.log('========================');
    
    // 分析実行
    analyzeUserTagsLocal();
  }, [isAnalyzing, analyzeUserTagsLocal, userProfile, works.length]);

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
    
    // デバッグ用：userProfileオブジェクトの内容を確認
    console.log('userProfile in getProfileImageUrl:', userProfile);
    
    // profile_image_urlが存在する場合はそれを使用
    if (userProfile.profile_image_url) {
      console.log('Using profile_image_url:', userProfile.profile_image_url);
      return userProfile.profile_image_url;
    }
    
    // avatar_urlが存在する場合はそれを使用
    if (userProfile.avatar_url) {
      console.log('Using avatar_url:', userProfile.avatar_url);
      return userProfile.avatar_url;
    }
    
    // デフォルトのアバター画像を返さない（何も表示しない）
    console.log('No profile image found');
    return '';
  }, [userProfile]);

  // URLをコピーする関数
  const copyProfileUrl = useCallback(() => {
    if (!userProfile?.id) {
      toast({
        title: 'エラー',
        description: 'プロフィールIDが取得できません',
        variant: 'destructive'
      });
      return;
    }
    
    // 正しいUUIDフォーマットかチェックは一時的に無効化（デバッグ用）
    /*
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userProfile.id)) {
      console.error('無効なユーザーID形式:', userProfile.id);
      toast({
        title: 'エラー',
        description: 'プロフィールIDの形式が無効です',
        variant: 'destructive'
      });
      return;
    }
    */
    
    const profileUrl = `${window.location.origin}/profile/${userProfile.id}`;
    console.log('コピーするURL:', profileUrl);
    
    // 直接フォールバックメソッドを使用（Clipboard APIのセキュリティ制限を回避）
    fallbackCopyTextToClipboard(profileUrl);
  }, [userProfile, toast]);

  // フォールバックのコピー方法
  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      // 一時的なテキストエリアを作成
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // テキストエリアをオフスクリーンに配置
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // テキストを選択してコピー
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      
      // テキストエリアを削除
      document.body.removeChild(textArea);
      
      if (success) {
        toast({
          title: 'コピー完了',
          description: 'プロフィールURLがクリップボードにコピーされました',
          variant: 'default'
        });
        setShowShareUrl(false);
      } else {
        toast({
          title: 'コピー失敗',
          description: 'URLのコピーに失敗しました。もう一度お試しください。',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('URLコピー失敗（フォールバック）:', err);
      toast({
        title: 'コピー失敗',
        description: 'URLのコピーに失敗しました。もう一度お試しください。',
        variant: 'destructive'
      });
    }
  };

  // プロフィール更新イベントのリスナーを設定
  useEffect(() => {
    // プロフィール更新イベントのハンドラー
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile update event received:', event.detail);
      if (event.detail && event.detail.profile) {
        // イベントから受け取ったプロフィールデータの内容を確認
        console.log('Profile data from event:', event.detail.profile);
        
        // nameとfull_nameの存在を確認
        if (event.detail.profile.name) {
          console.log('Event contains name:', event.detail.profile.name);
        }
        if (event.detail.profile.full_name) {
          console.log('Event contains full_name:', event.detail.profile.full_name);
        }
        
        // プロフィールデータを更新
        setUserProfile(prevProfile => {
          const updatedProfile = {
            ...(prevProfile || {}),
            ...event.detail.profile,
            // nameフィールドが存在しない場合はfull_nameを使用
            name: event.detail.profile.name || event.detail.profile.full_name || (prevProfile?.name || "")
          };
          console.log('Updated user profile:', updatedProfile);
          return updatedProfile;
        });
      } else {
        // イベントにプロフィールデータがない場合は再取得
        console.log('No profile data in event, fetching from database...');
        fetchUserProfile();
      }
    };

    // プロフィール保存完了イベントのハンドラー
    const handleProfileSaveComplete = (event: CustomEvent) => {
      console.log('Profile save complete event detected, refreshing profile...');
      
      // イベントからプロフィールデータを取得して即時反映
      if (event.detail && event.detail.profile) {
        console.log('Profile data from save complete event:', event.detail.profile);
        
        // nameとfull_nameの存在を確認
        if (event.detail.profile.name) {
          console.log('Save event contains name:', event.detail.profile.name);
        }
        if (event.detail.profile.full_name) {
          console.log('Save event contains full_name:', event.detail.profile.full_name);
        }
        
        setUserProfile(prevProfile => {
          const updatedProfile = {
            ...(prevProfile || {}),
            ...event.detail.profile,
            // nameフィールドが存在しない場合はfull_nameを使用
            name: event.detail.profile.name || event.detail.profile.full_name || (prevProfile?.name || "")
          };
          console.log('Updated user profile after save:', updatedProfile);
          return updatedProfile;
        });
      } else {
        // イベントにプロフィールデータがない場合は再取得
        // 少し遅延を入れてデータベースの更新が確実に完了するのを待つ
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      }
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

  // 作品追加メニューの表示・非表示を切り替える
  const toggleAddWorkMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAddWorkMenu(prev => !prev);
  };

  // 外部クリックでメニューを閉じる
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

  // 作品タイプを選択して作品追加ページに遷移
  const handleAddWorkType = (type: string) => {
    navigate(`/works/new?type=${type}`);
    setShowAddWorkMenu(false);
  };

  // タグの頻度データから直接分析を行う関数

  // ページタイトルをセット
  useEffect(() => {
    // URLパラメータからプロフィールIDを取得
    const profileId = params.id;
    
    if (profileId) {
      document.title = userProfile ? `${userProfile.full_name || 'User'} | Balubo` : 'プロフィール | Balubo';
    } else {
      // 自分のマイページの場合
      document.title = 'マイページ | Balubo';
      console.log('📌 自分のマイページを表示します');
    }
    
    // URLをチェック
    console.log('📌 現在のURL:', window.location.href);
    console.log('📌 ログイン後の処理です');
    
    // ログイン状態の確認（デバッグ用）
    const checkLoginStatus = async () => {
      const { data } = await supabase.auth.getSession();
      console.log('📊 ログイン状態:', data.session ? 'ログイン済み' : 'ログインしていません');
      if (data.session) {
        console.log('🔑 ユーザーID:', data.session.user.id);
      }
    };
    
    checkLoginStatus();
    
    return () => {
      // クリーンアップ関数
    };
  }, [params.id, userProfile]);

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
              <div ref={addWorkButtonRef} className="relative inline-block text-left">
                <button
                  onClick={() => navigate('/works/new')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="作品を追加"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  作品を追加
                </button>
              </div>
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
            
            {/* 肩書きを表示 */}
            {userProfile?.headline && (
              <p className="text-gray-700 font-medium mt-1">{userProfile.headline}</p>
            )}

            {/* ユーザー情報 */}
            <div className="ml-36 pt-2 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-component-name="Mypage">
                  {userProfile?.name || userProfile?.full_name || "ユーザー名"}
                </h1>
                <p className="text-gray-500 max-w-2xl" data-component-name="Mypage">{userProfile?.about || "自己紹介文がありません"}</p>
                
                {/* 所在地 */}
                {(userProfile?.location) && (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    {userProfile.location && <span>{userProfile.location}</span>}
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
                {isCurrentUser && (
                  <a 
                    href="/profile/edit" 
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    プロフィール編集
                  </a>
                )}
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
                    投稿数: stats.monthly[index] || 0,
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
            {isCurrentUser && (
              <button 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => openCareerEditDialog()}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                追加
              </button>
            )}
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
                  {isCurrentUser && (
                    <button 
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => openCareerEditDialog(career)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      編集
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI分析セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">AI分析</h2>
            {isCurrentUser && (
              <button
                onClick={runAIAnalysis}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Zap className="h-4 w-4" />
                AI分析を実行
              </button>
            )}
          </div>

          {isAnalyzing ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center">
                <Spinner className="h-12 w-12 animate-spin text-blue-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">分析中...</h3>
                <p className="text-sm text-gray-500">
                  あなたの作品とタグを分析しています。少々お待ちください。
                </p>
              </div>
            </div>
          ) : hasAnalysis ? (
            <div className="space-y-4" data-component-name="Mypage">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100" data-component-name="Mypage">
                <div className="flex items-center mb-2" data-component-name="Mypage">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                  <h4 className="text-md font-semibold">AI分析について</h4>
                </div>
                <p className="text-sm text-gray-600" data-component-name="Mypage">
                クリエイターの価値を測る要素は多様ですが、特に重要と考えられる以下の3つの要素から分析しています。これらの要素を総合的に見ることで、ユーザーの多面的な価値や魅力をより深く理解できます。
                </p>
              </div>

              {/* 創造性と独自性 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200" data-component-name="Mypage">
                <div className="flex items-center mb-3" data-component-name="Mypage">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  <h4 className="text-md font-semibold">創造性と独自性 (オリジナリティ)</h4>
                </div>
                
                {/* 分析結果 - 強調表示 */}
                <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-100">
                  <p className="text-base text-gray-800 leading-relaxed">
                    {aiAnalysisResult?.originality?.summary || "まだ分析されていません"}
                  </p>
                  {aiAnalysisResult?.originality?.summary && 
                    <p className="mt-3 text-sm text-blue-600 italic">
                      AI分析を実行するとあなたの創造性や独自性についてより深く理解できます。
                    </p>
                  }
                </div>
                
                {/* 折りたたみ可能な詳細情報 */}
                <details className="text-sm">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-700 mb-2">詳細情報を表示</summary>
                  <div className="pl-2 border-l-2 border-gray-200">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">内容:</p>
                      <p className="text-sm text-gray-500">
                        新しいアイデアや表現を生み出す能力、既存の概念を独自の視点で再解釈する力を指します。他者と差別化された独自の世界観や表現スタイルを確立することで、作品に唯一無二の価値が生まれます。
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">指標例:</p>
                      <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                        <li>新規性：これまでにない新しい視点や表現</li>
                        <li>独創性：他者と明確に区別される独自の特徴</li>
                        <li>革新性：既存の枠組みを超える挑戦的な試み</li>
                        <li>実験性：従来の手法にとらわれない実験的アプローチ</li>
                      </ul>
                    </div>
                  </div>
                </details>
                
                {aiAnalysisResult?.specialties && aiAnalysisResult.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {aiAnalysisResult.specialties.map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 専門性とスキル */}
              <div className="bg-white p-4 rounded-lg border border-gray-200" data-component-name="Mypage">
                <div className="flex items-center mb-3" data-component-name="Mypage">
                  <Brush className="h-5 w-5 text-orange-500 mr-2" />
                  <h4 className="text-md font-semibold">専門性とスキル (クオリティ)</h4>
                </div>
                
                {/* 分析結果 - 強調表示 */}
                <div className="mb-4 p-3 bg-orange-50 rounded-md border border-orange-100">
                  <p className="text-base text-gray-800 leading-relaxed">
                    {aiAnalysisResult?.quality?.summary || "まだ分析されていません"}
                  </p>
                  {aiAnalysisResult?.quality?.summary && 
                    <p className="mt-3 text-sm text-blue-600 italic">
                                        AI分析を実行するとあなたの専門性とスキルについてより深く理解できます。
                    </p>
                  }
                </div>
                
                {/* 折りたたみ可能な詳細情報 */}
                <details className="text-sm">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-700 mb-2">詳細情報を表示</summary>
                  <div className="pl-2 border-l-2 border-gray-200">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">内容:</p>
                      <p className="text-sm text-gray-500">
                        特定の分野における知識や技術の深さと幅を表します。専門的な知見に基づいた質の高い作品制作能力や、技術的な完成度の高さが作品の信頼性と価値を高めます。
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">指標例:</p>
                      <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                        <li>技術的完成度：作品の仕上がりや精度の高さ</li>
                        <li>専門知識の深さ：特定分野における専門的な知見</li>
                        <li>一貫性：作品全体を通じた質とスタイルの安定性</li>
                        <li>問題解決力：複雑な課題に対する効果的な解決方法の提示</li>
                        <li>洗練度：細部まで行き届いた丁寧な仕上げ</li>
                      </ul>
                    </div>
                  </div>
                </details>
                
                {aiAnalysisResult?.design_styles && aiAnalysisResult.design_styles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {aiAnalysisResult.design_styles.map((style: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 影響力と共感 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <Lightbulb className="h-5 w-5 text-purple-500 mr-2" />
                  <h4 className="text-md font-semibold">影響力と共感 (エンゲージメント)</h4>
                </div>
                
                {/* 分析結果 - 強調表示 */}
                <div className="mb-4 p-3 bg-purple-50 rounded-md border border-purple-100">
                  <p className="text-base text-gray-800 leading-relaxed">
                    {aiAnalysisResult?.engagement?.summary || "まだ分析されていません"}
                  </p>
                  {aiAnalysisResult?.engagement?.summary && 
                    <p className="mt-3 text-sm text-blue-600 italic">
                                        AI分析を実行するとあなたの影響力と共感についてより深く理解できます。
                    </p>
                  }
                </div>
                
                {/* 折りたたみ可能な詳細情報 */}
                <details className="text-sm">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-700 mb-2">詳細情報を表示</summary>
                  <div className="pl-2 border-l-2 border-gray-200">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">内容:</p>
                      <p className="text-sm text-gray-500">
                        作品が他者に与える影響や共感を呼び起こす力を指します。感情を動かし、新たな視点や行動の変化を促す作品は、社会的価値や文化的意義を持ち、より広い影響力を持ちます。
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">指標例:</p>
                      <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                        <li>共感性：観客の感情や経験に響く力</li>
                        <li>社会的影響力：社会的議論や変化を促す可能性</li>
                        <li>記憶に残る度合い：長期的に記憶に残る印象の強さ</li>
                        <li>対話性：観客との相互作用を促す要素</li>
                        <li>普遍性：幅広い層に受け入れられる要素</li>
                      </ul>
                    </div>
                  </div>
                </details>
                
                {aiAnalysisResult?.interests?.topics && aiAnalysisResult?.interests?.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {aiAnalysisResult?.interests?.topics.map((topic: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 総合的な考察 */}
              {aiAnalysisResult?.overall_insight && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4" data-component-name="Mypage">
                  <div className="flex items-center mb-3" data-component-name="Mypage">
                    <Lightbulb className="h-5 w-5 text-green-500 mr-2" />
                    <h4 className="text-md font-semibold">総合的な考察</h4>
                  </div>
                  
                  {/* 分析結果 - 強調表示 */}
                  <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-100">
                    <p className="text-base text-gray-800 leading-relaxed">
                      {aiAnalysisResult?.overall_insight?.summary || "まだ分析されていません"}
                    </p>
                    {aiAnalysisResult?.overall_insight?.future_potential && (
                      <p className="mt-3 text-sm text-blue-600 italic">
                        {aiAnalysisResult.overall_insight.future_potential}
                      </p>
                    )}
                  </div>
                </div>
              )}
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

        {/* 作品一覧セクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">作品一覧</h2>
            {isCurrentUser && (
              <div ref={addWorkButtonRef} className="relative inline-block text-left">
                <button
                  onClick={toggleAddWorkMenu}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  作品を追加
                </button>
                {showAddWorkMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleAddWorkType('writing')}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <FileType className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <span className="font-medium">ウェブ</span>
                          <p className="text-xs text-gray-500">記事・ブログなど</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleAddWorkType('design')}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <Image className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="text-left">
                          <span className="font-medium">画像 & ファイル</span>
                          <p className="text-xs text-gray-500">デザイン・写真など</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                value={`${window.location.origin}/profile/${userProfile?.id}`}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="bg-indigo-600 text-white px-4 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={copyProfileUrl}
              >
                コピー
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