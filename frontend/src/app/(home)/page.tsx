"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (!roomCode) return;
    router.push(`/chat/${roomCode}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="max-w-4xl w-full text-center space-y-8 px-6">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Disposable Chatrooms
        </h1>

        <p className="text-lg font-mono text-gray-400 tracking-tight">
          Create a private chatroom instantly. Share the link. No sign-up, no
          hassle. Conversations disappear when youre done.
        </p>

        <div className="flex w-full max-w-md mx-auto flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="elevated"
            className="w-full sm:w-1/2 bg-white text-black dark:border-black rounded-xl"
          >
            <Link href={`/chat`}>
            Create Room
            </Link>
          </Button>

          <div className="flex w-full sm:w-1/2 gap-2">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-black dark:text-white"
            />
            <Button
              variant="elevated"
              className="rounded-xl text-black bg-white dark:border-black"
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
