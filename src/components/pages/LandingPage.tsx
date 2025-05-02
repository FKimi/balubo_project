import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, PenTool, LineChart, Users, ShieldCheck, ArrowRight } from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-7 h-7 text-indigo-500" />,
    title: "AIが“あなたらしさ”を分析",
    description: "記事URLや原稿を登録するだけで、AIがオリジナリティ・クオリティ・エンゲージメントの3軸であなたの強みを可視化。"
  },
  {
    icon: <PenTool className="w-7 h-7 text-indigo-500" />,
    title: "信頼と実績を伝えるプロフィール",
    description: "媒体別・ジャンル別の実績、自己PRやショートインタビューで“人”としての魅力も発信。"
  },
  {
    icon: <LineChart className="w-7 h-7 text-indigo-500" />,
    title: "信用スコア＆進行管理",
    description: "受発注の不安や面倒を解消。信用スコアや進行管理、ダイレクトプライシング機能で安心取引。"
  },
  {
    icon: <Users className="w-7 h-7 text-indigo-500" />,
    title: "直接依頼・マッチング",
    description: "発注主からの直接依頼やマッチングで、単価や条件も自分でコントロール。"
  },
  {
    icon: <ShieldCheck className="w-7 h-7 text-indigo-500" />,
    title: "安心の認証・セキュリティ",
    description: "Google認証やRLSであなたのデータとプライバシーをしっかり守ります。"
  }
];

const LandingPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-indigo-50 flex flex-col">
      {/* ヒーローセクション */}
      <section className="w-full px-4 pt-10 pb-12 md:pt-16 md:pb-20 flex flex-col items-center text-center bg-white relative z-10">
        <h1 className="text-3xl md:text-5xl font-extrabold text-indigo-700 mb-4 leading-tight drop-shadow-sm">
          AI時代に“人”としての<br className="hidden md:inline" />ライターを可視化し、応援する
        </h1>
        <p className="text-lg md:text-2xl text-gray-700 mb-8 max-w-2xl">
          Baluboは、AI分析であなたの執筆実績と信頼を最大限に引き出す<br />ライター特化型ポートフォリオサービスです。
        </p>
        <Link to="/creator/sign-up" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg shadow-lg hover:bg-indigo-700 transition mb-2">
          今すぐ無料で登録 <ArrowRight className="w-5 h-5" />
        </Link>
        <span className="text-sm text-gray-500">登録は1分・GoogleアカウントでもOK</span>
      </section>

      {/* サービス特徴 */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center border border-indigo-50">
            {f.icon}
            <h3 className="mt-4 text-xl font-semibold text-indigo-700">{f.title}</h3>
            <p className="mt-2 text-gray-600 text-base">{f.description}</p>
          </div>
        ))}
      </section>

      {/* FAQ・よくある質問 */}
      <section className="w-full max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center">よくある質問</h2>
        <div className="space-y-5">
          <div className="bg-indigo-50 rounded-lg p-4">
            <strong className="text-indigo-700">Q. ライター以外も使えますか？</strong>
            <p className="text-gray-700 mt-1">今後カメラマン・デザイナーなどにも拡張予定ですが、現時点ではライター向けに最適化しています。</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <strong className="text-indigo-700">Q. 料金はかかりますか？</strong>
            <p className="text-gray-700 mt-1">基本機能は無料でご利用いただけます（将来的な有料プランも検討中）。</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <strong className="text-indigo-700">Q. AI分析の内容はどこまで公開されますか？</strong>
            <p className="text-gray-700 mt-1">ご自身のプロフィールや公開設定に応じて、自由にコントロールできます。</p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="w-full py-8 text-center text-gray-400 text-sm mt-auto">
        &copy; {new Date().getFullYear()} Balubo - ライター特化型AIポートフォリオサービス
      </footer>
    </main>
  );
};

export default LandingPage;
