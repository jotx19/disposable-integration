"use client";

import React from "react";
import { ChatSidebar } from "@/modules/chat/ui/chatSidebar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarInset } from "@/components/ui/sidebar";

interface Props {
  children: React.ReactNode;
}

const ChatLayout: React.FC<Props> = ({ children }) => {
  return (
    <ThemeProvider
    >
      <ChatSidebar>
        <SidebarInset>{children}</SidebarInset>
      </ChatSidebar>
    </ThemeProvider>
  );
};

export default ChatLayout;
