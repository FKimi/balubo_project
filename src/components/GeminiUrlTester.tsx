import React, { useState } from 'react';
import { extractDataFromUrl, UrlExtractedData } from '../lib/gemini-url-service';

/**
 * Gemini APIを使用したURL情報取得テストコンポーネント
 */
const GeminiUrlTester: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlExtractedData | null>(null);

  // URLの検証
  const validateUrl = (input: string): boolean => {
    if (!input.trim()) return false;
    
    // URLの形式を検証（プロトコルがない場合は許可）
    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
    return urlPattern.test(input);
  };

  const handleFetchData = async () => {
    if (!validateUrl(url)) {
      setError('有効なURLを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await extractDataFromUrl(url);
      setResult(data);
    } catch (err) {
      console.error('Error fetching URL data:', err);
      setError(err instanceof Error ? err.message : 'URLからデータを取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-background max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Gemini API URL情報取得テスト</h2>
      <div className="mb-4">
        <label htmlFor="url" className="block text-sm font-medium mb-1">URL</label>
        <div className="flex gap-2">
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-grow p-2 border rounded"
            disabled={loading}
          />
          <button
            onClick={handleFetchData}
            disabled={loading || !url.trim()}
            className={`px-4 py-2 rounded font-medium ${
              loading || !url.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {loading ? '取得中...' : '取得'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          例: zenn.dev, qiita.com/username/items/123456, https://example.com
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">エラー</span>
          </div>
          <p className="mt-1 ml-7">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-indigo-600">Gemini APIで分析中...</p>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">取得結果</h3>
          
          <div className="mb-4">
            <h4 className="font-medium">タイトル</h4>
            <p className="mt-1">{result.title || '(タイトルなし)'}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium">説明</h4>
            <p className="mt-1 whitespace-pre-wrap">{result.description || '(説明なし)'}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium">URL</h4>
            <p className="mt-1 break-all">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {result.url}
              </a>
            </p>
          </div>
          
          {result.imageUrl && (
            <div className="mb-4">
              <h4 className="font-medium">サムネイル画像</h4>
              <img 
                src={result.imageUrl} 
                alt="サムネイル" 
                className="mt-2 max-w-full h-auto max-h-60 object-contain"
              />
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="font-medium">タグ</h4>
            {result.tags && result.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {result.tags.map((tag, index) => (
                  <div key={index} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm flex items-center">
                    <span>{tag.name}</span>
                    <span className="ml-1 bg-indigo-200 text-indigo-700 text-xs px-1 rounded-full">
                      {Math.round(tag.relevance * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1">(タグなし)</p>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result, null, 2));
              }}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
            >
              JSONをコピー
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiUrlTester;
