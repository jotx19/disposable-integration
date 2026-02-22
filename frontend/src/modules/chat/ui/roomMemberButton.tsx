"use client";

import React, { useMemo, useState } from "react";
import { UserIcon, MoreVertical, UserX, Copy, Verified } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/useAuthStore";
import { useRoomStore } from "@/store/useRoomStore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = { _id: string; name: string };
type IdObj = { _id: string };

type RoomMembersButtonProps = {
  roomCode?: string;
  roomId?: string;
  members?: User[];
  createdBy?: unknown;
};

function getCreatorId(createdBy: unknown): string | null {
  if (
    typeof createdBy === "object" &&
    createdBy !== null &&
    "_id" in createdBy &&
    typeof (createdBy as IdObj)._id === "string"
  ) {
    return (createdBy as IdObj)._id;
  }
  if (typeof createdBy === "string") return createdBy;
  return null;
}

export const RoomMembersButton: React.FC<RoomMembersButtonProps> = ({
  roomCode,
  roomId,
  members,
  createdBy,
}) => {
  const { onlineUsers, authUser } = useAuthStore();
  const { removeUserFromRoom } = useRoomStore();
  const [open, setOpen] = useState(false);

  const creatorId = useMemo(() => getCreatorId(createdBy), [createdBy]);

  const isCreator = useMemo(() => {
    return !!authUser && !!creatorId && creatorId === authUser._id;
  }, [authUser, creatorId]);

  const onlineCount = useMemo(() => {
    if (!members) return 0;
    return members.filter((m) => onlineUsers.includes(m._id)).length;
  }, [members, onlineUsers]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const code = roomCode ?? "";
      if (!code) return toast.error("Room code missing");
      await removeUserFromRoom(code, userId);
      toast.success("User removed");
    } catch {
      toast.error("Failed to remove user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full backdrop-blur-xl mx-11 h-9 px-4"
          disabled={!roomId}
        >
          <UserIcon className="h-4 w-4" size={16} />
          <span className="text-md text-gray-300">{onlineCount}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Room Members</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <ul className="space-y-2">
            {(members ?? []).map((member) => {
              const isOnline = onlineUsers.includes(member._id);
              const isSelf = !!authUser && member._id === authUser._id;
              const isAdmin = !!creatorId && member._id === creatorId;
              const canRemove = isCreator && !isSelf;

              return (
                <li
                  key={member._id}
                  className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isOnline ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3 ${
                          isOnline ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </span>

                    <p className="truncate text-sm font-medium">
                      {member.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (you)
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {isOnline ? "Online" : "Offline"}
                    </span>

                    {canRemove ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="Member actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => handleRemove(member._id)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => void copyText(member._id, "User ID")}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy user id
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : isAdmin ? (
                      <div
                        className="h-8 w-8 flex items-center justify-center"
                        title="Room Admin"
                      >
                        <Verified className="h-4 w-4 fill-blue-500 text-white" />
                      </div>
                    ) : (
                      <span className="h-8 w-8" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};