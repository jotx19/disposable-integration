"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const CARD =
  "rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#141414]";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl space-y-3 text-center", className)}>
      <span className="inline-flex items-center rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground md:text-base">{description}</p>
      )}
    </div>
  );
}

export function Hashtag({ tag, className }: { tag: string; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md bg-yellow-200/70 px-1.5 py-0.5 font-mono text-xs text-yellow-950 dark:bg-yellow-300/15 dark:text-yellow-200",
        className
      )}
    >
      #{tag}
    </span>
  );
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hms = `${pad(Math.floor((s % 86400) / 3600))}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
  return days > 0 ? `${days}d ${hms}` : hms;
}

// Seconds elapsed since mount, ticking once a second. Starts at 0 on the server
// and on first client render so hydration matches.
export function useElapsedSeconds() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000
    );
    return () => window.clearInterval(id);
  }, []);
  return elapsed;
}
