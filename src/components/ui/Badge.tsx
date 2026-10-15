import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "secondary" | "default";

interface BadgeProps {
  children:  React.ReactNode;
  variant?:  BadgeVariant;
  className?: string;
  dot?:      boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success:   "bg-success-bg text-success-text dark:bg-success/10 dark:text-success",
  warning:   "bg-warning-bg text-warning-text dark:bg-warning/10 dark:text-warning",
  danger:    "bg-danger-bg  text-danger-text  dark:bg-danger/10  dark:text-danger",
  info:      "bg-brand-soft  text-success-text dark:bg-brand-softDark dark:text-brand",
  secondary: "bg-surface-input dark:bg-dark-input text-text-secondary dark:text-textDark-secondary border border-surface-border dark:border-dark-border",
  default:   "bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary",
};

const dotColors: Record<BadgeVariant, string> = {
  success:   "bg-success",
  warning:   "bg-warning",
  danger:    "bg-danger",
  info:      "bg-brand",
  secondary: "bg-text-secondary",
  default:   "bg-text-muted",
};

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-xs font-semibold",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
