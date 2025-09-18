"use client";

import { useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  ArrowRight,
  Verified,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { createRoom, isCreatingRoom } = useRoomStore();

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    const room = await createRoom({ name: roomName });
    if (room) {
      setInviteLink(room.inviteLink || null);
    }
  };

  const handleCopy = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 dark:bg-[#0A0A0A] p-6">
      <Card className="w-full max-w-4xl border-none h-[74vh] flex flex-col rounded-2xl shadow-lg bg-gray-100 dark:bg-[#171717] text-center p-8">
        {!inviteLink ? (
          <div className="flex flex-col h-full w-full">
            {/* Top Section */}
            <div className="flex flex-col items-center mb-6">
              <h1 className="md:text-4xl text-3xl text-gray-900 dark:text-white">
                Create a Room
              </h1>
              <p className="text-muted-foreground md:text-xs text-[10px]">
                Enter the name for your room below
              </p>
            </div>

            {/* Middle Empty Section */}
            <div className="flex-1 flex items-center justify-center">hi
              {/* Placeholder div for future use (illustration/animation) */}
              <div className="w-full h-full flex items-center justify-center">hi
                {/* empty for now */}
              </div>hi
            </div>

            <div className="flex flex-col items-center gap-4">
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
                className="w-1/3 flex items-center justify-center gap-2 py-2 rounded-lg text-black hover:bg-yellow-500 transition"
              >
                {isCreatingRoom && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Badge className="text-lg rounded-full mb-6">
              <Verified className="text-blue-200 fill-blue-600 mr-2" />
              Room Created Successfully!
            </Badge>

            <div className="w-full border border-dashed rounded-2xl flex items-center justify-between gap-4 p-5">
              <Button
                onClick={handleCopy}
                variant="secondary"
                className="flex-1 flex items-center justify-center text-lg w-full h-12 rounded-xl"
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

              <Button asChild className="flex-1 h-12 text-lg rounded-xl">
                <a href="/chat">
                  Visit Room <ExternalLink className="h-5 w-5 ml-2" />
                </a>
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
