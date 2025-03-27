import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  fetchWorkWithAdmin, 
  fetchWorkTagsWithAdmin, 
  fetchWorkAnalysisWithAdmin, 
  fetchRelatedWorksWithAdmin 
} from '../lib/supabase-admin';
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
  expertise: string;
  content_style: string;
  uniqueness: string;
  interests: string;
  appeal_points: string;
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
      if (!id) {
        toast.error({ 
          title: '作品IDが指定されていません', 
          description: '正しいURLでアクセスしてください'
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // 管理者権限で作品データを取得
        const { data: workData, error: workError } = await fetchWorkWithAdmin(id);
        
        if (workError) {
          console.error('作品詳細取得エラー:', workError);
          toast.error({ 
            title: '作品の読み込みに失敗しました', 
            description: '作品が見つからないか、アクセスできません' 
          });
          setLoading(false);
          return;
        }
        
        if (!workData) {
          console.error('作品データが見つかりません:', id);
          toast.error({ 
            title: '作品が見つかりません', 
            description: '指定された作品は存在しないか、削除された可能性があります' 
          });
          setLoading(false);
          return;
        }
        
        // 管理者権限でタグデータを取得
        const { data: tagData, error: tagError } = await fetchWorkTagsWithAdmin(id);
        
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
        
        // 管理者権限でAI分析結果を取得
        const { data: analysisData, error: analysisError } = await fetchWorkAnalysisWithAdmin(id);
        
        if (analysisError) {
          console.error('分析結果取得エラー:', analysisError);
          // 分析結果がない場合もあるので、エラーは表示せず処理を続行
        } else if (analysisData) {
          setAnalysisResult(analysisData.result);
        }
        
        // 管理者権限で関連作品を取得
        if (workWithTags.user_id) {
          const { data: relatedData, error: relatedError } = await fetchRelatedWorksWithAdmin(
            workWithTags.user_id, 
            id
          );
          
          if (relatedError) {
            console.error('関連作品取得エラー:', relatedError);
          } else if (relatedData) {
            setRelatedWorks(relatedData);
          }
        }
        
      } catch (error) {
        console.error('作品詳細取得エラー:', error);
        toast.error({ title: '作品の読み込みに失敗しました', description: '作品が見つからないか、アクセスできません' });
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
                    <p className="text-gray-700 mb-4">{analysisResult.expertise}</p>
                  </>
                )}
              </div>
              
              {/* コンテンツスタイル */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-purple-600" />
                  コンテンツスタイル
                </h3>
                
                {analysisResult.content_style && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.content_style}</p>
                  </>
                )}
              </div>
              
              {/* 作品のユニークさ */}
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-teal-600" />
                  作品のユニークさ
                </h3>
                
                {analysisResult.uniqueness && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.uniqueness}</p>
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
