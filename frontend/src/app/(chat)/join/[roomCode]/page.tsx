"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { toast } from "sonner";

interface JoinPageProps {
  params: { roomCode: string };
}

const JoinRoomPage: React.FC<JoinPageProps> = ({ params }) => {
  const router = useRouter();
  const { roomCode } = params;
  const { joinRoom } = useRoomStore();

  useEffect(() => {
    const join = async () => {
      if (!roomCode) return;

      const room = await joinRoom(roomCode);

      if (room) {
        toast.success(`Joined room "${room.name}" successfully!`);
        router.push(`/chat/${room.roomCode}`);
      } else {
        router.push("/");
      }
    };

    join();
  }, [roomCode, joinRoom, router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-gray-500">Joining room...</p>
    </div>
  );
};

export default JoinRoomPage;
