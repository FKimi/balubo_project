import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
  fetchWorkWithAdmin,
  fetchWorkTagsWithAdmin,
  fetchWorkAnalysisWithAdmin,
  fetchRelatedWorksWithAdmin,
  deleteWorkWithAdmin
} from '../../../lib/supabase-admin';
import { useToast } from '../../../lib/hooks/useToast';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
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
  Trash2,
  MessageSquare,
  Send,
  Pencil,
  Save,
  BookMarked,
  Heart
} from 'lucide-react';
import { Work } from '../../../types';
import { formatYearMonth } from '../../../app/lib/utils/dateFormat';

// AI分析結果の型定義
interface AnalysisResult {
  originality: string;
  quality: string;
  engagement: string;
}

// コメントの型定義
interface Comment {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  text: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    profile_image_url?: string;
  };
}

// ユーザープロフィールの型定義
interface UserProfile {
  id: string;
  full_name: string;
  profile_image_url?: string;
  headline?: string; // 見出し・タイトル
  [key: string]: unknown; // その他のプロフィールフィールド
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
  
  // コメント関連の状態
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  
  // 制作メモ関連の状態
  const [memoInput, setMemoInput] = useState('');
  const [editingMemo, setEditingMemo] = useState(false);
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);
  
  // コメントリストへの参照
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  // 作者情報のstate
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  // いいね数を管理するstate
  const [likeCount, setLikeCount] = useState<number>(0);

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
        const tags = tagData?.map((item: { tags: { id: string; name: string }[] }) => {
          if (Array.isArray(item.tags) && item.tags[0]?.name) {
            return item.tags[0].name;
          }
          return null;
        }).filter((tag: string | null) => tag !== null) || [];
        
        const workWithTags = {
          ...workData,
          tags
        };
        
        setWork(workWithTags);
        
        // 現在のユーザーが作品の所有者かどうかを確認
        const { data: { user } } = await supabase.auth.getUser();
        setIsOwner(user?.id === workWithTags.user_id);
        
        // 作者のプロフィール情報を取得
        if (workWithTags.user_id) {
          const { data: authorData, error: authorError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', workWithTags.user_id)
            .single();
            
          if (authorError) {
            console.error('作者プロフィール取得エラー:', authorError);
          } else if (authorData) {
            setAuthorProfile(authorData);
          }
        }
        
        // いいね数を取得
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('*')
          .eq('content_type', 'work')
          .eq('content_id', id);
        
        if (likesError) {
          console.error('いいね数取得エラー:', likesError);
          // いいね数の取得エラーは致命的ではないので処理続行
        } else {
          setLikeCount(likesData?.length || 0);
        }
        
        // 管理者権限でAI分析結果を取得
        const { data: analysisData, error: analysisError } = await fetchWorkAnalysisWithAdmin(id);
        
        if (analysisError) {
          console.error('分析結果取得エラー:', analysisError);
          // 分析結果がない場合もあるので、エラーは表示せず処理を続行
        } else if (analysisData) {
          setAnalysisResult(analysisData.result);
        }
        
        // 作品のmemoフィールドがあれば、それをmemoInputに設定
        if (workWithTags.memo) {
          setMemoInput(workWithTags.memo);
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
    // 新しい「YYYY年M月」形式で表示
    return formatYearMonth(dateString);
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
      navigate('/portfolio');
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
  
  // コメント関連の関数
  const fetchComments = useCallback(async () => {
    if (!id) return;
    
    console.log('fetchComments開始:', id);
    setCommentsLoading(true);
    try {
      // まずコメントデータを取得
      const { data: commentData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_type', 'work')
        .eq('content_id', id)
        .order('created_at', { ascending: true });
      
      console.log('コメントデータ取得結果:', commentData, error);
      
      if (error) {
        console.error('コメント取得SQLエラー:', error);
        throw error;
      }
      
      if (!commentData || commentData.length === 0) {
        console.log('コメントがありません');
        setComments([]);
        setCommentsLoading(false);
        return;
      }
      
      // コメントに紐づくユーザーIDを抽出
      const userIds = Array.from(new Set(commentData.map(comment => comment.user_id)));
      console.log('ユーザーID一覧:', userIds);
      
      // ユーザープロフィール情報を取得
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      console.log('プロフィール情報取得結果:', profilesData, profilesError);
      
      if (profilesError) {
        console.error('ユーザープロフィール取得エラー:', profilesError);
        // エラーがあってもコメントは表示する
      }
      
      // ユーザー情報をマッピング
      const usersMap: Record<string, UserProfile> = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, UserProfile>);
      
      // コメントとユーザー情報を結合
      const commentsWithUsers = commentData.map((comment) => ({
        ...comment,
        user: usersMap[comment.user_id]
      }));
      
      console.log('最終的なコメントデータ:', commentsWithUsers);
      setComments(commentsWithUsers);
    } catch (error) {
      console.error('コメント取得エラー:', error);
      toast.error({ 
        title: 'コメントの読み込みに失敗しました', 
        description: '時間をおいて再度お試しください' 
      });
      setComments([]); // エラー時は空配列をセット
    } finally {
      setCommentsLoading(false);
    }
  }, [id, toast]);
  
  // コメントを投稿する関数
  const postComment = async () => {
    if (!id || !commentInput.trim()) return;
    
    console.log('コメント投稿開始:', commentInput.trim());
    setCommentLoading(true);
    setCommentError(null);
    
    // コメント内容を変数に保存
    const commentText = commentInput.trim();
    
    try {
      // ユーザー認証状態の確認
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('認証状態:', user, authError);
      
      if (authError) {
        console.error('認証エラー:', authError);
        setCommentError('ログイン状態を確認できません。再ログインしてください。');
        setCommentLoading(false);
        return;
      }
      
      if (!user) {
        setCommentError('コメントを投稿するにはログインが必要です');
        setCommentLoading(false);
        return;
      }
      
      // 現在のユーザーの情報を取得
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      console.log('ユーザープロフィール:', userProfile, profileError);
      
      if (profileError) {
        console.error('ユーザープロフィール取得エラー:', profileError);
        // プロフィールが取得できなくてもコメント投稿は続行
      }

      // 一時的なコメント
      const tempId = `temp-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const tempComment = {
        id: tempId,
        user_id: user.id,
        content_id: id || '',
        content_type: 'work',
        text: commentText,
        created_at: timestamp,
        user: userProfile
      };
      
      // 一時的なコメントをUIに追加（楽観的UI更新）
      setComments(prevComments => {
        const newComments = [...prevComments, tempComment];
        return newComments;
      });
      
      // 作品のコメント数をUIで更新（楽観的更新）
      if (work) {
        setWork({
          ...work,
          comment_count: (work.comment_count || 0) + 1
        });
      }
      
      // コメント入力をクリア
      setCommentInput('');
      
      // 実際のコメント投稿処理
      const insertData = {
        user_id: user.id,
        content_id: id,
        content_type: 'work',
        text: commentText
      };
      
      const { error: insertError } = await supabase
        .from('comments')
        .insert(insertData)
        .select();
      
      if (insertError) {
        console.error('コメント挿入エラー:', insertError);
        
        // エラーの場合、一時的なコメントを削除
        setComments(prevComments => prevComments.filter(c => c.id !== tempId));
        
        // 作品のコメント数も元に戻す
        if (work) {
          setWork({
            ...work,
            comment_count: Math.max(0, (work.comment_count || 0) - 1)
          });
        }
        
        // RLSポリシーエラーの場合（アクセス権限のエラー）
        if (insertError.code === '42501') {
          setCommentError('権限設定によりコメントを投稿できません');
          toast.error({ 
            title: 'コメントの投稿に失敗しました', 
            description: '権限設定を確認してください' 
          });
        } else {
          setCommentError('コメントの投稿に失敗しました');
          toast.error({ 
            title: 'コメントの投稿に失敗しました', 
            description: 'サーバーエラーが発生しました' 
          });
        }
      } else {
        // 成功した場合の処理
        // 実際のデータベースからコメントを再取得
        fetchComments();
        
        // トーストメッセージを表示
        const successMessage = {
          title: 'コメントを投稿しました',
          description: '他のユーザーにも表示されます'
        };
        toast.success(successMessage);
      }
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      setCommentError('予期せぬエラーが発生しました');
      toast.error({ 
        title: 'コメントの投稿に失敗しました', 
        description: '時間をおいて再度お試しください' 
      });
    } finally {
      setCommentLoading(false);
    }
  };
  
  // 初期表示時にコメントを取得
  useEffect(() => {
    if (id && !loading) {
      fetchComments();
    }
  }, [id, loading, fetchComments]);
  
  // コメントリストの末尾へスクロールする関数
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 新しいコメントが追加されたらスクロール
  useEffect(() => {
    if (comments.length > 0 && !commentsLoading) {
      scrollToBottom();
    }
  }, [comments.length, commentsLoading]);
  
  // 制作メモを保存する関数
  const saveWorkMemo = async () => {
    if (!id || !memoInput.trim()) return;
    
    setMemoLoading(true);
    setMemoError(null);
    
    try {
      // ユーザー認証状態の確認
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('認証エラー:', authError);
        setMemoError('ログイン状態を確認できません。再ログインしてください。');
        setMemoLoading(false);
        return;
      }
      
      if (!user) {
        setMemoError('メモを保存するにはログインが必要です');
        setMemoLoading(false);
        return;
      }
      
      // 作品のmemoカラムを更新
      const { error } = await supabase
        .from('works')
        .update({
          memo: memoInput.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('メモ更新エラー:', error);
        setMemoError('メモの更新に失敗しました');
        setMemoLoading(false);
        return;
      }
      
      // ローカルのwork状態も更新
      setWork(prev => prev ? { ...prev, memo: memoInput.trim() } : null);
      
      toast.success({ 
        title: 'メモを保存しました', 
        description: '制作メモが更新されました' 
      });
      
      // 編集モードを終了
      setEditingMemo(false);
    } catch (error) {
      console.error('メモ保存エラー:', error);
      setMemoError('予期せぬエラーが発生しました');
      toast.error({ 
        title: 'メモの保存に失敗しました', 
        description: '時間をおいて再度お試しください' 
      });
    } finally {
      setMemoLoading(false);
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
          
          {/* 作者情報 */}
          {authorProfile && (
            <div 
              className="flex items-center mb-6 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors w-fit"
              onClick={() => navigate(`/profile/${work.user_id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mr-3">
                {authorProfile.profile_image_url ? (
                  <img 
                    src={authorProfile.profile_image_url} 
                    alt={authorProfile.full_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                  {authorProfile.full_name}
                </div>
                {authorProfile.headline && (
                  <div className="text-sm text-gray-500">{authorProfile.headline}</div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center text-gray-600 mb-4">
            <div className="flex items-center mr-6 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              {/* 公開月（published_date）があればそれを優先表示。なければ作成日 */}
              <span>{formatDate(work.published_date || work.created_at)}</span>
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
              {work.tags.map((tag: string, index: number) => (
                <Badge key={index} className="mr-2 mb-2">{tag}</Badge>
              ))}
            </div>
          )}
          
          {work.description && (
            <div className="prose max-w-none mt-6">
              <p className="text-gray-700 whitespace-pre-line">{work.description}</p>
            </div>
          )}
          
          {/* コメント数・いいね数表示 */}
          <div className="flex items-center mt-6 text-gray-500">
            <div className="flex items-center mr-4">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span>{comments.length || work.comment_count || 0} コメント</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              <span>{likeCount} いいね</span>
            </div>
          </div>
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
              {/* 創造性 */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-indigo-600" />
                  創造性
                </h3>
                
                {analysisResult.originality && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.originality}</p>
                  </>
                )}
              </div>
              
              {/* 専門性 */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-purple-600" />
                  専門性
                </h3>
                
                {analysisResult.quality && (
                  <>
                    <p className="text-gray-700 mb-4">{analysisResult.quality}</p>
                  </>
                )}
              </div>
              
              {/* 影響力 */}
              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-teal-600" />
                  影響力
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
      
      {/* 制作メモ */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <BookMarked className="w-6 h-6 mr-2 text-indigo-600" />
            制作メモ
          </h2>
          
          {isOwner ? (
            <div className="mb-6">
              {editingMemo ? (
                <div className="flex flex-col">
                  <textarea
                    className="w-full border rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none mb-2"
                    rows={5}
                    placeholder="この作品に関する制作背景や苦労した点、アイデアの元になったことなどを記録しておきましょう..."
                    value={memoInput}
                    onChange={(e) => setMemoInput(e.target.value)}
                    disabled={memoLoading}
                  />
                  {memoError && (
                    <p className="text-red-500 text-sm mt-1 mb-2">{memoError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="secondary"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setEditingMemo(false);
                        setMemoInput(work?.memo || '');
                      }} 
                      disabled={memoLoading}
                    >
                      <Pencil className="w-4 h-4" />
                      キャンセル
                    </Button>
                    <Button 
                      onClick={saveWorkMemo} 
                      disabled={memoLoading || !memoInput.trim()}
                      className="flex items-center gap-2"
                    >
                      {memoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {memoLoading ? '保存中...' : '保存する'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {work?.memo ? (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 whitespace-pre-line">{work.memo}</p>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="secondary"
                          className="flex items-center gap-2"
                          onClick={() => setEditingMemo(true)}
                        >
                          <Pencil className="w-4 h-4" />
                          編集する
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-4">まだ制作メモがありません。作品に関する制作背景や工夫した点を記録しておきましょう。</p>
                      <Button 
                        onClick={() => setEditingMemo(true)}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        メモを追加する
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {work?.memo ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{work.memo}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">この作品には制作メモがありません。</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* コメントセクション */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" />
            コメント {comments.length > 0 && <span className="text-sm ml-2 font-normal text-gray-500">({comments.length})</span>}
          </h2>
          
          {/* コメント入力フォーム */}
          <div className="mb-8">
            <div className="flex flex-col">
              <textarea
                className="w-full border rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none"
                rows={3}
                placeholder="コメントを入力してください..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enterキーが押されたとき（Shiftキーが押されていなければ）
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // デフォルトの改行を防止
                    if (commentInput.trim() && !commentLoading) {
                      postComment();
                    }
                  }
                }}
                disabled={commentLoading}
              />
              {commentError && (
                <p className="text-red-500 text-sm mt-1">{commentError}</p>
              )}
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={postComment} 
                  disabled={commentLoading || !commentInput.trim()}
                  className="flex items-center gap-2"
                >
                  {commentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {commentLoading ? 'コメント投稿中...' : 'コメントを投稿'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* コメントリスト */}
          <div className="space-y-6">
            {commentsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
                <span className="text-gray-600">コメントを読み込み中...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                まだコメントはありません。最初のコメントを投稿しましょう！
              </div>
            ) : (
              <>
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 pb-4 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <div 
                        className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/profile/${comment.user_id}`)}
                      >
                        {comment.user?.profile_image_url ? (
                          <img 
                            src={comment.user.profile_image_url} 
                            alt={comment.user.full_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h3 
                          className="font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer"
                          onClick={() => navigate(`/profile/${comment.user_id}`)}
                        >
                          {comment.user?.full_name || 'ユーザー'}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={commentsEndRef} /> {/* コメントリストの最下部への参照 */}
          </div>
        </div>
      </div>
      
      {/* 関連作品 */}
      {relatedWorks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">関連作品</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedWorks.map((relatedWork: Work) => (
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
                        relatedWork.tags.map((tag: string, idx: number) => (
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
// temporary comment
