import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label:  string;
  value:  string;
  change: string;
  up:     boolean;
  icon?:  React.ReactNode;
}

export default function KpiCard({ label, value, change, up, icon }: Props) {
  return (
    <div className="group bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5 hover:border-brand/40 dark:hover:border-brand/30 transition-all hover:shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-text-muted dark:text-textDark-secondary uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <span className="text-text-muted dark:text-textDark-muted opacity-60 group-hover:opacity-100 transition-opacity">
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary tracking-tight mb-3">
        {value}
      </p>

      {/* Change badge */}
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-pill font-semibold",
          up
            ? "bg-success-bg text-success-text dark:bg-success/10 dark:text-success"
            : "bg-danger-bg text-danger-text dark:bg-danger/10 dark:text-danger"
        )}
      >
        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {change}
      </span>
    </div>
  );
}
