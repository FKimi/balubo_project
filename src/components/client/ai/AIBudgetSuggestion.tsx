import React, { useState } from 'react';
import { Loader2, Sparkles, DollarSign } from 'lucide-react';
import { suggestBudgetRange } from '../../../utils/gemini';

interface AIBudgetSuggestionProps {
  category: string;
  description: string;
  onApplyBudget: (min: string, max: string) => void;
  onClose: () => void;
}

const AIBudgetSuggestion: React.FC<AIBudgetSuggestionProps> = ({
  category,
  description,
  onApplyBudget,
  onClose
}) => {
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!category || !description.trim()) {
      setError('カテゴリーと案件の説明を先に入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [min, max] = await suggestBudgetRange(category, description);
      setBudgetMin(min);
      setBudgetMax(max);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予算提案の生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 数値のカンマ区切り表示
  const formatNumber = (value: string) => {
    if (!value) return '';
    return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleApply = () => {
    onApplyBudget(budgetMin, budgetMax);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <DollarSign className="w-5 h-5 text-indigo-500 mr-2" />
            AI予算提案
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
            案件のカテゴリーと説明をもとに、適切な予算範囲を提案します。
          </p>

          <div className="mb-6">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !category || !description.trim()}
              className={`w-full px-4 py-2 rounded-md ${
                isLoading || !category || !description.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  予算を提案
                </>
              )}
            </button>
          </div>

          {(budgetMin || budgetMax) && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">提案された予算範囲:</h3>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">最小予算</div>
                  <div className="text-xl font-bold">{formatNumber(budgetMin)} 円</div>
                </div>
                <div className="text-gray-400">〜</div>
                <div>
                  <div className="text-sm text-gray-500">最大予算</div>
                  <div className="text-xl font-bold">{formatNumber(budgetMax)} 円</div>
                </div>
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
            disabled={!budgetMin && !budgetMax}
            className={`px-4 py-2 rounded-md ${
              !budgetMin && !budgetMax
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            予算を適用
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIBudgetSuggestion; 