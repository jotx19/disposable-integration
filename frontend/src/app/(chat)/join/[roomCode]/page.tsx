"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const JoinRoomPage = () => {
  const router = useRouter();
  const params = useParams();
  const { joinRoom } = useRoomStore();

  // ✅ Safely get roomCode from URL
  const roomCode = params?.roomCode as string;

  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const join = async () => {
      if (!roomCode) return;

      const room = await joinRoom(roomCode);

      if (room) {
        toast.success(`Joined room "${room.name}" successfully!`);
        setRedirecting(true);

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev === 1) {
              clearInterval(timer);
              router.push(`/chat`);
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setRedirecting(false);
      }
    };

    join();
  }, [roomCode, joinRoom, router]);

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0A0A0A]">
      <div className="relative flex flex-col md:max-w-xl max-w-lg items-center gap-2 text-center bg-gray-200 dark:bg-[#171717] rounded-2xl p-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 rounded-full"
          onClick={() => router.push("https://disposable.vercel.app")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <DotLottieReact
          src="/Bloomingo.lottie"
          className="md:w-auto w-[70vw] md:h-[30vh] pr-5"
          autoplay
          loop
        />

        <Badge className="text-lg text-black mb-4">
          Joining you in the room...
        </Badge>

        {redirecting && (
          <p className="text-sm text-gray-500 font-mono tracking-tighter">
            Redirecting you in {countdown}s
          </p>
        )}
      </div>
    </div>
  );
};

export default JoinRoomPage;
