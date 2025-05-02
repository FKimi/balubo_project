import React from "react";
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { analyzeContent } from '../../../lib/gemini.ts';
import { extractDataFromUrl } from '../../../lib/gemini-url-service';
import { extractDataFromUrlWithMetadata } from '../../../lib/url-metadata';
import { createTag } from '../../../api/tags'; 
import { Loader2, BrainCircuit } from 'lucide-react';

interface ContentInput {
  title: string;
  description?: string | null;
  url?: string;
  imageUrl?: string;
}

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
  work_type: string; 
  is_public: boolean;
  user_id: string;
  tags?: string[]; 
  roles?: string[]; 
  published_date?: string; // 掲載月 (例: 2025-04)
}

interface WorkForm {
  title: string;
  description: string;
  source_url: string;
  thumbnail_url: string;
  work_type: string;
  is_public: boolean;
  user_id: string;
  tags: string[];
  roles: string[];
  published_date: string; // 掲載月 (例: 2025-04)
  image_file: File | null;
  image_preview: string;
}

import type { UrlExtractedData as OriginalUrlExtractedData } from '../../../lib/gemini-url-service';

interface UrlExtractedDataWithDate extends OriginalUrlExtractedData {
  publishedDate?: string;
}

import type { UserCategory } from '../../../types';

