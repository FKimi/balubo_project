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
  appeal_points: {
    points: Array<{ title: string; description: string }>;
    summary: string;
  };
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
  const [generatedTags, setGeneratedTags] = useState<Array<{ name: string; relevance?: number }>>([]);
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
    if (!form.title && !form.description) {
      setError('タイトルまたは説明文を入力してください');
      return;
    }

    setAnalyzingContent(true);
    setError(null);

    try {
      const content: ContentInput = {
        title: form.title,
        description: form.description,
        url: form.source_url
      };

      const result = await analyzeContent(content);
      console.log('AI分析結果:', result);

      setAnalysisResult(result);
      
      if (result.interests && result.interests.tags) {
        const newTags = result.interests.tags.map(tag => {
          let japaneseTag = tag;
          
          const tagTranslations: Record<string, string> = {
            "Regional Revitalization": "地域活性化",
            "Local Economy": "地域経済",
            "Business Attraction": "企業誘致",
            "Job Creation": "雇用創出",
            "Investment": "投資",
            "Innovation": "イノベーション",
            "Community Development": "コミュニティ開発",
            "Ehime Prefecture": "愛媛県",
            "Japan": "日本",
            "Rural Development": "地方開発",
            "Economic Growth": "経済成長",
            "Sustainability": "持続可能性",
            "Technology": "テクノロジー",
            "Tourism": "観光",
            "Agriculture": "農業",
            "Education": "教育",
            "Healthcare": "医療",
            "Infrastructure": "インフラ",
            "Government": "行政",
            "Policy": "政策"
          };
          
          if (tagTranslations[tag]) {
            japaneseTag = tagTranslations[tag];
          }
          
          return {
            name: japaneseTag,
            relevance: 1.0
          };
        });
        setGeneratedTags(newTags);
      }
    } catch (error) {
      console.error('AI分析エラー:', error instanceof Error ? error.message : String(error));
      
      let errorMessage = 'AI分析中にエラーが発生しました。しばらく待ってから再試行してください。';
      
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "API keyが設定されていないか無効です。環境変数を確認してください。";
        } else if (error.message.includes("network") || error.message.includes("timeout")) {
          errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください。";
        } else if (error.message.includes("JSON")) {
          errorMessage = "AIからの応答を解析できませんでした。しばらく待ってから再試行してください。";
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
      if (selectedType === 'design' && form.image_file) {
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
              try {
                console.log(`タグ "${tagName}" を作成します...`);
                
                const newTag = await createTag(tagName, 'user_generated');
                
                if (!newTag || !newTag.id) {
                  console.error('Invalid tag response from API:', newTag);
                  throw new Error('Invalid tag response from API');
                }
                
                console.log(`タグ "${tagName}" を作成しました:`, newTag);
                
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
                  デザイン
                </span>
              </button>
            </div>

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

            {selectedType === 'writing' && (
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
            )}

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

            {selectedType === 'design' && (
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
            )}

            {selectedType === 'design' && (
              <>
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

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明文
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="作品の説明を入力してください"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleAiAnalysis}
                  disabled={analyzingContent || (!form.title && !form.description)}
                  className={`text-sm px-3 py-1.5 rounded-md flex items-center
                    ${analyzingContent || (!form.title && !form.description)
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
                          if (!form.tags.includes(tag.name)) {
                            setForm({
                              ...form,
                              tags: [...form.tags, tag.name]
                            });
                          }
                        }}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        {tag.name}
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
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <BrainCircuit className="w-4 h-4 mr-1 text-indigo-500" />
                  AI分析結果
                </h4>
                
                {analysisResult.expertise && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700">専門性:</p>
                    <p className="text-sm text-gray-800">{analysisResult.expertise.summary}</p>
                  </div>
                )}
                
                {analysisResult.content_style && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700">コンテンツスタイル:</p>
                    <p className="text-sm text-gray-800">{analysisResult.content_style.summary}</p>
                  </div>
                )}
                
                {analysisResult.interests && analysisResult.interests.summary && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700">作品のユニークさ:</p>
                    <p className="text-sm text-gray-800">{analysisResult.interests.summary}</p>
                  </div>
                )}
              </div>
            )}

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
          </div>
        </form>
      </div>
    </div>
  );
};