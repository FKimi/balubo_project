import React from "react";

const UnderConstruction: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full py-32">
    <span className="text-4xl font-bold text-indigo-700 mb-4">🚧</span>
    <h1 className="text-2xl font-bold mb-2">この画面は実装中です</h1>
    <p className="text-gray-600 text-center">ただいま準備中です。しばらくお待ちください。</p>
  </div>
);

export default UnderConstruction;
