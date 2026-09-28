"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Link01Icon, Message01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CARD, SectionHeading, formatCountdown } from "./shared";

const OPTIONS = [
  { hours: 24, label: "24h", hint: "A bug, an incident, a quick decision." },
  { hours: 36, label: "36h", hint: "A PR review that spans a timezone or two." },
  { hours: 144, label: "6d", hint: "A sprint, a hackathon, a trip." },
];

// The demo clock runs 3600x faster so you can watch a room drain.
const SPEED = 3600;

export default function LifetimePicker() {
  const [hours, setHours] = useState(24);
  const [elapsed, setElapsed] = useState(0);
  const total = hours * 3600;
  const left = Math.max(0, total - elapsed);
  const progress = left / total;

  useEffect(() => {
    setElapsed(0);
    const start = Date.now();
    const id = window.setInterval(() => {
      const sim = ((Date.now() - start) / 1000) * SPEED;
      setElapsed(sim >= total ? 0 : sim);
    }, 50);
    return () => window.clearInterval(id);
  }, [total]);

  const option = OPTIONS.find((o) => o.hours === hours)!;

  return (
    <section className="px-4 py-24 md:px-6">
      <SectionHeading
        eyebrow="Room lifetime"
        title="Pick how long it lives."
        description="Every room has a timer. When it runs out, the room and every message in it are deleted from the database. No archive, no cleanup."
      />

      <div className={cn(CARD, "mx-auto mt-12 grid max-w-4xl gap-8 p-6 md:grid-cols-2 md:p-10")}>
        <div className="space-y-6">
          <div
            role="radiogroup"
            aria-label="Room lifetime"
            className="inline-flex gap-1 rounded-2xl border border-black/5 bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/5"
          >
            {OPTIONS.map((o) => (
              <button
                key={o.hours}
                type="button"
                role="radio"
                aria-checked={hours === o.hours}
                onClick={() => setHours(o.hours)}
                className={cn(
                  "relative rounded-xl px-5 py-2 text-sm font-medium transition",
                  hours === o.hours ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {hours === o.hours && (
                  <motion.span
                    layoutId="ttl-pill"
                    className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-white/15"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{o.label}</span>
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">{option.hint}</p>

          <ul className="space-y-2.5 text-sm">
            {[
              { icon: Message01Icon, text: "Every message goes with the room" },
              { icon: Link01Icon, text: "The invite link and code stop working" },
              { icon: Tick02Icon, text: "Set a default in Settings, change it per room" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-lg border bg-white/70 text-black">
                  <HugeiconsIcon icon={icon} className="size-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center gap-4 rounded-2xl bg-[#0A0A0A] p-6 text-white">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-mono">#your-room</span>
            <span>time left</span>
          </div>
          <div className="font-mono text-3xl tabular-nums tracking-tight md:text-4xl">
            {formatCountdown(left)}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-[background-color]",
                progress < 0.1 ? "bg-red-500" : progress < 0.3 ? "bg-orange-400" : "bg-green-300"
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <HugeiconsIcon icon={Delete02Icon} className="size-3" />
            sped up 3600 so you can watch it go
          </div>
        </div>
      </div>
    </section>
  );
}
