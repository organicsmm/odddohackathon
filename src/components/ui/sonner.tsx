import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Premium toast styling — wired to the same design tokens as the rest of the
 * UI (gradient-card surface, semantic success/destructive/warning colors,
 * shadow-elegant, rounded-2xl). Use the `toast` re-export everywhere:
 *
 *   import { toast } from 'sonner';
 *   toast.success('Saved');
 *   toast.error('Something went wrong');
 *   toast.info('New version available');
 *   toast.warning('Heads up');
 *   toast.loading('Saving…');
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      gap={10}
      offset={20}
      icons={{
        success: <CheckCircle2 className="h-4 w-4" />,
        error: <XCircle className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <AlertTriangle className="h-4 w-4" />,
        loading: <Loader2 className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        // Tokens come from index.css / tailwind.config — no hardcoded colors.
        unstyled: false,
        classNames: {
          toast: [
            "group toast",
            "group-[.toaster]:rounded-2xl",
            "group-[.toaster]:border group-[.toaster]:border-border/60",
            "group-[.toaster]:bg-gradient-card",
            "group-[.toaster]:backdrop-blur-xl",
            "group-[.toaster]:text-foreground",
            "group-[.toaster]:shadow-elegant",
            "group-[.toaster]:px-4 group-[.toaster]:py-3.5",
            "group-[.toaster]:gap-3",
            // Subtle aurora accent strip on the left edge
            "group-[.toaster]:relative group-[.toaster]:overflow-hidden",
            "group-[.toaster]:before:absolute group-[.toaster]:before:inset-y-0 group-[.toaster]:before:left-0 group-[.toaster]:before:w-1",
            "group-[.toaster]:before:bg-gradient-to-b group-[.toaster]:before:from-primary group-[.toaster]:before:to-accent",
          ].join(" "),
          title: "font-display text-sm font-semibold tracking-tight",
          description: "group-[.toast]:text-muted-foreground text-xs leading-relaxed",
          actionButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-gradient-hero group-[.toast]:text-primary-foreground group-[.toast]:shadow-soft group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium",
          closeButton:
            "group-[.toast]:bg-card group-[.toast]:border group-[.toast]:border-border/60 group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground",
          // Per-type tints — accent strip + icon color shift to semantic tokens
          success: [
            "group-[.toaster]:before:from-success group-[.toaster]:before:to-success/60",
            "[&>[data-icon]]:text-success",
          ].join(" "),
          error: [
            "group-[.toaster]:before:from-destructive group-[.toaster]:before:to-destructive/60",
            "[&>[data-icon]]:text-destructive",
          ].join(" "),
          info: [
            "group-[.toaster]:before:from-primary group-[.toaster]:before:to-accent",
            "[&>[data-icon]]:text-primary",
          ].join(" "),
          warning: [
            "group-[.toaster]:before:from-warning group-[.toaster]:before:to-warning/60",
            "[&>[data-icon]]:text-warning",
          ].join(" "),
          loading: [
            "group-[.toaster]:before:from-muted-foreground group-[.toaster]:before:to-muted",
            "[&>[data-icon]]:text-muted-foreground",
          ].join(" "),
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
