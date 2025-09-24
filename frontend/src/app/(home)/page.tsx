"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (!roomCode) return;
    router.push(`/chat/${roomCode}`);
  };

  return (
    <main
      className="flex min-h-[83vh] items-center justify-center
      md:bg-[linear-gradient(45deg,#007b84_0%,#d35c2f_50%,#b23a68_100%)] bg-[linear-gradient(45deg,#007b84_0%,#d35c2f_50%,#b23a68_100%)]
      rounded-3xl md:m-10 m-5 p-6"
    >
      <div className="max-w-3xl w-full text-center space-y-6">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white">
          Disposable Chatrooms
        </h1>

        <p className="md:text-lg text-sm font-mono text-gray-200 tracking-tight">
          Create a private chatroom instantly. Share the link, no
          hassle. Conversations disappear when you are done.
        </p>

        <div className="flex w-full max-w-md mx-auto flex-col sm:flex-row gap-4 justify-center">
          <Button
          onClick={() => router.push('/chat')}
            variant="elevated"
            className="w-full sm:w-1/2 bg-black text-white rounded-full"
          >
            Create Room
          </Button>

          <div className="flex w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="flex-1 px-3 py-2 rounded-l-full bg-black text-white"
            />
            <Button
              variant="elevated"
              className="text-white rounded-r-3xl rounded-l-none bg-black"
              onClick={handleJoin}
            >
              Join
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
