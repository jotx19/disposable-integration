"use client";

import { useEffect, useRef, useState } from "react";
import { X, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export type PickedSong = {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
  audioUrl: string;
};

function formatTime(time: number): string {
  if (!Number.isFinite(time) || time < 0) return "00:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Props = {
  picked: PickedSong | null;
  onClose: () => void;
};

export default function MiniPlayer({ picked, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 🔁 Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("player-state");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { song: PickedSong; time: number };
      if (!picked) return;

      setCurrentTime(parsed.time || 0);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = parsed.time || 0;
        }
      }, 200);
    } catch {}
  }, [picked]);

  // 💾 Save progress every 2s
  useEffect(() => {
    if (!picked) return;

    const interval = setInterval(() => {
      const t = audioRef.current?.currentTime ?? currentTime;
      localStorage.setItem(
        "player-state",
        JSON.stringify({
          song: picked,
          time: t || 0,
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [picked, currentTime]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => {
      setCurrentTime(el.currentTime);
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onTime);
    el.addEventListener("durationchange", onTime);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onTime);
      el.removeEventListener("durationchange", onTime);
    };
  }, [picked?.audioUrl]);

  if (!picked) return null;

  const togglePlayPause = () => {
    const el = audioRef.current;
    if (!el) return;

    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => setPlaying(false));
    }
  };

  const stopPlayer = () => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    localStorage.removeItem("player-state");
    onClose();
  };

  const seek = (v: number[]) => {
    const el = audioRef.current;
    if (!el) return;
    const t = v[0] ?? 0;
    el.currentTime = t;
    setCurrentTime(t);
  };

  return (
    <div className="mb-2 rounded-xl border border-border bg-background/60 backdrop-blur-md p-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={picked.imageUrl}
            alt={picked.name}
            className="h-10 w-10 rounded-md object-cover bg-secondary/50"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{picked.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {picked.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" size="icon" variant="secondary" onClick={togglePlayPause}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={stopPlayer}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-2 grid gap-1">
        <Slider value={[currentTime]} max={duration || 0} onValueChange={seek} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={picked.audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        autoPlay
      />
    </div>
  );
}