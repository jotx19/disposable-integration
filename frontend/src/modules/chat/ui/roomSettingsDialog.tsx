"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge02Icon,
  Clock01Icon,
  Copy01Icon,
  CrownIcon,
  Share08Icon,
  SlidersHorizontalIcon,
  UserGroupIcon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useRoomStore } from "@/store/useRoomStore";
import {
  DEFAULT_ROOM_TTL_HOURS,
  formatTimeLeft,
  getRoomExpiry,
} from "@/lib/roomTtl";
import SettingsLayout, { SettingsNavGroup } from "@/modules/settings/ui/settingsLayout";
import { SettingsHeader, SettingsRow } from "@/modules/settings/ui/settingsSection";
import { ConfirmRoomAction } from "@/modules/settings/ui/roomSettings";
import TtlPicker from "@/modules/settings/ui/ttlPicker";

export type RoomSettingsTab = "general" | "invite" | "members";

const NAV: SettingsNavGroup<RoomSettingsTab>[] = [
  {
    items: [
      { id: "general", label: "General", icon: SlidersHorizontalIcon },
      { id: "invite", label: "Invite & share", icon: Share08Icon },
      { id: "members", label: "Members", icon: UserGroupIcon },
    ],
  },
];

const copyText = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Copy failed");
  }
};

interface RoomSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: RoomSettingsTab;
  onTabChange: (tab: RoomSettingsTab) => void;
}

export default function RoomSettingsDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
}: RoomSettingsDialogProps) {
  const { selectedRoom } = useChatStore();
  const { userRooms } = useRoomStore();

  if (!selectedRoom) return null;

  // The room store copy carries the freshest ttl/expiry/member details.
  const room = userRooms.find((r) => r._id === selectedRoom._id) ?? selectedRoom;

  return (
    <SettingsLayout
      open={open}
      onOpenChange={onOpenChange}
      title={`#${selectedRoom.name}`}
      description="Room settings, invite link and members."
      nav={NAV}
      tab={tab}
      onTabChange={onTabChange}
    >
      {tab === "general" && <GeneralTab room={room} onClose={() => onOpenChange(false)} />}
      {tab === "invite" && <InviteTab room={room} />}
      {tab === "members" && <MembersTab room={room} />}
    </SettingsLayout>
  );
}

type RoomLike = {
  _id: string;
  name: string;
  roomCode?: string;
  inviteLink?: string;
  ttlHours?: number;
  expiresAt?: string;
  createdAt?: string;
  createdBy?: { _id: string; name: string } | null;
  members?: { _id: string; name: string; profilepic?: string }[];
  isPublic?: boolean;
};

function GeneralTab({ room, onClose }: { room: RoomLike; onClose: () => void }) {
  const { authUser } = useAuthStore();
  const { updateRoomTtl, deleteRoom, leaveRoom } = useRoomStore();
  const [savingTtl, setSavingTtl] = useState(false);

  const isOwner = !!authUser && room.createdBy?._id === authUser._id;
  const timeLeft = formatTimeLeft(getRoomExpiry(room));

  const handleTtl = async (hours: number) => {
    setSavingTtl(true);
    await updateRoomTtl(room._id, hours);
    setSavingTtl(false);
  };

  return (
    <div className="space-y-2">
      <SettingsHeader
        title="General"
        description="Details and lifetime of this room."
      />

      <SettingsRow label="Room name">
        <div className="flex gap-2">
          <Input value={room.name} readOnly className="h-10 rounded-xl" />
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            aria-label="Copy room name"
            onClick={() => void copyText(room.name, "Room name")}
          >
            <HugeiconsIcon icon={Copy01Icon} />
          </Button>
        </div>
      </SettingsRow>

      <SettingsRow label="Created by">
        <div className="flex items-center gap-2 text-sm">
          {room.createdBy?.name ?? "Unknown"}
          {isOwner && (
            <Badge className="rounded-full bg-yellow-300 text-black">
              <HugeiconsIcon icon={CrownIcon} />
              You
            </Badge>
          )}
        </div>
      </SettingsRow>

      <SettingsRow
        label="Room lifetime"
        description={
          isOwner
            ? "The room and all its messages are deleted when this runs out. Counted from when the room was created."
            : "Only the room owner can change this."
        }
        stacked
      >
        <div className="flex flex-wrap items-center gap-3">
          <TtlPicker
            value={room.ttlHours ?? DEFAULT_ROOM_TTL_HOURS}
            createdAt={room.createdAt}
            disabled={!isOwner || savingTtl}
            onChange={handleTtl}
          />
          {timeLeft && (
            <span className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-300">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" />
              {timeLeft}
            </span>
          )}
        </div>
      </SettingsRow>

      <SettingsRow
        label={isOwner ? "Delete room" : "Leave room"}
        description={
          isOwner
            ? "Deletes the room and all its messages for every member."
            : "You'll stop seeing this room. You can rejoin with its code while it's alive."
        }
      >
        <ConfirmRoomAction
          roomName={room.name}
          isOwner={isOwner}
          onConfirm={async () => {
            const ok = isOwner ? await deleteRoom(room._id) : await leaveRoom(room._id);
            if (ok) onClose();
          }}
        />
      </SettingsRow>
    </div>
  );
}

