"use client";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="max-w-4xl w-full text-center space-y-8 px-6">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Disposable Chatrooms
        </h1>

        <p className="text-lg font-mono text-gray-400 tracking-tight">
          Create a private chatroom instantly. Share the link. No sign-up, no
          hassle. Conversations disappear when you’re done.
        </p>

        <div className="flex w-1/2 mx-auto flex-col sm:flex-row gap-4 justify-center">
          <Button
          variant='elevated'
          className="w-full sm:w-1/2 bg-white text-black dark:border-black rounded-xl">
            Create Room
          </Button>
          <Button
          variant='elevated'
          className="w-full sm:w-1/2 rounded-xl text-white dark:border-black dark:text-black">
            Join Room
          </Button>
        </div>
      </div>
    </main>
  );
}
