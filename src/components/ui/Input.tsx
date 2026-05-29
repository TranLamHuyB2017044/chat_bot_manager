import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:   string;
  error?:   string;
  hint?:    string;
  prefix?:  ReactNode;
  suffix?:  ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary dark:text-textDark-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-text-muted dark:text-textDark-muted">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-3 py-2.5 rounded-btn text-sm transition",
              "bg-surface-input dark:bg-dark-input",
              "border border-surface-border dark:border-dark-border",
              "text-text-primary dark:text-textDark-primary",
              "placeholder:text-text-muted dark:placeholder:text-textDark-muted",
              "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              prefix && "pl-9",
              suffix && "pr-9",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-text-muted dark:text-textDark-muted">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-text-muted dark:text-textDark-secondary">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
