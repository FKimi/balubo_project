import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, FileText, Image, Link, Upload, X, Tag as TagIcon } from 'lucide-react';
import UrlAnalyzer from '../../analytics/UrlAnalyzer';
import { UrlAnalysisResult } from '../../../lib/url-analyzer';
import TagAnalysis from '../../analytics/TagAnalysis';
import { analyzeUserData } from '../../../lib/ai-analysis';
import type { Work, WorkTagWithName } from '../../../types';

export function WorkCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<'writing' | 'design'>('writing');
  const [userId, setUserId] = useState<string | null>(null);
  const [showUrlAnalyzer, setShowUrlAnalyzer] = useState(false);
  const [showTagAnalysis, setShowTagAnalysis] = useState(false);
  const [form, setForm] = useState({
    title: '',
    source_url: '',
    description: '',
    work_type: 'writing',
    design_type: '',
    tools_used: [] as string[],
    design_url: '',
    behance_url: '',
    dribbble_url: '',
    is_public: true,
    file: null as File | null,
    preview: null as string | null,
    image_url: '',
    tags: ''
  });
  const [tagArray, setTagArray] = useState<string[]>([]);

  // ユーザーIDを取得
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  // タグ文字列が変更されたらタグ配列を更新
  useEffect(() => {
    if (form.tags) {
      const tags = form.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      setTagArray(tags);
    } else {
      setTagArray([]);
    }
  }, [form.tags]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        file,
        preview: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      // 1. まず作品を保存
      const { data: workData, error: insertError } = await supabase
        .from('works')
        .insert([
          {
            user_id: user.id,
            title: form.title,
            description: form.description,
            source_url: form.source_url,
            image_url: form.image_url,
            is_public: form.is_public,
            work_type: form.work_type,
            design_type: form.design_type,
            tools_used: form.tools_used,
            design_url: form.design_url,
            behance_url: form.behance_url,
            dribbble_url: form.dribbble_url
          }
        ])
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (workData && tagArray.length > 0) {
        // 2. タグを処理
        for (const tagName of tagArray) {
          // 2.1 タグが存在するか確認し、なければ作成
          let tagId;
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .single();

          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert([{ name: tagName }])
              .select('id')
              .single();

            if (tagError) {
              console.error('タグの作成に失敗しました:', tagError);
              continue;
            }
            tagId = newTag.id;
          }

          // 2.2 作品とタグを関連付け
          const { error: relationError } = await supabase
            .from('work_tags')
            .insert([{ work_id: workData.id, tag_id: tagId }]);

          if (relationError) {
            console.error('タグの関連付けに失敗しました:', relationError);
          }
          
          // 2.3 ユーザーのタグ統計を更新
          try {
            // タグ統計が存在するか確認
            const { data: existingStat } = await supabase
              .from('tag_stats')
              .select('*')
              .eq('user_id', user.id)
              .eq('tag_id', tagId)
              .single();
            
            if (existingStat) {
              // 既存の統計を更新
              await supabase
                .from('tag_stats')
                .update({
                  count: existingStat.count + 1,
                  last_used_at: new Date().toISOString()
                })
                .eq('id', existingStat.id);
            } else {
              // 新しい統計を作成
              await supabase
                .from('tag_stats')
                .insert([{
                  user_id: user.id,
                  tag_id: tagId,
                  tag_name: tagName,
                  count: 1,
                  first_used_at: new Date().toISOString(),
                  last_used_at: new Date().toISOString()
                }]);
            }
          } catch (statError) {
            console.error('タグ統計の更新に失敗しました:', statError);
          }
        }
        
        // 3. AI分析を実行し、結果をuser_insightsテーブルに保存
        try {
          // ユーザーの全作品を取得
          const { data: userWorks, error: worksError } = await supabase
            .from('works')
            .select('*')
            .eq('user_id', user.id);
            
          if (worksError) throw worksError;
          
          if (userWorks && userWorks.length > 0) {
            // 各作品のタグを取得
            const worksWithTags = await Promise.all(
              userWorks.map(async (work: Work) => {
                try {
                  // work_tags_with_namesビューを使用してタグを取得
                  const { data: tagsData, error: tagsError } = await supabase
                    .from('work_tags_with_names')
                    .select('*')
                    .eq('work_id', work.id);
                    
                  if (tagsError) throw tagsError;
                  
                  // タグ名を抽出
                  const tags = tagsData 
                    ? tagsData.map((item: WorkTagWithName) => item.tag_name).filter(Boolean)
                    : [];
                    
                  return {
                    ...work,
                    tags
                  };
                } catch (error) {
                  console.error(`Error fetching tags for work ${work.id}:`, error);
                  return {
                    ...work,
                    tags: []
                  };
                }
              })
            );
            
            // AI分析を実行
            const analysisResult = await analyzeUserData(worksWithTags as Work[]);
            
            // 既存のuser_insightsレコードを確認
            const { data: existingInsight } = await supabase
              .from('user_insights')
              .select('id')
              .eq('user_id', user.id)
              .single();
              
            if (existingInsight) {
              // 既存のレコードを更新
              await supabase
                .from('user_insights')
                .update({
                  expertise: analysisResult.expertise,
                  uniqueness: analysisResult.uniqueness,
                  interests: analysisResult.interests,
                  talent: analysisResult.talent,
                  specialties: analysisResult.specialties,
                  design_styles: analysisResult.designStyles,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingInsight.id);
            } else {
              // 新しいレコードを作成
              await supabase
                .from('user_insights')
                .insert([{
                  user_id: user.id,
                  expertise: analysisResult.expertise,
                  uniqueness: analysisResult.uniqueness,
                  interests: analysisResult.interests,
                  talent: analysisResult.talent,
                  specialties: analysisResult.specialties,
                  design_styles: analysisResult.designStyles
                }]);
            }
          }
        } catch (analysisError) {
          console.error('AI分析の実行または保存に失敗しました:', analysisError);
          // 分析エラーは致命的ではないので、作品保存は続行
        }
      }

      // 4. ファイルがある場合はアップロード
      if (form.file) {
        const fileExt = form.file.name.split('.').pop();
        const fileName = `${workData.id}.${fileExt}`;
        const filePath = `works/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('works')
          .upload(filePath, form.file);

        if (uploadError) {
          console.error('ファイルのアップロードに失敗しました:', uploadError);
        } else {
          // アップロードに成功したら、作品のサムネイルURLを更新
          const { data: publicUrl } = supabase.storage
            .from('works')
            .getPublicUrl(filePath);

          if (publicUrl) {
            await supabase
              .from('works')
              .update({ thumbnail_url: publicUrl.publicUrl })
              .eq('id', workData.id);
          }
        }
      }

      navigate('/portfolio');
    } catch (err) {
      setError(err instanceof Error ? err.message : '作品の登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // URL分析結果を受け取る処理
  const handleAnalysisComplete = (result: UrlAnalysisResult) => {
    // 分析結果をフォームに反映
    setForm(prev => ({
      ...prev,
      title: result.title || prev.title,
      description: result.description || prev.description,
      source_url: result.url || prev.source_url,
      image_url: result.image || prev.image_url,
    }));
    
    // タグの設定（カンマ区切りの文字列に変換）
    if (result.tags && result.tags.length > 0) {
      const tagString = result.tags
        .sort((a: { relevance: number }, b: { relevance: number }) => b.relevance - a.relevance) // 関連度の高い順にソート
        .slice(0, 5) // 上位5つのタグを選択
        .map((tag: { name: string }) => tag.name)
        .join(', ');
      
      setForm(prev => ({
        ...prev,
        tags: tagString
      }));
    }
    
    // モーダルを閉じる
    setShowUrlAnalyzer(false);
  };

  // タグ分析結果を受け取る処理
  const handleTagAnalysisComplete = (tags: Array<{name: string; relevance: number}>) => {
    if (tags && tags.length > 0) {
      const tagString = tags
        .sort((a: { relevance: number }, b: { relevance: number }) => b.relevance - a.relevance)
        .slice(0, 5)
        .map((tag: { name: string }) => tag.name)
        .join(', ');
      
      setForm(prev => ({
        ...prev,
        tags: tagString
      }));
    }
    
    setShowTagAnalysis(false);
  };

  // タグを削除する処理
  const removeTag = (tagToRemove: string) => {
    const updatedTags = tagArray.filter(tag => tag !== tagToRemove);
    setForm(prev => ({
      ...prev,
      tags: updatedTags.join(', ')
    }));
  };

  // タグを追加する処理
  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (newTag && !tagArray.includes(newTag)) {
        const updatedTags = [...tagArray, newTag];
        setForm(prev => ({
          ...prev,
          tags: updatedTags.join(', ')
        }));
        e.currentTarget.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/portfolio')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            ポートフォリオに戻る
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

        <h2 className="text-lg font-medium text-gray-900 mb-4">作品の種類</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => {
              setSelectedType('writing');
              setForm(prev => ({ ...prev, work_type: 'writing' }));
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
              setSelectedType('design');
              setForm(prev => ({ ...prev, work_type: 'design' }));
            }}
            className={`relative rounded-lg border p-4 text-center hover:border-indigo-600 ${
              selectedType === 'design' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
            }`}
          >
            <div className="flex justify-center mb-2">
              <Image className={`w-6 h-6 ${selectedType === 'design' ? 'text-indigo-600' : 'text-gray-400'}`} />
            </div>
            <span className={`text-sm font-medium ${selectedType === 'design' ? 'text-indigo-600' : 'text-gray-900'}`}>
              デザイン
            </span>
          </button>
        </div>

        {selectedType === 'writing' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">URLから自動取得</h2>
              <button
                type="button"
                onClick={() => setShowUrlAnalyzer(!showUrlAnalyzer)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                {showUrlAnalyzer ? 'URL分析を閉じる' : 'URL分析を開く'}
              </button>
            </div>
            
            {showUrlAnalyzer ? (
              <UrlAnalyzer 
                userId={userId || undefined} 
                onAnalysisComplete={handleAnalysisComplete}
              />
            ) : (
              <p className="text-gray-600 text-sm mb-4">
                URLを入力するだけで、タイトル、説明文、タグを自動取得できます。
                <button
                  type="button"
                  onClick={() => setShowUrlAnalyzer(true)}
                  className="text-indigo-600 hover:text-indigo-800 ml-2"
                >
                  URL分析を開く
                </button>
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">作品情報</h2>
            <form id="work-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="source_url" className="block text-sm font-medium text-gray-700 mb-1">
                  作品URL
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="source_url"
                    id="source_url"
                    required
                    value={form.source_url}
                    onChange={handleChange}
                    placeholder="https://example.com/your-work"
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  URLを入力すると、タイトルや説明文を自動で取得します
                </p>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={form.title}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {selectedType === 'design' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      デザインファイル
                    </label>
                    <div 
                      className={`relative border-2 border-dashed rounded-lg p-6 ${
                        dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                      } transition-colors duration-200`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {form.preview ? (
                        <div className="relative">
                          <img
                            src={form.preview}
                            alt="プレビュー"
                            className="max-w-full h-auto rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, file: null, preview: null }))}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-100"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4 flex text-sm leading-6 text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                            >
                              <span>ファイルを選択</span>
                              <input
                                id="file-upload"
                                name="file"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/x-photoshop,application/illustrator"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleFiles(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                            <p className="pl-1">またはドラッグ＆ドロップ</p>
                          </div>
                          <p className="text-xs leading-5 text-gray-600 mt-2">
                            JPEG, PNG, GIF, PSD, AI, PDF, WEBP (最大10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="design_type" className="block text-sm font-medium text-gray-700 mb-1">
                      デザインタイプ
                    </label>
                    <input
                      type="text"
                      name="design_type"
                      id="design_type"
                      value={form.design_type}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Webデザイン、ロゴデザインなど"
                    />
                  </div>

                  <div>
                    <label htmlFor="design_url" className="block text-sm font-medium text-gray-700">
                      デザイン作品URL
                    </label>
                    <input
                      type="url"
                      name="design_url"
                      id="design_url"
                      value={form.design_url}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="behance_url" className="block text-sm font-medium text-gray-700">
                      Behance URL
                    </label>
                    <input
                      type="url"
                      name="behance_url"
                      id="behance_url"
                      value={form.behance_url}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="dribbble_url" className="block text-sm font-medium text-gray-700">
                      Dribbble URL
                    </label>
                    <input
                      type="url"
                      name="dribbble_url"
                      id="dribbble_url"
                      value={form.dribbble_url}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  タグ
                </label>
                <div className="mb-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tagArray.map((tag, index) => (
                      <div 
                        key={index} 
                        className="inline-flex items-center bg-indigo-100 text-indigo-800 text-xs rounded px-2 py-1"
                      >
                        <span>{tag}</span>
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-indigo-500 hover:text-indigo-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TagIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="tag-input"
                      placeholder="タグを入力してEnterキーを押してください"
                      className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      onKeyDown={addTag}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    カンマ区切りでタグを入力するか、1つずつ入力してEnterキーを押してください
                  </p>
                  <div className="mt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setShowTagAnalysis(!showTagAnalysis)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      {showTagAnalysis ? 'タグ分析を閉じる' : 'AIでタグを自動生成'}
                    </button>
                  </div>
                </div>
                
                {showTagAnalysis && userId && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                    <TagAnalysis 
                      userId={userId}
                      title={form.title}
                      description={form.description}
                      url={form.source_url}
                      content=""
                      onTagSelect={handleTagAnalysisComplete}
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowTagAnalysis(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    name="is_public"
                    checked={form.is_public}
                    onChange={(e) => setForm(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                    この作品を公開する
                  </label>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}