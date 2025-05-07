import React, { useState } from "react";

type Props = {
  open: boolean;
  profileUrl: string;
  onClose: () => void;
};

const ShareDialog: React.FC<Props> = ({ open, profileUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // モダンなNavigator Clipboard APIを使用
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      // 3秒後にコピー状態をリセット
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('クリップボードコピーエラー:', err);
      // フォールバック: 古い方法
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const success = document.execCommand('copy');
        if (success) {
          setCopied(true);
          // 3秒後にコピー状態をリセット
          setTimeout(() => setCopied(false), 3000);
        } else {
          console.error('クリップボードコピー失敗');
        }
      } catch (e) {
        console.error('クリップボードコピーエラー (フォールバック):', e);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">プロフィールをシェア</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-2">以下のURLをコピーしてシェアできます：</p>
        <div className="flex">
          <input
            type="text"
            value={profileUrl}
            readOnly
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button
            className={`${copied ? 'bg-green-600' : 'bg-indigo-600'} text-white px-4 rounded-r-md hover:${copied ? 'bg-green-700' : 'bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:${copied ? 'ring-green-500' : 'ring-indigo-500'} transition-colors`}
            onClick={handleCopy}
          >
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
