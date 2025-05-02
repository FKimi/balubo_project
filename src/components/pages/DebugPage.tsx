import React, { useState } from 'react';
import { testGeminiApi } from '../test-gemini';

interface TestResult {
  success: boolean;
  message: string;
  response?: string;
  details?: any;
}

const DebugPage: React.FC = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestGeminiApi = async () => {
    setIsLoading(true);
    try {
      const result = await testGeminiApi();
      setTestResult(result);
      console.log('テスト結果:', result);
    } catch (error) {
      console.error('テスト実行エラー:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '不明なエラー',
        details: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">デバッグページ</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Gemini API テスト</h2>
        <p className="mb-4">
          Gemini APIの接続状態をテストします。このテストは環境変数の設定が正しいかどうかも確認します。
        </p>

        <button
          onClick={handleTestGeminiApi}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md ${
            isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white font-medium`}
        >
          {isLoading ? 'テスト実行中...' : 'APIテスト実行'}
        </button>

        {testResult && (
          <div className={`mt-6 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-bold ${testResult.success ? 'text-green-700' : 'text-red-700'} mb-2`}>
              {testResult.success ? '✅ テスト成功' : '❌ テスト失敗'}
            </h3>
            <p className="mb-2">{testResult.message}</p>
            
            {testResult.response && (
              <div className="mt-2">
                <p className="font-semibold">API応答:</p>
                <pre className="bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap">{testResult.response}</pre>
              </div>
            )}
            
            {!testResult.success && testResult.details && (
              <div className="mt-2">
                <p className="font-semibold">エラー詳細:</p>
                <pre className="bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap overflow-auto text-sm">{
                  typeof testResult.details === 'object' 
                    ? JSON.stringify(testResult.details, null, 2) 
                    : String(testResult.details)
                }</pre>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-bold text-yellow-700 mb-2">環境変数確認</h3>
          <p className="text-sm">
            VITE_GEMINI_API_KEY環境変数が正しく設定されていることを確認してください。<br />
            .envファイルに以下の行が含まれているかチェックしてください：
          </p>
          <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">VITE_GEMINI_API_KEY=あなたのAPIキー</pre>
        </div>
      </div>
    </div>
  );
};

export default DebugPage; 