export const AddWork = () => {
  const navigate = useNavigate();
  const { id: workId } = useParams<{ id: string }>();
  const isEditMode = !!workId;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const urlFetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  const [form, setForm] = useState<WorkForm>({
    title: '',
    description: '',
    source_url: '',
    thumbnail_url: '',
    work_type: 'writing',
    is_public: true,
    user_id: '',
    tags: [],
    roles: [],
    published_date: '',
    image_file: null,
    image_preview: ''
  });

  const [roleList, setRoleList] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<UserCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // --- カテゴリ編集・削除用 state ---
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // --- カテゴリ検索用 state ---
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('works')
          .select('roles')
          .not('roles', 'is', null);
        if (error) throw error;
        const allRoles = (data || []).flatMap((row: { roles: string[] }) => row.roles || []);
        const uniqueRoles = Array.from(new Set(allRoles)).filter(Boolean);
        setRoleList(uniqueRoles.length > 0 ? uniqueRoles : ['企画', '取材', '執筆', '編集', '撮影', 'デザイン']);
      } catch {
        setRoleList(['企画', '取材', '執筆', '編集', '撮影', 'デザイン']);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      // ユーザーIDでフィルタ
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setCategoryList([]);
        return;
      }
      const userId = userData.user.id;
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) setCategoryList(data as UserCategory[]);
    };
    fetchCategories();
  }, []);

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
        
        const tagArray: string[] =
          workTags && Array.isArray(workTags)
            ? workTags
                .flatMap((wt: WorkTag) =>
                  Array.isArray(wt.tags)
                    ? wt.tags.map((t) => t.name || '')
                    : wt.tags && typeof wt.tags === 'object' && wt.tags.name
                    ? [wt.tags.name]
                    : []
                )
                .filter(Boolean)
            : [];

        setForm((prev: WorkForm) => ({
          ...prev,
          title: workData.title || '',
          description: workData.description || '',
          source_url: workData.source_url || '',
          thumbnail_url: workData.thumbnail_url || '',
          tags: tagArray,
          work_type: workData.work_type || 'writing',
          is_public: workData.is_public !== false,
          roles: workData.roles || [],
          published_date: workData.published_date || '',
          image_file: null,
          image_preview: workData.thumbnail_url || '',
          user_id: workData.user_id || prev.user_id, // 必ずuser_idをセット
        }));
        
        const { data: workCategories, error: categoriesError } = await supabase
          .from('work_categories')
          .select('category_id')
          .eq('work_id', workId);
        
        if (!categoriesError && workCategories) {
          setSelectedCategoryIds(workCategories.map((row: { category_id: string }) => row.category_id));
        }
        
        setInitialDataLoaded(true);
      } catch {
        console.error('作品データの読み込みに失敗しました');
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
      
      const metadata = await extractDataFromUrlWithMetadata(url) as UrlExtractedDataWithDate;
      
      console.log("取得したメタデータ:", metadata);
      
      // 掲載日を月単位（YYYY-MM）で整形
      let publishedMonth = '';
      if (metadata.publishedDate) {
        const date = new Date(metadata.publishedDate);
        if (!isNaN(date.getTime())) {
          publishedMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      if (metadata) {
        setForm((prev: WorkForm) => ({
          ...prev,
          title: metadata.title || prev.title,
          description: metadata.description || prev.description,
          thumbnail_url: metadata.imageUrl || prev.thumbnail_url,
          source_url: url,
          published_date: publishedMonth || prev.published_date,
        }));
      } else {
        const fallbackData = await extractDataFromUrl(url);
        
        if (fallbackData) {
          setForm((prev: WorkForm) => ({
            ...prev,
            title: fallbackData.title || prev.title,
            description: fallbackData.description || prev.description,
            source_url: url
          }));
        }
      }
    } catch {
      console.error("URL取得エラー:");
      setError("URLからの情報取得に失敗しました。URLを確認してください。");
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setForm((prev: WorkForm) => ({ ...prev, source_url: url }));
    
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
    if (!form.title && !form.description && !form.image_preview && !form.thumbnail_url) {
      setError('タイトル、説明文、または画像のいずれかが必要です');
      return;
    }
    
    try {
      setAnalyzingContent(true);
      
      const content: ContentInput = {
        title: form.title || '無題の作品', 
        description: form.description || '', 
        url: form.source_url || '',
        imageUrl: form.image_preview || form.thumbnail_url 
      };
      
      console.log('AI分析を開始します:', content);
      
      const result = await analyzeContent(content);
      console.log('AI分析結果:', result);

      setAnalysisResult(result);
      
      if (result.tags) {
        const newTags = result.tags;
        
        setForm((prev: WorkForm) => ({ ...prev, tags: [...new Set([...prev.tags, ...newTags])] }));
        
        if (!form.title && result.originality && result.originality.features && result.originality.features.length > 0) {
          const topFeature = result.originality.features[0].name;
          setForm((prev: WorkForm) => ({ 
            ...prev, 
            title: `${topFeature}の作品` 
          }));
        }
      }
    } catch (err) {
      console.error('AI分析エラー:', err);
      let errorMessage = 'AI分析中にエラーが発生しました。しばらく待ってから再試行してください。';
      if (err instanceof Error) {
        errorMessage += `\n詳細: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `\n詳細: ${err}`;
      }
      setError(errorMessage);
    } finally {
      setAnalyzingContent(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setForm((prev: WorkForm) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCategory()) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('送信するフォームデータ:', form);
      console.log('役割:', form.roles);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ログインが必要です');
      }

      // published_date（YYYY-MM）→YYYY-MM-01に変換
      let publishedDateForDb = form.published_date;
      if (publishedDateForDb && publishedDateForDb.length === 7) {
        publishedDateForDb += '-01';
      }
      const workData: WorkData = {
        title: form.title,
        description: form.description,
        source_url: form.source_url,
        thumbnail_url: form.thumbnail_url,
        work_type: form.work_type || 'writing',
        is_public: form.is_public ?? true,
        user_id: user.id,
        roles: form.roles && form.roles.length > 0 ? form.roles : undefined,
        published_date: publishedDateForDb || undefined, // 空欄の場合は送信しない
      };
      
      let savedWorkId: string;
      
      if (isEditMode) {
        const { data: updateResult, error: updateError } = await supabase
          .from('works')
          .update(workData)
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
        console.log('workData', workData); // 追加: デバッグ用
        const { data: insertResult, error: insertError } = await supabase
          .from('works')
          .insert([workData])
          .select('*'); // 明示的に全カラム取得
        if (insertError) {
          console.error('insertError', insertError); // 追加: エラー詳細
          throw insertError;
        }
        
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
              
              const { data: existingRelation } = await supabase
                .from('work_tags')
                .select('*')
                .eq('work_id', savedWorkId)
                .eq('tag_id', tagId)
                .limit(1);
                
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
                
                const { data: existingRelation } = await supabase
                  .from('work_tags')
                  .select('*')
                  .eq('work_id', savedWorkId)
                  .eq('tag_id', newTag.id)
                  .limit(1);
                  
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
              } catch {
                console.error(`タグ "${tagName}" の作成に失敗しました`);
              }
            }
          } catch {
            console.error(`タグ "${tagName}" の処理中にエラーが発生しました`);
          }
        }
      }

      if (selectedCategoryIds.length > 0) {
        // まず既存のwork_categoriesを削除（編集時）
        await supabase.from('work_categories').delete().eq('work_id', savedWorkId);
        // 新しいカテゴリを挿入
        await supabase.from('work_categories').insert(
          selectedCategoryIds.map((category_id) => ({ work_id: savedWorkId, category_id }))
        );
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

    } catch {
      console.error('作品の登録中にエラーが発生しました');
      setError('作品の登録中にエラーが発生しました');
    } finally {
      setLoading(false);
      // 作品保存後にポートフォリオへ遷移
      navigate('/portfolio');
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddCategory = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;
    if (!newCategoryName.trim()) return;
    const userId = userData.user.id;
    const { data, error } = await supabase
      .from('user_categories')
      .insert([{ name: newCategoryName.trim(), user_id: userId }])
      .select();
    if (!error && data) setCategoryList(prev => [...prev, ...data]);
    setNewCategoryName('');
  };

  // --- カテゴリ編集開始 ---
  const handleEditCategory = (id: string, name: string) => {
    setEditingCategoryId(id);
    setEditingCategoryName(name);
  };

  // --- カテゴリ編集保存 ---
  const handleSaveCategory = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    const userId = userData.user.id;
    const { data, error } = await supabase
      .from('user_categories')
      .update({ name: editingCategoryName.trim() })
      .eq('id', editingCategoryId)
      .eq('user_id', userId)
      .select();
    if (!error && data) {
      setCategoryList(prev => prev.map(cat => cat.id === editingCategoryId ? data[0] : cat));
    }
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // --- カテゴリ編集キャンセル ---
  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // --- カテゴリ削除 ---
  const handleDeleteCategory = async (id: string) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;
    if (!window.confirm('本当に削除しますか？')) return;
    const userId = userData.user.id;
    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (!error) {
      setCategoryList(prev => prev.filter(cat => cat.id !== id));
      setSelectedCategoryIds(prev => prev.filter(cid => cid !== id));
    }
  };

  const validateCategory = () => {
    setCategoryError(null);
    return true;
  };

  const [roleInput, setRoleInput] = useState('');

  // --- カテゴリリストのフィルタ＆ソート ---
  const filteredCategoryList = categoryList
    .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort((a, b) => {
      const aSelected = selectedCategoryIds.includes(a.id) ? -1 : 1;
      const bSelected = selectedCategoryIds.includes(b.id) ? -1 : 1;
      return aSelected - bSelected;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-pink-50 to-white py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/portfolio')}
            className="flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors gap-1"
          >
            ←
            ポートフォリオに戻る
          </button>
          <button
            type="submit"
            form="work-form"
            disabled={loading}
            className="inline-flex items-center px-5 py-2 rounded-full shadow-md text-white bg-gradient-to-r from-indigo-400 via-pink-400 to-pink-500 font-bold hover:brightness-110 transition-all text-base focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>

        <form id="work-form" onSubmit={handleSubmit} className="space-y-7">
          <div className="bg-white/90 shadow rounded-xl p-7">
            <div className="mb-6">
              <label htmlFor="title" className="text-base font-bold text-indigo-700 mb-1 flex items-center gap-2">
                📝
                タイトル
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full rounded-lg border border-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 px-4 py-3 text-base transition-all bg-gray-50 placeholder-gray-300"
                placeholder="作品のタイトルを入力"
              />
            </div>

            <div className="mb-6">
              <label className="text-base font-bold text-indigo-700 mb-1 flex items-center gap-2">
                🔗
                作品URL
              </label>
              <p className="text-xs text-gray-500 mb-2 ml-1">URLを入力すると、タイトル・説明・タグを自動取得します。</p>
              <div className="relative">
                <input
                  type="url"
                  value={form.source_url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com/your-work"
                  className="w-full rounded-lg border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 px-4 py-3 text-base transition-all bg-gray-50 placeholder-gray-300"
                  required
                />
                {fetchingUrl && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              {fetchingUrl && (
                <p className="mt-2 text-xs text-indigo-400 animate-pulse">URLから情報を取得中...</p>
              )}
              {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
              )}
            </div>

            {form.thumbnail_url && (
              <div className="mb-6">
                <label className="text-base font-bold text-indigo-700 mb-1">サムネイル画像</label>
                <div className="mt-1 rounded-lg border border-gray-200 overflow-hidden w-full max-w-xs">
                  <img
                    src={form.thumbnail_url}
                    alt="サムネイル"
                    className="w-full h-40 object-cover bg-gray-100"
                  />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="description" className="text-base font-bold text-indigo-700 mb-1 flex items-center gap-2">
                💬
                説明文
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full rounded-lg border border-gray-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 px-4 py-3 text-base transition-all bg-gray-50 placeholder-gray-300"
                placeholder="作品の説明を入力"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleAiAnalysis}
                  disabled={analyzingContent || ((!form.title && !form.description) && (!form.image_preview && !form.thumbnail_url))}
                  className={`text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow font-semibold transition-all
                    ${analyzingContent || ((!form.title && !form.description) && (!form.image_preview && !form.thumbnail_url))
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-100 via-pink-100 to-pink-200 hover:brightness-110 text-indigo-700 hover:shadow-lg'
                    }`}
                >
                  {analyzingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />分析中...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" />AI分析する
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="published_date" className="text-base font-bold text-indigo-700 mb-1 flex items-center gap-2">
                📆
                掲載月
              </label>
              <input
                type="month"
                id="published_date"
                name="published_date"
                value={form.published_date || ''}
                onChange={(e) => handleInputChange('published_date', e.target.value)}
                className="w-full rounded-lg border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 px-4 py-3 text-base transition-all bg-gray-50 placeholder-gray-300"
                placeholder="掲載月を入力または自動取得"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="tag-input" className="text-base font-bold text-indigo-700 mb-1 flex items-center gap-2">
                🏷️
                タグ
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <input
                  type="text"
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
                  placeholder="タグを入力して Enter"
                  className="flex-1 rounded-full border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-50 px-4 py-2 text-base transition-all bg-gray-50 placeholder-gray-300"
                  aria-label="自由入力タグ"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
                      setForm((prev: WorkForm) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
                      setTagInput('');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-pink-100 text-pink-700 font-bold text-sm shadow hover:bg-pink-200 transition-transform hover:-translate-y-0.5"
                >追加</button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium shadow-sm">
                    <span className="text-base">#</span>{tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = [...form.tags];
                        newTags.splice(index, 1);
                        setForm((prev: WorkForm) => ({ ...prev, tags: newTags }));
                      }}
                      className="ml-1 text-xs text-gray-400 hover:text-pink-500 focus:outline-none"
                      aria-label="タグを削除"
                    >✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6 border border-indigo-100 p-4 rounded-xl bg-indigo-50">
              <label className="text-base font-bold text-indigo-700 mb-1 flex items-center gap-2">
                🧑‍💻
                あなたの役割 <span className="text-pink-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[44px]">
                {form.roles.length === 0 ? (
                  <span className="text-xs text-gray-400">ここに選択した役割が表示されます</span>
                ) : (
                  form.roles.map((role, index) => (
                    <span key={index} className="inline-flex items-center px-4 py-2 rounded-lg bg-green-400 text-white font-semibold text-base shadow">
                      {role}
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev: WorkForm) => ({ ...prev, roles: prev.roles.filter((r) => r !== role) }));
                        }}
                        className="ml-2 text-white hover:text-green-900 focus:outline-none"
                        aria-label={`${role}を外す`}
                      >×</button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {roleList.filter((role) => !form.roles.includes(role)).map((role, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setForm((prev: WorkForm) => ({ ...prev, roles: [...prev.roles, role] }));
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-400 font-semibold text-base shadow hover:bg-indigo-50 transition-colors"
                  >
                    {role} ＋
                  </button>
                ))}
                <input
                  type="text"
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); } }}
                  placeholder="その他の役割を入力"
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-base text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-indigo-200 w-40"
                  aria-label="自由入力役割"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (roleInput.trim() && !form.roles.includes(roleInput.trim())) {
                      setForm((prev: WorkForm) => ({ ...prev, roles: [...prev.roles, roleInput.trim()] }));
                      setRoleInput('');
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 font-semibold text-base shadow hover:bg-indigo-50"
                >追加</button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-base font-bold text-indigo-700 mb-1 flex items-center gap-2">
                📂 カテゴリ（複数選択可）
              </label>
              {/* カテゴリ検索ボックス */}
              <div className="mb-2">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  placeholder="カテゴリ検索"
                  className="rounded-full border border-gray-200 px-3 py-2 text-sm w-48"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto">
                {filteredCategoryList.length === 0 ? (
                  <span className="text-gray-400 text-sm">カテゴリがありません</span>
                ) : (
                  filteredCategoryList.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-1">
                      {editingCategoryId === cat.id ? (
                        <>
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={e => setEditingCategoryName(e.target.value)}
                            className="rounded-full border border-indigo-300 px-2 py-1 text-sm w-24"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="text-xs text-indigo-600 hover:underline px-1"
                            onClick={handleSaveCategory}
                            disabled={!editingCategoryName.trim()}
                          >保存</button>
                          <button
                            type="button"
                            className="text-xs text-gray-400 hover:underline px-1"
                            onClick={handleCancelEditCategory}
                          >キャンセル</button>
                        </>
                      ) : (
                        <label className={`flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer select-none transition-all ${selectedCategoryIds.includes(cat.id) ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}>
                          <input
                            type="checkbox"
                            className="accent-indigo-500 mr-1"
                            checked={selectedCategoryIds.includes(cat.id)}
                            onChange={() => handleCategoryChange(cat.id)}
                          />
                          {cat.name}
                          <button
                            type="button"
                            className="text-xs text-indigo-400 hover:underline px-1"
                            onClick={e => { e.preventDefault(); handleEditCategory(cat.id, cat.name); }}
                          >編集</button>
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:underline px-1"
                            onClick={e => { e.preventDefault(); handleDeleteCategory(cat.id); }}
                          >削除</button>
                        </label>
                      )}
                    </div>
                  ))
                )}
              </div>
              {/* カテゴリ追加UI */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="新しいカテゴリ名"
                  className="rounded-full border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shadow hover:bg-indigo-200"
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                >追加</button>
              </div>
              {categoryError && (
                <p className="mt-2 text-xs text-red-500">{categoryError}</p>
              )}
            </div>

            {analysisResult && (
              <section className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 flex items-center mb-3">
                  <BrainCircuit className="w-5 h-5 mr-2 text-indigo-500" />
                  AI分析結果
                </h4>
                <div className="flex items-center mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <img
                    src="/balubo.png"
                    alt="baluboくん"
                    className="w-16 h-16 rounded-full mr-3 border-2 border-yellow-300 bg-white object-contain"
                    style={{minWidth:'64px',minHeight:'64px'}}
                  />
                  <div className="text-gray-800 text-sm font-medium leading-snug">
                    baluboくんのひとこと：<br />
                    この記事は独自性・専門性・影響力の三拍子そろった素晴らしい内容です！<br />
                    ぜひご注目ください。
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {analysisResult.originality && (
                    <div className="rounded-xl bg-white border border-yellow-100 shadow-sm p-4 flex flex-col min-h-[140px]">
                      <span className="text-xs font-semibold text-yellow-600 mb-1">Originality（オリジナリティ）</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 overflow-y-auto max-h-[120px]">{analysisResult.originality.summary}</p>
                      </div>
                    </div>
                  )}
                  {analysisResult.quality && (
                    <div className="rounded-xl bg-white border border-blue-100 shadow-sm p-4 flex flex-col min-h-[140px]">
                      <span className="text-xs font-semibold text-blue-600 mb-1">Expertise（専門性）</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 overflow-y-auto max-h-[120px]">{analysisResult.quality.summary}</p>
                      </div>
                    </div>
                  )}
                  {analysisResult.engagement && (
                    <div className="rounded-xl bg-white border border-pink-100 shadow-sm p-4 flex flex-col min-h-[140px]">
                      <span className="text-xs font-semibold text-pink-600 mb-1">Engagement（影響力）</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 overflow-y-auto max-h-[120px]">{analysisResult.engagement.summary}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
            <div className="pt-5 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/portfolio')}
                className="bg-white py-2 px-6 border border-gray-300 rounded-full shadow-sm text-base font-medium text-gray-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
              >キャンセル</button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-400 via-pink-400 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl hover:brightness-110 transition-all text-base focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >保存</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};