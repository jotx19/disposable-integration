"use client";

import { cn } from "@/lib/utils";
import { ROOM_TTL_OPTIONS, isTtlAvailable } from "@/lib/roomTtl";

interface TtlPickerProps {
  value: number;
  onChange: (hours: number) => void;
  createdAt?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export default function TtlPicker({
  value,
  onChange,
  createdAt,
  disabled,
  size = "md",
}: TtlPickerProps) {
  return (
    <div
      role="radiogroup"
      className="inline-flex items-center gap-1 rounded-xl border bg-secondary/50 p-1"
    >
      {ROOM_TTL_OPTIONS.map(({ hours, label }) => {
        const available = isTtlAvailable(createdAt, hours);
        const active = value === hours;
        return (
          <button
            key={hours}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled || !available}
            title={available ? undefined : "This room is already older than that"}
            onClick={() => onChange(hours)}
            className={cn(
              "rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm",
              active
                ? "bg-background text-foreground shadow-sm dark:bg-white/15"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
