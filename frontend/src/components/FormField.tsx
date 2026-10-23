import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function FormField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: FormFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-base font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className={cn(
          'h-12 rounded-md border border-chalk bg-paper px-4 text-base text-ink',
          'placeholder:text-ink/40',
          'transition-colors focus:border-brand focus:outline-none',
          error && 'border-red-500',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-ink/60">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function TextArea({ label, error, id, className, ...rest }: TextAreaProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-base font-medium text-ink">
        {label}
      </label>
      <textarea
        id={inputId}
        {...rest}
        className={cn(
          'min-h-[100px] rounded-md border border-chalk bg-paper px-4 py-3 text-base text-ink',
          'placeholder:text-ink/40',
          'transition-colors focus:border-brand focus:outline-none',
          error && 'border-red-500',
          className
        )}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}