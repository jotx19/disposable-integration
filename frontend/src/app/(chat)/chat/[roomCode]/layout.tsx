"use client";

import React from "react";
import { ChatSidebar } from "@/modules/chat/ui/chatSidebar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRoomStore } from "@/store/useRoomStore";
import { useAuthStore } from "@/store/useAuthStore";

interface Props {
  children: React.ReactNode;
}

const ChatLayout: React.FC<Props> = ({ children }) => {
  const { userRooms, getUserRooms } = useRoomStore();
  const { authUser, checkAuth } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.allSettled([getUserRooms(), checkAuth()]);
      setLoading(false);
    };
    fetchData();
  }, [getUserRooms, checkAuth]);

  return (
  <ThemeProvider>
      <ChatSidebar
        authUser={authUser}
        userRooms={userRooms}
        loading={loading}
      >
        <SidebarInset>{children}</SidebarInset>
      </ChatSidebar>
    </ThemeProvider>
  );
};

export default ChatLayout;
