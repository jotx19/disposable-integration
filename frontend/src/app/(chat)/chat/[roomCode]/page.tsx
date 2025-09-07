"use client";

import React, { useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatHeader } from "@/modules/chat/ui/chatHeader";
import { ChatMessage } from "@/modules/chat/ui/chatView";

export default function RoomPage() {
  const { selectedRoom, messages, getMessages, isMessagesLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      getMessages(selectedRoom._id);
    }
  }, [selectedRoom, getMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedRoom) {
    return <div className="p-4 text-center">Select a room to start chatting</div>;
  }

  if (!authUser) {
    return <div className="p-4 text-center">Please login to view messages</div>;
  }

  return (
    <div className="flex justify-center min-h-screen p-2">
      <div className="flex flex-col w-full max-w-5xl shadow-md rounded-xl overflow-hidden">
        <ChatHeader />

        <div className="flex-1 overflow-y-auto p-4 space-y-2 h-[70vh]">
          {isMessagesLoading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg._id} message={msg} />
            ))
          )}
          <div ref={messageEndRef} />
        </div>
      </div>
    </div>
  );
}
