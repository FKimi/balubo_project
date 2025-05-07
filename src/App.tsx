import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from './lib/supabase';
// import { supabaseAdmin } from './lib/supabase-admin';
import './App.css';
import { 
  ArrowRight, 
  FileText, 
  LineChart, 
  Sparkles, 
  XCircle, 
  Users, 
  Zap, 
  Target, 
  PenTool, 
  BrainCircuit, 
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { ToastProvider } from './components/ui/Toast';
import { logEnvironmentInfo, logSupabaseDetails } from './lib/debug-logger';
import Loading from './components/common/Loading';
import Home from './components/user/Home';
import { GlobalHeader } from './components/layout';
// import { BottomNavigation } from './components/layout';
import { AppProvider } from './lib/context/AppContext';

// 遅延ロードされるコンポーネント
const ClientDashboard = lazy(() => import('./components/client/ClientDashboard'));
const ClientProjects = lazy(() => import('./components/client/ClientProjects'));
const ClientPage = lazy(() => import('./components/client/page'));
const ClientLogin = lazy(() => import('./components/client/ClientLogin'));
const ClientRegister = lazy(() => import('./components/client/ClientRegister'));
const ClientCreators = lazy(() => import('./components/client/ClientCreators'));
const ClientProjectNew = lazy(() => import('./components/client/ClientProjectNew'));
const ClientProfile = lazy(() => import('./components/client/ClientProfile'));
const ClientProfileView = lazy(() => import('./components/client/ClientProfileView'));
const ClientMessages = lazy(() => import('./components/client/ClientMessages'));
const MessagesPage = lazy(() => import('./components/pages/MessagesPage'));
// const Mypage = lazy(() => import('./components/profile/Mypage'));
const SignUpForm = lazy(() => import('./components/auth/SignUpForm').then(module => ({ default: module.SignUpForm })));
const LoginForm = lazy(() => import('./components/auth/LoginForm').then(module => ({ default: module.LoginForm })));
const Register = lazy(() => import('./components/auth/Register').then(module => ({ default: module.Register })));
const WorkCreateWeb = lazy(() => import('./components/user/works/WorkCreateWeb').then(module => ({ default: module.AddWork })));
// const WorkCreateDesign = lazy(() => import('./components/user/works/WorkCreateDesign').then(module => ({ default: module.WorkCreate })));
const Settings = lazy(() => import('./components/user/Settings').then(module => ({ default: module.Settings })));
const AuthCallback = lazy(() => import('./components/auth/AuthCallback'));
const WorkDetail = lazy(() => import('./components/user/works/WorkDetail'));
const ProfileEdit = lazy(() => import('./components/user/ProfileEdit'));
const Profile = lazy(() => import('./components/user/Profile'));
const AIAnalysisDashboard = lazy(() => import('./components/user/AIAnalysisDashboard'));
const Portfolio = lazy(() => import('./components/user/portfolio/Portfolio'));
// const TagAnalysis = lazy(() => import('./components/TagAnalysis').then(module => ({ default: module.TagAnalysis || module.default })));
// const CreatorAnalysis = lazy(() => import('./components/CreatorAnalysis').then(module => ({ default: module.CreatorAnalysis || module.default })));
const DebugPage = lazy(() => import('./components/pages/DebugPage'));
const SearchPage = lazy(() => import('./components/user/search/UserSearchPage'));
const GalleryPage = lazy(() => import('./components/pages/GalleryPage'));

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* ヘッダー */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-500">balubo</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログイン
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                無料で始める
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            <span className="text-indigo-500">AIが</span>クリエイターの新しい魅力を<span className="text-indigo-500">発見・証明</span>
            <span className="block mt-2">ミスマッチのない最適な仕事と出会う</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Baluboは<span className="text-indigo-500">「AIによる作品分析」</span>を通じて、<br />
            クリエイターの<span className="text-indigo-500">魅力を客観的に発見・証明</span>するポートフォリオサービスです。<br />
            ポートフォリオに「客観性」をもたらすことで、<br />
            クリエイターと発注者のミスマッチを解決することを目指します。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={() => navigate('/signup')}
              className="rounded-md bg-indigo-500 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 flex items-center gap-2"
            >
              無料で始める <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 課題提起セクション */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              こんな悩み、ありませんか？
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              クリエイターと発注者の間に生じる「ミスマッチ」の現実
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {/* クリエイターの悩み */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-indigo-500">
                <PenTool className="h-6 w-6 mr-2" />
                クリエイターの悩み
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>ポートフォリオ作成に時間がかかり、本業に集中できない</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>自分の強みや専門性を客観的に言語化できず、自己PRが苦手</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>自分の作品の価値が適切に評価されているか不安</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>自分に合った仕事かどうか判断するのが難しい</span>
                </li>
              </ul>
            </div>
            
            {/* 発注者の悩み */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-indigo-500">
                <Users className="h-6 w-6 mr-2" />
                発注者の悩み
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>クリエイターの実際のスキルや専門性を見極めるのが難しい</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>ポートフォリオだけでは、実際の仕事の質が予測できない</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>期待していた成果物と実際の納品物にギャップがある</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>プロジェクトに最適なクリエイターを効率的に見つけられない</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ソリューション紹介セクション */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              その悩み、<span className="text-indigo-500">Balubo</span>がAIで解決します
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              AI分析型ポートフォリオサービス「Balubo」は、<br />
              URL入力だけであなたの真の価値を客観的に可視化します
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <Zap className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                  ポートフォリオ自動生成
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    作品URLを入力するだけで、あなたのポートフォリオを自動生成。手間と時間を大幅に削減します。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <BrainCircuit className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                  AIによる客観的分析
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    AIを活用し、あなたの専門性、スタイル、作品のユニークさを客観的に分析します。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <Target className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                  ミスマッチの解消
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    客観的な分析結果により、クリエイターと発注者の間のミスマッチを解消し、最適なマッチングを実現します。
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              AIがあなたの作品を<span className="text-indigo-500">多角的に分析</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              クリエイターの価値を測る要素は多様ですが、Baluboでは特に重要な3つの要素を分析。<br />
              URLを入力するだけで、あなたの作品の真の価値を客観的に可視化します。
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <Sparkles className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                  創造性と独自性
                  <span className="text-indigo-500 ml-1 text-sm">(オリジナリティ)</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    あなたの作品の独創性や新しい視点を分析。他のクリエイターとの差別化ポイントを明確にします。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <FileText className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                  専門性とスキル
                  <span className="text-indigo-500 ml-1 text-sm">(クオリティ)</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    あなたの専門知識や技術的な熟練度を評価。作品の質や完成度を客観的に分析します。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <LineChart className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                  影響力と共感
                  <span className="text-indigo-500 ml-1 text-sm">(エンゲージメント)</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    あなたの作品が読者や視聴者に与える影響力や共感性を分析。感情的な繋がりを生み出す力を評価します。
                  </p>
                </dd>
              </div>
            </dl>
            <p className="mt-12 text-center text-base text-gray-600">
              これら3つの要素を総合的に見ることで、あなたの多面的な価値や魅力をより深く理解できます。
            </p>
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
                className="rounded-md bg-indigo-500 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 flex items-center gap-2"
              >
                無料で始める <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              3ステップで簡単スタート
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Baluboの利用はとても簡単です
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md text-center relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">アカウント作成</h3>
              <p className="text-gray-600">
                無料でアカウントを作成。メールアドレスとパスワードだけで簡単に登録できます。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="flex justify-center mb-4">
                <FileText className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">作品URL入力</h3>
              <p className="text-gray-600">
                あなたの作品のURLを入力するだけ。ニュースメディア、note、ブログなどさまざまなプラットフォームに対応。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI分析実行</h3>
              <p className="text-gray-600">
                AIがあなたの作品を自動分析。専門性、スタイル、作品のユニークさなどを客観的に可視化します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQセクション */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              よくある質問
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Baluboについてよく寄せられる質問と回答
            </p>
          </div>
          
          <div className="mx-auto max-w-3xl">
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-semibold flex items-center">
                    <HelpCircle className="h-5 w-5 text-indigo-500 mr-2" />
                    どんなクリエイターにおすすめですか？
                  </h3>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </div>
                <div className="mt-2 text-gray-600">
                  主にライターや編集者、デザイナー、カメラマンなど、作品をポートフォリオとして管理したいクリエイターにおすすめです。特に自分の強みや専門性を客観的に把握したい方、効率的に自己PRしたい方に最適です。
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-semibold flex items-center">
                    <HelpCircle className="h-5 w-5 text-indigo-500 mr-2" />
                    無料プランでどこまでできますか？
                  </h3>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </div>
                <div className="mt-2 text-gray-600">
                  無料プランでは、基本的なポートフォリオ作成とAI分析機能をご利用いただけます。作品の登録数に制限がありますが、主要な機能はすべてお試しいただけます。
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-semibold flex items-center">
                    <HelpCircle className="h-5 w-5 text-indigo-500 mr-2" />
                    AIはどのように分析するのですか？
                  </h3>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </div>
                <div className="mt-2 text-gray-600">
                  AIを使用した高精度な分析を提供。客観的かつ公平な評価を心がけ、あなたの真の価値を引き出します。
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-semibold flex items-center">
                    <HelpCircle className="h-5 w-5 text-indigo-500 mr-2" />
                    自己PRにどう役立ちますか？
                  </h3>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </div>
                <div className="mt-2 text-gray-600">
                  AIによる客観的な分析結果は、自分では気づかなかった強みや特徴を発見するのに役立ちます。これにより、より説得力のある自己PRが可能になり、クライアントや採用担当者に自分の価値を効果的に伝えることができます。
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 最終CTAセクション */}
      <section className="bg-indigo-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              あなたの才能を、AIで解き放とう
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              今すぐ無料でBaluboを始めて、あなたの真の価値を発見しましょう。<br />
              たった数分で、プロフェッショナルなポートフォリオの完成です。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => navigate('/signup')}
                className="rounded-md bg-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow-md hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 flex items-center gap-2 transition-all duration-300 hover:scale-105"
              >
                無料でBaluboを始める <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-6 text-sm text-gray-500">

            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-indigo-500 mb-4">Balubo</div>
            <div className="text-sm text-gray-500 mb-6">
              AI分析型ポートフォリオサービス
            </div>
            <div className="text-sm text-gray-400">
              {new Date().getFullYear()} Balubo. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const location = useLocation();
  // ヘッダーを非表示にしたいパス一覧
  const hideHeaderPaths = [
    '/',
    '/login',
    '/signup',
    '/register',
    '/creator/sign-in',
    '/creator/sign-up',
  ];
  const shouldHideHeader = hideHeaderPaths.includes(location.pathname);
  useEffect(() => {
    logEnvironmentInfo();
    logSupabaseDetails();
  }, []);

  // 通常の App コンポーネントの内容
  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
          {/* LP・認証系ページではグローバルヘッダー非表示 */}
          {!shouldHideHeader && <GlobalHeader />}
          <Suspense fallback={<Loading />}>
            {/* ヘッダーの高さ分（h-14 = 56px）だけ上部にパディングを追加 */}
            <div className={!shouldHideHeader ? 'pt-14' : ''}>
              <Routes>
                {/* LPトップページ（ライター特化LP） */}
                <Route path="/" element={<LandingPage />} />
                {/* 認証コールバックルートを最優先で処理 */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/callback" element={<AuthCallback />} />
                {/* ユーザー用ホーム画面ルートを追加 */}
                <Route path="/user/home" element={<Home />} />
                {/* クリエイター向けのルート */}
                <Route path="/creator/sign-in" element={<LoginForm />} />
                <Route path="/creator/sign-up" element={<SignUpForm />} />
                <Route path="/creator/dashboard" element={<Portfolio />} />
                {/* クライアント（企業）向けルート */}
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/client/projects" element={<ClientProjects />} />
                <Route path="/client/project/new" element={<ClientProjectNew />} />
                <Route path="/client" element={<ClientPage />} />
                <Route path="/client/login" element={<ClientLogin />} />
                <Route path="/client/register" element={<ClientRegister />} />
                <Route path="/client/creators" element={<ClientCreators />} />
                <Route path="/client/profile" element={<ClientProfileView />} />
                <Route path="/client/profile/edit" element={<ClientProfile />} />
                <Route path="/client/messages" element={<ClientMessages />} />
                <Route path="/client/home" element={<Home />} />
                {/* プロフィール関連ルート */}
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/dashboard" element={<AIAnalysisDashboard />} />
                {/* <Route path="/mypage" element={<Mypage />} /> */}
                <Route path="/mypage" element={<Portfolio />} />
                {/* 作品関連ルート */}
                <Route path="/add-work" element={<WorkCreateWeb />} />
                <Route path="/works/new" element={<WorkCreateWeb />} />
                <Route path="/user/works/create" element={<WorkCreateWeb />} />
                <Route path="/works/create" element={<WorkCreateWeb />} />
                <Route path="/works/:id" element={<WorkDetail />} />
                <Route path="/user/works/:id" element={<WorkDetail />} />
                <Route path="/works/edit/:id" element={<WorkCreateWeb />} />
                {/* ホーム画面 */}
                <Route path="/home" element={<Home />} />
                {/* 認証関連ルート */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<SignUpForm />} />
                <Route path="/register" element={<Register />} />
                {/* クリエイタープロフィールページ */}
                <Route path="/creator/:id" element={<Portfolio />} />
                <Route path="/profile/:id" element={<Portfolio />} />
                {/* 検索ページ */}
                <Route path="/search" element={<Suspense fallback={<Loading />}><SearchPage /></Suspense>} />
                {/* ギャラリーページ */}
                <Route path="/gallery" element={<Suspense fallback={<Loading />}><GalleryPage /></Suspense>} />
                {/* メッセージページ */}
                <Route path="/messages" element={<Suspense fallback={<Loading />}><MessagesPage /></Suspense>} />
                {/* デバッグページ */}
                <Route path="/debug" element={<DebugPage />} />
              </Routes>
            </div>
          </Suspense>
        </div>
        {/* ボトムナビゲーション（モバイルのみ表示） */}
        {/* <BottomNavigation /> */}
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
