import { createContext } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export type ToastProps = Omit<Toast, 'id'>;
export type ToastErrorProps = Omit<Toast, 'id' | 'variant'>;

export interface ToastContextType {
  toast: ((props: ToastProps) => void) & {
    error: (props: ToastErrorProps) => void;
    success: (props: ToastErrorProps) => void;
  };
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
