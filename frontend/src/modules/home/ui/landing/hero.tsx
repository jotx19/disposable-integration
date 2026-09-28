"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ContainerIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Silk from "@/modules/home/ui/silk";
import {  useElapsedSeconds } from "./shared";

const HERO_TAGS = ["bug-bash", "pr-review", "hackathon", "incident"];

export default function Hero() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();
  const elapsed = useElapsedSeconds();

  const handleJoin = () => {
    const code = roomCode.trim();
    if (!code) return;
    router.push(`/join/${code}`);
  };

  return (
    <section className="px-3 pt-3 md:px-4 md:pt-4">
      <div className="relative flex min-h-[87svh] items-center justify-center overflow-hidden rounded-3xl p-6">
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <Silk speed={3} scale={1} color="#475569" noiseIntensity={1.5} rotation={0} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-7xl space-y-6 text-center"
        >

          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Disposable Chatrooms
          </h1>

          <p className="mx-auto text-xs text-gray-200 md:w-1/2 md:text-xs">
            Dev chat that deletes itself. One room per bug, PR or standup, gone
            in 24 hours, 36 hours or 6 days.
          </p>

          <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => router.push("/chat")}
              variant="elevated"
              className="w-full rounded-full border-gray-800 bg-black text-white sm:w-1/2"
            >
              <HugeiconsIcon icon={ContainerIcon} size={18} />
              Rooms
            </Button>

            <div className="flex w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="min-w-0 flex-1 rounded-l-full bg-black px-3 py-2 text-white"
              />
              <Button
                variant="elevated"
                className="rounded-l-none rounded-r-3xl border-gray-800 bg-black text-white"
                onClick={handleJoin}
              >
                Join
              </Button>
            </div>
          </div>

          <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-2 pt-2">
            {HERO_TAGS.map((tag) => (
              <a
                key={tag}
                href="#demo"
                className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-xs text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                #{tag}
              </a>
            ))}
          </div>
        </motion.div>

        <a
          href="#demo"
          className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 font-mono text-[11px] text-white/60 transition hover:text-white"
        >
          ↓ see it in action
        </a>
      </div>
    </section>
  );
}
