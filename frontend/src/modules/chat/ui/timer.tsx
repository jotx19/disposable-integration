// Timer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";

interface Room {
  _id: string;
  name: string;
}

interface TimerProps {
  room: Room | null;
}

export const Timer: React.FC<TimerProps> = ({ room }) => {
  const { getRoomExpirationTime } = useRoomStore();
  const [time, setTime] = useState<number | null>(null);

  useEffect(() => {
    if (!room) return;
  
    let interval: number | undefined;
  
    getRoomExpirationTime(room._id).then((seconds) => {
      if (seconds != null) {
        setTime(seconds);
  
        interval = window.setInterval(() => {
          setTime((prev) => {
            if (!prev || prev <= 0) {
              if (interval) window.clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });
  
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [room, getRoomExpirationTime]);
  

  if (time == null) return null;

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return (
    <span className="text-sm tracking-tighter text-gray-400 font-mono">
      {hours}h {minutes}m {seconds}s
    </span>
  );
};
