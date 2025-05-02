import { ArrowRight, Users, PenTool, Zap, BrainCircuit, FileText, Target, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClientPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* ヘッダー */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-600">balubo</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/client/login')}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログイン
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                新規登録
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            <span className="text-indigo-600">事業を動かす</span>
            <span className="block mt-2">プロクリエイターとの最高の出会い</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Baluboは<span className="text-indigo-600">「事業を理解する」</span>プロクリエイターと、<br />
            <span className="text-indigo-600">「クリエイティブで事業を加速させたい」</span>企業を<br />
            高精度でマッチングするプラットフォームです。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={() => navigate('/')}
              className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2"
            >
              新規登録 <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => document.getElementById('problem-section')?.scrollIntoView({behavior: 'smooth'})}
              className="text-indigo-600 hover:text-indigo-500 px-3 py-2 rounded-md text-lg font-medium"
            >
              詳しく見る
            </button>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントをお持ちでない方は
            <button
              onClick={() => navigate('/client/register')}
              className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
            >
              新規登録
            </button>
          </p>
        </div>
      </header>

      {/* 課題提起セクション */}
      <section id="problem-section" className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              こんな課題はありませんか？
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              質の高いコンテンツ制作において企業が直面する課題
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {/* 課題リスト */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-indigo-600">
                <Users className="h-6 w-6 mr-2" />
                企業の課題
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>事業目的やビジネス文脈を理解するクリエイターを見つけるのが困難</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>従来の方法ではクリエイターの質の見極めが難しい</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>探す手間がかかりすぎてコンテンツ制作が遅延する</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>期待していた成果と実際の納品物にギャップが生じる</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-indigo-600">
                <PenTool className="h-6 w-6 mr-2" />
                従来の探し方の限界
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>人脈や紹介：選択肢が限られる</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>SNS・検索：質の見極めに時間がかかる</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>クラウドソーシング：ビジネス理解度の高いクリエイターが見つかりにくい</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">❌</div>
                  <span>制作会社・代理店：コストが高い</span>
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
              <span className="text-indigo-600">balubo</span>の解決策
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              事業を理解し、成果を出せるプロクリエイターと<br />
              効率的・高精度にマッチングします
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <Zap className="h-6 w-6 flex-none text-indigo-600" aria-hidden="true" />
                  高精度AIマッチング
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    AI技術により、企業の依頼内容とクリエイターのスキル・実績・ビジネス理解度・価値観を多角的に分析し、最適な候補者を推薦します。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <BrainCircuit className="h-6 w-6 flex-none text-indigo-600" aria-hidden="true" />
                  厳選されたプロクリエイター
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    審査を通じて、ビジネス貢献意欲と高い専門性を持つクリエイターのみが登録。質の高いマッチングを実現します。
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <FileText className="h-6 w-6 flex-none text-indigo-600" aria-hidden="true" />
                  多角的なクリエイター情報
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    実績ポートフォリオだけでなく、得意分野、ビジネス経験、コミュニケーションスタイル、価値観などを可視化し、ミスマッチを防ぎます。
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 活用事例セクション */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              活用シーン
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              様々なコンテンツ制作シーンでご活用いただけます
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 text-indigo-600">
                <Target className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">オウンドメディア運営</h3>
              <p className="text-gray-600">
                ビジネスの文脈を理解し、専門性の高い記事を作成できるライター・編集者とマッチング。コンテンツの質を高めます。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 text-indigo-600">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">新規事業開発</h3>
              <p className="text-gray-600">
                新しい事業の本質を理解し、魅力的に伝えられるクリエイターを見つけ、事業の立ち上げフェーズを加速します。
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 text-indigo-600">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">広報・PR活動</h3>
              <p className="text-gray-600">
                企業の価値観や目指す方向性を深く理解し、一貫性のあるメッセージを発信できるプロフェッショナルと協業します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              料金プラン
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              成果報酬型の分かりやすい料金体系
            </p>
          </div>
          
          <div className="mx-auto max-w-md">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-indigo-100">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">マッチングプラン</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-bold tracking-tight text-indigo-600">10%</span>
                  <span className="ml-1 text-xl text-gray-500">/ 契約額</span>
                </div>
                <p className="mt-6 text-gray-500">
                  新規登録は完全無料。<br />
                  契約成立時のみ手数料が発生します。
                </p>
              </div>
              
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                  <span>新規登録</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                  <span>AI活用による最適マッチング</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                  <span>プロジェクト管理サポート</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                  <span>安心の品質保証</span>
                </li>
              </ul>
              
              <div className="mt-8">
                <button
                  onClick={() => navigate('/')}
                  className="w-full rounded-md bg-indigo-600 px-4 py-3 text-md font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  新規登録
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            最適なクリエイターとの出会いで<br />ビジネスを加速させませんか？
          </h2>
          <p className="mt-6 text-lg leading-8 text-indigo-100">
            まずは新規登録から。あなたの事業に最適なクリエイターをご紹介します。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={() => navigate('/')}
              className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              新規登録
            </button>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-2xl font-bold text-white">balubo</span>
              <span className="text-sm ml-2 text-gray-400">for Business</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                利用規約
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                プライバシーポリシー
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                お問い合わせ
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2023 balubo, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
