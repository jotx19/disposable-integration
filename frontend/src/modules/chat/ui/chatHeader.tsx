"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useRoomStore } from "@/store/useRoomStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer } from "@/modules/chat/ui/timer";

export const ChatHeader: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { onlineUsers } = useAuthStore();
  const { selectedRoom, setSelectedRoom } = useChatStore();
  const { userRooms } = useRoomStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!roomCode) return;
    const room = userRooms.find(room => room._id === roomCode);
    if (!room) return;

    setSelectedRoom(room);
  }, [roomCode, userRooms, setSelectedRoom]);

  if (!selectedRoom) return null;

  const onlineCount = selectedRoom.members.filter(m =>
    onlineUsers.includes(m._id)
  ).length;

  return (
    <div className="flex justify-center p-2 bg-transparent">
      <div className="flex items-center justify-between w-full max-w-6xl">
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full backdrop-blur-xl mix mx-11 h-9 px-4"
          onClick={() => setIsModalOpen(true)}
        >
          <UserIcon className="h-4 w-4" size={16} />
          <span className="text-md text-gray-300">{onlineCount}</span>
        </Button>

        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="md:text-lg px-4 py-2">
            {selectedRoom.name}
          </Badge>
          <Timer room={selectedRoom} />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 dark:bg-[#242423] bg-[#F5F5F5] rounded-3xl w-full max-w-lg flex flex-col items-center">
            <div className="flex w-full justify-between mb-4">
              <h2 className="text-3xl font-bold text-center w-full">Room Members</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 p-1"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-3 mt-4 w-full">
              {selectedRoom.members.map(member => (
                <li
                  key={member._id}
                  className="flex justify-between items-center p-2 bg-gray-700 rounded-lg"
                >
                  <span className="text-white">{member.name}</span>
                  <span
                    className={`text-sm font-bold ${
                      onlineUsers.includes(member._id) ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {onlineUsers.includes(member._id) ? "Online" : "Offline"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};