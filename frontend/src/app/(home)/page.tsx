"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "lucide-react";
import Silk from "@/modules/home/ui/silk";

export default function LandingPage() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (!roomCode) return;
    router.push(`/join/${roomCode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F0] dark:bg-background">
      <main
        className="flex w-full min-h-[calc(100vh-25vh)] -mt-20 overflow-hidden items-center justify-center
        rounded-3xl md:m-none m-5 p-6 relative"
      >
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <Silk
            speed={3}
            scale={1}
            color="#475569" 
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>

        <div className="relative z-10 max-w-7xl w-full text-center space-y-6">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white">
            Disposable Chatrooms
          </h1>

          <p className="md:text-lg text-xs md:w-1/2 mx-auto font-mono text-gray-200 tracking-tight">
            Create, Share no
            hassle. Conversations disappear when you are done.
          </p>

          <div className="flex w-full max-w-md mx-auto flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/chat")}
              variant="elevated"
              className="w-full sm:w-1/2 bg-black text-white border-gray-800 rounded-full"
            >
              <Container size={18} />
              Rooms
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
                className="text-white rounded-r-3xl border-gray-800 rounded-l-none bg-black"
                onClick={handleJoin}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}