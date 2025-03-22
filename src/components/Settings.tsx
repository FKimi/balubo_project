import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

type UserProfile = {
  id: string;
  name: string;
  bio: string;
  website_url: string;
  profile_image_url: string;
  twitter_username: string;
  instagram_username: string;
  facebook_username: string;
};

export function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserProfile>({
    id: '',
    name: '',
    bio: '',
    website_url: '',
    profile_image_url: '',
    twitter_username: '',
    instagram_username: '',
    facebook_username: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          navigate('/login');
          return;
        }

        // First check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // Profile doesn't exist yet, create initial form with user ID
          setForm(prev => ({ ...prev, id: user.id }));
        } else if (fetchError) {
          throw fetchError;
        } else {
          // Profile exists, use it
          setForm(existingProfile);
        }
      } catch (err) {
        setError('プロフィールの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    // Validate required fields
    if (!form.id) {
      setError('ユーザーIDが無効です');
      setSaving(false);
      return;
    }

    try {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: form.id,
          name: form.name,
          bio: form.bio,
          website_url: form.website_url,
          profile_image_url: form.profile_image_url,
          twitter_username: form.twitter_username,
          instagram_username: form.instagram_username,
          facebook_username: form.facebook_username,
        });

      if (upsertError) throw upsertError;
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの保存に失敗しました');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
            form="settings-form"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">プロフィール設定</h2>
            <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={form.name}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="profile_image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  プロフィール画像URL
                </label>
                <input
                  type="url"
                  name="profile_image_url"
                  id="profile_image_url"
                  value={form.profile_image_url}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
                  ウェブサイトURL
                </label>
                <input
                  type="url"
                  name="website_url"
                  id="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">SNSアカウント</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="twitter_username" className="block text-sm font-medium text-gray-700 mb-1">
                      Twitter ユーザー名
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        name="twitter_username"
                        id="twitter_username"
                        value={form.twitter_username}
                        onChange={handleChange}
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="instagram_username" className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram ユーザー名
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        name="instagram_username"
                        id="instagram_username"
                        value={form.instagram_username}
                        onChange={handleChange}
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="facebook_username" className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook ユーザー名
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        name="facebook_username"
                        id="facebook_username"
                        value={form.facebook_username}
                        onChange={handleChange}
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
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