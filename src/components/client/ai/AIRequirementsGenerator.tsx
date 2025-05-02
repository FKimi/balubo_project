import React, { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { generateProjectRequirements } from '../../../utils/gemini';

interface AIRequirementsGeneratorProps {
  onApplyRequirements: (requirements: string) => void;
  onClose: () => void;
}

const AIRequirementsGenerator: React.FC<AIRequirementsGeneratorProps> = ({
  onApplyRequirements,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const [generatedRequirements, setGeneratedRequirements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('プロジェクトの概要を入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const requirements = await generateProjectRequirements(prompt);
      setGeneratedRequirements(requirements);
    } catch (err) {
      setError(err instanceof Error ? err.message : '要件の生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApplyRequirements(generatedRequirements);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
            AI要件定義アシスタント
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクトの概要を入力
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
              placeholder="例: Webサイトのデザインリニューアルをお願いしたいです。当社は不動産会社で、より現代的で使いやすいサイトにしたいと考えています。"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className={`px-4 py-2 rounded-md ${
                isLoading || !prompt.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } flex items-center`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  要件を生成
                </>
              )}
            </button>
          </div>

          {generatedRequirements && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">生成された要件:</h3>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 whitespace-pre-wrap">
                {generatedRequirements}
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
            disabled={!generatedRequirements}
            className={`px-4 py-2 rounded-md ${
              !generatedRequirements
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            要件を適用
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRequirementsGenerator; 