"use client";

import React from "react";
import { ChatSidebar } from "@/modules/chat/ui/chatSidebar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRoomStore } from "@/store/useRoomStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CallDialog } from "@/modules/chat/ui/callDialog"; 
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

const ChatLayout: React.FC<Props> = ({ children }) => {
  const { userRooms, getUserRooms, removeRoomLocally, applyRoomTtl } =
    useRoomStore();
  const { authUser, checkAuth, socket } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.allSettled([getUserRooms(), checkAuth()]);
      setLoading(false);
    };
    fetchData();
  }, [getUserRooms, checkAuth]);

  // Keep the sidebar in sync when another member deletes a room or changes its lifetime.
  React.useEffect(() => {
    if (!socket) return;
    const onDeleted = ({ roomId, name }: { roomId: string; name: string }) => {
      removeRoomLocally(roomId);
      toast.info(`#${name} was deleted`);
    };
    const onUpdated = ({
      roomId,
      ttlHours,
      expiresAt,
    }: {
      roomId: string;
      ttlHours: number;
      expiresAt: string;
    }) => applyRoomTtl(roomId, ttlHours, expiresAt);

    socket.on("room-deleted", onDeleted);
    socket.on("room-updated", onUpdated);
    return () => {
      socket.off("room-deleted", onDeleted);
      socket.off("room-updated", onUpdated);
    };
  }, [socket, removeRoomLocally, applyRoomTtl]);

  return (
    <ThemeProvider>
      <ChatSidebar
        authUser={authUser}
        userRooms={userRooms}
        loading={loading}
      >
        <SidebarInset>{children}</SidebarInset>
      </ChatSidebar>
      <CallDialog /> 
    </ThemeProvider>
  );
};

export default ChatLayout;