import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Client } from '../../types';
import ClientLayout from './ClientLayout';
import { Building2, Globe, MapPin, Phone, Mail, Calendar, Users, Info, Edit } from 'lucide-react';

const ClientProfileView: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Client | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (window.location.pathname !== '/client/login') {
            navigate('/client/login');
          }
          return;
        }

        const { data, error } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // プロフィールが存在しない場合は編集画面に遷移
            if (window.location.pathname !== '/client/profile/edit') {
              navigate('/client/profile/edit');
            }
            return;
          }
          
          throw error;
        }

        setProfile(data);
      } catch (err) {
        console.error('プロフィール取得エラー:', err);
        setError('プロフィール情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate('/client/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">企業プロフィール</h1>
          <button
            onClick={() => navigate('/client/profile/edit')}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
          >
            <Edit className="h-4 w-4" />
            <span>編集する</span>
          </button>
        </div>

        {profile && (
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                基本情報
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">会社名</p>
                  <p className="font-medium">{profile.company_name || '未設定'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">業種</p>
                  <p className="font-medium">{profile.industry || '未設定'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">企業規模</p>
                  <p className="font-medium">{profile.company_size || '未設定'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">設立年</p>
                  <p className="font-medium">{profile.founded_year || '未設定'}</p>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Globe className="h-4 w-4 mr-1 text-gray-400" />
                    Webサイト
                  </p>
                  {profile.website ? (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    <p className="text-gray-500">未設定</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500 flex items-center">
                  <Info className="h-4 w-4 mr-1 text-gray-400" />
                  会社概要
                </p>
                <div className="mt-2 p-4 bg-gray-50 rounded-md">
                  {profile.description ? (
                    <p className="whitespace-pre-line">{profile.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">会社概要は設定されていません</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 連絡先情報 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                連絡先情報
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Users className="h-4 w-4 mr-1 text-gray-400" />
                    担当者名
                  </p>
                  <p className="font-medium">{profile.contact_person || '未設定'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                    連絡先メールアドレス
                  </p>
                  <p className="font-medium">{profile.contact_email || profile.email || '未設定'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    連絡先電話番号
                  </p>
                  <p className="font-medium">{profile.contact_phone || '未設定'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    所在地
                  </p>
                  <p className="font-medium">{profile.company_address || '未設定'}</p>
                </div>
              </div>
            </div>
            
            {/* アカウント情報 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">アカウント情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">登録日</p>
                  <p className="font-medium">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('ja-JP') : '不明'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">最終更新日</p>
                  <p className="font-medium">
                    {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('ja-JP') : '不明'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientProfileView; 