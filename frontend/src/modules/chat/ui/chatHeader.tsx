"use client";

import React, { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Info, Copy, Link2, Video, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useChatStore } from "@/store/useChatStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useCallStore } from "@/store/useCallStore";

import { Badge } from "@/components/ui/badge";
import { Timer } from "@/modules/chat/ui/timer";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RoomMembersButton } from "./roomMemberButton";
import { Button } from "@/components/ui/button";

export const ChatHeader: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { selectedRoom, setSelectedRoom } = useChatStore();
  const { userRooms } = useRoomStore();
  const {
    isInCall,
    isMinimized,
    startCall,
    joinCall,
    openCall,
    maximize,
    activeCallInRoom,
  } = useCallStore();

  useEffect(() => {
    if (!roomCode) return;
    const room = userRooms.find((r) => r.roomCode === roomCode);
    if (!room) return;
    setSelectedRoom(room);
  }, [roomCode, userRooms, setSelectedRoom]);

  const displayRoomCode = useMemo(() => {
    if (!roomCode) return "";
    return roomCode.length > 12 ? `${roomCode.slice(0, 12)}…` : roomCode;
  }, [roomCode]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleCopyInvite = () => {
    const link = selectedRoom?.inviteLink;
    if (!link) return toast.error("No invite link available");
    void copyText(link, "Invite link");
  };

  const handleCopyName = () => {
    if (!selectedRoom) return;
    void copyText(selectedRoom.name, "Room name");
  };

  const handleCallClick = () => {
    if (!selectedRoom) return;
    if (isInCall && isMinimized) {
      maximize();
      return;
    }
    if (isInCall) {
      openCall();
      return;
    }
    if (activeCallInRoom) {
      joinCall(activeCallInRoom.roomId, "video");
      return;
    }
    startCall(selectedRoom._id, "video");
  };

  if (!selectedRoom) return null;

  const callIsActive = isInCall || !!activeCallInRoom;

  return (
    <div className="flex justify-center p-2 bg-transparent">
      <div className="flex items-center justify-between w-full max-w-6xl">
        <RoomMembersButton
          roomId={selectedRoom._id}
          roomCode={selectedRoom.roomCode}
          members={selectedRoom.members ?? []}
          createdBy={selectedRoom.createdBy}
        />

        <div className="flex items-center gap-2">
          <div className="relative">
            {callIsActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-background z-10" />
            )}
            <Button
              variant="outline"
              onClick={handleCallClick}
              aria-label={
                isInCall
                  ? "Return to call"
                  : activeCallInRoom
                  ? "Join call"
                  : "Start video call"
              }
              className={cn(
                "flex items-center gap-2 rounded-full backdrop-blur-xl h-9 px-4 transition",
                isInCall
                  ? "text-green-400 hover:bg-green-500/10"
                  : activeCallInRoom
                  ? "text-blue-400 hover:bg-blue-500/10"
                  : "hover:bg-white/10"
              )}
            >
              {isInCall ? (
                <PhoneCall className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Badge variant="secondary" className="md:text-xs flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Show room information"
                  className="p-1 rounded-full hover:bg-white/10 transition"
                >
                  <Info className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="center"
                sideOffset={8}
                collisionPadding={12}
                className="p-0 w-[calc(100vw-25px)] mx-auto max-w-[20rem] sm:w-80 rounded-2xl"
              >
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-semibold text-center">
                    Room Information
                  </p>
                </div>

                <div className="px-3 py-3 border-b">
                  <p className="text-xs text-muted-foreground mb-2">
                    Room Name
                  </p>
                  <div className="h-10 w-full rounded-full border px-3 flex items-center gap-2">
                    <span className="flex-1 truncate text-sm text-center">
                      {selectedRoom.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyName}
                      className="shrink-0 h-7 w-7 rounded-full hover:bg-muted transition flex items-center justify-center"
                      aria-label="Copy room name"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="px-3 py-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Invite Link
                  </p>
                  <div className="h-10 w-full rounded-full border flex items-center overflow-hidden">
                    <span className="flex-1 truncate text-sm text-center px-3">
                      {displayRoomCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      disabled={!selectedRoom.inviteLink}
                      className="h-full px-4 border-l flex items-center justify-center bg-white text-black hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed rounded-none"
                      aria-label="Copy invite link"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </Badge>

          <Timer room={selectedRoom} />
        </div>
      </div>
    </div>
  );
};
