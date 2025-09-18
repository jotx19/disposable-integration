"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRoomStore } from "@/store/useRoomStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/modules/home/ui/navbar";

const ChatLandingPage = () => {
  const { userRooms, getUserRooms } = useRoomStore();
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth().catch(() => {
      toast.error("Failed to check authentication.");
    });
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      getUserRooms().catch(() => {
        toast.error("Failed to load rooms.");
      });
    }
  }, [authUser, getUserRooms]);

  return (
    <div className="flex items-center justify-center min-h-screen dark:bg-[#0A0A0A] p-4">
      <div className="w-full max-w-4xl h-[74vh] bg-gray-200 dark:bg-[#171717] rounded-xl shadow-sm p-6 flex flex-col">
        <div className="flex flex-col mb-4">
          {isCheckingAuth ? (
            <div className="h-8 w-40 mx-auto bg-gray-600 rounded-full animate-pulse mb-2"></div>
          ) : authUser ? (
            <Badge
              variant="secondary"
              className="md:text-3xl mb-1 text-xl font-semibold text-center mx-auto"
            >
              Hello, {authUser.name}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="md:text-3xl mb-1 text-xl font-semibold text-center mx-auto "
            >
              Hello, guest
            </Badge>
          )}
          <p className="md:text-sm text-[9px] text-muted-foreground text-center">
            Groups you are joined will be listed below
          </p>
        </div>
        <div className="flex justify-end mb-4">
          <Link
            href="/chat/create"
            className="text-sm text-blue-500 hover:underline"
          >
            Create New Room
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isCheckingAuth ? (
            <ul className="space-y-3 pt-9 md:w-2/3 mx-auto">
              {Array.from({ length: 5 }).map((_, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-800 rounded-xl p-4"
                >
                  <div className="h-4 w-1/2 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 w-6 bg-gray-600 rounded animate-pulse"></div>
                </li>
              ))}
            </ul>
          ) : authUser && userRooms.length === 0 ? (
            <ul className="space-y-3 pt-9 md:w-2/3 mx-auto">
              {Array.from({ length: 5 }).map((_, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-800 rounded-xl p-4"
                >
                  <div className="h-4 w-1/2 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 w-6 bg-gray-600 rounded animate-pulse"></div>
                </li>
              ))}
            </ul>
          ) : authUser ? (
            <ul className="space-y-3 md:w-2/3 mx-auto">
              {userRooms.map((room) => (
                <li
                  key={room._id}
                  className="flex justify-between items-center bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition cursor-pointer"
                >
                  <span className="text-white font-medium">{room.name}</span>
                  <Link
                    href={`/chat/${room.roomCode}`}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowRight size={20} className="-rotate-45" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3 w-2/3 mx-auto">
              {Array.from({ length: 5 }).map((_, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-800 rounded-xl p-4"
                >
                  <div className="h-4 w-1/2 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 w-6 bg-gray-600 rounded animate-pulse"></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Header />
    </div>
  );
};

export default ChatLandingPage;
