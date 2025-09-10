"use client";

import React, { useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatHeader } from "@/modules/chat/ui/chatHeader";
import { ChatMessage } from "@/modules/chat/ui/chatView";
import ChatMessageInput from "@/modules/chat/ui/messageInupt";
import MessageSkeleton from "@/modules/chat/ui/messageSkeleton";
import EmptyRoom from "@/modules/chat/ui/chatLoader";

export default function RoomPage() {
  const { selectedRoom, messages, getMessages, isMessagesLoading } =
    useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRoom) {
      getMessages(selectedRoom._id);
    }
  }, [selectedRoom, getMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedRoom) {
    return <EmptyRoom />;
  }

  if (!authUser) {
    return <div className="p-4 text-center">Please login to view messages</div>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full max-w-5xl mx-auto p-2">
      <div className="sticky top-2 z-50 bg-transparent">
        <ChatHeader />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isMessagesLoading
          ? Array(5)
              .fill(0)
              .map((_, idx) => <MessageSkeleton key={idx} />)
          : messages.map((msg) => <ChatMessage key={msg._id} message={msg} />)}
        <div ref={messageEndRef} />
      </div>

      <div className="mt-auto">
        <ChatMessageInput />
      </div>
    </div>
  );
}
