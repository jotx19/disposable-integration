"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CrownIcon,
  Delete02Icon,
  Logout03Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useRoomStore } from "@/store/useRoomStore";
import {
  DEFAULT_ROOM_TTL_HOURS,
  formatTimeLeft,
  getRoomExpiry,
} from "@/lib/roomTtl";
import { SettingsHeader } from "./settingsSection";
import TtlPicker from "./ttlPicker";

export default function RoomSettings() {
  const { authUser } = useAuthStore();
  const { userRooms, deleteRoom, leaveRoom, updateRoomTtl } = useRoomStore();
  const [pendingTtl, setPendingTtl] = useState<string | null>(null);

  if (!authUser) return null;

  const handleTtl = async (roomId: string, hours: number) => {
    setPendingTtl(roomId);
    await updateRoomTtl(roomId, hours);
    setPendingTtl(null);
  };

  return (
    <div className="space-y-2">
      <SettingsHeader
        title="Rooms"
        description="Every room you're in. Change how long your rooms live, or leave and delete them."
      />

      <Separator className="mt-4" />

      {userRooms.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          You&apos;re not in any rooms yet.
        </p>
      ) : (
        <ul>
          {userRooms.map((room, i) => {
            const isOwner = room.createdBy?._id === authUser._id;
            const timeLeft = formatTimeLeft(getRoomExpiry(room));

            return (
              <li key={room._id}>
                {i > 0 && <Separator />}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{room.name}</span>
                      {isOwner ? (
                        <Badge className="rounded-full bg-yellow-300 text-black">
                          <HugeiconsIcon icon={CrownIcon} />
                          Owner
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full">
                          Member
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{room.roomCode}</span>
                      <span className="flex items-center gap-1">
                        <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" />
                        {room.members.length}
                      </span>
                      {timeLeft && (
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-300">
                          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
                          {timeLeft}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isOwner && (
                      <TtlPicker
                        size="sm"
                        value={room.ttlHours ?? DEFAULT_ROOM_TTL_HOURS}
                        createdAt={room.createdAt}
                        disabled={pendingTtl === room._id}
                        onChange={(hours) => handleTtl(room._id, hours)}
                      />
                    )}
                    <ConfirmRoomAction
                      roomName={room.name}
                      isOwner={isOwner}
                      onConfirm={() =>
                        isOwner ? deleteRoom(room._id) : leaveRoom(room._id)
                      }
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ConfirmRoomAction({
  roomName,
  isOwner,
  onConfirm,
}: {
  roomName: string;
  isOwner: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-destructive hover:text-destructive"
        >
          <HugeiconsIcon icon={isOwner ? Delete02Icon : Logout03Icon} />
          {isOwner ? "Delete" : "Leave"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isOwner ? `Delete #${roomName}?` : `Leave #${roomName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isOwner
              ? "The room and all its messages will be deleted for every member. This can't be undone."
              : "You'll stop seeing this room. You can rejoin later with its code while it's still alive."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
          >
            {isOwner ? "Delete room" : "Leave room"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
