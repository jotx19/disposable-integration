"use client";

import React, { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatMessageTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import EmojiAvatar from "@/components/ui/EmojiAvatar";

interface Message {
  _id: string;
  text?: string;
  sender: string | { _id: string; name?: string; profilepic?: string };
  createdAt: string;
  image?: string;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { authUser } = useAuthStore();
  const { selectedMessages, toggleSelectedMessage, deleteSelectedMessages } =
    useChatStore();

  const [showFull, setShowFull] = useState(false);

  if (!authUser) return null;

  const senderId =
    typeof message.sender === "string" ? message.sender : message.sender._id;
  const senderName =
    typeof message.sender === "string" ? "Unknown" : message.sender.name;
  const senderPic =
    typeof message.sender === "string" || !message.sender?.profilepic
      ? null
      : message.sender.profilepic;

  const isAuthUser = senderId === authUser._id;
  const messageTime = formatMessageTime(message.createdAt);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSelectedMessages([message._id]);
  };

  const isLongMessage = message.text && message.text.length > 120;

  return (
    <div
      className={`flex items-end ${
        isAuthUser ? "justify-end" : "justify-start"
      } relative`}
      onClick={() => toggleSelectedMessage(message._id)}
    >
      {!isAuthUser && (
        <div className="flex flex-col items-center w-10 mr-2">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
            {senderPic ? (
              <img
                src={senderPic}
                alt={senderName || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <EmojiAvatar className="w-full h-full" />
            )}
          </div>
          <span className="text-xs text-gray-500 mt-1 text-center truncate w-10">
            {senderName || "Unknown"}
          </span>
        </div>
      )}

      <div className="flex flex-col max-w-[70%] space-y-1">
        <div
          className={`px-4 py-2 rounded-xl break-words relative transition-all duration-200 ${
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
          <p
            className="ml-2 py-0 p-0 self-start"
            onClick={(e) => {
              e.stopPropagation();
              setShowFull(true);
            }}
          >
            Read more
          </p>
        )}
        <span className="text-xs text-gray-400">{messageTime}</span>
      </div>

      {isAuthUser && selectedMessages.includes(message._id) && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="p-1 rounded-full"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete message</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
