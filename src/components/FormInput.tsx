import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helpText?: string;
  icon?: React.ReactNode;
}

export function FormInput({ label, helpText, icon, className = '', ...props }: FormInputProps) {
  // 値が undefined または null の場合は空文字列に変換して制御/非制御の警告を回避
  const inputProps = {
    ...props,
    value: props.value === undefined || props.value === null ? '' : props.value
  };

  return (
    <div>
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-neutral-700 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...inputProps}
          className={`
            block w-full rounded-lg border-neutral-300 shadow-sm
            focus:border-primary-500 focus:ring-primary-500
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
        />
      </div>
      {helpText && (
        <p className="mt-2 text-sm text-neutral-500">{helpText}</p>
      )}
    </div>
  );
}