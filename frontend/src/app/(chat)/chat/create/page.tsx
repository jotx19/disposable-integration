"use client";

import { useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SharedLogo from "@/modules/auth/ui/AuthLoader";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import TtlPicker from "@/modules/settings/ui/ttlPicker";
import { DEFAULT_ROOM_TTL_HOURS } from "@/lib/roomTtl";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");

  const { createRoom, isCreatingRoom } = useRoomStore();
  const router = useRouter();
  const { authUser, isCheckingAuth } = useAuthStore();
  const [ttlHours, setTtlHours] = useState<number | null>(null);
  const selectedTtl =
    ttlHours ?? authUser?.defaultRoomTtlHours ?? DEFAULT_ROOM_TTL_HOURS;

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    const room = await createRoom({ name: roomName, ttlHours: selectedTtl });
    if (room) {
      router.push("/chat");
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && !authUser) {
      router.replace("/sign-in");
    }
  }, [isCheckingAuth, authUser, router]);

  if (isCheckingAuth || (!authUser && !isCheckingAuth)) {
    return <SharedLogo />;
  }

  const canCreate = !!roomName.trim() && !isCreatingRoom;

  return (
    <div className="min-h-svh flex items-center justify-center dark:bg-[#0A0A0A] p-4 md:p-6">
      <Card className="w-full max-w-2xl border-none flex flex-col items-center gap-5 md:gap-6 rounded-3xl shadow-lg bg-[#FAFAFA] dark:bg-[#171717] text-center px-5 py-8 md:px-12 md:py-10">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl text-gray-900 dark:text-white">
            Create a Room
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Name it after the thing you&apos;re working on
          </p>
        </div>

        <DotLottieReact
          src="/room2.lottie"
          className="w-full max-w-xs md:max-w-sm h-[22svh] md:h-[30svh]"
          autoplay
          loop
        />

        <form
          className="flex w-full flex-col items-center gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (canCreate) void handleCreate();
          }}
        >
          <div className="flex w-full items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 p-1.5 pl-4 focus-within:ring-2 focus-within:ring-yellow-300 transition">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. auth-bug-hunt"
              maxLength={50}
              autoFocus
              aria-label="Room name"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 outline-none"
            />
            <Button
              type="submit"
              disabled={!canCreate}
              className="h-10 shrink-0 rounded-xl px-4 md:px-6 gap-2"
            >
              {isCreatingRoom && (
                <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
              )}
              Create
            </Button>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <TtlPicker value={selectedTtl} onChange={setTtlHours} />
            <p className="text-[11px] text-muted-foreground">
              Room and messages auto-delete after this long
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}