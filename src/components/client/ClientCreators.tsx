import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Search, Filter, Award, MapPin, Tag, Briefcase } from 'lucide-react';
import { searchCreators, getRecommendedCreators } from '../../api/services/client';
import ClientLayout from './ClientLayout';
import { UserProfile } from '../../types';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ClientCreators: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [highlightedCreators, setHighlightedCreators] = useState<UserProfile[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        // おすすめクリエイターを取得
        const recommended = await getRecommendedCreators();
        setHighlightedCreators(recommended);
        
        // 全てのクリエイターを取得
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        
        // profile_image_urlをavatar_urlとしてマッピング
        const mappedData = data.map(profile => ({
          ...profile,
          avatar_url: profile.profile_image_url
        }));
        
        setCreators(mappedData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, []);

  // 検索処理
  const handleSearch = async () => {
    if (!searchQuery.trim() && selectedSkills.length === 0 && selectedIndustries.length === 0) {
      return;
    }
    
    setIsSearching(true);
    try {
      let results: UserProfile[] = [];
      
      if (searchQuery.trim()) {
        results = await searchCreators(searchQuery);
      } else {
        // クエリがない場合は全てのクリエイターを取得
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        // profile_image_urlをavatar_urlとしてマッピング
        results = data.map(profile => ({
          ...profile,
          avatar_url: profile.profile_image_url
        }));
      }
      
      // スキルでフィルタリング
      if (selectedSkills.length > 0) {
        results = results.filter((creator: UserProfile) => 
          creator.skills && 
          selectedSkills.some(skill => 
            creator.skills!.some((s: string) => 
              s.toLowerCase().includes(skill.toLowerCase())
            )
          )
        );
      }
      
      // 業界でフィルタリング
      if (selectedIndustries.length > 0) {
        results = results.filter((creator: UserProfile) => 
          creator.industry && 
          selectedIndustries.includes(creator.industry)
        );
      }
      
      setCreators(results);
    } catch (error) {
      console.error('検索エラー:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  // 共通のスキル一覧
  const commonSkills = [
    'ライティング',
    'デザイン',
    'プログラミング',
    'マーケティング',
    'コピーライティング',
    'SEO',
    'UI/UX',
    '編集',
    'イラスト',
    '動画制作'
  ];

  // 業界一覧
  const industries = [
    'IT・通信',
    'メディア・広告',
    '金融・保険',
    '小売・EC',
    '製造',
    '医療・ヘルスケア',
    '教育',
    '不動産',
    '飲食・ホスピタリティ',
    'コンサルティング',
    'その他'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // クリエイターカードコンポーネント
  const CreatorCard = ({ creator }: { creator: UserProfile }) => (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => navigate(`/creator/${creator.id}`)}
    >
      {/* カバー画像またはデフォルト背景 */}
      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600">
        {creator.background_image_url && (
          <img 
            src={creator.background_image_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {/* プロフィール情報 */}
      <div className="px-4 pt-0 pb-4 relative">
        <div className="flex justify-between -mt-6 mb-3">
          <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gray-200">
            <img 
              src={creator.avatar_url || 'https://via.placeholder.com/48'} 
              alt={creator.full_name} 
              className="h-full w-full object-cover"
            />
          </div>
          {creator.is_featured && (
            <span className="bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
              <Award size={12} className="mr-1" />
              おすすめ
            </span>
          )}
        </div>
        
        <h3 className="font-bold text-lg text-gray-900 truncate">{creator.full_name}</h3>
        <p className="text-sm text-gray-600 font-medium mb-2 truncate">{creator.headline || 'クリエイター'}</p>
        
        {creator.location && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <MapPin size={12} className="mr-1" />
            <span>{creator.location}</span>
          </div>
        )}
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {creator.about || 'プロフィール情報がありません'}
        </p>
        
        {/* スキルタグ */}
        {creator.skills && creator.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {creator.skills.slice(0, 3).map((skill: string, index: number) => (
              <span 
                key={index}
                className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full flex items-center"
              >
                <Tag size={10} className="mr-1" />
                {skill}
              </span>
            ))}
            {creator.skills.length > 3 && (
              <span className="text-xs text-gray-500">+{creator.skills.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">クリエイター一覧</h1>
        </div>
        
        {/* 検索＆フィルター */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 検索ボックス */}
            <div className="flex-grow relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="クリエイターを検索（名前、スキル、自己紹介など）"
                className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-3 text-gray-400">
                <Search size={24} />
              </div>
            </div>
            
            {/* フィルターボタン */}
            <button
              className="lg:w-auto w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg flex items-center justify-center transition"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? '検索中...' : '検索する'}
            </button>
          </div>
          
          {/* フィルターオプション */}
          <div className="mt-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
                <Filter size={16} className="mr-1" />
                スキルでフィルター
              </h3>
              <div className="flex flex-wrap gap-2">
                {commonSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      selectedSkills.includes(skill)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
                <Briefcase size={16} className="mr-1" />
                業界でフィルター
              </h3>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => toggleIndustry(industry)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      selectedIndustries.includes(industry)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* おすすめクリエイター */}
        {highlightedCreators.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Award className="mr-2 text-indigo-600" size={24} />
              おすすめクリエイター
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {highlightedCreators.map((creator) => (
                <CreatorCard 
                  key={creator.id} 
                  creator={{...creator, is_featured: true}} 
                />
              ))}
            </div>
          </div>
        )}
        
        {/* クリエイター一覧 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {searchQuery || selectedSkills.length > 0 || selectedIndustries.length > 0 
              ? '検索結果' 
              : 'すべてのクリエイター'}
          </h2>
          
          {creators.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 mb-4">該当するクリエイターが見つかりませんでした。</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSkills([]);
                  setSelectedIndustries([]);
                  handleSearch();
                }}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                すべてのクリエイターを表示する
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creators
                .filter(c => !highlightedCreators.some(h => h.id === c.id))
                .map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientCreators; 