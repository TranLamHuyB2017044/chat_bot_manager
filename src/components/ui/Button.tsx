import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  icon?:     React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand hover:bg-brand-hover text-white shadow-sm shadow-brand/20 disabled:opacity-50",
  secondary:
    "bg-surface-input dark:bg-dark-input text-text-primary dark:text-textDark-primary border border-surface-border dark:border-dark-border hover:border-brand/40",
  ghost:
    "text-text-secondary dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input",
  danger:
    "bg-danger-bg text-danger-text hover:bg-danger hover:text-white border border-danger/20",
};

const sizes: Record<Size, string> = {
  sm:  "px-3 py-1.5 text-xs gap-1.5",
  md:  "px-4 py-2   text-sm gap-2",
  lg:  "px-5 py-2.5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant  = "primary",
      size     = "md",
      loading  = false,
      icon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-btn transition-all active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : icon}
      {children}
    </button>
  )
);
Button.displayName = "Button";
