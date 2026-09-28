"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Delete02Icon,
  MusicNote01Icon,
  Share08Icon,
  Tick02Icon,
  Timer02Icon,
  Video01Icon,
  SquareLock02Icon,
  Headphones,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CARD, SectionHeading, formatCountdown, useElapsedSeconds } from "./shared";

function FeatureCard({
  icon,
  title,
  body,
  className,
  children,
}: {
  icon: typeof Copy01Icon;
  title: string;
  body: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
      className={cn(CARD, "flex flex-col overflow-hidden", className)}
    >
      <div className="flex min-h-40 flex-1 items-center justify-center bg-black/[0.02] p-6 dark:bg-white/[0.02]">
        {children}
      </div>
      <div className="space-y-1.5 border-t border-black/5 p-5 dark:border-white/10">
        <div className="flex items-center gap-2 font-semibold">
          <HugeiconsIcon icon={icon} className="size-4" />
          {title}
        </div>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  );
}

function CountdownVisual() {
  const elapsed = useElapsedSeconds();
  const rooms = [
    { name: "hotfix-2041", left: 3 * 3600 + 14 * 60 },
    { name: "pr-482-review", left: 35 * 3600 + 2 * 60 },
    { name: "hackathon-48h", left: 5 * 86400 + 8 * 3600 },
  ];
  return (
    <div className="w-full max-w-md space-y-2">
      {rooms.map((r) => (
        <div
          key={r.name}
          className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <span className="font-mono">#{r.name}</span>
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              r.left < 6 * 3600 ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {formatCountdown(r.left - elapsed)}
          </span>
        </div>
      ))}
    </div>
  );
}

function InviteVisual() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText("7XK2QPfa");
    } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex h-10 flex-1 items-center rounded-xl border border-black/10 bg-white px-3 font-mono tracking-[0.2em] dark:border-white/10 dark:bg-white/5">
          7XK2QPfa
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy room code"
          className="grid size-10 place-items-center rounded-xl border border-black/10 bg-white transition hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className={cn("size-4", copied && "text-green-500")} />
        </button>
      </div>
      <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-medium text-white">
        <HugeiconsIcon icon={Share08Icon} className="size-4" />
        Share invite
      </div>
    </div>
  );
}

function CallVisual() {
  const people = ["🦊", "🐼", "🐙", "🦉"];
  return (
    <div className="grid w-full max-w-[220px] grid-cols-2 gap-1.5 rounded-2xl bg-black p-1.5">
      {people.map((p, i) => (
        <div key={p} className="relative grid aspect-video place-items-center rounded-lg bg-zinc-800 text-2xl">
          {p}
          {i === 1 && <span className="absolute inset-0 rounded-lg ring-2 ring-green-400" />}
        </div>
      ))}
    </div>
  );
}

function MusicVisual() {
  return (
    <div className="flex w-full max-w-xs items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg border bg-muted">
      <HugeiconsIcon icon={Headphones} className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">lofi beats to debug to</div>
        <div className="text-xs text-muted-foreground">playing for 5 in the room</div>
      </div>
      <div className="flex h-6 items-end gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-1 origin-bottom rounded-full bg-orange-500"
            style={{
              height: "100%",
              animation: `equalizer ${0.7 + i * 0.15}s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SwipeVisual() {
  return (
    <div className="relative flex w-full max-w-[240px] justify-end">
      <div className="absolute right-0 top-1/2 flex h-9 w-[64px] -translate-y-1/2 flex-col items-center justify-center rounded-xl bg-red-500/15 text-[10px] font-medium text-red-500">
        <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
        Delete
      </div>
      <motion.div
        animate={{ x: [0, 0, -72, -72, 0] }}
        transition={{ duration: 3.2, times: [0, 0.25, 0.4, 0.8, 1], repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-xl bg-blue-500 px-3 py-2 text-sm text-white"
      >
        oops, wrong room
      </motion.div>
    </div>
  );
}

function SudoVisual() {
  const full = "sudo delete you";
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((v) => (v >= full.length + 12 ? 0 : v + 1)), 110);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="w-full max-w-xs rounded-xl bg-[#0A0A0A] p-4 font-mono text-sm text-white">
      <span className="text-green-400">$</span> {full.slice(0, n)}
      <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-white/80" />
    </div>
  );
}

export default function Features() {
  return (
    <section className="px-4 py-24 md:px-6">
      <SectionHeading
        eyebrow="Features"
        title="Everything a short chat needs."
        description="Nothing it doesn't."
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Timer02Icon}
          title="Rooms that self-destruct"
          body="Each room counts down from 24 hours, 36 hours or 6 days. Owners can change it from room settings."
          className="md:col-span-2"
        >
          <CountdownVisual />
        </FeatureCard>
        <FeatureCard
          icon={Share08Icon}
          title="Invite by link or code"
          body="Share the invite from any app, or read out an 8-character code."
        >
          <InviteVisual />
        </FeatureCard>
        <FeatureCard
          icon={Video01Icon}
          title="Jump on a call"
          body="When typing gets slow, start a video call right inside the room."
        >
          <CallVisual />
        </FeatureCard>
        <FeatureCard
          icon={MusicNote01Icon}
          title="Listen together"
          body="Search a song and play it for everyone in the room."
        >
          <MusicVisual />
        </FeatureCard>
        <FeatureCard
          icon={Delete02Icon}
          title="Swipe to delete"
          body="Sent something wrong? Swipe it away, iOS style."
        >
          <SwipeVisual />
        </FeatureCard>
        <FeatureCard
          icon={SquareLock02Icon}
          title="Leave no trace"
          body="Delete your account and every room you made goes with it. Confirm with sudo, not a support ticket."
          className="md:col-span-3"
        >
          <SudoVisual />
        </FeatureCard>
      </div>
    </section>
  );
}
