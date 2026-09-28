"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatMessageTime, getInitials } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  _id: string;
  type?: "user" | "system";
  text?: string;
  sender?: string | { _id: string; name?: string; profilepic?: string } | null;
  createdAt: string;
  image?: string;
  guest?: boolean;
}

interface ChatMessageProps {
  message: Message;
  // Who is reading. Defaults to the signed-in user; the guest page passes its guest id.
  viewerId?: string;
  // Guests can't delete, so their own bubbles render without swipe actions.
  canDeleteOwn?: boolean;
}

// Width of the revealed delete action, and how far a swipe must go to open it / delete outright.
const ACTION_WIDTH = 84;
const OPEN_THRESHOLD = ACTION_WIDTH / 2;
const FULL_SWIPE_THRESHOLD = 200;
const SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

function MessageBubble({
  message,
  isAuthUser,
}: {
  message: Message;
  isAuthUser: boolean;
}) {
  const [showFull, setShowFull] = useState(false);
  const isLongMessage = !!message.text && message.text.length > 120;

  return (
    <div
      className={`flex flex-col space-y-1 ${
        isAuthUser ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`px-4 py-2 rounded-xl break-words relative ${
          isAuthUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
        }`}
        style={{
          minHeight: "40px",
          maxHeight: showFull ? "none" : "100px",
          overflow: "hidden",
        }}
      >
        {message.text}

        {!showFull && isLongMessage && (
          <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white to-transparent dark:from-gray-900 pointer-events-none" />
        )}
      </div>

      {!showFull && isLongMessage && (
        <button
          type="button"
          className="ml-2 text-sm self-start"
          onClick={(e) => {
            e.stopPropagation();
            setShowFull(true);
          }}
        >
          Read more
        </button>
      )}
      <span className="text-xs text-gray-400">
        {formatMessageTime(message.createdAt)}
      </span>
    </div>
  );
}

function SwipeableOwnMessage({ message }: { message: Message }) {
  const { openMessageId, setOpenMessageId, deleteSelectedMessages } =
    useChatStore();
  const isOpen = openMessageId === message._id;

  const rowRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const actionOpacity = useTransform(x, [-ACTION_WIDTH, -16, 0], [1, 0, 0]);
  const actionScale = useTransform(x, [-ACTION_WIDTH, 0], [1, 0.6]);

  const handleDelete = () => deleteSelectedMessages([message._id]);

  // Snap to the open/closed position whenever the open state changes.
  useEffect(() => {
    const controls = animate(x, isOpen ? -ACTION_WIDTH : 0, SPRING);
    return () => controls.stop();
  }, [isOpen, x]);

  // Tapping anywhere outside the open row closes it, like iOS.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setOpenMessageId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, setOpenMessageId]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x + (isOpen ? -ACTION_WIDTH : 0);
    if (offset < -FULL_SWIPE_THRESHOLD) {
      void handleDelete();
      return;
    }
    const shouldOpen = offset < -OPEN_THRESHOLD || info.velocity.x < -500;
    setOpenMessageId(shouldOpen ? message._id : null);
    // Same state as before still needs to spring back into place.
    animate(x, shouldOpen ? -ACTION_WIDTH : 0, SPRING);
  };

  return (
    <div ref={rowRef} className="relative flex justify-end">
      <motion.div
        style={{ opacity: actionOpacity, scale: actionScale }}
        className="absolute right-0 top-0 bottom-5 flex items-center"
      >
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete message"
          tabIndex={isOpen ? 0 : -1}
          className="flex h-10 w-[80px] flex-col items-center justify-center rounded-l-lg bg-red-500/15 text-red-500 text-[11px] font-medium hover:bg-red-500/25 active:bg-red-500/30 transition-colors"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
        </button>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -FULL_SWIPE_THRESHOLD - 40, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onDoubleClick={() => setOpenMessageId(isOpen ? null : message._id)}
        style={{ x }}
        className="relative max-w-[70%] cursor-grab active:cursor-grabbing select-none"
        title="Swipe left or double-click to delete"
      >
        <MessageBubble message={message} isAuthUser />
      </motion.div>
    </div>
  );
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  viewerId,
  canDeleteOwn = true,
}) => {
  const { authUser } = useAuthStore();
  const me = viewerId ?? authUser?._id;

  if (!me) return null;

  if (message.type === "system") {
    return (
      <div className="w-full flex justify-center my-2">
        <div className="text-xs text-gray-500">{message.text}</div>
      </div>
    );
  }

  const sender = typeof message.sender === "object" ? message.sender : null;
  const senderId = typeof message.sender === "string" ? message.sender : sender?._id;

  if (senderId === me) {
    if (canDeleteOwn && !message.guest) {
      return <SwipeableOwnMessage message={message} />;
    }
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          <MessageBubble message={message} isAuthUser />
        </div>
      </div>
    );
  }

  const senderName = sender?.name ?? "Unknown";
  const senderPic = sender?.profilepic || null;

  return (
    <div className="flex items-end justify-start">
      <div className="flex flex-col items-center w-10 mr-2">
        <Avatar className="h-10 w-10">
          {senderPic && (
            <AvatarImage src={senderPic} alt={senderName || "User"} className="object-cover" />
          )}
          <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
        </Avatar>
        <span className="text-xs text-gray-500 mt-1 text-center truncate w-10">
          {senderName || "Unknown"}
        </span>
        {message.guest && (
          <span className="text-[9px] font-medium uppercase tracking-wider text-amber-500">
            guest
          </span>
        )}
      </div>

      <div className="max-w-[70%]">
        <MessageBubble message={message} isAuthUser={false} />
      </div>
    </div>
  );
};

export default ChatMessage;
