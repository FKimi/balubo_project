import { Routes, Route, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, FileText, LineChart, Sparkles } from 'lucide-react';
import { SignUpForm } from './components/SignUpForm';
import { LoginForm } from './components/LoginForm';
import Mypage from './components/Mypage';
import { Register } from './components/Register';
import { AddWork } from './components/AddWork';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { AuthCallback } from './components/AuthCallback';
import { ToastProvider } from './components/Toast';
import WorkDetail from './components/WorkDetail';
import ProfileEdit from './components/ProfileEdit';
// テスト用コンポーネントは一時的にコメントアウト
// import { OgpTest } from './components/OgpTest';
// import { GeminiUrlTest } from './components/GeminiUrlTest';

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

      {/* Concept Section */}
      <section className="py-16 bg-indigo-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">サービスコンセプト</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              あなたの強みを、AIが客観的に可視化
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Baluboは、ライターやクリエイター向けのAI解析型ポートフォリオ自動生成サービスです。
              複数のメディアやサイトに散在する作品を一元管理し、AIによる客観的な分析で
              あなたの専門性や強みを効果的にアピールします。
            </p>
          </div>
        </div>
      </section>

      {/* Problem Solution Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-12">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">解決する課題</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              クリエイターの3つの悩みを解決
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">ポートフォリオ作成の手間</h3>
              <p className="text-gray-600">
                専門知識や時間をかけずに、手軽に作品をまとめて魅力的なポートフォリオを作成できます。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">客観的な自己PRの難しさ</h3>
              <p className="text-gray-600">
                AIによる客観的な分析で、あなたの強みや専門性を正確に把握し、効果的にアピールできます。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">作品の散在</h3>
              <p className="text-gray-600">
                複数のメディアやサイトに掲載された作品を一箇所で管理し、体系的に整理できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-white">
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

      {/* How to Use Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-12">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">使い方</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              3ステップで簡単スタート
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute top-12 left-0 w-full border-t-2 border-indigo-200 hidden md:block"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm relative z-10">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-xl font-semibold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">アカウント作成</h3>
                <p className="text-gray-600 text-center">
                  メールアドレスまたはGoogleアカウントで簡単に登録できます。
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm relative z-10">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-xl font-semibold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">作品のURL入力</h3>
                <p className="text-gray-600 text-center">
                  あなたの作品が掲載されているURLを入力するだけで、自動的に情報を取得します。
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm relative z-10">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-xl font-semibold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">AI分析の実行</h3>
                <p className="text-gray-600 text-center">
                  ボタン一つでAI分析を実行し、あなたの専門性や強みを可視化したポートフォリオが完成します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-indigo-600 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-100">描きたい未来</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              クリエイターの可能性を最大化する
            </p>
            <p className="mt-6 text-lg leading-8 text-indigo-100">
              Baluboは、すべてのクリエイターが自分の強みを正確に理解し、適切な評価を受け、
              最適な仕事とつながる世界を目指しています。
              AIの力で、クリエイティブな才能が正当に評価される未来を創造します。
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              あなたの才能を世界に
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              今すぐ無料で始めて、あなたの作品の価値を最大限に引き出しましょう。
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
