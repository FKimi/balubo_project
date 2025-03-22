import React, { useState, useRef } from 'react';
import { UrlAnalysisResult, saveAnalysisToDatabase, analyzeUrl } from '../lib/url-analyzer';

interface UrlAnalyzerProps {
  userId?: string;
  onAnalysisComplete: (result: UrlAnalysisResult) => void;
}

const UrlAnalyzer: React.FC<UrlAnalyzerProps> = ({ userId, onAnalysisComplete }) => {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<UrlAnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'fetching' | 'analyzing' | 'complete'>('idle');
  const urlInputRef = useRef<HTMLInputElement>(null);

  // URLの検証
  const validateUrl = (input: string): boolean => {
    if (!input.trim()) return false;
    
    // URLの形式を検証（プロトコルがない場合は許可）
    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
    return urlPattern.test(input);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    setIsValidUrl(inputUrl === '' || validateUrl(inputUrl));
    if (error) setError(null);
  };

  // ペーストイベントの処理
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      setUrl(pastedText);
      setIsValidUrl(pastedText === '' || validateUrl(pastedText));
      if (error) setError(null);
    }
  };

  // クリップボードからURLを貼り付け
  const pasteFromClipboard = () => {
    // フォーカスを入力フィールドに設定し、ブラウザのペースト機能を使用
    if (urlInputRef.current) {
      urlInputRef.current.focus();
      document.execCommand('paste');
    }
  };

  const handleAnalyze = async () => {
    // URLが空または無効な場合は処理しない
    if (!url.trim() || !isValidUrl) {
      setError('有効なURLを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisStep('fetching');

    try {
      // URLにプロトコルがない場合は追加
      let processedUrl = url;
      if (!/^https?:\/\//i.test(processedUrl)) {
        processedUrl = `https://${processedUrl}`;
      }

      console.log('分析するURL:', processedUrl);
      
      // 統合されたanalyzeUrl関数を使用してURLを分析
      setAnalysisStep('analyzing');
      const result = await analyzeUrl(processedUrl);
      
      console.log('分析結果:', result);
      setAnalysisResult(result);
      setAnalysisStep('complete');
    } catch (err) {
      console.error('URL analysis error:', err);
      setError(err instanceof Error ? err.message : 'URL分析中にエラーが発生しました');
      setAnalysisStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // 分析結果をデータベースに保存
  const handleSave = async () => {
    if (!analysisResult || !userId) {
      setError('分析結果またはユーザーIDがありません');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveAnalysisToDatabase(userId, analysisResult);
      
      // 保存成功後、親コンポーネントに通知
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
    } catch (err) {
      console.error('Error saving analysis:', err);
      setError('分析結果の保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 分析結果を親コンポーネントに渡す
  const handleUse = () => {
    if (analysisResult && onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }
  };

  // 分析ステップに応じたメッセージを表示
  const getStepMessage = () => {
    switch (analysisStep) {
      case 'fetching':
        return 'URLからコンテンツを取得中...';
      case 'analyzing':
        return 'コンテンツをAI分析中...';
      default:
        return '分析中...';
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-medium">URL分析</h3>
      <p className="text-sm text-muted-foreground">
        URLを入力して分析すると、タイトル、説明、タグが自動取得されます
      </p>

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

      <div className="space-y-2">
        <label htmlFor="url" className="block text-sm font-medium">URL</label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              id="url"
              ref={urlInputRef}
              value={url}
              onChange={handleUrlChange}
              onPaste={handlePaste}
              placeholder="https://example.com"
              className={`flex-grow p-2 border rounded focus:ring-2 focus:outline-none ${!isValidUrl ? "border-red-500" : "border-gray-300"}`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={pasteFromClipboard}
              disabled={loading}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              title="クリップボードからURLを貼り付け"
            >
              貼り付け
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim() || !isValidUrl}
              className={`w-full px-4 py-2 rounded font-medium ${
                loading || !url.trim() || !isValidUrl
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getStepMessage()}
                </>
              ) : (
                '分析する'
              )}
            </button>
          </div>
        </div>
        
        {!isValidUrl && url.trim() !== '' && (
          <p className="text-xs text-red-500">有効なURLを入力してください</p>
        )}
        <p className="text-xs text-gray-500">
          例: zenn.dev, qiita.com/username/items/123456, https://example.com
        </p>
      </div>

      {analysisResult && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">分析結果</h3>
          
          <div className="mb-4">
            <h4 className="font-medium">タイトル</h4>
            <p>{analysisResult.title}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium">説明</h4>
            <p className="text-sm whitespace-pre-wrap">{analysisResult.description}</p>
          </div>
          
          {analysisResult.imageUrl && (
            <div className="mb-4">
              <h4 className="font-medium">画像</h4>
              <img 
                src={analysisResult.imageUrl} 
                alt={analysisResult.title} 
                className="mt-2 max-w-full h-auto max-h-40 object-contain"
              />
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="font-medium">タグ</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysisResult.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm flex items-center"
                >
                  <span>{tag.name}</span>
                  <span className="ml-1 bg-indigo-200 text-indigo-700 text-xs px-1 rounded-full">
                    {Math.round(tag.relevance * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleUse}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              この結果を使用
            </button>
            
            {userId && (
              <button
                onClick={handleSave}
                className={`px-4 py-2 rounded ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : 'データベースに保存'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlAnalyzer;
