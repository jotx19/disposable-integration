"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  FloppyDiskIcon,
  GlobalIcon,
  Logout03Icon,
  SentIcon,
  UserIcon,
  WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/modules/chat/ui/chatView";
import { cn } from "@/lib/utils";
import { getSenderId, type Message, type RoomGuest } from "@/store/useChatStore";
import type { GuestRoomInfo, GuestStatus } from "./useGuestRoom";

const GLASS =
  "border border-border bg-background/60 dark:bg-background/60 backdrop-blur-xl shadow-sm";

const SEND_ERRORS: Record<string, string> = {
  rate_limited: "Slow down a little.",
  too_long: "That message is too long.",
  room_expired: "This room has expired.",
  offline: "You're offline. Reconnecting…",
  timeout: "Message didn't go through. Try again.",
  session_ended: "Your guest session ended.",
};

const pad = (n: number) => n.toString().padStart(2, "0");

function useCountdown(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const total = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const days = Math.floor(total / 86400);
  const hms = `${pad(Math.floor((total % 86400) / 3600))}h ${pad(Math.floor((total % 3600) / 60))}m ${pad(total % 60)}s`;
  return { expired: total === 0, label: days > 0 ? `${days}d ${hms}` : hms };
}

interface GuestChatProps {
  room: GuestRoomInfo;
  you: RoomGuest;
  messages: Message[];
  guests: RoomGuest[];
  status: GuestStatus;
  lostMessages: boolean;
  onDismissLost: () => void;
  onSend: (text: string) => Promise<{ ok: boolean; error?: string }>;
  onSaveChat: () => void;
  onLeave: () => void;
}

export default function GuestChat({
  room,
  you,
  messages,
  guests,
  status,
  lostMessages,
  onDismissLost,
  onSend,
  onSaveChat,
  onLeave,
}: GuestChatProps) {
  const [text, setText] = useState("");
  const [bannerOpen, setBannerOpen] = useState(true);
  const [overlay, setOverlay] = useState({ top: 140, bottom: 110 });
  const headerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const countdown = useCountdown(room.expiresAt);
  const connected = status === "connected";
  const sentCount = messages.filter((m) => getSenderId(m) === you.id).length;

  // Same floating layout as the member chat: reserve the header/input heights.
  useEffect(() => {
    const header = headerRef.current;
    const input = inputRef.current;
    if (!header || !input) return;
    const measure = () => setOverlay({ top: header.offsetHeight, bottom: input.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(input);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, overlay.bottom]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || !connected) return;
    setText("");
    const res = await onSend(body);
    if (!res.ok) {
      setText(body);
      toast.error(SEND_ERRORS[res.error ?? ""] ?? "Message failed to send");
    }
  };

  return (
    <div className="relative mx-auto h-svh w-full max-w-5xl dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 overflow-y-auto overscroll-contain px-4 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div style={{ height: overlay.top }} aria-hidden />
        <div className="space-y-2 py-2">
          {messages.map((m) => (
            <ChatMessage key={m._id} message={m} viewerId={you.id} canDeleteOwn={false} />
          ))}
        </div>
        <div ref={endRef} style={{ height: overlay.bottom }} aria-hidden />
      </div>

      {/* Floating header + save banner */}
      <div ref={headerRef} className="pointer-events-none absolute inset-x-0 top-0 z-50 space-y-2 px-3 pt-3 md:px-4">
        <div className="flex items-center justify-between gap-2 [&>*]:pointer-events-auto">
          <div className={cn("flex h-9 min-w-0 items-center gap-2 rounded-full px-4", GLASS)}>
            <HugeiconsIcon icon={GlobalIcon} className="size-3.5 shrink-0 text-blue-400" />
            <span className="truncate text-sm font-medium">#{room.name}</span>
            <span className="hidden shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-500 sm:inline">
              guest
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div
              className={cn("hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm sm:flex", GLASS)}
              title={`${room.memberCount} members, ${guests.length} guests here now`}
            >
              <HugeiconsIcon icon={UserIcon} className="size-4" />
              {room.memberCount + guests.length}
            </div>
            <span
              className={cn(
                "flex h-9 items-center rounded-full px-4 font-mono text-[12px] tabular-nums tracking-tighter md:text-sm",
                GLASS,
                countdown.expired ? "text-red-400" : "text-gray-300"
              )}
            >
              {countdown.expired ? "Expired" : countdown.label}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={onLeave}
              aria-label="Leave room"
              className={cn("size-9 rounded-full text-red-500 hover:text-red-500", GLASS)}
            >
              <HugeiconsIcon icon={Logout03Icon} className="size-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {status === "reconnecting" && (
            <motion.div
              key="reconnecting"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="pointer-events-auto mx-auto flex w-fit items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1.5 text-xs text-orange-600 backdrop-blur-xl dark:text-orange-300"
            >
              <HugeiconsIcon icon={WifiDisconnected01Icon} className="size-3.5" />
              Connection lost. Reconnecting… unsaved messages will be cleared.
            </motion.div>
          )}

          {lostMessages && status === "connected" && (
            <motion.div
              key="lost"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="pointer-events-auto mx-auto flex w-fit items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1.5 text-xs text-orange-600 backdrop-blur-xl dark:text-orange-300"
            >
              Your connection dropped, so your unsaved messages were cleared.
              <button type="button" onClick={onDismissLost} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
              </button>
            </motion.div>
          )}

          {bannerOpen && (
            <motion.div
              key="save"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                "pointer-events-auto flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:p-4",
                GLASS
              )}
            >
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium">Hey @{you.username} 👋 want to save this chat?</span>{" "}
                <span className="text-muted-foreground">
                  {sentCount > 0
                    ? `Your ${sentCount} ${sentCount === 1 ? "message disappears" : "messages disappear"} when you leave or lose connection. Sign up to keep ${sentCount === 1 ? "it" : "them"} here until the room expires.`
                    : "As a guest, your messages disappear when you leave. Sign up to keep them until the room expires."}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button onClick={onSaveChat} className="h-9 rounded-xl bg-blue-500 text-white hover:bg-blue-600">
                  <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
                  Save chat
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-xl"
                  aria-label="Dismiss"
                  onClick={() => setBannerOpen(false)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating input */}
      <div ref={inputRef} className="absolute inset-x-0 bottom-0 z-50 px-3 pb-3 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className={cn("flex w-full min-w-0 items-end gap-2 rounded-2xl px-3 py-1.5 shadow-lg", GLASS)}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            maxLength={2000}
            disabled={!connected || countdown.expired}
            placeholder={connected ? `Message #${room.name} as @${you.username}` : "Reconnecting…"}
            className="max-h-[40vh] min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-2.5 font-mono text-sm tracking-tight outline-none wrap-anywhere placeholder:text-muted-foreground disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || !connected}
            className="mb-1 shrink-0 rounded-full"
            aria-label="Send message"
          >
            <HugeiconsIcon icon={SentIcon} className="size-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
