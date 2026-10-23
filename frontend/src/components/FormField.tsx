import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({ label, error, id, className, ...rest }: FormFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className={cn(
          'h-11 rounded-md border border-chalk bg-paper px-3 text-base text-ink',
          'placeholder:text-ink/40',
          'transition-colors focus:border-brand focus:outline-none',
          error && 'border-red-500',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}