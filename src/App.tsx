import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { supabaseAdmin } from './lib/supabase-admin';
import './App.css';
import Mypage from './components/profile/Mypage';
import { SupabaseConnectionTest } from './components/debug/SupabaseConnectionTest';
import { ArrowRight, FileText, LineChart, Sparkles } from 'lucide-react';
import { SignUpForm } from './components/SignUpForm';
import { LoginForm } from './components/LoginForm';
import { Register } from './components/Register';
import { AddWork } from './components/works/AddWork';
import { Settings } from './components/profile/Settings';
import { AuthCallback } from './components/AuthCallback';
import { ToastProvider } from './components/Toast';
import WorkDetail from './components/WorkDetail';
import ProfileEdit from './components/profile/ProfileEdit';
import Profile from './components/profile/Profile';
import { logEnvironmentInfo, logSupabaseDetails } from './lib/debug-logger';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Balubo
            <span className="block text-indigo-600">AI分析型ポートフォリオサービス</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            URLを入力するだけで、あなたの作品をAIが分析。<br />
            専門性・作品特徴・興味関心を<span className="text-indigo-600">可視化</span>し、<br />
            プロフェッショナルなポートフォリオを<span className="text-indigo-600">自動生成</span>します。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={() => navigate('/signup')}
              className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2"
            >
              無料で始める <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              AIがあなたの作品を<span className="text-indigo-600">深く分析</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              URLを入力するだけで、あなたの作品を自動で分析。<br />
              専門性や作風、興味関心を可視化します。
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <Sparkles className="h-6 w-6 flex-none text-indigo-600" aria-hidden="true" />
                  専門性分析
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    あなたの作品から専門性を自動抽出。どんな分野に強みがあるかを可視化します。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <FileText className="h-6 w-6 flex-none text-indigo-600" aria-hidden="true" />
                  文章スタイル分析
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    あなたの文章の特徴や表現スタイルを分析。独自の魅力を客観的に把握できます。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <LineChart className="h-6 w-6 flex-none text-indigo-600" aria-hidden="true" />
                  興味関心分析
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    あなたが取り上げるテーマや題材から興味関心を分析。自分では気づかなかった傾向を発見できます。
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              今すぐ始めましょう
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              無料でアカウントを作成して、あなたの作品をAIで分析。<br />
              プロフェッショナルなポートフォリオを簡単に作成できます。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => navigate('/signup')}
                className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2"
              >
                無料で始める <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function App() {
  // デバッグ用の一時的な表示
  const isDebugMode = false;
  const [connectionTest, setConnectionTest] = useState<{
    supabase: 'untested' | 'success' | 'failed';
    supabaseAdmin: 'untested' | 'success' | 'failed';
    error?: string;
  }>({
    supabase: 'untested',
    supabaseAdmin: 'untested'
  });

  // アプリケーション初期化時のデバッグ情報を出力
  useEffect(() => {
    logEnvironmentInfo();
    logSupabaseDetails();
  }, []);

  // Supabase接続テスト
  useEffect(() => {
    if (isDebugMode) {
      // 環境変数の状態をチェック
      const envStatus = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '設定あり' : '未設定',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定あり' : '未設定',
        VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '設定あり' : '未設定',
        VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY ? '設定あり' : '未設定',
      };
      
      console.log('[環境変数状態]', envStatus);
      
      // 通常のSupabaseクライアントのテスト
      async function testNormalSupabase() {
        try {
          const { error } = await supabase.from('profiles').select('count()', { count: 'exact', head: true });
          if (error) {
            setConnectionTest(prev => ({ ...prev, supabase: 'failed', error: error.message }));
            console.error('[ERROR] 通常Supabase接続エラー:', { message: error.message });
          } else {
            setConnectionTest(prev => ({ ...prev, supabase: 'success' }));
            console.log('[SUCCESS] 通常Supabase接続成功');
          }
        } catch (error) {
          setConnectionTest(prev => ({ ...prev, supabase: 'failed', error: String(error) }));
          console.error('[ERROR] 通常Supabase接続例外:', { message: error instanceof Error ? error.message : String(error) });
        }
      }
      
      // Supabase管理者クライアントのテスト
      const testSupabaseAdmin = async () => {
        try {
          // 少しの遅延を入れて、テストをシーケンシャルに実行
          await new Promise(resolve => setTimeout(resolve, 500));
          const { error } = await supabaseAdmin.from('profiles').select('count()', { count: 'exact', head: true });
          if (error) {
            setConnectionTest(prev => ({ ...prev, supabaseAdmin: 'failed', error: error.message }));
            console.error('[ERROR] 管理者Supabase接続エラー:', { message: error.message });
          } else {
            setConnectionTest(prev => ({ ...prev, supabaseAdmin: 'success' }));
            console.log('[SUCCESS] 管理者Supabase接続成功');
          }
        } catch (error) {
          setConnectionTest(prev => ({ ...prev, supabaseAdmin: 'failed', error: String(error) }));
          console.error('[ERROR] 管理者Supabase接続例外:', { message: error instanceof Error ? error.message : String(error) });
        }
      };

      testNormalSupabase();
      testSupabaseAdmin();
    }
  }, [isDebugMode]);

  if (isDebugMode) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: '#3182ce', marginBottom: '20px' }}>Balubo - デバッグモード</h1>
        <SupabaseConnectionTest initialStatus={connectionTest} />
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => {
              localStorage.setItem('debugMode', 'false');
              window.location.reload();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            通常モードで再読み込み
          </button>
        </div>
      </div>
    );
  }

  // 通常の App コンポーネントの内容
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<Mypage />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/works/new" element={<AddWork />} />
        <Route path="/works/:id" element={<WorkDetail />} />
        <Route path="/works/edit/:id" element={<AddWork />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* テスト用ルートはコメントアウト */}
        {/* <Route path="/ogp-test" element={<OgpTest />} />
        <Route path="/gemini-test" element={<GeminiUrlTest />} /> */}
      </Routes>
    </ToastProvider>
  );
}

export default App;
