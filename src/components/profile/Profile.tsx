import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Loader2, 
  AlertCircle, 
  Globe, 
  ExternalLink, 
  Zap, 
  Star, 
  Brush, 
  FileText,
  ArrowLeft
} from 'lucide-react';
import { analyzeUserTagsApi } from '../../api/tag-analysis-api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

type UserProfile = {
  id: string;
  full_name: string;
  about: string;
  website_url: string;
  profile_image_url: string;
  headline?: string;
  location?: string;
  industry?: string;
  background_image_url?: string;
};

type Work = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  views?: number;
  comment_count?: number;
  tags?: string[];
};

type AIAnalysis = {
  originality: { 
    summary: string;
  };
  quality: { 
    summary: string;
  };
  engagement: { 
    summary: string;
  };
  overall_insight: {
    summary: string;
    future_potential: string;
  };
  specialties: string[];
  design_styles: string[];
  interests: {
    areas: string[];
    topics: string[];
  };
  tag_frequency?: { [key: string]: number };
};

// 日付フォーマット関数
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ダミーデータ（データ取得に失敗した場合のフォールバック）
const dummyProfile: UserProfile = {
  id: '1',
  full_name: 'ユーザー名',
  about: '自己紹介文がありません',
  website_url: '',
  profile_image_url: 'https://via.placeholder.com/150?text=No+Image',
  headline: '',
  location: '',
  industry: '',
  background_image_url: ''
};

