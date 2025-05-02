import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Client, Project, Application } from '../../types';
import { 
  getClientProfile, 
  getProjects, 
  getApplicationsByProject, 
  getRecommendedCreators,
  searchCreators
} from '../../api/services/client';
import { 
  Search, 
  Briefcase, 
  MessageSquare, 
  ChevronRight, 
  Calendar, 
  Award,
  Users,
  Zap,
  BrainCircuit,
  FileText
} from 'lucide-react';
import ClientLayout from './ClientLayout';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ClientDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [recommendedCreators, setRecommendedCreators] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadClientData() {
      setLoading(true);
      
      try {
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        
        // 開発中は一時的にユーザーチェックをスキップ
        /* 本来のコード
        if (!user) {
          navigate('/client/login');
          return;
        }
        */
        
        // 企業プロフィールを取得
        let clientData = null;
        if (user) {
          try {
            clientData = await getClientProfile(user.id);
            if (clientData) {
              console.log("企業プロフィール取得成功:", clientData);
            } else {
              console.log("企業プロフィールが存在しません。デフォルト値を使用します。");
              // プロフィールが存在しない場合はデフォルトデータを作成
              clientData = {
                id: 0,
                user_id: user.id,
                company_name: 'プロフィール未設定',
                email: user.email || '',
                created_at: new Date().toISOString(),
              };
            }
          } catch (profileError) {
            console.error("企業プロフィール取得に失敗しましたが処理を継続します:", profileError);
            // プロフィールが存在しない場合はデフォルトデータを作成
            clientData = {
              id: 0,
              user_id: user.id,
              company_name: 'プロフィール未設定',
              email: user.email || '',
              created_at: new Date().toISOString(),
            };
            
            // 必要に応じて自動的にプロフィールを作成するコード
            // ここではコメントアウトしていますが、必要に応じて有効化できます
            /*
            try {
              const { data, error } = await supabase
                .from('client_profiles')
                .insert([
                  {
                    user_id: user.id,
                    company_name: 'プロフィール未設定',
                    email: user.email || '',
                    created_at: new Date(),
                  },
                ])
                .select();
              
              if (data && data[0]) {
                clientData = data[0];
                console.log("プロフィールを自動作成しました:", clientData);
              }
            } catch (createError) {
              console.error("プロフィール作成エラー:", createError);
            }
            */
          }
        } else {
          // ユーザーがログインしていない場合のデモデータ
          clientData = {
            id: 1,
            user_id: 'demo-user',
            company_name: 'デモ企業',
            industry: 'IT',
            company_size: '10-50人',
            email: 'demo@example.com',
            created_at: new Date().toISOString(),
          };
        }
        
        // ユーザーデータが存在しない場合はプロフィール作成ページへ
        /* 本来のコード
        if (!clientData) {
          navigate('/client/profile/edit');
          return;
        }
        */
        
        setClient(clientData);
        
        // 案件情報を取得（デモデータか実際のデータ）
        let projectsData = [];
        if (user) {
          projectsData = await getProjects(user.id);
        } else {
          // デモ案件データ
          projectsData = [
            {
              id: 'demo-project-1',
              client_id: 'demo-user',
              title: 'デモ案件：コーポレートサイトリニューアル',
              description: '企業Webサイトのデザインリニューアルと実装',
              required_skills: ['UI/UXデザイン', 'HTML/CSS', 'JavaScript'],
              status: "published" as const,
              budget_min: 300000,
              budget_max: 500000,
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
            }
          ];
        }
        setProjects(projectsData as Project[]);
        
        // 全案件の応募情報を取得
        let allApplications: Application[] = [];
        if (user) {
          for (const project of projectsData) {
            const projectApplications = await getApplicationsByProject(project.id);
            allApplications = [...allApplications, ...projectApplications];
          }
        } else {
          // デモ応募データ
          allApplications = [
            {
              id: 'demo-application-1',
              project_id: 'demo-project-1',
              user_id: 'demo-creator-1',
              status: 'pending',
              message: 'デモ応募メッセージ',
              created_at: new Date().toISOString(),
              profiles: {
                id: 'demo-creator-1',
                full_name: 'デモクリエイター1',
                avatar_url: 'https://via.placeholder.com/40',
                headline: 'UIデザイナー / Webデベロッパー',
                about: '',
                created_at: new Date().toISOString(),
              }
            }
          ];
        }
        setApplications(allApplications);
        
        // おすすめクリエイターを取得
        const recommended = await getRecommendedCreators();
        setRecommendedCreators(recommended.length > 0 ? recommended : [
          {
            id: 'demo-creator-2',
            full_name: 'デモクリエイター2',
            avatar_url: 'https://via.placeholder.com/40',
            headline: 'コンテンツライター',
            about: 'Webコンテンツ制作とコピーライティングの専門家です。SEO対策も得意としています。',
            skills: ['コピーライティング', 'SEOライティング', 'コンテンツマーケティング']
          },
          {
            id: 'demo-creator-3',
            full_name: 'デモクリエイター3',
            avatar_url: 'https://via.placeholder.com/40',
            headline: 'グラフィックデザイナー',
            about: 'ブランディングとグラフィックデザインを専門としています。ロゴ、パッケージデザインが得意分野です。',
            skills: ['ロゴデザイン', 'パッケージデザイン', 'ブランディング']
          }
        ]);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadClientData();
  }, [navigate]);

  // クリエイター検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchCreators(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('検索エラー:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // キーボードイベント処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <ClientLayout>
      <div>
        {/* ウェルカムメッセージ */}
        <div className="bg-indigo-600 text-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">ようこそ、{client?.company_name}様</h1>
          <p className="mb-4">事業を動かすプロクリエイターとのマッチングをお手伝いします。</p>
          <button 
            onClick={() => navigate('/client/project/new')} 
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-md text-sm font-medium"
          >
            案件を作成する
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* メインコンテンツ */}
          <div className="w-full lg:w-8/12">
            {/* 検索ボックス */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="クリエイターを検索（名前、スキル、業界など）"
                  className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Search size={24} />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-3 top-2 bg-indigo-600 text-white px-4 py-1 rounded-lg hover:bg-indigo-500 transition"
                >
                  検索
                </button>
              </div>
              
              {/* 検索結果 */}
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">検索結果</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((project) => (
                      <div 
                        key={project.id} 
                        className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => navigate(`/client/project/${project.id}`)}
                      >
                        <div className="flex items-center">
                          <img 
                            src={project.description ? project.description : 'https://via.placeholder.com/40'} 
                            alt={project.title} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="ml-3">
                            <div className="font-medium">{project.title}</div>
                            <div className="text-sm text-gray-500">{project.description || '案件'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* アクティブな案件 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Briefcase className="mr-2 text-indigo-600" size={20} />
                  アクティブな案件
                </h2>
                <button 
                  onClick={() => navigate('/client/projects')}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                >
                  すべて表示 <ChevronRight size={16} />
                </button>
              </div>
              
              {projects.filter(p => p.status === 'published').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">アクティブな案件はありません</p>
                  <button
                    onClick={() => navigate('/client/project/new')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
                  >
                    案件を作成する
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects
                    .filter(p => p.status === 'published')
                    .slice(0, 3)
                    .map((project) => {
                      const projectApplications = applications.filter(a => a.project_id === project.id);
                      return (
                        <div 
                          key={project.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                          onClick={() => navigate(`/client/project/${project.id}`)}
                        >
                          <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {project.required_skills?.map((skill, index) => (
                              <span 
                                key={index}
                                className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <div className="flex items-center">
                              <MessageSquare size={16} className="mr-1" />
                              <span>{projectApplications.length} 件の応募</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-1" />
                              <span>期限: {project.deadline ? new Date(project.deadline).toLocaleDateString('ja-JP') : '設定なし'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            
            {/* おすすめクリエイター */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Award className="mr-2 text-indigo-600" size={20} />
                  おすすめクリエイター
                </h2>
                <button 
                  onClick={() => navigate('/client/creators')}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                >
                  すべて表示 <ChevronRight size={16} />
                </button>
              </div>
              
              {recommendedCreators.length === 0 ? (
                <p className="text-center text-gray-500 py-4">現在おすすめクリエイターはいません</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedCreators.map((profile) => (
                    <div 
                      key={profile.id} 
                      className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition cursor-pointer"
                      onClick={() => navigate(`/creator/${profile.id}`)}
                    >
                      <div className="flex items-center mb-3">
                        <img 
                          src={profile.logo_url || 'https://via.placeholder.com/40'} 
                          alt={profile.company_name} 
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                        <div>
                          <div className="font-medium">{profile.company_name}</div>
                          <div className="text-sm text-gray-500">{profile.industry || '業界未設定'}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">{profile.description || '自己紹介未設定'}</div>
                      {profile.website && (
                        <a 
                          href={profile.website} 
                          className="text-blue-500 underline text-xs" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {profile.website}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* サイドバー（右） */}
          <div className="w-full lg:w-4/12">
            {/* 企業プロフィール情報 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Users className="mr-2 text-indigo-600" size={20} />
                  企業プロフィール
                </h2>
                <button 
                  onClick={() => navigate('/client/profile')}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                >
                  詳細 <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">会社名</p>
                  <p className="font-medium">{client?.company_name || '未設定'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">業種</p>
                  <p className="font-medium">{client?.industry || '未設定'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">企業規模</p>
                  <p className="font-medium">{client?.company_size || '未設定'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">メールアドレス</p>
                  <p className="font-medium">{client?.email || '未設定'}</p>
                </div>
                {!client?.industry && !client?.company_size && (
                  <div className="bg-indigo-50 p-3 rounded-md text-sm text-indigo-600">
                    企業プロフィールを設定すると、クリエイターとのマッチング精度が向上します。
                  </div>
                )}
              </div>
            </div>
            
            {/* 最近の応募 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <MessageSquare className="mr-2 text-indigo-600" size={20} />
                最近の応募
              </h2>
              
              {applications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">まだ応募はありません</p>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application) => (
                    <div 
                      key={application.id} 
                      className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition"
                      onClick={() => navigate(`/client/application/${application.id}`)}
                    >
                      <div className="flex items-center mb-2">
                        <img 
                          src={application.profiles?.avatar_url || 'https://via.placeholder.com/30'} 
                          alt={application.profiles?.full_name} 
                          className="h-8 w-8 rounded-full object-cover mr-2"
                        />
                        <div>
                          <div className="font-medium text-sm">{application.profiles?.full_name || 'クリエイター'}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(application.created_at).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm line-clamp-1 flex-1">
                          {projects.find(p => p.id === application.project_id)?.title || '案件'}に応募
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status === 'pending' ? '検討中' :
                           application.status === 'accepted' ? '承認済' : '却下'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {applications.length > 0 && (
                <button 
                  onClick={() => navigate('/client/applications')}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center mt-4 w-full justify-center"
                >
                  すべての応募を見る <ChevronRight size={16} />
                </button>
              )}
            </div>
            
            {/* サービス概要 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">baluboの特徴</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Zap className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium">高精度AIマッチング</h3>
                    <p className="text-sm text-gray-500">AI技術で企業とクリエイターの「相性」を多角的に分析し最適化</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <BrainCircuit className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium">厳選されたプロクリエイター</h3>
                    <p className="text-sm text-gray-500">ビジネス貢献意欲と高い専門性を持つクリエイターが登録</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium">多角的なクリエイター情報</h3>
                    <p className="text-sm text-gray-500">実績だけでなく、得意分野、ビジネス経験、価値観などを可視化</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-md font-medium mb-2">ご利用料金</h3>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="flex items-baseline justify-center">
                    <span className="text-2xl font-bold text-indigo-600">10%</span>
                    <span className="ml-1 text-sm text-gray-600">/ 契約額</span>
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-1">
                    相談・マッチング提案は完全無料。<br />
                    契約成立時のみ手数料が発生します。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
