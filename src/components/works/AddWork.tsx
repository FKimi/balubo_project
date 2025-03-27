import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { analyzeContent } from '../../lib/gemini';
import { extractDataFromUrl } from '../../lib/gemini-url-service';
import { extractDataFromUrlWithMetadata } from '../../lib/url-metadata';
import { createTag } from '../../api/tags'; 
import { ArrowLeft, FileText, ImageIcon, Loader2, BrainCircuit, X, Camera, Trash2 } from 'lucide-react';

// ContentInput型定義をインポートせずに直接定義
interface ContentInput {
  title: string;
  description?: string | null;
  url?: string;
  imageUrl?: string;
}

// AI分析結果の型定義
interface AnalysisResult {
  originality: {
    features: Array<{ name: string; score: number }>;
    summary: string;
  };
  quality: {
    categories: Array<{ name: string; score: number }>;
    summary: string;
  };
  engagement: {
    points: Array<{ title: string; description: string }>;
    summary: string;
  };
  tags: string[];
}

interface WorkData {
  title: string;
  description: string;
  source_url: string;
  thumbnail_url: string;
  design_type: string;
  design_url: string;
  behance_url: string;
  dribbble_url: string;
  work_type: string; 
  is_public: boolean;
  user_id: string;
  tags?: string[]; 
  roles?: string[]; 
}