export function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>({
    originality: { 
      summary: '' 
    },
    quality: { 
      summary: '' 
    },
    engagement: { 
      summary: '' 
    },
    overall_insight: {
      summary: '',
      future_potential: ''
    },
    specialties: [],
    design_styles: [],
    interests: {
      areas: [],
      topics: []
    },
    tag_frequency: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careers, setCareers] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState<{ monthly: number[] }>({
    monthly: Array(12).fill(0)
  });
  const [initialized, setInitialized] = useState(false);

  // 月名の配列
  const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // データ取得用のuseEffect
  useEffect(() => {
    // すでに初期化済みの場合は再取得しない
    if (initialized) return;
    
    const fetchProfile = async () => {
      try {
        if (!id) {
          setError('プロフィールIDが見つかりません');
          setLoading(false);
          return;
        }

        // 管理者権限ではなく、通常のsupabaseクライアントでデータを取得するように変更
        console.log('プロフィール情報を取得中 (clientモード):', id);
        
        // プロフィール情報を取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', String(id))
          .single();
        
        if (profileError) {
          console.error('プロフィール取得エラー:', profileError);
          setError('プロフィールの取得に失敗しました');
          setLoading(false);
          return;
        }
        
        // 作品データを取得
        const { data: worksData, error: worksError } = await supabase
          .from('works')
          .select('*')
          .eq('user_id', String(id))
          .order('created_at', { ascending: false });
        
        if (worksError) {
          console.error('作品取得エラー:', worksError);
          setError('作品の取得に失敗しました');
          setLoading(false);
          return;
        }
        
        // 職歴データを取得
        const { data: careersData, error: careersError } = await supabase
          .from('careers')
          .select('*')
          .eq('user_id', String(id))
          .order('start_date', { ascending: false });
        
        if (careersError) {
          console.error('職歴取得エラー:', careersError);
          setError('職歴の取得に失敗しました');
          setLoading(false);
          return;
        }
        
        // AI分析データを取得
        const { data: aiData, error: aiError } = await supabase
          .from('user_insights')
          .select('*')
          .eq('user_id', String(id))
          .single();
        
        if (aiError) {
          console.error('AI分析取得エラー:', aiError);
          // AI分析エラーは致命的ではないので、処理を続行
        } else if (aiData) {
          setAiAnalysis(aiData);
        }
        
        // データをステートに設定
        setProfile(profileData);
        setWorks(worksData || []);
        setCareers(careersData || []);
        
        // 月間投稿統計データを計算
        if (worksData && worksData.length > 0) {
          // 月別の投稿数を集計
          const monthlyStats = Array(12).fill(0);
          
          worksData.forEach(work => {
            const date = new Date(work.created_at);
            const month = date.getMonth(); // 0-11
            monthlyStats[month]++;
          });
          
          setStats({ monthly: monthlyStats });
        }
        
        setInitialized(true);
        setLoading(false);
      } catch (err) {
        console.error('プロフィールページ全体の読み込みに失敗しました:', err);
        setError('プロフィールの読み込みに失敗しました');
        // エラーが発生してもダミーデータを使用
        setProfile(dummyProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, initialized]);

  // AI分析を実行する関数
  const runAIAnalysis = useCallback(async () => {
    if (!profile) return;
    
    setIsAnalyzing(true);
    
    try {
      // 分析開始の通知
      const startNotification = document.createElement('div');
      startNotification.id = 'analysis-notification';
      startNotification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #3b82f6;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-size: 14px;
      `;
      startNotification.innerHTML = `
        <div style="display: flex; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          AI分析を実行中...
        </div>
      `;
      document.body.appendChild(startNotification);
      
      console.log(`ユーザーID: ${profile.id} の分析を開始します`);
      
      // 既存のAPIを使用して分析を実行
      const result = await analyzeUserTagsApi(profile.id);
      
      // 開始通知を削除
      const existingNotification = document.getElementById('analysis-notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      if (!result.success) {
        console.error('AI分析エラー詳細:', result);
        throw new Error(result.error || '分析に失敗しました');
      }
      
      console.log('分析結果:', result.data);
      
      // 分析結果を直接ステートに設定
      if (result.data) {
        // 型アサーションを使用して型エラーを回避
        const analysisData = result.data as any;
        
        setAiAnalysis({
          originality: { 
            summary: analysisData.originality?.summary || '' 
          },
          quality: { 
            summary: analysisData.quality?.summary || '' 
          },
          engagement: { 
            summary: analysisData.engagement?.summary || '' 
          },
          overall_insight: {
            summary: analysisData.overall_insight?.summary || '',
            future_potential: analysisData.overall_insight?.future_potential || ''
          },
          specialties: analysisData.specialties || [],
          design_styles: analysisData.design_styles || [],
          interests: {
            areas: analysisData.interests?.areas || [],
            topics: analysisData.interests?.topics || []
          },
          tag_frequency: analysisData.tag_frequency || {}
        });
        
        // タグの頻度情報をコンソールに出力（デバッグ用）
        if (analysisData.tag_frequency) {
          console.log('タグの頻度情報:', analysisData.tag_frequency);
        }
      }
      
      // 成功通知
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #34c759;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-size: 14px;
      `;
      notification.innerHTML = `
        <div style="display: flex; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          AI分析が完了しました！
        </div>
      `;
      document.body.appendChild(notification);
      
      // 3秒後に通知を消す
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('AI分析中にエラーが発生しました:', error);
      
      // 開始通知を削除
      const existingNotification = document.getElementById('analysis-notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      // エラー通知
      const errorNotification = document.createElement('div');
      errorNotification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f87171;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-size: 14px;
      `;
      
      // エラーメッセージに応じた対処法を表示
      let errorMessage = error instanceof Error ? error.message : '不明なエラー';
      let actionMessage = '';
      
      if (errorMessage.includes('作品が見つかりません')) {
        actionMessage = '作品を追加してから再度お試しください。';
      } else if (errorMessage.includes('タグデータが見つかりません')) {
        actionMessage = '作品にタグを追加してから再度お試しください。';
      } else {
        actionMessage = '時間をおいて再度お試しいただくか、管理者にお問い合わせください。';
      }
      
      errorNotification.innerHTML = `
        <div style="display: flex; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div>エラー: ${errorMessage}</div>
            <div style="font-size: 12px; margin-top: 4px;">${actionMessage}</div>
          </div>
        </div>
      `;
      document.body.appendChild(errorNotification);
      
      // 5秒後にエラー通知を消す
      setTimeout(() => {
        errorNotification.remove();
      }, 5000);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">プロフィールが見つかりません</h2>
          <p className="text-gray-600 mb-4">{error || 'このユーザーのプロフィールは存在しないか、アクセスできません。'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ローディング表示 */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="mt-2 text-lg font-medium text-gray-700">読み込み中...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* プロフィールヘッダー */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {/* カバー画像 */}
            <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
              {profile.background_image_url && (
                <img
                  src={profile.background_image_url}
                  alt="カバー画像"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="px-4 sm:px-6 pb-6 relative">
              {/* プロフィール画像とユーザー情報 - モバイル対応 */}
              <div className="flex flex-col sm:flex-row sm:items-end -mt-16 mb-4 sm:mb-0">
                {/* プロフィール画像 */}
                <div className="border-4 border-white rounded-full overflow-hidden shadow-lg mx-auto sm:mx-0"
                     style={{ width: '8rem', height: '8rem' }}>
                  <img
                    src={profile.profile_image_url || 'https://via.placeholder.com/150?text=No+Image'}
                    alt={profile.full_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                  
                  {profile.headline && (
                    <p className="text-gray-700 font-medium mt-1">{profile.headline}</p>
                  )}
                  
                  {(profile.location || profile.industry) && (
                    <div className="flex items-center justify-center sm:justify-start text-sm text-gray-500 mt-1">
                      {profile.location && <span>{profile.location}</span>}
                      {profile.location && profile.industry && <span className="mx-1">•</span>}
                      {profile.industry && <span>{profile.industry}</span>}
                    </div>
                  )}
                  
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      <Globe className="mr-1 h-4 w-4" />
                      ウェブサイト
                    </a>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-500 max-w-2xl">{profile.about || '自己紹介文がありません'}</p>
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左サイドバー */}
            <div className="lg:col-span-1 space-y-6">
              {/* アクティビティセクション */}
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">職歴</h2>
                
                {careers.length === 0 ? (
                  <p className="text-gray-500">職歴情報がありません</p>
                ) : (
                  <div className="space-y-6">
                    {careers.map((career) => (
                      <div key={career.id} className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-3 before:h-3 before:bg-indigo-500 before:rounded-full before:z-10">
                        <div className="absolute left-[5.5px] top-5 bottom-0 w-0.5 bg-gray-200 -z-10"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">{career.company}</h3>
                            <p className="text-sm text-gray-600">{career.position}</p>
                            {career.department && (
                              <p className="text-sm text-gray-500">{career.department}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {formatDate(career.start_date)} - {career.is_current ? '現在' : (career.end_date ? formatDate(career.end_date) : '不明')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* メインコンテンツ */}
            <div className="lg:col-span-2">
              {/* AI分析セクション */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">AI分析</h2>
                  <button
                    onClick={runAIAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg transition-colors disabled:bg-blue-300"
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
                
                {isAnalyzing ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">分析中...</h3>
                      <p className="text-sm text-gray-500">
                        ユーザーの作品とタグを分析しています。少々お待ちください。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                        <h4 className="text-md font-semibold">AI分析について</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        クリエイターの価値を測る要素は多様ですが、特に重要と考えられる以下の3つの要素から分析しています。これらの要素を総合的に見ることで、ユーザーの多面的な価値や魅力をより深く理解できます。
                      </p>
                    </div>

                    {/* 創造性と独自性 */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <Star className="h-5 w-5 text-yellow-500 mr-2" />
                        <h4 className="text-md font-semibold">創造性と独自性 (オリジナリティ)</h4>
                      </div>
                      
                      {/* 分析結果 - 強調表示 */}
                      <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-100">
                        <p className="text-base text-gray-800 leading-relaxed">
                          {aiAnalysis?.originality?.summary || ''}
                        </p>
                        <p className="mt-3 text-sm text-blue-600 italic">
                          今後、異なる分野の知識を組み合わせることで、さらに独自性を高める可能性があります。新たな表現方法の探求も魅力を高めます。
                        </p>
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
                      
                      {aiAnalysis?.specialties && aiAnalysis.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {aiAnalysis.specialties.map((specialty, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 専門性とスキル */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <Brush className="h-5 w-5 text-orange-500 mr-2" />
                        <h4 className="text-md font-semibold">専門性とスキル (クオリティ)</h4>
                      </div>
                      
                      {/* 分析結果 - 強調表示 */}
                      <div className="mb-4 p-3 bg-orange-50 rounded-md border border-orange-100">
                        <p className="text-base text-gray-800 leading-relaxed">
                          {aiAnalysis?.quality?.summary || ''}
                        </p>
                        <p className="mt-3 text-sm text-blue-600 italic">
                          継続的な学習と実践により、さらにスキルを磨き、専門性を深めていくことができるでしょう。新たな技術の習得も視野に入れてみてはいかがでしょうか。
                        </p>
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
                      
                      {aiAnalysis?.design_styles && aiAnalysis.design_styles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {aiAnalysis.design_styles.map((style, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {style}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 影響力と共感 */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb h-5 w-5 text-purple-500 mr-2">
                          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                          <path d="M9 18h6"></path>
                          <path d="M10 22h4"></path>
                        </svg>
                        <h4 className="text-md font-semibold">影響力と共感 (エンゲージメント)</h4>
                      </div>
                      
                      {/* 分析結果 - 強調表示 */}
                      <div className="mb-4 p-3 bg-purple-50 rounded-md border border-purple-100">
                        <p className="text-base text-gray-800 leading-relaxed">
                          {aiAnalysis?.engagement?.summary || ''}
                        </p>
                        <p className="mt-3 text-sm text-blue-600 italic">
                          多様な視点を取り入れ、ターゲットオーディエンスとの対話を深めることで、さらなる共感と影響力を生み出せるでしょう。社会的な文脈との接続も魅力を高めます。
                        </p>
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
                      
                      {aiAnalysis?.interests && aiAnalysis.interests.areas && aiAnalysis.interests.areas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {aiAnalysis.interests.areas.map((interest, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 総合的な考察 */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
                      <div className="flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb h-5 w-5 text-green-500 mr-2">
                          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                          <path d="M9 18h6"></path>
                          <path d="M10 22h4"></path>
                        </svg>
                        <h4 className="text-md font-semibold">総合的な考察</h4>
                      </div>
                      
                      {/* 分析結果 - 強調表示 */}
                      <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-100">
                        <p className="text-base text-gray-800 leading-relaxed">
                          {aiAnalysis?.overall_insight?.summary || ''}
                        </p>
                        <p className="mt-3 text-sm text-blue-600 italic">
                          {aiAnalysis?.overall_insight?.future_potential || 'あなたの創造性と情熱は、今後さらに多くの可能性を広げていくでしょう。新たな挑戦や異なる分野との融合を通じて、クリエイターとしての価値をさらに高めていくことができます。自分の強みを活かしながら、好奇心を持って探求を続けることが、長期的な成長につながります。'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 作品一覧 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">作品一覧</h2>
                      
                      {works.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">まだ作品がありません</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {works.map((work) => (
                            <div key={work.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                              <div className="relative pb-[56.25%]">
                                {work.thumbnail_url || work.image_url ? (
                                  <img
                                    src={work.thumbnail_url || work.image_url}
                                    alt={work.title}
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900 truncate">{work.title}</h3>
                                {work.description && (
                                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{work.description}</p>
                                )}
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-gray-500">{formatDate(work.created_at)}</span>
                                  <button
                                    onClick={() => navigate(`/works/${work.id}`)}
                                    className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                  >
                                    詳細を見る
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;