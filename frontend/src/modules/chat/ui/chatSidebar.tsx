"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PanelLeftIcon, BadgeCheckIcon, ArrowUpRightIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/modules/home/ui/footer";
import { useChatStore, Room, User } from "@/store/useChatStore";

const MemoizedFooter = React.memo(Footer);

// ✅ Memoized Room item for performance
const RoomItem = React.memo(
  ({ room, onClick }: { room: Room; onClick: () => void }) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="md:w-[calc(80vw-60vw)] w-[calc(80vh-45vh)] h-10 p-6 mx-auto"
        onClick={onClick}
      >
        <div className="flex items-center px-2 w-full mx-auto text-xl gap-2">
          <span className="font-semibold truncate whitespace-nowrap overflow-hidden max-w-[80%]">
            {room.name}
          </span>
          <ArrowUpRightIcon className="size-6 !w-4 !h-4 shrink-0" />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
);
RoomItem.displayName = "RoomItem";

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
  const router = useRouter();
  const { setSelectedRoom } = useChatStore();
  const [open, setOpen] = React.useState(true);
  const [renderRooms, setRenderRooms] = React.useState(false);

  // ✅ Delay rendering rooms for smoother animation
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setRenderRooms(true), 150);
      return () => clearTimeout(timer);
    } else {
      setRenderRooms(false);
    }
  }, [open]);

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
          <PanelLeftIcon />
        </SidebarTrigger>
      </div>

      <Sidebar
        collapsible="offcanvas"
        className="z-40 transform-gpu will-change-transform transition-transform duration-200"
      >
        <SidebarHeader>
          {authUser && (
            <div className="flex items-center gap-2 px-2 py-2 md:w-[25vh] w-[18vh] md:justify-end h-[7vh] text-lg font-bold mx-auto justify-center">
              <Badge
                variant="secondary"
                className="bg-blue-500 text-white text-lg w-full h-full dark:bg-blue-600 flex justify-center items-center"
              >
                <BadgeCheckIcon className="size-6 !w-4 !h-4 shrink-0 mr-1" />
                {authUser.name}
              </Badge>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  className="h-10 p-6 md:w-[calc(80vw-60vw)] w-[calc(80vh-53vh)] mx-auto rounded-md"
                />
              ))
            ) : renderRooms ? (
              userRooms.map((room) => (
                <RoomItem
                  key={room._id}
                  room={room}
                  onClick={() => handleRoomClick(room._id)}
                />
              ))
            ) : null}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="justify-end flex">
            <MemoizedFooter />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/chat/create")}
          >
            + New Room
          </Button>
        </SidebarFooter>
      </Sidebar>

      {children}
    </SidebarProvider>
  );
};

export default ChatSidebar;
