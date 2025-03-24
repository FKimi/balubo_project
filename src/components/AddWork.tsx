import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analyzeContent } from '../lib/gemini';
import { extractDataFromUrl } from '../lib/gemini-url-service';
import { extractDataFromUrlWithMetadata } from '../lib/url-metadata';
import { createTag } from '../api/tags'; // createTag関数をインポート
import { ArrowLeft, FileText, ImageIcon, Loader2, BrainCircuit, X } from 'lucide-react';

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
  work_type: string; // typeからwork_typeに変更
  is_public: boolean;
  user_id: string;
  tags?: string[]; // tagsプロパティを追加
}

export const AddWork = () => {
  const navigate = useNavigate();
  const { id: workId } = useParams<{ id: string }>();
  const isEditMode = !!workId;
  
  const [selectedType, setSelectedType] = useState('writing');
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
    work_type: 'writing',
    design_type: '',
    design_url: '',
    behance_url: '',
    dribbble_url: '',
    is_public: true
  });

  // 編集モードの場合、既存の作品データを読み込む
  useEffect(() => {
    const fetchWorkData = async () => {
      if (!workId) return;
      
      try {
        setLoading(true);
        
        // 作品データを取得
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select('*')
          .eq('id', workId)
          .single();
        
        if (workError) throw workError;
        if (!workData) throw new Error('作品が見つかりませんでした');
        
        // タグを取得
        const { data: workTags, error: tagsError } = await supabase
          .from('work_tags')
          .select('tags(name)')
          .eq('work_id', workId);
        
        if (tagsError) throw tagsError;
        
        // タグ名の配列を作成
        const tags = workTags
          ? workTags
              .filter((wt: { tags?: { name: string } }) => wt.tags)
              .map((wt: { tags: { name: string } }) => wt.tags.name)
          : [];
        
        // フォームに既存データを設定
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
          is_public: workData.is_public !== false
        });
        
        // 作品タイプに基づいて選択状態を更新
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

  // URLからデータを取得する関数
  const fetchUrlData = async (url: string) => {
    if (!url || !url.trim() || !url.startsWith('http')) {
      return;
    }

    // 既にデータが読み込まれている編集モードでは、URLからのデータ取得をスキップ
    if (isEditMode && initialDataLoaded) {
      return;
    }
    
    try {
      setFetchingUrl(true);
      setError(null);
      
      console.log("URLからデータを取得します:", url);
      
      // LinkPreview APIを使用してメタデータを取得
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
        // LinkPreview APIが失敗した場合、Gemini APIを使用
        console.log("LinkPreview APIでの取得に失敗しました。Gemini APIを使用します。");
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

  // URLの入力を監視し、タイマーを使って自動取得
  const handleUrlChange = (url: string) => {
    setForm(prev => ({ ...prev, source_url: url }));
    
    // 既存のタイマーをクリア
    if (urlFetchTimerRef.current) {
      clearTimeout(urlFetchTimerRef.current);
    }
    
    // 有効なURLの場合、1秒後に自動取得
    if (url && url.trim() && url.startsWith('http')) {
      urlFetchTimerRef.current = setTimeout(() => {
        fetchUrlData(url);
      }, 1000);
    }
  };

  // AI分析を実行する関数
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

      // 分析結果を設定
      setAnalysisResult(result);
      
      // 生成されたタグを設定
      if (result.interests && result.interests.tags) {
        const newTags = result.interests.tags.map(tag => {
          // 英語タグを日本語に変換
          let japaneseTag = tag;
          
          // 英語タグの日本語変換マッピング
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
          
          // タグが英語の場合は日本語に変換
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
      
      // エラーの種類に応じたメッセージ
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

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ログインが必要です');
      }
      
      // タグを除いた作品データを準備
      const workData: WorkData = {
        ...form,
        user_id: user.id
      };
      
      // tagsプロパティを削除（work_tagsテーブルで管理するため）
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tags, ...workDataWithoutTags } = workData;
      
      let savedWorkId: string;
      
      if (isEditMode && workId) {
        // 編集モード: 既存の作品を更新
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
        
        // 既存のタグ関連付けを削除
        const { error: deleteTagsError } = await supabase
          .from('work_tags')
          .delete()
          .eq('work_id', workId);
        
        if (deleteTagsError) throw deleteTagsError;
      } else {
        // 新規作成モード: 新しい作品を挿入
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
      
      // タグを保存
      if (form.tags && form.tags.length > 0) {
        for (const tagName of form.tags) {
          try {
            // 2.1 タグが存在するか確認、なければ作成
            const { data: existingTags } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .limit(1);
              
            if (existingTags && existingTags.length > 0) {
              // 既存のタグが見つかった場合はそれを使用
              const tagId = existingTags[0].id;
              
              // 2.2 作品とタグを関連付け
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
              // 既存のタグが見つからない場合、api/tags.tsのcreateTag関数を使用してタグを作成
              try {
                console.log(`タグ "${tagName}" を作成します...`);
                
                // api/tags.tsのcreateTag関数を使用
                const newTag = await createTag(tagName, 'user_generated');
                
                if (!newTag || !newTag.id) {
                  console.error('Invalid tag response from API:', newTag);
                  throw new Error('Invalid tag response from API');
                }
                
                console.log(`タグ "${tagName}" を作成しました:`, newTag);
                
                // 作品とタグを関連付ける
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
                // エラーがあっても処理を続行（他のタグを処理する）
              }
            }
          } catch (error) {
            console.error(`タグ "${tagName}" の処理中にエラーが発生しました:`, error);
          }
        }
      }

      // 3. AI分析結果を保存
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
          // 分析結果の保存失敗はクリティカルではないので、処理を続行
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
      work_type: type // typeからwork_typeに変更
    }));
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
            {/* 作品の種類選択 */}
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

            {/* 作品URL入力フィールド */}
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

            {/* サムネイル画像表示 */}
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

            {/* タイトル入力フィールド */}
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
              />
            </div>

            {/* 説明文入力フィールド */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明文
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="作品の説明を入力してください"
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
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

            {/* タグ入力フィールド */}
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="タグを入力してEnterキーを押してください"
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
                />
              </div>
              
              {/* 生成されたタグ候補 */}
              {generatedTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">AI生成タグ候補:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedTags.map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!form.tags.includes(tag.name)) {
                            setForm(prev => ({ ...prev, tags: [...prev.tags, tag.name] }));
                          }
                        }}
                        disabled={form.tags.includes(tag.name)}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium 
                          ${form.tags.includes(tag.name) 
                            ? 'bg-indigo-100 text-indigo-800 opacity-50 cursor-not-allowed' 
                            : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                          }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI分析結果表示 */}
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
            </div>

            {/* 送信ボタン */}
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