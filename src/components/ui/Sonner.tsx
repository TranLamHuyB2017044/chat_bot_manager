import { Toaster as SonnerToaster, toast } from "sonner";
import { cn } from "@/lib/utils";

export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: cn(
            "bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card shadow-lg",
            "text-text-primary dark:text-textDark-primary"
          ),
          title: "font-semibold",
          description: "text-sm text-text-muted dark:text-textDark-muted",
          success: "border-success/30 bg-success-bg dark:bg-brand-softDark",
          warning: "border-warning/30 bg-warning-bg",
          error: "border-danger/30 bg-danger-bg",
          info: "border-info/30 bg-info-bg dark:bg-brand-softDark",
          closeButton: "hover:bg-surface-input dark:hover:bg-dark-input",
        },
      }}
    />
  );
}
