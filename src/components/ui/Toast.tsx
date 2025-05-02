import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { ToastContext, Toast, ToastProps, ToastErrorProps } from '../../lib/context/ToastContext';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastFn = useCallback(({ title, description, variant = 'default' }: ToastProps) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const error = useCallback(({ title, description }: ToastErrorProps) => {
    toastFn({ title, description, variant: 'destructive' });
  }, [toastFn]);

  const success = useCallback(({ title, description }: ToastErrorProps) => {
    toastFn({ title, description, variant: 'success' });
  }, [toastFn]);

  // toastFnにerrorとsuccessメソッドを追加
  const toast = Object.assign(toastFn, { error, success });

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-0 right-0 p-4 space-y-4 w-full max-w-sm z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              p-4 rounded-md shadow-md flex items-start justify-between
              ${toast.variant === 'destructive' ? 'bg-red-600 text-white' : ''}
              ${toast.variant === 'success' ? 'bg-green-600 text-white' : ''}
              ${toast.variant === 'default' ? 'bg-white text-gray-900' : ''}
            `}
          >
            <div>
              <h3 className="font-medium">{toast.title}</h3>
              {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-4 text-sm"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}