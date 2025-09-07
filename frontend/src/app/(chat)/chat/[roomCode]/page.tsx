// app/(chat)/[roomCode]/page.tsx
"use client";

import { useParams } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Room: {params.roomCode}</h1>
    </div>
  );
}
