import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  fetchWorkWithAdmin, 
  fetchWorkTagsWithAdmin, 
  fetchWorkAnalysisWithAdmin, 
  fetchRelatedWorksWithAdmin,
  deleteWorkWithAdmin
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
  BookOpen,
  Trash2
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
  originality: string;
  quality: string;
  engagement: string;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
  
  // 作品削除処理
  const handleDeleteWork = async () => {
    if (!id) return;
    
    try {
      setDeleting(true);
      
      const { error } = await deleteWorkWithAdmin(id);
      
      if (error) {
        console.error('作品削除エラー:', error);
        toast.error({ 
          title: '作品の削除に失敗しました', 
          description: '時間をおいて再度お試しください' 
        });
        setDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }
      
      toast.success({ 
        title: '作品を削除しました', 
        description: '作品が正常に削除されました' 
      });
      
      // マイページに遷移
      navigate('/mypage');
    } catch (err) {
      console.error('作品削除中の予期せぬエラー:', err);
      toast.error({ 
        title: '作品の削除に失敗しました', 
        description: '時間をおいて再度お試しください' 
      });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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
        
        {isOwner && (
          <Button 
            onClick={() => setShowDeleteConfirm(true)} 
            className="float-right mr-4"
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            削除
          </Button>
        )}
        
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-md p-6 w-96 max-w-[90%]">
              <h2 className="text-xl font-bold text-center mb-6">本当に削除しますか？</h2>
              <div className="flex justify-between">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="w-[48%]"
                  disabled={deleting}
                >
                  キャンセル
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteWork} 
                  disabled={deleting}
                  className="w-[48%]"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      削除中...
                    </>
                  ) : "削除"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 作品情報 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {work.thumbnail_url && (
          <div className="w-full bg-gray-100 flex justify-center">
            <img 
              src={work.thumbnail_url} 
              alt={work.title} 
              className="max-w-full max-h-[600px] object-contain"
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
              {/* 創造性と独自性 */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-indigo-600" />
                  創造性と独自性
                </h3>
                
                {analysisResult.originality && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.originality}</p>
                  </>
                )}
              </div>
              
              {/* 専門性とスキル */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-purple-600" />
                  専門性とスキル
                </h3>
                
                {analysisResult.quality && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.quality}</p>
                  </>
                )}
              </div>
              
              {/* 影響力と共感 */}
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-teal-600" />
                  影響力と共感
                </h3>
                
                {analysisResult.engagement && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.engagement}</p>
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
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {relatedWork.description}
                      </p>
                    )}
                    {/* 関連作品のタグを表示 */}
                    <div className="flex flex-wrap mt-2">
                      {relatedWork.tags && relatedWork.tags.length > 0 && 
                        relatedWork.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2 py-1 mr-1 mb-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))
                      }
                    </div>
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
