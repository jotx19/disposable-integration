"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeftIcon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import UserMenu from "@/modules/chat/ui/userMenu";
import { useChatStore, Room , User } from "@/store/useChatStore";

interface ChatSidebarProps {
  children?: React.ReactNode;
  authUser: User | null;
  userRooms: Room[]; 
  loading: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  children,
  authUser,
  userRooms,
  loading,
}) => {
  const { selectedRoom, setSelectedRoom } = useChatStore();
  const [open, setOpen] = React.useState(true);

  const handleRoomClick = React.useCallback(
    (roomId: string) => {
      const room = userRooms.find((r) => r._id === roomId);
      if (room) {
        const safeRoom: Room = {
          ...room,
          members: room.members || [],
        };
        setSelectedRoom(safeRoom);
      }
    },
    [userRooms, setSelectedRoom]
  );

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="fixed md:top-4 top-4.5 left-4 z-[99]">
        <SidebarTrigger className="rounded-xl p-4 bg-white/70 text-black shadow-md">
          <HugeiconsIcon icon={SidebarLeftIcon} />
        </SidebarTrigger>
      </div>

      <Sidebar
        collapsible="offcanvas"
        className="z-40 transform-gpu will-change-transform"
      >
        <SidebarHeader>
          <div className="flex h-auto p-2 items-center pl-12 pr-1 md:pr-2 font-bold">
            {loading || !authUser ? (
              <Skeleton className="w-full h-9 rounded-xl" />
            ) : (
              <Badge
                variant="secondary"
                className="bg-blue-500 rounded-xl text-white text-base md:text-lg w-full h-9 dark:bg-blue-600 flex justify-center items-center"
              >
                <p>Disposable</p>
              </Badge>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden">
          <div className="px-6 pt-3 pb-1 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {loading ? <Skeleton className="h-4 w-14 rounded" /> : "Rooms"}
          </div>
          <SidebarMenu className="gap-0">
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton
                    key={idx}
                    className="mx-4 my-1 h-12 w-auto rounded-md"
                  />
                ))
              : userRooms.length === 0
              ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No rooms yet.{" "}
                    <Link href="/chat/create" className="text-blue-500 hover:underline">
                      Create one
                    </Link>
                  </div>
                )
              : userRooms.map((room) => (
                  <SidebarMenuItem key={room._id}>
                    <SidebarMenuButton
                      isActive={selectedRoom?._id === room._id}
                      className="h-12 w-full rounded-none px-6"
                      onClick={() => handleRoomClick(room._id)}
                    >
                      <div className="flex min-w-0 w-full items-center gap-2 text-base md:text-lg">
                        <span className="font-semibold truncate">
                          {room.name}
                        </span>
                        <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-6 !w-4 !h-4 shrink-0" />
                      </div>
                    </SidebarMenuButton>
                    <SidebarSeparator className="mx-0" />
                  </SidebarMenuItem>
                ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>

      {children}
    </SidebarProvider>
  );
};

export default ChatSidebar;
