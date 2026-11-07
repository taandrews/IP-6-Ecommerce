import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...props },
  ref,
) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="label">
          {label} {props.required ? <span className="text-danger" aria-hidden>*</span> : null}
        </label>
      ) : null}
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          "input",
          error && "border-danger focus-visible:ring-danger",
          className,
        )}
        {...props}
      />
      {hint && !error ? <p id={`${id}-hint`} className="mt-1 text-xs text-ink/60">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className, ...props },
  ref,
) {
  return (
    <div>
      {label ? <label htmlFor={id} className="label">{label}</label> : null}
      <textarea
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn("input min-h-[120px]", error && "border-danger focus-visible:ring-danger", className)}
        {...props}
      />
      {hint && !error ? <p className="mt-1 text-xs text-ink/60">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldProps & { children: ReactNode };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, children, ...props },
  ref,
) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="label">
          {label} {props.required ? <span className="text-danger" aria-hidden>*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={id}
          ref={ref}
          aria-invalid={!!error}
          className={cn("input appearance-none pr-10 cursor-pointer", error && "border-danger", className)}
          {...props}
        >
          {children}
        </select>
        {/* The native arrow is hidden for consistent styling, so draw one: it has to look like a dropdown. */}
        <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-800" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {hint && !error ? <p className="mt-1 text-xs text-ink/60">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
});
