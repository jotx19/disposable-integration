"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatHeader } from "@/modules/chat/ui/chatHeader";
import { ChatMessage } from "@/modules/chat/ui/chatView";
import ChatMessageInput from "@/modules/chat/ui/messageInupt";
import MessageSkeleton from "@/modules/chat/ui/messageSkeleton";
import EmptyRoom from "@/modules/chat/ui/chatLoader";
import { useRouter } from "next/navigation";
import SharedLogo from "@/modules/auth/ui/AuthLoader";

export default function RoomPage() {
  const { selectedRoom, setSelectedRoom, messages, isMessagesLoading } =
    useChatStore();
  const router = useRouter();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState({ top: 64, bottom: 140 });
  const { authUser, isCheckingAuth } = useAuthStore();

  // Start with no room selected and leave the socket room when navigating away.
  useEffect(() => {
    setSelectedRoom(null);
    return () => setSelectedRoom(null);
  }, [setSelectedRoom]);

  useEffect(() => {
    if (!isCheckingAuth && !authUser) {
      router.replace("/sign-in");
    }
  }, [isCheckingAuth, authUser, router]);

  // Messages scroll underneath the floating header and input, so reserve
  // their live heights as spacers (the input grows as you type).
  useEffect(() => {
    const header = headerRef.current;
    const input = inputRef.current;
    if (!header || !input) return;
    const measure = () =>
      setOverlay({ top: header.offsetHeight, bottom: input.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(input);
    return () => observer.disconnect();
  }, [selectedRoom]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, overlay.bottom]);

  if (isCheckingAuth || (!authUser && !isCheckingAuth)) {
    return <SharedLogo />;
  }

  if (!selectedRoom) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <EmptyRoom />
      </div>
    );
  }

  return (
    <div className="relative h-svh w-full max-w-5xl mx-auto">
      <div className="absolute inset-0 overflow-y-auto overscroll-contain px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div style={{ height: overlay.top }} aria-hidden />
        <div className="space-y-2 py-2">
          {isMessagesLoading
            ? Array(5)
                .fill(0)
                .map((_, idx) => <MessageSkeleton key={idx} />)
            : messages.map((msg) => <ChatMessage key={msg._id} message={msg} />)}
        </div>
        <div ref={messageEndRef} style={{ height: overlay.bottom }} aria-hidden />
      </div>

      <div ref={headerRef} className="pointer-events-none absolute inset-x-0 top-0 z-50 pt-3">
        <ChatHeader />
      </div>

      <div ref={inputRef} className="absolute inset-x-0 bottom-0 z-50">
        <ChatMessageInput />
      </div>
    </div>
  );
}
