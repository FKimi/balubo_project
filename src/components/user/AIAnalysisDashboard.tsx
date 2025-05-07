import React, { useState } from 'react';

const AIAnalysisDashboard: React.FC = () => {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
        {clicked ? (
          <div className="py-12">
            <div className="text-4xl text-indigo-500 mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI分析ダッシュボード</h2>
            <p className="text-gray-600 text-lg mb-6">実装中です。今しばらくお待ちください。</p>
            <p className="text-gray-500">この機能は開発中のため、現在ご利用いただけません。</p>
          </div>
        ) : (
          <div 
            className="py-16 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors duration-200"
            onClick={() => setClicked(true)}
          >
            <div className="text-6xl text-indigo-400 mb-6">🤖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI分析ダッシュボード</h2>
            <p className="text-gray-600">クリックして詳細を表示</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisDashboard;
