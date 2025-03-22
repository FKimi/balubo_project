import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Globe, Twitter, Instagram, Facebook, Bot } from 'lucide-react';

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

export function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            bio,
            website_url,
            profile_image_url,
            twitter_username,
            instagram_username,
            facebook_username
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError('プロフィールの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">エラー</h2>
          <p className="mt-2 text-sm text-gray-500">{error || 'プロフィールが見つかりません'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            トップページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">
                    {profile.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name || '名前未設定'}</h1>
                <div className="mt-1 flex items-center space-x-4">
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {profile.twitter_username && (
                    <a
                      href={`https://twitter.com/${profile.twitter_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile.instagram_username && (
                    <a
                      href={`https://instagram.com/${profile.instagram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {profile.facebook_username && (
                    <a
                      href={`https://facebook.com/${profile.facebook_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6">
                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            <div className="mt-8">
              <div className="flex items-center">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h2 className="ml-2 text-lg font-medium text-gray-900">AI分析</h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-indigo-900">専門性</h3>
                  <p className="mt-1 text-sm text-indigo-700">
                    テクノロジー、プログラミングに関する深い知識と実践的な経験
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-indigo-900">スタイル</h3>
                  <p className="mt-1 text-sm text-indigo-700">
                    論理的で分かりやすい説明、実践的なアプローチ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}