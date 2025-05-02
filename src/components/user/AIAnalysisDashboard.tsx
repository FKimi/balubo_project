import React, { useState } from 'react';
import { Unlock, Lock, Zap } from 'lucide-react';

const AIAnalysisDashboard: React.FC = () => {
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* メイン */}
      <main className="flex-1 ml-64">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI分析ダッシュボード</h1>
              <p className="mt-1 text-gray-600">あなたの成長と魅力をAIが可視化。依頼者に刺さる“証明”を。</p>
            </div>
            {/* 公開切替・有料バッジ */}
            <div className="flex items-center space-x-3">
              <button
                className={`flex items-center px-3 py-1.5 text-xs rounded-full border ${isPublic ? 'bg-green-50 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                onClick={() => setIsPublic(!isPublic)}
              >
                {isPublic ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                {isPublic ? '公開中' : '非公開'}
              </button>
              <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                <Zap className="w-3 h-3 mr-1" />月額500円で全体公開
              </span>
            </div>
          </div>
        </div>
        {/* サブスク案内バナー */}
        <div className="bg-gradient-to-r from-indigo-100 to-blue-50 border-b border-indigo-200 py-3 px-6 flex items-center justify-between">
          <span className="text-indigo-700 font-semibold">全体公開＆依頼受付は月額500円で！</span>
          <button className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 text-sm font-medium">サブスク登録</button>
        </div>
        {/* フッター・注意事項 */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-xs text-blue-700">
            この分析結果はAIによる自動分析であり、実際のスキルや実績を保証するものではありません。分析精度向上のためには、作品の追加やプロフィール情報の充実をおすすめします。
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AIAnalysisDashboard;