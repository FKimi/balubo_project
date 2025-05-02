import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ClientProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // プロフィール情報の状態
  const [profile, setProfile] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    description: '',
    website: '',
    company_address: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    founded_year: '',
    logo_url: null as string | null,
  });

  // 企業規模の選択肢
  const companySizeOptions = [
    '1-10名',
    '11-50名',
    '51-200名',
    '201-500名',
    '501-1000名',
    '1001名以上'
  ];

  // 業種の選択肢
  const industryOptions = [
    'IT・通信',
    '金融・保険',
    '広告・マーケティング',
    '小売・流通',
    '製造',
    '医療・ヘルスケア',
    '教育',
    '不動産',
    '人材・サービス',
    '飲食・フード',
    'エンターテイメント',
    'その他'
  ];

  // プロフィール情報の取得
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/client/login');
        return;
      }

      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // データが見つからない場合は正常に続行（新規ユーザー）
        if (error.code === 'PGRST116') {
          console.log('プロフィール情報が未作成です。新規作成します。');
          setLoading(false);
          return;
        }
        
        console.error('プロフィール取得エラー:', error);
        setError('プロフィール情報の取得に失敗しました');
        setLoading(false);
        return;
      }

      if (data) {
        setProfile({
          company_name: data.company_name || '',
          industry: data.industry || '',
          company_size: data.company_size || '',
          description: data.description || '',
          website: data.website || '',
          company_address: data.company_address || '',
          contact_person: data.contact_person || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          founded_year: data.founded_year || '',
          logo_url: data.logo_url,
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  // 入力フィールドの変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // プロフィール保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/client/login');
        return;
      }

      // まずは既存のレコードをチェック
      const { data: existingProfile } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      
      if (existingProfile) {
        // 既存のレコードがある場合は更新
        result = await supabase
          .from('client_profiles')
          .update({
            company_name: profile.company_name,
            industry: profile.industry,
            company_size: profile.company_size,
            description: profile.description,
            website: profile.website,
            company_address: profile.company_address,
            contact_person: profile.contact_person,
            contact_email: profile.contact_email,
            contact_phone: profile.contact_phone,
            founded_year: profile.founded_year,
            logo_url: profile.logo_url,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // 新規レコード作成
        result = await supabase
          .from('client_profiles')
          .insert({
            user_id: user.id,
            company_name: profile.company_name,
            industry: profile.industry,
            company_size: profile.company_size,
            description: profile.description,
            website: profile.website,
            company_address: profile.company_address,
            contact_person: profile.contact_person,
            contact_email: profile.contact_email,
            contact_phone: profile.contact_phone,
            founded_year: profile.founded_year,
            logo_url: profile.logo_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        throw result.error;
      }

      setSuccessMessage('プロフィールを保存しました');
      window.scrollTo(0, 0);
      
      // 保存成功後、3秒後にダッシュボードにリダイレクト
      setTimeout(() => {
        navigate('/client/dashboard');
      }, 3000);
    } catch (error) {
      console.error('プロフィール保存エラー:', error);
      setError('プロフィールの保存に失敗しました');
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">企業プロフィール</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">プロフィール情報を読み込み中...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">基本情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                  会社名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={profile.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  業種 <span className="text-red-500">*</span>
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={profile.industry}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">選択してください</option>
                  {industryOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="company_size" className="block text-sm font-medium text-gray-700 mb-1">
                  企業規模
                </label>
                <select
                  id="company_size"
                  name="company_size"
                  value={profile.company_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">選択してください</option>
                  {companySizeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700 mb-1">
                  設立年
                </label>
                <input
                  type="number"
                  id="founded_year"
                  name="founded_year"
                  value={profile.founded_year}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                会社概要
              </label>
              <textarea
                id="description"
                name="description"
                value={profile.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="会社の事業内容や特徴などを入力してください"
              />
            </div>
            
            <div className="mt-4">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Webサイト
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={profile.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com"
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">連絡先情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                  担当者名
                </label>
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  value={profile.contact_person}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                  連絡先メールアドレス
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={profile.contact_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  連絡先電話番号
                </label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={profile.contact_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 mb-1">
                  所在地
                </label>
                <input
                  type="text"
                  id="company_address"
                  name="company_address"
                  value={profile.company_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/client/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  保存中...
                </>
              ) : '保存する'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ClientProfile; 