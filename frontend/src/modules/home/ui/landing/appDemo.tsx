"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  PanInfo,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Delete02Icon,
  InformationCircleIcon,
  MusicNote01Icon,
  SentIcon,
  UserIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { SectionHeading, formatCountdown, useElapsedSeconds } from "./shared";

interface DemoMessage {
  id: string;
  mine?: boolean;
  name: string;
  avatar: string;
  text: string;
  code?: string;
  time: string;
}

interface DemoRoom {
  id: string;
  name: string;
  members: number;
  secondsLeft: number;
  messages: DemoMessage[];
}

const ROOMS: DemoRoom[] = [
  {
    id: "auth",
    name: "auth-bug-hunt",
    members: 4,
    secondsLeft: 23 * 3600 + 12 * 60 + 40,
    messages: [
      { id: "a1", name: "aman", avatar: "🦊", text: "prod login is 500ing after the deploy 😬", time: "10:02" },
      { id: "a2", mine: true, name: "you", avatar: "🐼", text: "stack trace?", time: "10:02" },
      {
        id: "a3",
        name: "aman",
        avatar: "🦊",
        text: "here",
        code: "TypeError: Cannot read properties of undefined (reading 'token')\n  at protectRoute (auth.middleware.js:14)",
        time: "10:03",
      },
      { id: "a4", name: "dev", avatar: "🐙", text: "cookie name changed in the last PR. middleware still reads the old one", time: "10:04" },
      { id: "a5", mine: true, name: "you", avatar: "🐼", text: "fix pushed, redeploying 🚀", time: "10:06" },
      { id: "a6", name: "aman", avatar: "🦊", text: "logins are back. this room can die now 🫡", time: "10:09" },
    ],
  },
  {
    id: "pr",
    name: "pr-482-review",
    members: 3,
    secondsLeft: 35 * 3600 + 2 * 60 + 5,
    messages: [
      { id: "p1", name: "mei", avatar: "🦉", text: "left comments on the migration, mostly naming", time: "14:20" },
      { id: "p2", mine: true, name: "you", avatar: "🐼", text: "can we split the migration into its own PR?", time: "14:21" },
      { id: "p3", name: "mei", avatar: "🦉", text: "yes please, easier to roll back", code: "git checkout -b chore/split-migration", time: "14:22" },
      { id: "p4", mine: true, name: "you", avatar: "🐼", text: "done, re-requested review", time: "14:40" },
    ],
  },
  {
    id: "standup",
    name: "friday-standup",
    members: 7,
    secondsLeft: 5 * 86400 + 20 * 3600 + 9 * 60,
    messages: [
      { id: "s1", name: "sam", avatar: "🐻", text: "shipped the rate limiter, watching dashboards", time: "09:30" },
      { id: "s2", name: "zoe", avatar: "🐸", text: "blocked on staging db, pinged infra", time: "09:31" },
      { id: "s3", mine: true, name: "you", avatar: "🐼", text: "pairing with zoe after this, will unblock", time: "09:32" },
      { id: "s4", name: "kai", avatar: "🐧", text: "putting lofi in the room player 🎧", time: "09:33" },
    ],
  },
];

const ACTION_WIDTH = 76;

function SwipeBubble({
  message,
  onDelete,
}: {
  message: DemoMessage;
  onDelete: () => void;
}) {
  const x = useMotionValue(0);
  const actionOpacity = useTransform(x, [-ACTION_WIDTH, -12, 0], [1, 0, 0]);
  const [open, setOpen] = useState(false);

  const snap = (to: number) =>
    animate(x, to, { type: "spring", stiffness: 500, damping: 40 });

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const shouldOpen = info.offset.x + (open ? -ACTION_WIDTH : 0) < -ACTION_WIDTH / 2;
    setOpen(shouldOpen);
    snap(shouldOpen ? -ACTION_WIDTH : 0);
  };

  return (
    <div className="relative flex justify-end">
      <motion.button
        type="button"
        onClick={onDelete}
        style={{ opacity: actionOpacity }}
        tabIndex={open ? 0 : -1}
        className="absolute right-0 top-0 bottom-4 my-auto flex h-9 w-[68px] flex-col items-center justify-center rounded-xl bg-red-500/15 text-[10px] font-medium text-red-500"
      >
        <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
        Delete
      </motion.button>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH - 20, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onDoubleClick={() => {
          setOpen(!open);
          snap(open ? 0 : -ACTION_WIDTH);
        }}
        style={{ x }}
        className="relative flex max-w-[80%] cursor-grab select-none flex-col items-end gap-1 active:cursor-grabbing"
      >
        <Bubble message={message} />
      </motion.div>
    </div>
  );
}

function Bubble({ message }: { message: DemoMessage }) {
  return (
    <>
      <div
        className={cn(
          "rounded-xl px-3 py-1.5 text-[13px] leading-snug",
          message.mine ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
        )}
      >
        {message.text}
        {message.code && (
          <pre className="mt-1.5 whitespace-pre-wrap break-all rounded-lg bg-black/80 p-2 font-mono text-[10.5px] text-red-300">
            {message.code}
          </pre>
        )}
      </div>
      <span className="text-[10px] text-gray-400">{message.time}</span>
    </>
  );
}

