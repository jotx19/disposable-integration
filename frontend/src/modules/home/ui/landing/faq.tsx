"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CARD, SectionHeading } from "./shared";

const FAQS = [
  {
    q: "How long does a room last?",
    a: "You choose when you create it: 24 hours, 36 hours or 6 days, counted from creation. The room owner can change it later from room settings, as long as the room isn't already older than the new lifetime.",
  },
  {
    q: "What happens when the timer runs out?",
    a: "The room and every message in it are deleted from the database automatically. The invite link and room code stop working.",
  },
  {
    q: "Do I need an account?",
    a: "Yes. Sign up with an email to create or join rooms, so people in a room know who they're talking to.",
  },
  {
    q: "Can I delete a message I sent?",
    a: "Swipe it left, or double-click it on desktop, and tap Delete. You can only delete your own messages.",
  },
  {
    q: "Can I leave or delete a room early?",
    a: "Members can leave any room from room settings. Owners can delete the room for everyone at any time.",
  },
  {
    q: "How do I delete my account?",
    a: "Settings → Account → Delete account, then type sudo delete followed by your username. Rooms you created and all your messages are removed.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="px-4 py-24 md:px-6">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." />

      <div className={cn(CARD, "mx-auto mt-12 max-w-3xl divide-y divide-black/5 dark:divide-white/10")}>
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium"
              >
                {item.q}
                <HugeiconsIcon
                  icon={Add01Icon}
                  className={cn("size-4 shrink-0 transition-transform duration-300", isOpen && "rotate-45")}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
