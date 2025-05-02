import React, { useState } from 'react';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { generateProjectTitle } from '../../../utils/gemini';

interface AITitleGeneratorProps {
  description: string;
  onApplyTitle: (title: string) => void;
  onClose: () => void;
}

const AITitleGenerator: React.FC<AITitleGeneratorProps> = ({
  description,
  onApplyTitle,
  onClose
}) => {
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('案件の説明を先に入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const title = await generateProjectTitle(description);
      setGeneratedTitle(title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タイトルの生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApplyTitle(generatedTitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
            AIタイトル生成
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            案件の説明をもとに、クリエイターの興味を引く魅力的なタイトルを生成します。
          </p>

          <div className="mb-6">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !description.trim()}
              className={`w-full px-4 py-2 rounded-md ${
                isLoading || !description.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  タイトルを生成
                </>
              )}
            </button>
          </div>

          {generatedTitle && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-800">生成されたタイトル:</h3>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="text-indigo-600 hover:text-indigo-800 p-1"
                  title="別のタイトルを生成"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                {generatedTitle}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleApply}
            disabled={!generatedTitle}
            className={`px-4 py-2 rounded-md ${
              !generatedTitle
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            タイトルを適用
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITitleGenerator; 