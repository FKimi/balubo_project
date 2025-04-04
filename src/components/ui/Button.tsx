import { forwardRef } from 'react';
import type { ForwardedRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref: ForwardedRef<HTMLButtonElement>) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors';
    
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
      text: 'bg-transparent hover:bg-gray-100',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
        {...props}
      />
    );
  }
);