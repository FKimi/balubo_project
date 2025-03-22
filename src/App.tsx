import { Routes, Route, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, FileText, LineChart, Sparkles } from 'lucide-react';
import { SignUpForm } from './components/SignUpForm';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { Register } from './components/Register';
import { Mypage } from './components/Mypage';
import { AddWork } from './components/AddWork';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { ToastProvider } from './components/Toast';
import { OgpTest } from './components/OgpTest';
import { GeminiUrlTest } from './components/GeminiUrlTest';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Balubo
            <span className="block text-indigo-600">AI分析型ポートフォリオ</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            URLを入力するだけで、あなたの作品をAIが分析。<br />
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
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">主な機能</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              あなたの作品を最大限に引き立てる
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Baluboは、あなたの作品をAIが分析し、最適なポートフォリオを自動生成します。
              URLを入力するだけで、あなたの専門性や強みを可視化します。
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <Bot className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  AI分析
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Google Gemini AIが、あなたの作品を分析し、専門性や強みを抽出します。
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  自動要約
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  長い記事も自動で要約し、ポイントを簡潔にまとめます。
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  タグ自動生成
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  あなたの作品に関連するキーワードやスキルを自動でタグ付けします。
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <LineChart className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  スキル可視化
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  あなたのスキルセットを可視化し、強みを効果的にアピールします。
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/works/new" element={<AddWork />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/ogp-test" element={<OgpTest />} />
        <Route path="/gemini-test" element={<GeminiUrlTest />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
