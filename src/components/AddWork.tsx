import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, FileText, Image, Link } from 'lucide-react';

export function AddWork() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'writing' | 'design'>('writing');
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
    is_public: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const { error: insertError } = await supabase
        .from('works')
        .insert([
          {
            user_id: user.id,
            ...form
          }
        ]);

      if (insertError) throw insertError;

      navigate('/dashboard');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
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

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">AI分析</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      URLを入力すると、AIがコンテンツを分析し、あなたの専門性や作品の特徴を可視化します
                    </div>
                  </div>
                </div>
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
                    <label htmlFor="design_type" className="block text-sm font-medium text-gray-700">
                      デザインタイプ
                    </label>
                    <input
                      type="text"
                      name="design_type"
                      id="design_type"
                      value={form.design_type}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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