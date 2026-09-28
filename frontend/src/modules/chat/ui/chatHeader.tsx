"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, Video01Icon, Call02Icon, UserIcon, GlobalIcon, SquareLock02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { useRoomStore } from "@/store/useRoomStore";
import { cn } from "@/lib/utils";

import { useChatStore } from "@/store/useChatStore";
import { useCallStore } from "@/store/useCallStore";
import { useAuthStore } from "@/store/useAuthStore";

import { Timer } from "@/modules/chat/ui/timer";

import RoomSettingsDialog, { type RoomSettingsTab } from "./roomSettingsDialog";
import { Button } from "@/components/ui/button";

export const ChatHeader: React.FC = () => {
  const { selectedRoom, roomGuests } = useChatStore();
  const {
    isInCall,
    isMinimized,
    startCall,
    joinCall,
    openCall,
    maximize,
    activeCallInRoom,
  } = useCallStore();

  const { onlineUsers, authUser } = useAuthStore();
  const { setRoomVisibility } = useRoomStore();
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<RoomSettingsTab>("general");

  const openSettings = (tab: RoomSettingsTab) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
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
  const isOwner = !!authUser && selectedRoom.createdBy?._id === authUser._id;
  const isPublic = !!selectedRoom.isPublic;

  const toggleVisibility = async () => {
    setSavingVisibility(true);
    await setRoomVisibility(selectedRoom._id, !isPublic);
    setSavingVisibility(false);
  };
  const onlineCount = (selectedRoom.members ?? []).filter((m) =>
    onlineUsers.includes(m._id)
  ).length;

  return (
    <div className="pointer-events-none flex justify-center p-2 bg-transparent">
      <div className="pointer-events-none flex items-center justify-between w-full max-w-6xl [&>*]:pointer-events-auto">
        <Button
          variant="outline"
          onClick={() => openSettings("members")}
          aria-label="Room members"
          className="flex items-center gap-2 rounded-full mx-11 h-9 px-4 border border-border bg-background/60 dark:bg-background/60 backdrop-blur-xl shadow-sm"
        >
          <HugeiconsIcon icon={UserIcon} className="h-4 w-4" />
          <span className="text-md text-gray-300">{onlineCount + roomGuests.length}</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={toggleVisibility}
            disabled={!isOwner || savingVisibility}
            aria-pressed={isPublic}
            title={
              !isOwner
                ? `This room is ${isPublic ? "public" : "private"}. Only the owner can change it.`
                : isPublic
                ? "Anyone with the link can chat as a guest. Click to make private."
                : "Only members can chat. Click to let anyone with the link join as a guest."
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full h-9 px-3 text-sm border border-border bg-background/60 dark:bg-background/60 backdrop-blur-xl shadow-sm disabled:opacity-100",
              isPublic ? "text-blue-400 hover:bg-blue-500/10" : "text-muted-foreground hover:bg-white/10",
              !isOwner && "cursor-default"
            )}
          >
            <HugeiconsIcon
              icon={savingVisibility ? Loading03Icon : isPublic ? GlobalIcon : SquareLock02Icon}
              className={cn("h-4 w-4", savingVisibility && "animate-spin")}
            />
            <span className="hidden sm:inline">{isPublic ? "Public" : "Private"}</span>
          </Button>

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
                "flex items-center gap-2 rounded-full h-9 px-4 transition border border-border bg-background/60 dark:bg-background/60 backdrop-blur-xl shadow-sm",
                isInCall
                  ? "text-green-400 hover:bg-green-500/10"
                  : activeCallInRoom
                  ? "text-blue-400 hover:bg-blue-500/10"
                  : "hover:bg-white/10"
              )}
            >
              {isInCall ? (
                <HugeiconsIcon icon={Call02Icon} className="h-4 w-4" />
              ) : (
                <HugeiconsIcon icon={Video01Icon} className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label="Room settings"
            onClick={() => openSettings("general")}
            className="h-9 w-9 rounded-full border border-border bg-background/60 dark:bg-background/60 backdrop-blur-xl shadow-sm"
          >
            <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4" />
          </Button>

          <Timer room={selectedRoom} />
        </div>
      </div>
      <RoomSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tab={settingsTab}
        onTabChange={setSettingsTab}
      />
    </div>
  );
};
