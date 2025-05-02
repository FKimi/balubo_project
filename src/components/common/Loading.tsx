import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="ml-2 text-lg font-medium">読み込み中...</span>
    </div>
  );
};

export default Loading; 