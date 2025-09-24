"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PanelLeftIcon,
  BadgeCheckIcon,
  ArrowUpRightIcon,
} from "lucide-react";

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

import { useRoomStore } from "@/store/useRoomStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/store/useChatStore";

export const ChatSidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { userRooms, getUserRooms } = useRoomStore();
  const { authUser, checkAuth } = useAuthStore();
  const { setSelectedRoom } = useChatStore();
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await getUserRooms();
      await checkAuth(); 
      setLoading(false);
    };
    fetchData();
  }, [getUserRooms, checkAuth]);

  const handleRoomClick = (roomId: string) => {
    const room = userRooms.find((room) => room._id === roomId);
    if (!room) return;
    setSelectedRoom(room); 
  };

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="fixed md:top-4 top-5.5 left-4 z-99">
        <SidebarTrigger className="rounded-xl p-4 bg-white/70 text-black">
          <PanelLeftIcon />
        </SidebarTrigger>
      </div>

      <Sidebar collapsible="offcanvas" className="z-40">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2 md:w-[25vh] w-[18vh] md:justify-end h-[7vh] text-lg font-bold mx-auto justify-center">
          {authUser && (
          <Badge
          variant="secondary"
          className="bg-blue-500 text-white text-lg w-full h-full dark:bg-blue-600"
        >
          <BadgeCheckIcon className="size-6 !w-4 !h-4 shrink-0"/>
          {authUser.name}
        </Badge>
            )}
            </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {loading &&
              Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  className="h-10 p-6 md:w-[calc(80vw-60vw)] w-[calc(80vh-53vh)] mx-auto rounded-md"
                />
              ))}

            {!loading &&
              userRooms.map((room) => (
                <SidebarMenuItem key={room.roomCode}>
                  <SidebarMenuButton className="md:w-[calc(80vw-60vw)] w-[calc(80vh-53vh)] h-10 p-6 mx-auto"
                    onClick={() => handleRoomClick(room._id)}
                  >
                    <div className="flex items-center px-4 w-full mx-auto text-xl gap-2">
                      <span className="font-semibold">{room.name}</span>
                      <ArrowUpRightIcon className="size-6 !w-4 !h-4 shrink-0" />
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
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
