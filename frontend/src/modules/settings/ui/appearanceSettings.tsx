"use client";

import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { SettingsHeader, SettingsRow } from "./settingsSection";

const THEMES = [
  { value: "light", label: "Light", icon: Sun03Icon, preview: "bg-[#F4F4F0]" },
  { value: "dark", label: "Dark", icon: Moon02Icon, preview: "bg-[#0A0A0A]" },
];

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <SettingsHeader title="Appearance" description="How Disposable looks on this device." />

      <SettingsRow label="Theme" stacked>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {THEMES.map(({ value, label, icon, preview }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "rounded-xl border p-2 text-left transition",
                theme === value
                  ? "ring-2 ring-blue-500 border-transparent"
                  : "hover:bg-secondary/60"
              )}
            >
              <div className={cn("h-16 rounded-lg border", preview)} />
              <div className="mt-2 flex items-center gap-2 px-1 text-sm">
                <HugeiconsIcon icon={icon} className="size-4" />
                {label}
              </div>
            </button>
          ))}
        </div>
      </SettingsRow>
    </div>
  );
}
