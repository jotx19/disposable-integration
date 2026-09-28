"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface SettingsNavGroup<T extends string> {
  group?: string;
  items: { id: T; label: string; icon: typeof UserIcon }[];
}

interface SettingsLayoutProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  nav: SettingsNavGroup<T>[];
  tab: T;
  onTabChange: (tab: T) => void;
  children: React.ReactNode;
}

// Shared shell for settings-style dialogs: side nav on desktop, tab row on mobile.
export default function SettingsLayout<T extends string>({
  open,
  onOpenChange,
  title,
  description,
  nav,
  tab,
  onTabChange,
  children,
}: SettingsLayoutProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] md:h-[80vh] w-[calc(100vw-1.5rem)] max-w-none sm:max-w-5xl flex-col md:flex-row gap-0 overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>

        <nav className="shrink-0 border-b md:w-60 md:border-b-0 md:border-r bg-secondary/30 p-3 md:p-4">
          <div className="hidden md:block truncate px-2 pb-3 text-xs text-muted-foreground">
            {title}
          </div>
          <div className="flex gap-1 overflow-x-auto pr-10 md:pr-0 md:flex-col md:overflow-visible">
            {nav.map(({ group, items }) => (
              <div key={group ?? "main"} className="flex gap-1 md:flex-col">
                {group && (
                  <div className="hidden md:block px-2 pt-5 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {group}
                  </div>
                )}
                {items.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onTabChange(id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition",
                      tab === id
                        ? "bg-background font-medium shadow-sm ring-1 ring-border dark:bg-white/10"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <HugeiconsIcon icon={icon} className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-8">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
