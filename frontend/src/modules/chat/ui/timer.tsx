"use client";

import React, { useEffect, useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { getRoomExpiry } from "@/lib/roomTtl";
import { cn } from "@/lib/utils";

interface Room {
  _id: string;
  name: string;
  ttlHours?: number;
  expiresAt?: string;
  createdAt?: string;
}

interface TimerProps {
  room: Room | null;
}

const pad = (n: number) => n.toString().padStart(2, "0");

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const hms = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return days > 0 ? `${days}d ${hms}` : hms;
}

export const Timer: React.FC<TimerProps> = ({ room }) => {
  const { getRoomDeadline } = useRoomStore();
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const roomId = room?._id;
  const expiresAt = room?.expiresAt;
  const ttlHours = room?.ttlHours;
  const createdAt = room?.createdAt;

  // Refetch whenever the room or its lifetime changes.
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    setDeadline(null);

    getRoomDeadline(roomId).then((serverDeadline) => {
      if (cancelled) return;
      const fallback = getRoomExpiry({ expiresAt, ttlHours, createdAt })?.getTime();
      setDeadline(serverDeadline ?? fallback ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, expiresAt, ttlHours, createdAt, getRoomDeadline]);

  // Derive remaining time from the wall clock each tick so it never drifts,
  // even when the tab was in the background.
  useEffect(() => {
    if (deadline == null) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline]);

  if (deadline == null) return null;

  const remaining = deadline - now;
  const expired = remaining <= 0;
  const urgent = !expired && remaining < 60 * 60 * 1000;

  return (
    <span
      title={`Expires ${new Date(deadline).toLocaleString()}`}
      className={cn(
        "flex h-9 items-center rounded-full px-4 md:text-sm text-[12px] tracking-tighter font-mono tabular-nums border border-border bg-background/60 dark:bg-background/60 backdrop-blur-xl shadow-sm",
        expired || urgent ? "text-red-400" : "text-gray-300"
      )}
    >
      {expired ? "Expired" : formatRemaining(remaining)}
    </span>
  );
};
