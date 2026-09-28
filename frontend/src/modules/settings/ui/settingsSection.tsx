import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function SettingsHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1 pr-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function SettingsRow({
  label,
  description,
  children,
  stacked = false,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <>
      <Separator />
      <div
        className={cn(
          "flex gap-3 py-5",
          stacked
            ? "flex-col"
            : "flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-8",
          className
        )}
      >
        <div className="space-y-1 sm:min-w-40">
          <div className="text-sm font-medium">{label}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(!stacked && "sm:flex-1 sm:max-w-sm")}>{children}</div>
      </div>
    </>
  );
}