function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-xl bg-gray-200 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-gray-500"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export default function AppDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.3 });
  const reduceMotion = useReducedMotion();
  const elapsed = useElapsedSeconds();

  const [activeId, setActiveId] = useState(ROOMS[0].id);
  const [visible, setVisible] = useState(0);
  const [deleted, setDeleted] = useState<string[]>([]);

  const room = ROOMS.find((r) => r.id === activeId)!;
  const messages = room.messages.filter((m) => !deleted.includes(m.id));
  const done = visible >= room.messages.length;
  const nextIsOther = !done && !room.messages[visible]?.mine;

  // Replay the conversation whenever a room is opened.
  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setVisible(room.messages.length);
      return;
    }
    setVisible(0);
    const id = window.setInterval(() => {
      setVisible((v) => {
        if (v >= room.messages.length) {
          window.clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeId, inView, reduceMotion, room.messages.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, activeId]);

  const shown = messages.filter((m) => room.messages.indexOf(m) < visible);

  return (
    <section id="demo" className="scroll-mt-6 px-4 py-24 md:px-6">
      <SectionHeading
        eyebrow="Live demo"
        title="This is the app. Go on, poke it."
        description="Switch rooms in the sidebar, watch the chat play out, and swipe your own blue messages left (or double-click them) to delete."
      />

      <div
        ref={containerRef}
        className="dark mx-auto mt-12 flex h-[560px] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-[#171717] md:flex">
          <div className="flex h-14 items-center gap-2 px-3">
            <div className="size-8 rounded-lg bg-white/70" />
            <div className="flex h-8 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
              Disposable
            </div>
          </div>
          <div className="px-6 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-white/50">
            Rooms
          </div>
          <div>
            {ROOMS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                className={cn(
                  "flex h-12 w-full items-center gap-2 border-b border-white/10 px-6 text-left text-[15px] font-semibold transition",
                  r.id === activeId ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <span className="truncate">{r.name}</span>
                <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5 shrink-0" />
              </button>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 p-3">
            <div className="grid size-8 place-items-center rounded-full bg-blue-500 text-xs">YO</div>
            <div className="min-w-0 text-xs">
              <div className="truncate font-medium">you</div>
              <div className="truncate text-white/50">you@dev.team</div>
            </div>
          </div>
        </aside>

        {/* Chat */}
        <div className="relative flex-1">
          <div
            ref={scrollRef}
            className="absolute inset-0 space-y-3 overflow-y-auto px-4 pt-20 pb-28 [scrollbar-width:none] md:px-6 [&::-webkit-scrollbar]:hidden"
          >
            <div className="text-center text-[11px] text-gray-500">
              you created the room
            </div>
            <AnimatePresence initial={false}>
              {shown.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {m.mine ? (
                    <SwipeBubble
                      message={m}
                      onDelete={() => setDeleted((d) => [...d, m.id])}
                    />
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-base">
                        {m.avatar}
                      </div>
                      <div className="flex max-w-[80%] flex-col items-start gap-1">
                        <Bubble message={m} />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {inView && nextIsOther && (
              <div className="pl-10">
                <TypingDots />
              </div>
            )}
          </div>

          {/* Floating header */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="pointer-events-auto flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 text-xs backdrop-blur-xl">
                <HugeiconsIcon icon={UserIcon} className="size-3.5" />
                {room.members}
              </div>
              <div className="flex gap-1 overflow-x-auto md:hidden">
                {ROOMS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    className={cn(
                      "pointer-events-auto h-8 rounded-full border border-white/10 px-2.5 font-mono text-[10px] backdrop-blur-xl",
                      r.id === activeId ? "bg-white/20" : "bg-black/60"
                    )}
                  >
                    #{r.name.split("-")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="hidden size-8 place-items-center rounded-full border border-white/10 bg-black/60 backdrop-blur-xl sm:grid">
                <HugeiconsIcon icon={Video01Icon} className="size-3.5" />
              </div>
              <div className="hidden size-8 place-items-center rounded-full border border-white/10 bg-black/60 backdrop-blur-xl sm:grid">
                <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5" />
              </div>
              <div className="flex h-8 items-center rounded-full border border-white/10 bg-black/60 px-3 font-mono text-[11px] tabular-nums text-gray-300 backdrop-blur-xl">
                {formatCountdown(room.secondsLeft - elapsed)}
              </div>
            </div>
          </div>

          {/* Floating input */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 shadow-lg backdrop-blur-xl">
              <HugeiconsIcon icon={MusicNote01Icon} className="mb-auto mt-1.5 size-4 text-white/50" />
              <div className="min-h-12 flex-1 pt-1 font-mono text-xs text-white/40">
                Message #{room.name}
              </div>
              <div className="grid size-8 place-items-center rounded-full bg-white/80 text-black">
                <HugeiconsIcon icon={SentIcon} className="size-4" />
              </div>
            </div>
            {done && messages.some((m) => m.mine) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1.5 text-center font-mono text-[10px] text-white/40"
              >
                ← swipe a blue message to delete it
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
