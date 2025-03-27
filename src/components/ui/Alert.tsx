import React from 'react';
import { X } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ children, type = 'info', className = '', dismissible, onDismiss }: AlertProps) {
  const types = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className={`rounded-lg border p-4 ${types[type]} ${className}`}>
      <div className="flex">
        <div className="flex-1">{children}</div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-3 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}