// app/(chat)/layout.tsx
"use client";

import React from "react";
import { ChatSidebar } from "@/modules/chat/ui/chatSidebar";
import { ThemeProvider } from "@/components/ui/theme-provider";

interface Props {
  children: React.ReactNode;
}

const ChatLayout: React.FC<Props> = ({ children }) => {
  return (
    <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    >
    <div className="flex min-h-screen w-screen overflow-hidden dark:bg-[#0A0A0A] text-foreground">
      <ChatSidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
    </ThemeProvider>
  );
};

export default ChatLayout;
