"use client";

import { useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  Verified,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SharedLogo from "@/modules/auth/ui/AuthLoader";
import Link from "next/link";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { createRoom, isCreatingRoom } = useRoomStore();
  const router = useRouter();
  const { authUser, isCheckingAuth } = useAuthStore();

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    const room = await createRoom({ name: roomName });
    if (room) {
      setInviteLink(room.inviteLink || null);
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

  const handleCopy = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0A0A0A] p-6">
      <Card className="w-full max-w-4xl border-none h-[74vh] flex flex-col rounded-2xl shadow-lg bg-[#FAFAFA] dark:bg-[#171717] text-center p-8">
        {!inviteLink ? (
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
              className="md:w-auto w-[70vw] h-[40vh]"
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
                className="w-1/3 flex items-center justify-center gap-2 py-2 rounded-lg dark:text-black text-white hover:bg-yellow-500  transition"
              >
                {isCreatingRoom && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <Badge className="text-lg flex items-center mx-auto rounded-full">
              <Verified className="text-blue-200 fill-blue-600 !h-8 !w-8 mr-2" />
              Room Created Successfully!
            </Badge>

            <div className="w-full border border-dashed rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 p-5">
              <Button
                onClick={handleCopy}
                variant="secondary"
                className="w-full md:flex-1 flex items-center justify-center text-lg h-12 rounded-xl"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-5 w-5 mr-2" />
                    Copy Invite Link
                  </>
                )}
              </Button>

              <Button
                asChild
                className="w-full md:flex-1 h-12 text-lg rounded-xl"
              >
                <Link href="/chat">
                  Visit Room <ExternalLink className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
