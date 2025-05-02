import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 企業規模オプション型
export type CompanySize =
  | ''
  | '1-10'
  | '11-50'
  | '51-100'
  | '101-500'
  | '501-1000'
  | '1001+';

const ClientRegister: React.FC = () => {
  const [companyName, setCompanyName] = useState<string>('');
  // const [contactPerson, setContactPerson] = useState('');
  // const [contactPersonTitle, setContactPersonTitle] = useState('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [companySize, setCompanySize] = useState<CompanySize>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // 企業アカウント登録処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // 入力検証
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください');
      setLoading(false);
      return;
    }

    try {
      // ユーザー登録
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'client', // 企業アカウントとして登録
            company_name: companyName,
            industry: industry,
            company_size: companySize,
          }
        }
      });

      if (signUpError) throw signUpError;

      // プロフィール情報をデータベースに保存
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('client_profiles')
          .insert([
            {
              user_id: data.user.id,
              company_name: companyName,
              industry: industry,
              company_size: companySize,
              email: email,
              created_at: new Date(),
            },
          ]);

        if (profileError) throw profileError;
      }

      setSuccessMessage('登録が完了しました。メールアドレス確認後にログインしてください。');
      setTimeout(() => {
        navigate('/client/login');
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : '登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 業種選択肢
  const industryOptions = [
    'IT・通信',
    'メディア・広告',
    '金融・保険',
    '小売・EC',
    '製造',
    '医療・ヘルスケア',
    '教育',
    '不動産',
    '飲食・ホスピタリティ',
    'コンサルティング',
    'その他'
  ];

  // 企業規模選択肢
  const companySizeOptions: { value: CompanySize; label: string }[] = [
    { value: '', label: '選択してください' },
    { value: '1-10', label: '1-10人' },
    { value: '11-50', label: '11-50人' },
    { value: '51-100', label: '51-100人' },
    { value: '101-500', label: '101-500人' },
    { value: '501-1000', label: '501-1000人' },
    { value: '1001+', label: '1001人以上' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          トップに戻る
        </button>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          企業アカウント登録
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          すでにアカウントをお持ちの方は
          <button
            onClick={() => navigate('/client/login')}
            className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
          >
            ログイン
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{successMessage}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 会社名 */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                会社名 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 業種 */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                業種 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="industry"
                  name="industry"
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">選択してください</option>
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 企業規模 */}
            <div>
              <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                企業規模 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="companySize"
                  name="companySize"
                  required
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value as CompanySize)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  {companySizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">6文字以上で設定してください</p>
            </div>

            {/* パスワード（確認） */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認） <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* エラーメッセージ表示 */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* 送信ボタン */}
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? '登録中...' : 'アカウント登録'}
              </Button>
            </div>

            {/* 利用規約・プライバシーポリシー同意 */}
            <div className="text-xs text-gray-500 text-center mt-4">
              「アカウント登録」ボタンをクリックすることで、
              <a href="#" className="text-indigo-600 hover:text-indigo-500">利用規約</a>
              および
              <a href="#" className="text-indigo-600 hover:text-indigo-500">プライバシーポリシー</a>
              に同意したものとみなされます。
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientRegister; 