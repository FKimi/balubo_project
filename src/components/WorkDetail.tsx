import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/hooks/useToast';
import { Button } from './Button';
import { Badge } from './Badge';
import { 
  ArrowLeft, 
  Edit, 
  ExternalLink, 
  Calendar, 
  Tag,
  Loader2,
  BrainCircuit,
  Fingerprint,
  BookOpen
} from 'lucide-react';

// 作品データの型定義
interface Work {
  id: string;
  title: string;
  description?: string;
  source_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  views?: number;
  tags?: string[];
}

// AI分析結果の型定義
interface AnalysisResult {
  expertise: {
    categories: Array<{ name: string; score: number }>;
    summary: string;
  };
  content_style: {
    features: Array<{ name: string; score: number }>;
    summary: string;
  };
  interests: {
    tags: string[];
    summary: string;
  };
  appeal_points?: {
    points: Array<{ title: string; description: string }>;
    summary: string;
  };
}

const WorkDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [work, setWork] = useState<Work | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<Work[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchWorkDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // 作品データの取得
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select('*')
          .eq('id', id)
          .single();
        
        if (workError) {
          throw workError;
        }
        
        // タグの取得
        const { data: tagData, error: tagError } = await supabase
          .from('work_tags')
          .select('tag_id, tags(id, name)')  // tagsテーブルとJOINしてnameを取得
          .eq('work_id', id);
        
        if (tagError) {
          console.error('タグ取得エラー:', tagError);
          // タグエラーは致命的ではないので処理を続行
        }
        
        // 作品データにタグを追加
        const tags = tagData?.map(item => {
          // tagsは配列ではなくオブジェクトとして返される
          if (item.tags && typeof item.tags === 'object' && 'name' in item.tags) {
            return item.tags.name;
          }
          return null;
        }).filter(tag => tag !== null) || [];
        
        const workWithTags = {
          ...workData,
          tags
        };
        
        setWork(workWithTags);
        
        // 現在のユーザーが作品の所有者かどうかを確認
        const { data: { user } } = await supabase.auth.getUser();
        setIsOwner(user?.id === workWithTags.user_id);
        
        // AI分析結果の取得
        const { data: analysisData, error: analysisError } = await supabase
          .from('work_analysis')
          .select('*')
          .eq('work_id', id)
          .single();
        
        if (analysisError) {
          console.error('分析結果取得エラー:', analysisError);
          // 分析結果がない場合もあるので、エラーは表示せず処理を続行
        } else if (analysisData) {
          setAnalysisResult(analysisData.result);
        }
        
        // 関連作品の取得（同じユーザーの他の作品）
        if (workWithTags.user_id) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('works')
            .select('*')
            .eq('user_id', workWithTags.user_id)
            .neq('id', id)
            .limit(3);
          
          if (relatedError) {
            console.error('関連作品取得エラー:', relatedError);
          } else if (relatedData) {
            setRelatedWorks(relatedData);
          }
        }
        
      } catch (error) {
        console.error('作品詳細取得エラー:', error);
        toast.error({ title: '作品の読み込みに失敗しました' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkDetails();
  }, [id, toast]);
  
  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">作品を読み込んでいます...</p>
      </div>
    );
  }
  
  if (!work) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-600 mb-4">作品が見つかりませんでした</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <Button variant="text" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
        
        {isOwner && (
          <Button 
            onClick={() => navigate(`/works/edit/${id}`)} 
            className="float-right"
          >
            <Edit className="w-4 h-4 mr-2" />
            編集
          </Button>
        )}
      </div>
      
      {/* 作品情報 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {work.thumbnail_url && (
          <div className="w-full h-64 bg-gray-100">
            <img 
              src={work.thumbnail_url} 
              alt={work.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{work.title}</h1>
          
          <div className="flex flex-wrap items-center text-gray-600 mb-4">
            <div className="flex items-center mr-6 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(work.created_at)}</span>
            </div>
            
            {work.source_url && (
              <a 
                href={work.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-indigo-600 hover:text-indigo-800 mr-6 mb-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                <span>元記事を見る</span>
              </a>
            )}
          </div>
          
          {work.tags && work.tags.length > 0 && (
            <div className="flex items-center flex-wrap mb-6">
              <Tag className="w-4 h-4 mr-2 text-gray-600" />
              {work.tags.map((tag, index) => (
                <Badge key={index} className="mr-2 mb-2">{tag}</Badge>
              ))}
            </div>
          )}
          
          {work.description && (
            <div className="prose max-w-none mt-6">
              <p className="text-gray-700 whitespace-pre-line">{work.description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* AI分析結果 */}
      {analysisResult && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BrainCircuit className="w-6 h-6 mr-2 text-indigo-600" />
              AI分析結果
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 専門性分析 */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-indigo-600" />
                  専門性分析
                </h3>
                
                {analysisResult.expertise && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.expertise.summary}</p>
                    <div className="space-y-2">
                      {analysisResult.expertise.categories.map((category, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm text-gray-700 w-1/3">{category.name}</span>
                          <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-indigo-600 h-2.5 rounded-full" 
                              style={{ width: `${category.score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* 文章スタイル分析 */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                  文章スタイル分析
                </h3>
                
                {analysisResult.content_style && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.content_style.summary}</p>
                    <div className="space-y-2">
                      {analysisResult.content_style.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm text-gray-700 w-1/3">{feature.name}</span>
                          <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-purple-600 h-2.5 rounded-full" 
                              style={{ width: `${feature.score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* 興味・関心分析 */}
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-teal-600" />
                  興味・関心分析
                </h3>
                
                {analysisResult.interests && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.interests.summary}</p>
                    <div className="flex flex-wrap">
                      {analysisResult.interests.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          className="mr-2 mb-2 bg-teal-100 text-teal-800 border-teal-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 関連作品 */}
      {relatedWorks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">関連作品</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedWorks.map((relatedWork) => (
                <div 
                  key={relatedWork.id} 
                  className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/works/${relatedWork.id}`)}
                >
                  {relatedWork.thumbnail_url && (
                    <div className="w-full h-40 bg-gray-200">
                      <img 
                        src={relatedWork.thumbnail_url} 
                        alt={relatedWork.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {relatedWork.title}
                    </h3>
                    {relatedWork.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {relatedWork.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkDetail;
