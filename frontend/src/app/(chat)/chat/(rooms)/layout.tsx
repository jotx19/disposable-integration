"use client";

import React from "react";
import { ChatSidebar } from "@/modules/chat/ui/chatSidebar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRoomStore } from "@/store/useRoomStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { CallDialog } from "@/modules/chat/ui/callDialog"; 
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

const ChatLayout: React.FC<Props> = ({ children }) => {
  const {
    userRooms,
    getUserRooms,
    removeRoomLocally,
    applyRoomTtl,
    applyRoomVisibility,
    setPendingRoomId,
  } = useRoomStore();
  const { authUser, checkAuth, socket } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.allSettled([getUserRooms(), checkAuth()]);
      setLoading(false);

      // Open the room we were sent here for (just joined, or a saved guest chat).
      const { pendingRoomId, userRooms: rooms } = useRoomStore.getState();
      if (pendingRoomId) {
        setPendingRoomId(null);
        const room = rooms.find((r) => r._id === pendingRoomId);
        if (room) useChatStore.getState().setSelectedRoom({ ...room, members: room.members ?? [] });
      }
    };
    fetchData();
  }, [getUserRooms, checkAuth, setPendingRoomId]);

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

    const onVisibility = ({ roomId, isPublic }: { roomId: string; isPublic: boolean }) =>
      applyRoomVisibility(roomId, isPublic);

    socket.on("room-deleted", onDeleted);
    socket.on("room-updated", onUpdated);
    socket.on("room-visibility", onVisibility);
    return () => {
      socket.off("room-deleted", onDeleted);
      socket.off("room-updated", onUpdated);
      socket.off("room-visibility", onVisibility);
    };
  }, [socket, removeRoomLocally, applyRoomTtl, applyRoomVisibility]);

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