function InviteTab({ room }: { room: RoomLike }) {
  const link = room.inviteLink;
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleShare = async () => {
    if (!link) return;
    if (canShare) {
      try {
        await navigator.share({
          title: `Join #${room.name}`,
          text: `Join #${room.name} on Disposable. This room self-destructs.`,
          url: link,
        });
      } catch {
        // User dismissed the share sheet.
      }
      return;
    }
    void copyText(link, "Invite link");
  };

  return (
    <div className="space-y-2">
      <SettingsHeader
        title="Invite & share"
        description={
          room.isPublic
            ? "This room is public: anyone with the link can chat right away as a guest, or sign in to join as a member."
            : "Signed-in people with the link or code can join while the room is alive."
        }
      />

      <SettingsRow label="Share" description="Send the invite through any app.">
        <Button
          onClick={handleShare}
          disabled={!link}
          className="rounded-xl bg-blue-500 text-white hover:bg-blue-600"
        >
          <HugeiconsIcon icon={Share08Icon} />
          {canShare ? "Share invite" : "Copy invite link"}
        </Button>
      </SettingsRow>

      <SettingsRow label="Invite link">
        <div className="flex gap-2">
          <Input value={link ?? "No invite link"} readOnly className="h-10 rounded-xl font-mono text-xs" />
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            aria-label="Copy invite link"
            disabled={!link}
            onClick={() => link && void copyText(link, "Invite link")}
          >
            <HugeiconsIcon icon={Copy01Icon} />
          </Button>
        </div>
      </SettingsRow>

      {room.roomCode && (
        <SettingsRow label="Room code" description="Enter it on the home page to join.">
          <div className="flex gap-2">
            <Input value={room.roomCode} readOnly className="h-10 rounded-xl font-mono tracking-widest" />
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-xl"
              aria-label="Copy room code"
              onClick={() => void copyText(room.roomCode!, "Room code")}
            >
              <HugeiconsIcon icon={Copy01Icon} />
            </Button>
          </div>
        </SettingsRow>
      )}
    </div>
  );
}

function MembersTab({ room }: { room: RoomLike }) {
  const { authUser, onlineUsers } = useAuthStore();
  const { removeUserFromRoom } = useRoomStore();
  const { roomGuests } = useChatStore();
  const members = room.members ?? [];
  const creatorId = room.createdBy?._id;
  const isOwner = !!authUser && creatorId === authUser._id;
  const onlineCount = members.filter((m) => onlineUsers.includes(m._id)).length;

  return (
    <div className="space-y-2">
      <SettingsHeader
        title="Members"
        description={`${members.length} ${members.length === 1 ? "member" : "members"} · ${onlineCount} online`}
      />

      <Separator className="mt-4" />

      <ul>
        {members.map((member, i) => {
          const isOnline = onlineUsers.includes(member._id);
          const isSelf = member._id === authUser?._id;
          const isCreator = member._id === creatorId;

          return (
            <li key={member._id}>
              {i > 0 && <Separator />}
              <div className="flex items-center gap-3 py-3">
                <div className="relative shrink-0">
                  <Avatar className="size-9">
                    <AvatarImage src={member.profilepic || undefined} alt={member.name} />
                    <AvatarFallback>
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background ${
                      isOnline ? "bg-green-500" : "bg-zinc-400"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{member.name}</span>
                    {isCreator && (
                      <HugeiconsIcon
                        icon={CheckmarkBadge02Icon}
                        className="size-4 shrink-0 fill-blue-500 text-white"
                      />
                    )}
                    {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isCreator ? "Owner" : "Member"} · {isOnline ? "Online" : "Offline"}
                  </div>
                </div>

                {isOwner && !isSelf && room.roomCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => void removeUserFromRoom(room.roomCode!, member._id)}
                  >
                    <HugeiconsIcon icon={UserRemove01Icon} />
                    Remove
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {roomGuests.length > 0 && (
        <>
          <div className="pt-6 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Guests here now · {roomGuests.length}
          </div>
          <Separator />
          <ul>
            {roomGuests.map((guest, i) => (
              <li key={guest.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-3 py-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{getInitials(guest.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{guest.username}</div>
                    <div className="text-xs text-muted-foreground">
                      Guest
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
