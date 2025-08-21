import Link from "next/link"

export const metadata = {
  title: "コンテンツ企画・制作事業 | 株式会社balubo",
  description:
    "baluboのコンテンツ企画・制作事業の詳細。技術文書作成、マニュアル制作、Webコンテンツ企画から運用まで、専門性の高いコンテンツソリューションを提供します。",
}

export default function ContentPlanningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              balubo
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#problem" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium">
                課題
              </Link>
              <Link href="/#solution" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium">
                ソリューション
              </Link>
              <Link href="/#service" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium">
                サービス
              </Link>
              <Link href="/#company" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium">
                会社概要
              </Link>
              <Link href="/#contact" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium">
                お問い合わせ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-8">
              <span className="text-sm font-medium text-blue-700">コンテンツ企画・制作事業</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              企業のビジネスを
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">加速させる</span>
              <br />
              コンテンツ制作
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              技術的専門性と創造性を融合させた、高品質なコンテンツソリューションを提供します。
              企画から制作、運用まで一貫してサポートし、お客様のビジネス成長を加速させます。
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="#challenges"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                課題を確認する
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              <Link
                href="#pricing"
                className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-2xl hover:border-blue-600 hover:text-blue-600 transition-all duration-300 font-semibold hover:bg-blue-50/50"
              >
                料金を見る
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Market Trend Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 mb-6">
              <span className="text-sm font-medium text-indigo-700">MARKET TREND</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">ビジネスコンテンツの内製化が加速する時代</h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              企業が自らコンテンツを発信する「大ビジネスコンテンツ時代」が到来しています。
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">オウンドメディアの急増</h3>
              <p className="text-slate-600 leading-relaxed">
                企業が自社の思想や価値観を発信するオウンドメディアが急増。トヨタ、日経など大手企業も積極的に参入しています。
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">動画スタジオ・YouTube</h3>
              <p className="text-slate-600 leading-relaxed">
                企業が自社で動画コンテンツを制作する動画スタジオの設置や、YouTubeチャンネルの運営が一般的になっています。
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">自社イベントの開催</h3>
              <p className="text-slate-600 leading-relaxed">
                企業が自社でイベントを企画・開催し、直接顧客やステークホルダーとのコミュニケーションを図る動きが加速しています。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">なぜ今、ビジネスコンテンツなのか？</h3>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                製品やサービスの機能だけでは差別化が難しい時代において、企業は「共感」と「信頼」を獲得する必要があります。
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">ビジネスコンテンツの目的</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600">マーケティング（リード獲得、顧客エンゲージメント）</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600">IR（投資家への訴求）</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600">採用ブランディング（候補者の惹きつけ）</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600">社内エンゲージメント（理念浸透、一体感醸成）</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">市場の変化</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600">情報過多の時代における企業の独自性の重要性</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600">企業自らが自社の思想や価値観を「語る」必要性</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600">「物語（コンテンツ）」を通じた市場とのコミュニケーション</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 課題の背景セクション */}
          <div className="mt-16 bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl p-10 border border-orange-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">しかし、現実は厳しい...</h3>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                ビジネスコンテンツの重要性が高まる一方で、コンテンツマーケティング担当者は深刻な課題に直面しています。
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">人手不足</h4>
                <p className="text-sm text-slate-600">継続的なコンテンツ制作に追われ、戦略的な企画ができない</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">成果不足</h4>
                <p className="text-sm text-slate-600">コンテンツを制作しても、読者に届かず成果に繋がらない</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">差別化困難</h4>
                <p className="text-sm text-slate-600">他社と同じようなコンテンツになり、独自性を表現できない</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section id="challenges" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-6">
              <span className="text-sm font-medium text-red-700">ISSUES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">コンテンツマーケ担当者の切実な声</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              「事業を理解してくれる、本当に良いプロクリエイターと、どうすれば出会えるんだ...！」
              <br />
              これは、多くの企業担当者の方から直接伺ってきた、偽らざる本音です。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-red-50 to-pink-50 p-8 rounded-3xl border border-red-100 hover:border-red-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">継続的なコンテンツ制作の負担</h3>
              <p className="text-slate-700 mb-6 leading-relaxed">
                「毎月のコンテンツ制作に追われて、戦略的な企画ができない」「人手が足りず、品質を保てない」
                <br />
                オウンドメディアの運営代行を依頼しても、企画から記事、コンセプトまで丸投げになってしまう...
              </p>
              <ul className="text-slate-600 space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  定期的な更新に追われている
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  企画・制作・運用の人手不足
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  品質とスピードの両立が困難
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-3xl border border-orange-100 hover:border-orange-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">コンテンツマーケティングの成果不足</h3>
              <p className="text-slate-700 mb-6 leading-relaxed">
                「コンテンツを制作しているが、成果に繋がらない」「ROIが見えない」「効果測定ができていない」
                <br />
                せっかく作ったコンテンツが読者に届かず、リード獲得やブランド認知に繋がらない...
              </p>
              <ul className="text-slate-600 space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  コンテンツの効果が測定できない
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  リード獲得に繋がらない
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  投資対効果が見えない
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 hover:border-blue-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">競合との差別化ができない</h3>
              <p className="text-slate-700 mb-6 leading-relaxed">
                「他社と同じようなコンテンツになってしまう」「独自性のあるコンテンツが作れない」
                <br />
                自社の価値やストーリーが伝わらず、ブランドの独自性を表現できない...
              </p>
              <ul className="text-slate-600 space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  他社と似たようなコンテンツ
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  独自性のあるストーリーがない
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  ブランドの価値が伝わらない
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-6">
              <span className="text-sm font-medium text-green-700">SOLUTIONS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">baluboの解決策</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              これらの課題を解決するために、baluboが提供する具体的なソリューション
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 解決策1: 継続的なコンテンツ制作の負担に対する解決策 */}
            <div className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-red-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">継続的な制作体制の構築</h3>
              <p className="text-slate-700 mb-6 leading-relaxed">
                専任チームによる継続的なコンテンツ制作で、品質とスピードを両立
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">専任制作チーム</h4>
                    <p className="text-slate-600 text-sm">経験豊富な専門家が継続的にサポート</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">効率的な制作プロセス</h4>
                    <p className="text-slate-600 text-sm">標準化されたワークフローで品質を保証</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">柔軟な運用体制</h4>
                    <p className="text-slate-600 text-sm">月次・週次での継続的なコンテンツ更新</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 解決策2: コンテンツマーケティングの成果不足に対する解決策 */}
            <div className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-orange-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">データドリブンな成果創出</h3>
              <p className="text-slate-700 mb-6 leading-relaxed">
                効果測定と分析に基づく戦略的なコンテンツで、確実な成果を実現
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">効果測定システム構築</h4>
                    <p className="text-slate-600 text-sm">KPI設定から分析レポートまで</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">ターゲット分析</h4>
                    <p className="text-slate-600 text-sm">ユーザー行動データに基づく最適化</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">継続的な改善</h4>
                    <p className="text-slate-600 text-sm">データに基づく戦略の見直しと改善</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 解決策3: 競合との差別化ができないに対する解決策 */}
            <div className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">独自性のあるストーリーテリング</h3>
              <p className="text-slate-700 mb-6 leading-relaxed">
                自社の価値観とストーリーを活かした、競合に差別化されたコンテンツ
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">ブランドストーリー構築</h4>
                    <p className="text-slate-600 text-sm">自社の価値観とミッションの明確化</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">ターゲット共感設計</h4>
                    <p className="text-slate-600 text-sm">顧客の課題と感情に響くコンテンツ</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">差別化ポイント発掘</h4>
                    <p className="text-slate-600 text-sm">競合分析による独自性の明確化</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">PROCESS</h2>
            <h3 className="text-xl text-blue-600 font-semibold mb-4">制作プロセス</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">品質と効率を両立する、balubo独自の制作プロセス</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  1
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ヒアリング・分析</h3>
              <p className="text-sm text-gray-600 mb-4">お客様の課題と現状を詳しく把握</p>
              <div className="text-xs text-blue-600 font-medium">1-2週間</div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  2
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">戦略・設計</h3>
              <p className="text-sm text-gray-600 mb-4">最適なコンテンツ戦略を立案</p>
              <div className="text-xs text-green-600 font-medium">1-2週間</div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  3
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">制作・実装</h3>
              <p className="text-sm text-gray-600 mb-4">高品質なコンテンツを制作</p>
              <div className="text-xs text-purple-600 font-medium">2-6週間</div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  4
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">効果測定・改善</h3>
              <p className="text-sm text-gray-600 mb-4">継続的な成果向上をサポート</p>
              <div className="text-xs text-orange-600 font-medium">継続的</div>
            </div>
          </div>

          {/* 詳細説明 */}
          <div className="mt-12 bg-gray-50 p-8 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">各ステップの詳細</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">制作内容</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>ビジネス課題のヒアリング、ターゲット分析、競合調査</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 font-bold">2.</span>
                    <span>コンテンツ戦略立案、情報設計、ワイヤーフレーム作成</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 font-bold">3.</span>
                    <span>コンテンツ制作、デザイン、システム実装、品質チェック</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-600 font-bold">4.</span>
                    <span>効果測定、データ分析、改善提案、運用サポート</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">成果物</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>現状分析レポート、ペルソナ設定、課題抽出</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 font-bold">2.</span>
                    <span>コンテンツ戦略書、サイトマップ、制作スケジュール</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 font-bold">3.</span>
                    <span>完成したコンテンツ、運用マニュアル、効果測定設定</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-600 font-bold">4.</span>
                    <span>効果測定レポート、改善提案、継続サポート</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">PRICING</h2>
            <h3 className="text-xl text-blue-600 font-semibold mb-4">料金体系</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              プロジェクトの規模と内容に応じた、透明性の高い料金設定
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 執筆サービス */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">執筆</h3>
                <div className="text-2xl font-bold text-blue-600">5万円〜</div>
                <div className="text-xs text-gray-500 mt-1">1本から</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="text-xs text-gray-600">• 技術記事・ブログ</div>
                <div className="text-xs text-gray-600">• コピーライティング</div>
                <div className="text-xs text-gray-600">• 技術文書</div>
                <div className="text-xs text-gray-600">• 校正・編集込み</div>
              </div>
              <Link
                href="#contact"
                className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                相談する
              </Link>
            </div>

            {/* サイト制作 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-500 text-center relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">人気</span>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">サイト制作</h3>
                <div className="text-2xl font-bold text-blue-600">30万円〜</div>
                <div className="text-xs text-gray-500 mt-1">ランディングページ</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="text-xs text-gray-600">• ランディングページ</div>
                <div className="text-xs text-gray-600">• コーポレートサイト</div>
                <div className="text-xs text-gray-600">• SEO対策込み</div>
                <div className="text-xs text-gray-600">• レスポンシブ対応</div>
              </div>
              <Link
                href="#contact"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                相談する
              </Link>
            </div>

            {/* コンテンツ戦略 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">コンテンツ戦略</h3>
                <div className="text-2xl font-bold text-blue-600">50万円〜</div>
                <div className="text-xs text-gray-500 mt-1">月額サポート</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="text-xs text-gray-600">• 戦略立案・設計</div>
                <div className="text-xs text-gray-600">• 月次コンテンツ制作</div>
                <div className="text-xs text-gray-600">• 効果測定・分析</div>
                <div className="text-xs text-gray-600">• 継続的な改善</div>
              </div>
              <Link
                href="#contact"
                className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                相談する
              </Link>
            </div>

            {/* オウンドメディア */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">オウンドメディア</h3>
                <div className="text-2xl font-bold text-blue-600">100万円〜</div>
                <div className="text-xs text-gray-500 mt-1">構築・運用</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="text-xs text-gray-600">• メディア構築</div>
                <div className="text-xs text-gray-600">• 記事制作・更新</div>
                <div className="text-xs text-gray-600">• SEO・集客施策</div>
                <div className="text-xs text-gray-600">• 6ヶ月間サポート</div>
              </div>
              <Link
                href="#contact"
                className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                相談する
              </Link>
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">料金に含まれるもの</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">企画・設計</h4>
                <p className="text-gray-600 text-xs mt-1">戦略立案から情報設計まで</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">制作・実装</h4>
                <p className="text-gray-600 text-xs mt-1">コンテンツ制作からシステム実装</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">効果測定</h4>
                <p className="text-gray-600 text-xs mt-1">アクセス解析設定と初期レポート</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">サポート</h4>
                <p className="text-gray-600 text-xs mt-1">運用マニュアルと期間内サポート</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strengths & Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">WHY CHOOSE US</h2>
            <h3 className="text-xl text-blue-600 font-semibold mb-4">私たちが選ばれる理由</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              技術とクリエイティブの融合で、お客様のビジネス成長を支援します
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 強み1: 技術的専門性 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">技術的専門性</h3>
              <p className="text-sm text-gray-600">
                エンジニア出身のメンバーが技術的な内容を正確に理解し、分かりやすく伝える能力に長けています。
              </p>
            </div>

            {/* 強み2: スピード感のある対応 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">スピード感のある対応</h3>
              <p className="text-sm text-gray-600">
                効率的なプロセスと豊富な経験により、高品質なコンテンツを短期間で制作。お客様のビジネススピードに合わせて対応します。
              </p>
            </div>

            {/* 強み3: お客様の成功を第一に */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">お客様の成功を第一に</h3>
              <p className="text-sm text-gray-600">
                単なる制作代行ではなく、お客様のビジネス成長を真剣に考えたパートナーとして、長期的な関係を築きます。
              </p>
            </div>
          </div>


        </div>
      </section>



      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">LET'S START</h2>
          <h3 className="text-xl text-blue-200 font-semibold mb-4">コンテンツでビジネスを加速させませんか？</h3>
          <p className="text-xl text-blue-100 mb-8">
            お客様の課題に合わせた最適なコンテンツソリューションをご提案します。 まずはお気軽にご相談ください。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#contact"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              お問い合わせ
            </Link>
            <Link
              href="/"
              className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-blue-400 mb-4">balubo</div>
              <p className="text-gray-400 mb-4">
                株式会社baluboは、コンテンツ企画・制作を通じて、 お客様のビジネス成長をサポートします。
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">サービス</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#services" className="hover:text-white transition-colors">
                    技術文書作成
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="hover:text-white transition-colors">
                    Webコンテンツ制作
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="hover:text-white transition-colors">
                    研修コンテンツ
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="hover:text-white transition-colors">
                    コンサルティング
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">会社情報</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/#company" className="hover:text-white transition-colors">
                    会社概要
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="hover:text-white transition-colors">
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    トップページ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 株式会社balubo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

