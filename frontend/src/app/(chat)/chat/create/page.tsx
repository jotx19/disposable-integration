"use client";

import { useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SharedLogo from "@/modules/auth/ui/AuthLoader";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");

  const { createRoom, isCreatingRoom } = useRoomStore();
  const router = useRouter();
  const { authUser, isCheckingAuth } = useAuthStore();

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    const room = await createRoom({ name: roomName });
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

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0A0A0A] p-6">
      <Card className="w-full max-w-4xl border-none h-[74vh] flex flex-col rounded-2xl shadow-lg bg-[#FAFAFA] dark:bg-[#171717] text-center p-8">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <h1 className="md:text-5xl text-3xl text-gray-900 dark:text-white">
              Create a Room
            </h1>
            <p className="text-muted-foreground md:text-xs text-[10px]">
              Enter the name for your room below
            </p>
          </div>

          <DotLottieReact
            src="/room2.lottie"
            className="md:w-auto w-[70vw]  h-[40vh]"
            autoplay
            loop
          />

          <div className="flex flex-col items-center gap-4 w-full">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="md:w-2/3 w-full px-4 py-2 rounded-lg bg-white dark:bg-white/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/60 focus:ring-2 focus:ring-yellow-300"
            />
            <Button
              variant="elevated"
              size="sm"
              onClick={handleCreate}
              disabled={isCreatingRoom}
              className="w-1/3 flex items-center justify-center gap-2 py-2 rounded-lg dark:text-black text-white hover:bg-yellow-500 transition"
            >
              {isCreatingRoom && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}