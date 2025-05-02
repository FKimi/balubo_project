import React from 'react';
import { Sparkles } from 'lucide-react';

interface AISupportButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

const AISupportButton: React.FC<AISupportButtonProps> = ({
  onClick,
  className = '',
  label = 'AIサポート'
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors ${className}`}
    >
      <Sparkles className="w-4 h-4 mr-1" />
      <span className="text-sm">{label}</span>
    </button>
  );
};

export default AISupportButton; 