"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ContainerIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Footer } from "@/modules/home/ui/footer";
import { Hashtag } from "./shared";

export default function Cta() {
  const router = useRouter();

  return (
    <section className="px-4 pt-10 pb-32 md:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#0A0A0A] p-8 text-center text-white md:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-blue-500/30 blur-3xl"
        />
        <div className="relative space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            <Hashtag tag="ship-it" />
            <Hashtag tag="then-forget-it" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Not every conversation needs to live forever.
          </h2>
          <p className="mx-auto max-w-lg font-mono text-sm text-white/60 md:text-base">
            Open a room for the thing you&apos;re working on right now.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="elevated"
              onClick={() => router.push("/chat/create")}
              className="rounded-full bg-yellow-300 px-6 text-black hover:bg-yellow-400 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            >
              <HugeiconsIcon icon={Add01Icon} size={18} />
              Create a room
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/chat")}
              className="rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
            >
              <HugeiconsIcon icon={ContainerIcon} size={18} />
              Open your rooms
            </Button>
          </div>
        </div>
      </div>

      <footer className="mx-auto mt-10 flex max-w-5xl items-center justify-between px-2 text-xs text-muted-foreground">
        <span className="font-mono">Dispose [:/]</span>
        <Footer />
      </footer>
    </section>
  );
}
