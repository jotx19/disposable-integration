"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosInstance } from "@/lib/axios";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";

interface JoinPageProps {
  params: Promise<{ roomCode: string }>;
}

type Status = "checking" | "joining" | "redirecting" | "private" | "failed";

const JoinRoomPage = ({ params }: JoinPageProps) => {
  const router = useRouter();
  const { joinRoom, setPendingRoomId } = useRoomStore();
  const { checkAuth } = useAuthStore();
  const { roomCode } = use(params);

  const [status, setStatus] = useState<Status>("checking");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;

    const run = async () => {
      if (localStorage.getItem("jwt")) await checkAuth();
      if (cancelled) return;

      // Signed in: join as a member and open the room.
      if (useAuthStore.getState().authUser) {
        setStatus("joining");
        const room = await joinRoom(roomCode);
        if (cancelled) return;
        if (!room) {
          setStatus("failed");
          return;
        }
        setPendingRoomId(room._id);
        setStatus("redirecting");
        return;
      }

      // Signed out: public rooms can be joined as a guest, private ones need an account.
      try {
        const { data } = await axiosInstance.get<{ isPublic: boolean }>(
          `/room/public/${roomCode}`
        );
        if (cancelled) return;
        if (data.isPublic) {
          router.replace(`/r/${roomCode}`);
          return;
        }
      } catch {
        // Fall through to the private state.
      }
      if (!cancelled) setStatus("private");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [roomCode, joinRoom, checkAuth, setPendingRoomId, router]);

  useEffect(() => {
    if (status !== "redirecting") return;
    if (countdown <= 0) {
      router.push("/chat");
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [status, countdown, router]);

  return (
    <div className="min-h-svh flex items-center justify-center p-4 dark:bg-[#0A0A0A]">
      <div className="relative flex w-full max-w-lg flex-col items-center gap-3 rounded-3xl bg-gray-200 p-6 text-center dark:bg-[#171717]">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 rounded-full"
          onClick={() => router.push("/")}
          aria-label="Back to home"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
        </Button>

        {status === "private" ? (
          <>
            <div className="mt-6 grid size-14 place-items-center rounded-2xl bg-black/5 dark:bg-white/10">
              <HugeiconsIcon icon={SquareLock02Icon} className="size-6" />
            </div>
            <h1 className="text-xl font-semibold">This room is private</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Sign in or create an account to join. If the room has expired, the
              link won&apos;t work anymore.
            </p>
            <div className="mt-2 flex gap-2">
              <Button asChild className="rounded-xl">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/sign-up">Create account</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DotLottieReact
              src="/Bloomingo.lottie"
              className="h-[26svh] w-full max-w-xs md:h-[30svh]"
              autoplay
              loop
            />
            <Badge className="mb-2 rounded-xl text-lg text-black">
              {status === "failed" ? "Couldn't join this room" : "Joining you in the room"}
            </Badge>
            {status === "redirecting" && (
              <p className="font-mono text-sm tracking-tighter text-gray-500">
                Opening it in {countdown}s
              </p>
            )}
            {status === "failed" && (
              <Button variant="outline" className="rounded-xl" onClick={() => router.push("/chat")}>
                Go to your rooms
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JoinRoomPage;
