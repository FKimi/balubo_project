import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Container } from '../components/Container';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  FileText,
  Eye,
  ThumbsUp,
  Pencil,
  BarChart4,
  Star,
  Sparkles,
  Twitter,
  Instagram,
  Facebook,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { analyzeUserData } from '../lib/ai-analysis';
import { Badge } from '../components/Badge';

// インターフェース
interface User {
  id: string;
  name?: string;
  email?: string;
  profile_image_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
  website?: string;
  location?: string;
  twitter_username?: string;
  facebook_username?: string;
  instagram_username?: string;
  username?: string;
  avatar_url?: string;
}

interface Work {
  id: string;
  title: string;
  description?: string | null;
  source_url: string;
  thumbnail_url?: string;
  image_url?: string;
  user_id: string;
  views: number;
  likes: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

interface Stats {
  totalWorks: number;
  totalViews: number;
  totalLikes: number;
  engagement: string;
  monthlyWorks: number[];
  totalCharacters: number;
  averageCharacters: number;
}

interface DisplayAIAnalysisResult {
  expertise?: string;
  expertiseTags?: string[];
  contentStyle?: string;
  styleFeatures?: string[];
  interests?: string;
  interestTags?: string[];
}

// 定数
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function Mypage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // コンポーネントの状態
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState<User>({} as User);
  const [works, setWorks] = useState<Work[]>([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<DisplayAIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 統計情報の初期状態
  const [stats, setStats] = useState<Stats>({
    totalWorks: 0,
    totalViews: 0,
    totalLikes: 0,
    engagement: '0',
    monthlyWorks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    totalCharacters: 0,
    averageCharacters: 0
  });

  // グラフ用のデータ
  const graphData = MONTHS.map((month, index) => {
    return {
      name: month,
      投稿数: stats.monthlyWorks[index] || 0,
    };
  });

  // 作品を取得する関数
  const fetchWorks = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('作品取得エラー:', error);
        toast({
          title: 'エラー',
          description: '作品の取得に失敗しました。',
          variant: 'destructive'
        });
        throw new Error('作品の取得に失敗しました。');
      }
      
      if (data) {
        const processedWorks = data.map(work => ({
          ...work,
          views: work.views || 0,
          likes: work.likes || 0,
          tags: work.tags || [],
          image_url: work.thumbnail_url || '',
          thumbnail_url: work.thumbnail_url || work.image_url || ''
        }));
        
        setWorks(processedWorks);
        
        // 統計情報を計算
        const totalViews = data.reduce((sum, work) => sum + (work.views || 0), 0);
        const totalLikes = data.reduce((sum, work) => sum + (work.likes || 0), 0);
        
        // 月別投稿数を計算
        const monthlyWorks = Array(12).fill(0);
        data.forEach(work => {
          const date = new Date(work.created_at);
          const month = date.getMonth();
          monthlyWorks[month]++;
        });
        
        // 文字数の統計を計算
        const totalChars = data.reduce((sum, work) => sum + (work.description?.length || 0), 0);
        const avgChars = data.length > 0 ? Math.round(totalChars / data.length) : 0;
        
        setStats({
          totalWorks: data.length,
          totalViews,
          totalLikes,
          engagement: data.length > 0 ? ((totalViews + totalLikes) / data.length).toFixed(1) : '0',
          monthlyWorks,
          totalCharacters: totalChars,
          averageCharacters: avgChars
        });
        
        return processedWorks;
      }
      
      return [];
    } catch (error) {
      console.error('作品取得処理エラー:', error);
      throw error;
    }
  }, [toast]);

  // ユーザープロファイルを取得する関数
  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('セッション取得エラー:', sessionError);
        setIsError(true);
        setErrorMessage('認証情報の取得に失敗しました。再ログインをお試しください。');
        toast({
          title: 'エラー',
          description: '認証情報の取得に失敗しました。再ログインをお試しください。',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      if (!session) {
        console.error('セッションがありません');
        setIsError(true);
        setErrorMessage('ログインが必要です。');
        toast({
          title: 'エラー',
          description: 'ログインが必要です。',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.error('ユーザー情報取得エラー:', userError);
        
        if (userError.code === 'PGRST116') {
          console.log('ユーザーレコードが見つかりません。基本情報を使用します。');
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            profile_image_url: session.user.user_metadata?.avatar_url || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
            name: session.user.user_metadata?.full_name || '',
            username: session.user.user_metadata?.full_name || ''
          });
        } else {
          setIsError(true);
          setErrorMessage('ユーザー情報の取得に失敗しました。');
          toast({
            title: 'エラー',
            description: 'ユーザー情報の取得に失敗しました。',
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
      } else {
        setUser({
          ...userData,
          avatar_url: userData.profile_image_url || '',
          username: userData.name || ''
        });
      }

      const worksData = await fetchWorks(session.user.id);
      
      try {
        const analysis = await analyzeUserData(worksData, userData?.bio);
        setAiAnalysisResult({
          expertise: analysis.talent?.summary || "",
          expertiseTags: analysis.specialties || [],
          contentStyle: "あなたの作品は独自のスタイルを持っています。",
          styleFeatures: analysis.designStyles || [],
          interests: "あなたの興味関心が作品に反映されています。",
          interestTags: analysis.interests || []
        });
      } catch (aiError) {
        console.error('AI分析エラー:', aiError);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('プロファイル取得エラー:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '不明なエラーが発生しました。',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  }, [fetchWorks, toast]);

  // AI分析を実行する関数
  const runAIAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      
      toast({
        title: "AI分析を開始しました",
        description: "しばらくお待ちください...",
      });
      
      if (!works || works.length === 0) {
        toast({
          title: "エラー",
          description: "分析する作品がありません。作品を追加してください。",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      const userAnalysis = await analyzeUserData(works, user?.bio);
      
      setAiAnalysisResult({
        expertise: userAnalysis.talent?.summary || "",
        expertiseTags: userAnalysis.specialties || [],
        contentStyle: "あなたの作品は独自のスタイルを持っています。",
        styleFeatures: userAnalysis.designStyles || [],
        interests: "あなたの興味関心が作品に反映されています。",
        interestTags: userAnalysis.interests || []
      });
      
      toast({
        title: "AI分析が完了しました",
        description: `${works.length}件の作品の分析結果が更新されました`,
        variant: "success",
      });
    } catch (error) {
      console.error("AI分析エラー:", error);
      toast({
        title: "エラー",
        description: "AI分析中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 初期データ取得
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // ローディング中の表示
  if (isLoading) {
    return (
      <ErrorBoundary>
        <Container>
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">読み込み中...</p>
          </div>
        </Container>
      </ErrorBoundary>
    );
  }

  // エラー時の表示
  if (isError) {
    return (
      <ErrorBoundary>
        <Container>
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">{errorMessage || 'データの取得中にエラーが発生しました。'}</p>
            <Button onClick={() => fetchUserProfile()}>再試行</Button>
          </div>
        </Container>
      </ErrorBoundary>
    );
  }

  // ユーザーが存在しない場合
  if (!user) {
    return (
      <ErrorBoundary>
        <Container>
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
            <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">ユーザー情報が見つかりません</h2>
            <p className="text-gray-600 mb-6">ログインしてください。</p>
            <Button onClick={() => navigate('/login')}>ログインページへ</Button>
          </div>
        </Container>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Container>
        {/* プロフィールセクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <div className="mb-4 md:mb-0 md:mr-6">
              <Avatar
                src={user.profile_image_url || ''}
                alt={user.name || 'ユーザー'}
                size="lg"
                className="border-2 border-primary-100"
              />
            </div>
            
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{user.name || 'ユーザー名未設定'}</h1>
                  <p className="text-gray-600 mt-1">{user.bio || '自己紹介文が設定されていません'}</p>
                </div>
                
                <Button 
                  onClick={() => navigate('/settings')}
                  variant="secondary"
                  className="text-sm"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  プロフィールを編集
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {user.twitter_username && (
                  <a
                    href={`https://twitter.com/${user.twitter_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Twitter className="w-4 h-4 mr-1" />
                    <span>@{user.twitter_username}</span>
                  </a>
                )}
                
                {user.instagram_username && (
                  <a
                    href={`https://instagram.com/${user.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Instagram className="w-4 h-4 mr-1" />
                    <span>@{user.instagram_username}</span>
                  </a>
                )}
                
                {user.facebook_username && (
                  <a
                    href={`https://facebook.com/${user.facebook_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Facebook className="w-4 h-4 mr-1" />
                    <span>{user.facebook_username}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 統計情報 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">統計情報</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-medium">総作品数</h3>
                </div>
                <p className="text-2xl font-bold">{stats.totalWorks}</p>
                <p className="text-sm text-gray-500 mt-1">作品</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <Eye className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-medium">総閲覧数</h3>
                </div>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-sm text-gray-500 mt-1">ビュー</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <ThumbsUp className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-medium">総いいね数</h3>
                </div>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
                <p className="text-sm text-gray-500 mt-1">いいね</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <BarChart4 className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-medium">平均エンゲージメント</h3>
                </div>
                <p className="text-2xl font-bold">{stats.engagement}</p>
                <p className="text-sm text-gray-500 mt-1">いいね/作品</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* 月間投稿グラフ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">月間投稿数</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={graphData}
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
        
        {/* AI分析結果 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">AI分析結果</h2>
            <Button 
              onClick={runAIAnalysis} 
              variant="primary"
              size="sm"
              disabled={isAnalyzing || works.length === 0}
              className="flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  AI分析を実行
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-medium">専門性（強み）</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{aiAnalysisResult?.expertise || '作品を追加すると、AIがあなたの専門性を分析します'}</p>
              {aiAnalysisResult?.expertiseTags && aiAnalysisResult.expertiseTags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {aiAnalysisResult.expertiseTags.map((tag, index) => (
                    <Badge key={index} variant="default" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-medium">作品の特徴・魅力</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{aiAnalysisResult?.contentStyle || '作品を追加すると、AIがあなたの文章の特徴を分析します'}</p>
              {aiAnalysisResult?.styleFeatures && aiAnalysisResult.styleFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {aiAnalysisResult.styleFeatures.map((tag, index) => (
                    <Badge key={index} variant="default" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-medium">興味・関心</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{aiAnalysisResult?.interests || '作品を追加すると、AIがあなたの興味・関心を分析します'}</p>
              {aiAnalysisResult?.interestTags && aiAnalysisResult.interestTags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {aiAnalysisResult.interestTags.map((tag, index) => (
                    <Badge key={index} variant="default" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {works.length === 0 && (
            <div className="text-center mt-4 text-gray-500 text-sm">
              <p>作品を追加するとAI分析が利用できるようになります</p>
            </div>
          )}
        </div>
        
        {/* 作品一覧 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">作品一覧</h2>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M21 18H3"></path>
                  <path d="M21 12H3"></path>
                  <path d="M21 6H3"></path>
                </svg>
                <span>リスト</span>
              </Button>
              <Button variant="secondary" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span>フィルター</span>
              </Button>
            </div>
          </div>
          
          {works.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work) => (
                <div key={work.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    {work.thumbnail_url ? (
                      <img 
                        src={work.thumbnail_url} 
                        alt={work.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{work.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {work.description || '説明はありません'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center text-gray-500 text-sm">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{work.views}</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          <span>{work.likes}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/works/${work.id}`)}
                        variant="text"
                        className="text-blue-600 hover:text-blue-800 text-sm p-0"
                      >
                        詳細
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">作品がありません</h3>
              <p className="text-gray-600 mb-6">あなたの最初の作品を投稿しましょう！</p>
              <Button 
                onClick={() => navigate('/works/new')}
                variant="primary"
                className="inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                新しい作品を投稿
              </Button>
            </div>
          )}
        </div>
      </Container>
    </ErrorBoundary>
  );
}