export const AddWork = () => {
  const navigate = useNavigate();
  const { id: workId } = useParams<{ id: string }>();
  const isEditMode = !!workId;
  
  // URLパラメータからタイプを取得
  const location = window.location;
  const queryParams = new URLSearchParams(location.search);
  const typeParam = queryParams.get('type');
  
  const [selectedType, setSelectedType] = useState(typeParam === 'design' ? 'design' : 'writing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const urlFetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    source_url: '',
    thumbnail_url: '',
    tags: [] as string[],
    work_type: typeParam === 'design' ? 'design' : 'writing',
    design_type: '',
    design_url: '',
    behance_url: '',
    dribbble_url: '',
    is_public: true,
    roles: [] as string[],
    image_file: null as File | null,
    image_preview: '' as string
  });

  // ファイル入力用のref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 編集モードの場合、既存の作品データを読み込む
  useEffect(() => {
    const fetchWorkData = async () => {
      if (!workId) return;
      
      try {
        setLoading(true);
        
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select('*')
          .eq('id', workId)
          .single();
        
        if (workError) throw workError;
        if (!workData) throw new Error('作品が見つかりませんでした');
        
        const { data: workTags, error: tagsError } = await supabase
          .from('work_tags')
          .select('tags(name)')
          .eq('work_id', workId);
        
        if (tagsError) throw tagsError;
        
        interface WorkTag {
          tags?: {
            name?: string;
          } | {
            name?: string;
          }[] | null;
        }
        
        const tags = workTags
          ? (workTags as WorkTag[])
              .filter((wt: WorkTag) => wt.tags)
              .map((wt: WorkTag) => {
                if (wt.tags && typeof wt.tags === 'object' && !Array.isArray(wt.tags) && 'name' in wt.tags) {
                  return wt.tags.name;
                }
                else if (Array.isArray(wt.tags) && wt.tags.length > 0 && 'name' in wt.tags[0]) {
                  return wt.tags[0].name;
                }
                return null;
              })
              .filter((tag): tag is string => tag !== null)
          : [];
        
        setForm({
          title: workData.title || '',
          description: workData.description || '',
          source_url: workData.source_url || '',
          thumbnail_url: workData.thumbnail_url || '',
          tags: tags,
          work_type: workData.work_type || 'writing',
          design_type: workData.design_type || '',
          design_url: workData.design_url || '',
          behance_url: workData.behance_url || '',
          dribbble_url: workData.dribbble_url || '',
          is_public: workData.is_public !== false,
          roles: workData.roles || [],
          image_file: null,
          image_preview: workData.thumbnail_url || ''
        });
        
        setSelectedType(workData.work_type || 'writing');
        setInitialDataLoaded(true);
      } catch (error) {
        console.error('作品データの読み込みに失敗しました:', error);
        setError('作品データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkData();
  }, [workId]);

  const fetchUrlData = async (url: string) => {
    if (!url || !url.trim() || !url.startsWith('http')) {
      return;
    }

    if (isEditMode && initialDataLoaded) {
      return;
    }
    
    try {
      setFetchingUrl(true);
      setError(null);
      
      console.log("URLからデータを取得します:", url);
      
      const metadata = await extractDataFromUrlWithMetadata(url);
      
      console.log("取得したメタデータ:", metadata);
      
      if (metadata) {
        setForm(prev => ({
          ...prev,
          title: metadata.title || prev.title,
          description: metadata.description || prev.description,
          thumbnail_url: metadata.imageUrl || prev.thumbnail_url,
          source_url: url
        }));
      } else {
        const fallbackData = await extractDataFromUrl(url);
        
        if (fallbackData) {
          setForm(prev => ({
            ...prev,
            title: fallbackData.title || prev.title,
            description: fallbackData.description || prev.description,
            source_url: url
          }));
        }
      }
    } catch (error) {
      console.error("URL取得エラー:", error instanceof Error ? error.message : String(error));
      setError("URLからの情報取得に失敗しました。URLを確認してください。");
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setForm(prev => ({ ...prev, source_url: url }));
    
    if (urlFetchTimerRef.current) {
      clearTimeout(urlFetchTimerRef.current);
    }
    
    if (url && url.trim() && url.startsWith('http')) {
      urlFetchTimerRef.current = setTimeout(() => {
        fetchUrlData(url);
      }, 1000);
    }
  };

  const handleAiAnalysis = async () => {
    // 分析対象がない場合はエラー
    if (!form.title && !form.description && !form.image_preview && !form.thumbnail_url) {
      setError('タイトル、説明文、または画像のいずれかが必要です');
      return;
    }
    
    try {
      setAnalyzingContent(true);
      
      // 分析対象のコンテンツを準備
      const content: ContentInput = {
        title: form.title || '無題の作品', // タイトルがない場合はデフォルト値を設定
        description: form.description || '', // 説明文がない場合は空文字
        url: form.source_url || '',
        imageUrl: form.image_preview || form.thumbnail_url // 画像URLを追加
      };
      
      console.log('AI分析を開始します:', content);
      
      // Gemini APIを使用して分析
      const result = await analyzeContent(content);
      console.log('AI分析結果:', result);

      // 分析結果を設定
      setAnalysisResult(result);
      
      // 生成されたタグを設定
      if (result.tags) {
        const newTags = result.tags;
        
        setGeneratedTags(newTags);
        setForm(prev => ({ ...prev, tags: [...new Set([...prev.tags, ...newTags])] }));
        
        // 画像のみで分析した場合は、分析結果からタイトルを設定
        if (!form.title && result.originality && result.originality.features && result.originality.features.length > 0) {
          const topFeature = result.originality.features[0].name;
          setForm(prev => ({ 
            ...prev, 
            title: `${topFeature}の作品` 
          }));
        }
      }
    } catch (error) {
      console.error('AI分析エラー:', error);
      
      let errorMessage = 'AI分析中にエラーが発生しました。しばらく待ってから再試行してください。';
      
      // エラーの種類に応じたメッセージ
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "API keyが設定されていないか無効です。環境変数を確認してください。";
        } else if (error.message.includes("quota")) {
          errorMessage = "API使用量の上限に達しました。後でもう一度お試しください。";
        }
      }
      
      setError(errorMessage);
    } finally {
      setAnalyzingContent(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロードできます');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    
    setForm(prev => ({
      ...prev,
      image_file: file,
      image_preview: previewUrl,
      thumbnail_url: selectedType === 'design' ? previewUrl : prev.thumbnail_url
    }));
    
    setError(null);
  };
  
  const handleClearImage = () => {
    if (form.image_preview) {
      URL.revokeObjectURL(form.image_preview);
    }
    
    setForm(prev => ({
      ...prev,
      image_file: null,
      image_preview: ''
    }));
  };
  
  const uploadImage = async (): Promise<string | null> => {
    if (!form.image_file) {
      console.error('画像ファイルがありません');
      return null;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('認証が必要です');
      }
      
      const userId = session.user.id;
      
      const fileExt = form.image_file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('works')
        .upload(filePath, form.image_file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('画像アップロードエラー:', JSON.stringify(uploadError, null, 2));
        
        if (uploadError.message && uploadError.message.includes('Bucket not found')) {
          console.log('バケットが見つかりません。作成を試みます...');
          
          const { error: createBucketError } = await supabase.storage.createBucket('works', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 5 * 1024 * 1024 
          });
          
          if (createBucketError) {
            console.error('バケット作成エラー:', JSON.stringify(createBucketError, null, 2));
            throw new Error('ストレージバケットの作成に失敗しました');
          }
          
          const { error: retryError } = await supabase.storage
            .from('works')
            .upload(filePath, form.image_file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (retryError) {
            console.error('再アップロードエラー:', JSON.stringify(retryError, null, 2));
            throw retryError;
          }
        } else {
          throw uploadError;
        }
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('works')
        .getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('公開URL取得エラー:', publicUrlData);
        throw new Error('画像の公開URLの取得に失敗しました');
      }
      
      console.log('画像アップロード成功:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('画像アップロードエラー:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
      setError(error instanceof Error ? error.message : '画像のアップロードに失敗しました');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('送信するフォームデータ:', form);
      console.log('役割:', form.roles);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ログインが必要です');
      }

      if (selectedType === 'design' && !form.image_file && !form.thumbnail_url) {
        setError('デザイン・写真作品には画像のアップロードが必要です');
        setLoading(false);
        return;
      }
      
      let uploadedImageUrl = null;
      if (form.image_file) {
        uploadedImageUrl = await uploadImage();
        if (!uploadedImageUrl) {
          setError('画像のアップロードに失敗しました');
          setLoading(false);
          return;
        }
      }
      
      const workData: WorkData = {
        title: form.title,
        description: form.description,
        source_url: form.source_url,
        thumbnail_url: uploadedImageUrl || form.thumbnail_url,
        design_type: selectedType === 'design' ? form.design_type : '',
        design_url: selectedType === 'design' ? form.design_url : '',
        behance_url: selectedType === 'design' ? form.behance_url : '',
        dribbble_url: selectedType === 'design' ? form.dribbble_url : '',
        work_type: form.work_type,
        is_public: form.is_public,
        user_id: user.id,
        tags: form.tags,
        roles: form.roles
      };
      
      const { tags, ...workDataWithoutTags } = workData;
      
      let savedWorkId: string;
      
      if (isEditMode) {
        const { data: updateResult, error: updateError } = await supabase
          .from('works')
          .update(workDataWithoutTags)
          .eq('id', workId)
          .select();
        
        if (updateError) throw updateError;
        
        if (!updateResult || updateResult.length === 0) {
          throw new Error('作品の更新に失敗しました');
        }
        
        savedWorkId = workId;
        
        const { error: deleteTagsError } = await supabase
          .from('work_tags')
          .delete()
          .eq('work_id', workId);
        
        if (deleteTagsError) throw deleteTagsError;
      } else {
        const { data: insertResult, error: insertError } = await supabase
          .from('works')
          .insert([workDataWithoutTags])
          .select();
        
        if (insertError) throw insertError;
        
        if (!insertResult || insertResult.length === 0) {
          throw new Error('作品の登録に失敗しました');
        }
        
        savedWorkId = insertResult[0].id;
      }
      
      if (form.tags && form.tags.length > 0) {
        for (const tagName of form.tags) {
          try {
            const { data: existingTags } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .limit(1);
              
            if (existingTags && existingTags.length > 0) {
              const tagId = existingTags[0].id;
              
              // タグの関連付けが既に存在するか確認
              const { data: existingRelation } = await supabase
                .from('work_tags')
                .select('*')
                .eq('work_id', savedWorkId)
                .eq('tag_id', tagId)
                .limit(1);
                
              // 関連付けが存在しない場合のみ挿入
              if (!existingRelation || existingRelation.length === 0) {
                const { error: relationError } = await supabase
                  .from('work_tags')
                  .insert([{ 
                    work_id: savedWorkId, 
                    tag_id: tagId,
                    created_at: new Date().toISOString()
                  }]);

                if (relationError) {
                  console.error('タグの関連付けに失敗しました:', relationError);
                }
              } else {
                console.log(`タグ "${tagName}" は既に作品に関連付けられています`);
              }
            } else {
              try {
                console.log(`タグ "${tagName}" を作成します...`);
                
                const newTag = await createTag(tagName, 'user_generated');
                
                if (!newTag || !newTag.id) {
                  console.error('Invalid tag response from API:', newTag);
                  throw new Error('Invalid tag response from API');
                }
                
                console.log(`タグ "${tagName}" を作成しました:`, newTag);
                
                // 新しいタグの関連付けが既に存在するか確認（念のため）
                const { data: existingRelation } = await supabase
                  .from('work_tags')
                  .select('*')
                  .eq('work_id', savedWorkId)
                  .eq('tag_id', newTag.id)
                  .limit(1);
                  
                // 関連付けが存在しない場合のみ挿入
                if (!existingRelation || existingRelation.length === 0) {
                  const { error: relationError } = await supabase
                    .from('work_tags')
                    .insert([{ 
                      work_id: savedWorkId, 
                      tag_id: newTag.id,
                      created_at: new Date().toISOString()
                    }]);
                  
                  if (relationError) {
                    console.error('新しいタグの関連付けに失敗しました:', relationError);
                  }
                } else {
                  console.log(`新しいタグ "${tagName}" は既に作品に関連付けられています`);
                }
              } catch (error) {
                console.error(`タグ "${tagName}" の作成に失敗しました:`, error);
              }
            }
          } catch (error) {
            console.error(`タグ "${tagName}" の処理中にエラーが発生しました:`, error);
          }
        }
      }

      if (analysisResult) {
        const { error: analysisError } = await supabase
          .from('work_analysis')
          .insert([{
            work_id: savedWorkId,
            result: analysisResult,
            created_at: new Date().toISOString()
          }]);
        
        if (analysisError) {
          console.error('AI分析結果の保存に失敗しました:', analysisError);
        }
      }

      navigate('/mypage');
    } catch (err) {
      console.error('作品の登録中にエラーが発生しました:', err instanceof Error ? err.message : JSON.stringify(err));
      setError(err instanceof Error ? err.message : '作品の登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setForm(prev => ({
      ...prev,
      work_type: type 
    }));
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setForm(prev => ({ ...prev, roles: [...prev.roles, role] }));
    } else {
      setForm(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role) }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/mypage')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            マイページに戻る
          </button>
          <button
            type="submit"
            form="work-form"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>

        <form id="work-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            {/* 作品タイプ選択 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  handleTypeSelect('writing');
                }}
                className={`relative rounded-lg border p-4 text-center hover:border-indigo-600 ${
                  selectedType === 'writing' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                }`}
              >
                <div className="flex justify-center mb-2">
                  <FileText className={`w-6 h-6 ${selectedType === 'writing' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
                <span className={`text-sm font-medium ${selectedType === 'writing' ? 'text-indigo-600' : 'text-gray-900'}`}>
                  記事・文章
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTypeSelect('design');
                }}
                className={`relative rounded-lg border p-4 text-center hover:border-indigo-600 ${
                  selectedType === 'design' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                }`}
              >
                <div className="flex justify-center mb-2">
                  <ImageIcon className={`w-6 h-6 ${selectedType === 'design' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
                <span className={`text-sm font-medium ${selectedType === 'design' ? 'text-indigo-600' : 'text-gray-900'}`}>
                  画像 & ファイル
                </span>
              </button>
            </div>

            {/* 共通フィールド：タイトル */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="作品のタイトルを入力"
              />
            </div>

            {/* 記事・文章タイプの場合のみ表示するフィールド */}
            {selectedType === 'writing' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作品URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={form.source_url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://example.com/your-work"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                    />
                    {fetchingUrl && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  {fetchingUrl && (
                    <p className="mt-1 text-xs text-gray-500">URLから情報を取得中...</p>
                  )}
                  {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                  )}
                </div>

                {/* 記事・文章タイプの場合のサムネイル表示 */}
                {form.thumbnail_url && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サムネイル画像
                    </label>
                    <div className="mt-1 relative rounded-md border border-gray-300 overflow-hidden">
                      <img
                        src={form.thumbnail_url}
                        alt="サムネイル"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 画像 & ファイルタイプの場合のみ表示するフィールド */}
            {selectedType === 'design' && (
              <>
                {/* 画像アップロード */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    画像アップロード
                  </label>
                  <div className="flex justify-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      画像を選択
                    </button>
                    {form.image_preview && (
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100 ml-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        画像をクリア
                      </button>
                    )}
                  </div>
                  {form.image_preview && (
                    <div className="mt-2">
                      <img
                        src={form.image_preview}
                        alt="アップロード画像"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* デザインタイプ選択 */}
                <div className="mb-4">
                  <label htmlFor="design_type" className="block text-sm font-medium text-gray-700 mb-1">
                    デザインタイプ
                  </label>
                  <select
                    id="design_type"
                    value={form.design_type}
                    onChange={(e) => handleInputChange('design_type', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">選択してください</option>
                    <option value="web">Webデザイン</option>
                    <option value="graphic">グラフィックデザイン</option>
                    <option value="ui">UIデザイン</option>
                    <option value="illustration">イラスト</option>
                    <option value="photo">写真</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                {/* デザイン関連URL */}
                <div className="mb-4">
                  <label htmlFor="design_url" className="block text-sm font-medium text-gray-700 mb-1">
                    デザイン公開URL（任意）
                  </label>
                  <input
                    type="url"
                    id="design_url"
                    value={form.design_url}
                    onChange={(e) => handleInputChange('design_url', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://example.com/your-design"
                  />
                </div>

                {/* Behance/Dribbble URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="behance_url" className="block text-sm font-medium text-gray-700 mb-1">
                      Behance URL（任意）
                    </label>
                    <input
                      type="url"
                      id="behance_url"
                      value={form.behance_url}
                      onChange={(e) => handleInputChange('behance_url', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://behance.net/username"
                    />
                  </div>
                  <div>
                    <label htmlFor="dribbble_url" className="block text-sm font-medium text-gray-700 mb-1">
                      Dribbble URL（任意）
                    </label>
                    <input
                      type="url"
                      id="dribbble_url"
                      value={form.dribbble_url}
                      onChange={(e) => handleInputChange('dribbble_url', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://dribbble.com/username"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 共通フィールド：説明文 */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明文
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="作品の説明を入力"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleAiAnalysis}
                  disabled={analyzingContent || ((!form.title && !form.description) && (!form.image_preview && !form.thumbnail_url))}
                  className={`text-sm px-3 py-1.5 rounded-md flex items-center
                    ${analyzingContent || ((!form.title && !form.description) && (!form.image_preview && !form.thumbnail_url))
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                >
                  {analyzingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4 mr-2" />
                      AI分析する
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 共通フィールド：タグ */}
            <div className="mb-4">
              <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-1">
                タグ
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = [...form.tags];
                        newTags.splice(index, 1);
                        setForm({ ...form, tags: newTags });
                      }}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                    >
                      <span className="sr-only">タグを削除</span>
                      <X className="h-2 w-2" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      if (!form.tags.includes(tagInput.trim())) {
                        setForm({
                          ...form,
                          tags: [...form.tags, tagInput.trim()]
                        });
                      }
                      setTagInput('');
                    }
                  }}
                  className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="タグを入力して Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
                      setForm({
                        ...form,
                        tags: [...form.tags, tagInput.trim()]
                      });
                      setTagInput('');
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                  追加
                </button>
              </div>
              {generatedTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">AI生成タグ（クリックで追加）:</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedTags.map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!form.tags.includes(tag)) {
                            setForm({
                              ...form,
                              tags: [...form.tags, tag]
                            });
                          }
                        }}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 border border-indigo-200 p-4 rounded-md bg-indigo-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                あなたの役割
              </label>
              <div className="flex flex-wrap gap-2">
                {['企画', '取材', '執筆', '編集', '撮影', 'デザイン'].map((role) => (
                  <label key={role} className={`inline-flex items-center px-3 py-1.5 rounded-md border ${
                    form.roles.includes(role) 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } cursor-pointer transition-colors duration-200 ease-in-out`}>
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role)}
                      onChange={(e) => handleRoleChange(role, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {analysisResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200" data-component-name="AddWork">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center" data-component-name="AddWork">
                  <BrainCircuit className="w-4 h-4 mr-1 text-indigo-500" />
                  AI分析結果
                </h4>
                
                <div className="mb-3 text-xs text-gray-600 border-b pb-2">
                  クリエイターの価値を測る要素は多様ですが、特に重要と考えられる以下の3つの要素から分析しています。これらの要素は相互に関連し合い、総合的に見ることであなたの多面的な価値や魅力をより深く理解できます。
                </div>
                
                {analysisResult.originality && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1" data-component-name="AddWork">創造性と独自性 (オリジナリティ):</p>
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">
                        新しいアイデアや表現を生み出す能力、既存の概念を独自の視点で再解釈する力を指します。他者と差別化された独自の世界観や表現スタイルを確立することで、作品に唯一無二の価値が生まれます。
                      </p>
                      <ul className="text-xs text-gray-600 list-disc pl-4 mb-2">
                        <li>新規性：これまでにない新しい視点や表現</li>
                        <li>独創性：他者と明確に区別される独自の特徴</li>
                        <li>革新性：既存の枠組みを超える挑戦的な試み</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-800 border-l-2 border-yellow-400 pl-2" data-component-name="AddWork">
                      {analysisResult.originality.summary.length > 140 
                        ? `${analysisResult.originality.summary.substring(0, 137)}...` 
                        : analysisResult.originality.summary}
                      <span className="block mt-1 text-xs text-indigo-600">今後、異なる分野の知識を組み合わせることで、さらに独自性を高める可能性があります。</span>
                    </p>
                  </div>
                )}
                
                {analysisResult.quality && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1" data-component-name="AddWork">専門性とスキル (クオリティ):</p>
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">
                        特定の分野における知識や技術の深さと幅を表します。専門的な知見に基づいた質の高い作品制作能力や、技術的な完成度の高さが作品の信頼性と価値を高めます。
                      </p>
                      <ul className="text-xs text-gray-600 list-disc pl-4 mb-2">
                        <li>技術的完成度：作品の仕上がりや精度の高さ</li>
                        <li>専門知識の深さ：特定分野における専門的な知見</li>
                        <li>一貫性：作品全体を通じた質とスタイルの安定性</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-800 border-l-2 border-orange-400 pl-2" data-component-name="AddWork">
                      {analysisResult.quality.summary.length > 140 
                        ? `${analysisResult.quality.summary.substring(0, 137)}...` 
                        : analysisResult.quality.summary}
                      <span className="block mt-1 text-xs text-indigo-600">継続的な学習と実践により、さらにスキルを磨き、専門性を深めていくことができるでしょう。</span>
                    </p>
                  </div>
                )}
                
                {analysisResult.engagement && analysisResult.engagement.summary && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">影響力と共感 (エンゲージメント):</p>
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">
                        作品が他者に与える影響や共感を呼び起こす力を指します。感情を動かし、新たな視点や行動の変化を促す作品は、社会的価値や文化的意義を持ち、より広い影響力を持ちます。
                      </p>
                      <ul className="text-xs text-gray-600 list-disc pl-4 mb-2">
                        <li>共感性：観客の感情や経験に響く力</li>
                        <li>社会的影響力：社会的議論や変化を促す可能性</li>
                        <li>記憶に残る度合い：長期的に記憶に残る印象の強さ</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-800 border-l-2 border-indigo-400 pl-2" data-component-name="AddWork">
                      {analysisResult.engagement.summary && analysisResult.engagement.summary.length > 140 
                        ? `${analysisResult.engagement.summary.substring(0, 137)}...` 
                        : analysisResult.engagement.summary}
                      <span className="block mt-1 text-xs text-indigo-600">多様な視点を取り入れ、ターゲットオーディエンスとの対話を深めることで、さらなる共感と影響力を生み出せるでしょう。</span>
                    </p>
                  </div>
                )}
                
                <div className="text-xs text-gray-600 border-t pt-2">
                  <p>これらの要素を総合的に見ることで、あなたの作品やクリエイターとしての多面的な価値や魅力をより深く理解できます。あなたの創造性と情熱は、今後さらに多くの可能性を広げていくでしょう。</p>
                </div>
              </div>
            )}
          </div>
          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/mypage')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};