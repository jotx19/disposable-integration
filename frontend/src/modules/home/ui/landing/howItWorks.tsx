"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CARD, SectionHeading } from "./shared";

const STEPS = [
  {
    title: "Create a room",
    body: "Name it after the thing you're working on and pick 24h, 36h or 6 days.",
    sample: "#pr-482-review · 36h",
  },
  {
    title: "Share the invite",
    body: "Send the link from any app, or read out the code. Teammates join in one click.",
    sample: "code: 7XK2QPfa",
  },
  {
    title: "Talk, then walk away",
    body: "Chat, call, play music. When the timer hits zero the room and its messages are gone.",
    sample: "⏳ 35h 59m 59s",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-24 md:px-6">
      <SectionHeading eyebrow="How it works" title="Three steps. Zero cleanup." />

      <div className="relative mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
        <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/15 md:block" />
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: i * 0.1 }}
            className={cn(CARD, "relative space-y-4 p-6")}
          >
            <span className="grid size-7 place-items-center rounded-full bg-black font-mono text-xs text-white dark:bg-white dark:text-black">
              {i + 1}
            </span>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            <div className="w-fit rounded-2xl rounded-bl-sm bg-blue-500 px-3 py-1.5 font-mono text-xs text-white">
              {s.sample}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
