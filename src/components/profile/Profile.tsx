import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProfileWithAdmin, fetchWorksWithAdmin, fetchCareersWithAdmin, fetchAIAnalysisWithAdmin } from '../../lib/supabase-admin';
import { ArrowLeft, Globe, ExternalLink, AlertCircle, Star, Brush, Compass, Zap, Loader2 } from 'lucide-react';
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
  expertise: string;
  talent: string;
  uniqueness: string;
  content_style: string;
  specialties?: string[];
  design_styles?: string[];
  interests?: {
    areas?: string[];
  };
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
    expertise: 'ライティングとコンテンツ制作において高い専門性を持っています。',
    talent: '技術的な知識と実践的な経験が豊富です。',
    uniqueness: 'データに基づいた分析と創造的な表現を組み合わせた独自のアプローチが特徴です。',
    content_style: '明確で簡潔な表現スタイルで、読者に伝わりやすい文章を作成します。',
    specialties: [],
    design_styles: [],
    interests: { areas: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careers, setCareers] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState<{ monthly: number[] }>({
    monthly: Array(12).fill(0)
  });

  // 月名の配列
  const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!id) {
          setError('プロフィールIDが見つかりません');
          setLoading(false);
          return;
        }

        // プロフィール情報を取得
        const { data: profileData, error: profileError } = await fetchProfileWithAdmin(String(id));
        
        if (profileError) {
          console.error('管理者権限でのプロフィール取得エラー:', profileError);
          setError('プロフィールの取得に失敗しました');
          setLoading(false);
          return;
        }
        
        // 管理者権限で作品データを取得
        const { data: worksData, error: worksError } = await fetchWorksWithAdmin(String(id));
        
        if (worksError) {
          console.error('管理者権限での作品取得エラー:', worksError);
          setError('作品の取得に失敗しました');
          setLoading(false);
          return;
        }
        
        // 管理者権限で職歴データを取得
        const { data: careersData, error: careersError } = await fetchCareersWithAdmin(String(id));
        
        if (careersError) {
          console.error('管理者権限での職歴取得エラー:', careersError);
          setError('職歴の取得に失敗しました');
          setLoading(false);
          return;
        }
        
        // 管理者権限でAI分析データを取得
        const { data: aiData, error: aiError } = await fetchAIAnalysisWithAdmin(String(id));
        
        if (aiError) {
          console.error('管理者権限でのAI分析取得エラー:', aiError);
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
  }, [id]);

  // AI分析を実行する関数
  const runAIAnalysis = useCallback(async () => {
    if (isAnalyzing || !profile) return;
    
    try {
      setIsAnalyzing(true);
      
      // 既存のAPIを使用して分析を実行
      const result = await analyzeUserTagsApi(profile.id);
      
      if (!result.success) {
        throw new Error(result.error || '分析に失敗しました');
      }
      
      // 分析結果を直接ステートに設定（Mypageコンポーネントと同様）
      if (result.data) {
        setAiAnalysis({
          expertise: result.data.expertise?.summary || 'ライティングとコンテンツ制作において高い専門性を持っています。',
          talent: result.data.talent?.summary || '技術的な知識と実践的な経験が豊富です。',
          uniqueness: result.data.uniqueness?.summary || 'データに基づいた分析と創造的な表現を組み合わせた独自のアプローチが特徴です。',
          content_style: result.data.content_style?.summary || '明確で簡潔な表現スタイルで、読者に伝わりやすい文章を作成します。',
          specialties: result.data.specialties || [],
          design_styles: result.data.design_styles || [],
          interests: {
            areas: result.data.interests?.areas || []
          }
        });
      }
      
      // 成功通知
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      notification.innerHTML = `
        <div class="flex items-center">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>AI分析が完了しました！</span>
        </div>
      `;
      document.body.appendChild(notification);
      
      // 3秒後に通知を消す
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('AI分析中にエラーが発生しました:', error);
      
      // エラー通知
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorNotification.innerHTML = `
        <div class="flex items-center">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>エラー: ${error instanceof Error ? error.message : '不明なエラー'}</span>
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 
              onClick={() => navigate('/')} 
              className="text-xl font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors"
            >
              Balubo
            </h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* プロフィールカード */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* カバー画像 */}
          <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
            {profile.background_image_url && (
              <img 
                className="h-full w-full object-cover"
                src={profile.background_image_url} 
                alt="背景画像"
              />
            )}
          </div>
          
          <div className="px-6 pb-6 relative">
            {/* プロフィール画像 */}
            <div className="absolute -top-16 left-6 border-4 border-white rounded-full overflow-hidden shadow-lg"
                 style={{ width: '8rem', height: '8rem' }}>
              <img
                src={profile.profile_image_url || 'https://via.placeholder.com/150?text=No+Image'}
                alt={profile.full_name}
                className="h-full w-full object-cover"
              />
            </div>
            
            <div className="ml-36 pt-2">
              <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
              <p className="text-gray-500 max-w-2xl">{profile.about || '自己紹介文がありません'}</p>
              
              {profile.headline && (
                <p className="text-gray-700 font-medium mt-1">{profile.headline}</p>
              )}
              
              {(profile.location || profile.industry) && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
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
        </div>

        {/* メインコンテンツ */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左サイドバー */}
          <div className="lg:col-span-1 space-y-8">
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
            <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-component-name="Profile">
              <div className="flex justify-between items-center mb-4" data-component-name="Profile">
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
                <div className="space-y-4" data-component-name="Profile">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100" data-component-name="Profile">
                    <div className="flex items-center mb-2" data-component-name="Profile">
                      <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                      <h4 className="text-md font-semibold" data-component-name="Profile">AI分析について</h4>
                    </div>
                    <p className="text-sm text-gray-600" data-component-name="Profile">
                      この分析結果はユーザーの作品から抽出したタグに基づいて生成されています。客観的な評価指標としてご活用ください。
                    </p>
                  </div>

                  {/* 専門性 */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200" data-component-name="Profile">
                    <div className="flex items-center mb-2" data-component-name="Profile">
                      <Star className="h-5 w-5 text-yellow-500 mr-2" />
                      <h4 className="text-md font-semibold" data-component-name="Profile">専門性</h4>
                    </div>
                    <p className="text-sm text-gray-600" data-component-name="Profile">
                      {aiAnalysis.expertise}
                    </p>
                    {aiAnalysis.specialties && aiAnalysis.specialties.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1" data-component-name="Profile">
                        {aiAnalysis.specialties.map((specialty, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* コンテンツスタイル */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200" data-component-name="Profile">
                    <div className="flex items-center mb-2" data-component-name="Profile">
                      <Brush className="h-5 w-5 text-orange-500 mr-2" />
                      <h4 className="text-md font-semibold" data-component-name="Profile">コンテンツスタイル</h4>
                    </div>
                    <p className="text-sm text-gray-600" data-component-name="Profile">
                      {aiAnalysis.content_style}
                    </p>
                    {aiAnalysis.design_styles && aiAnalysis.design_styles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1" data-component-name="Profile">
                        {aiAnalysis.design_styles.map((style, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {style}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 作品のユニークさ */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200" data-component-name="Profile">
                    <div className="flex items-center mb-2" data-component-name="Profile">
                      <Compass className="h-5 w-5 text-indigo-500 mr-2" />
                      <h4 className="text-md font-semibold" data-component-name="Profile">作品のユニークさ</h4>
                    </div>
                    <p className="text-sm text-gray-600" data-component-name="Profile">
                      {aiAnalysis.uniqueness}
                    </p>
                    {aiAnalysis.interests && aiAnalysis.interests.areas && aiAnalysis.interests.areas.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1" data-component-name="Profile">
                        {aiAnalysis.interests.areas.map((interest, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    <div key={work.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="relative pb-[56.25%]">
                        {work.thumbnail_url || work.image_url ? (
                          <img
                            src={work.thumbnail_url || work.image_url}
                            alt={work.title}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
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
                            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500"
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
        </div>
      </div>
    </div>
  );
}

export default Profile;