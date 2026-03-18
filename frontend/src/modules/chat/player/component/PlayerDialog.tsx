"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Pause, Play, SkipForward, Repeat, Repeat1, Loader2, Volume1, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getSongsById, getSongsSuggestions } from "@/lib/fetch";

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

type SuggestionRaw = {
  id: string;
  name: string;
  image?: Array<{ url: string }>;
  artists?: { primary?: Array<{ name: string }> };
  downloadUrl?: Array<{ url: string }>;
};

type SuggestionsResponse = { data?: SuggestionRaw[] };

type SongByIdResponse = {
  data?: Array<{
    id: string;
    name: string;
    image: Array<{ url: string }>;
    artists?: { primary?: Array<{ name: string }> };
    downloadUrl?: Array<{ url: string }>;
  }>;
};

function pickImage(song: SuggestionRaw): string {
  return song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url || "";
}

function artistName(song: SuggestionRaw): string {
  return song.artists?.primary?.[0]?.name ?? "Unknown";
}

function pickAudio(urls?: Array<{ url: string }>): string {
  return urls?.[2]?.url || urls?.[1]?.url || urls?.[0]?.url || "";
}

const BAR_COUNT = 10;

type Props = {
  picked: PickedSong | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongChange: (song: PickedSong) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playing: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: (e?: React.MouseEvent) => void;
  onSeek: (v: number[]) => void;
};

export default function PlayerDialog({
  picked,
  open,
  onOpenChange,
  onSongChange,
  audioRef,
  playing,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
}: Props) {
  const [suggestions, setSuggestions] = useState<PickedSong[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one">("off");
  const [loadingNext, setLoadingNext] = useState(false);
  const [volume, setVolume] = useState(80);

  const onSongChangeRef = useRef<(song: PickedSong) => void>(() => {});
  useEffect(() => {
    if (typeof onSongChange === "function") onSongChangeRef.current = onSongChange;
  }, [onSongChange]);
  if (typeof onSongChange === "function") onSongChangeRef.current = onSongChange;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume / 100;
  }, [volume, audioRef]);

  useEffect(() => {
    if (!picked?.id) return;
    setLoadingSuggestions(true);
    setSuggestions([]);
    void (async () => {
      try {
        const res = await getSongsSuggestions(picked.id);
        const json = (await res.json()) as SuggestionsResponse;
        const mapped: PickedSong[] = (json.data ?? []).slice(0, 10).map((s) => ({
          id: s.id,
          name: s.name,
          artist: artistName(s),
          imageUrl: pickImage(s),
          audioUrl: pickAudio(s.downloadUrl),
        }));
        setSuggestions(mapped);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    })();
  }, [picked?.id]);

  const resolveAndPlay = useCallback(async (song: PickedSong) => {
    const changeFn = onSongChangeRef.current;
    if (typeof changeFn !== "function") return;
    if (song.audioUrl) { changeFn(song); return; }
    setLoadingNext(true);
    try {
      const res = await getSongsById(song.id);
      const json = (await res.json()) as SongByIdResponse;
      const s = json.data?.[0];
      if (!s) return;
      changeFn({
        id: s.id,
        name: s.name,
        artist: s.artists?.primary?.[0]?.name ?? "Unknown",
        imageUrl: s.image?.[2]?.url || s.image?.[0]?.url || "",
        audioUrl: pickAudio(s.downloadUrl),
      });
    } finally {
      setLoadingNext(false);
    }
  }, []);

  const suggestionsRef = useRef<PickedSong[]>([]);
  useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);
  const repeatRef = useRef<"off" | "one">("off");
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  const playNext = useCallback(() => {
    const list = suggestionsRef.current;
    if (list.length === 0) return;
    void resolveAndPlay(list[0]);
  }, [resolveAndPlay]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      if (repeatRef.current === "one") { el.currentTime = 0; void el.play(); }
      else playNext();
    };
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeVolume = (next: number) => {
    const clamped = Math.max(0, Math.min(100, next));
    setVolume(clamped);
    if (audioRef.current) audioRef.current.volume = clamped / 100;
  };

  if (!picked) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 border border-border overflow-hidden rounded-2xl"
        style={{ maxWidth: "780px", width: "calc(100vw - 20px)", background: "hsl(var(--background))" }}
      >
        <div className="flex flex-col md:flex-row md:h-[500px] h-[85vh] overflow-hidden">
          <div className="flex flex-col md:w-[320px] w-full flex-shrink-0 overflow-hidden">
            <div className="relative flex-shrink-0 md:h-[260px] h-[40vw] min-h-[160px]">
              <img src={picked.imageUrl} alt={picked.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>

            <div className="flex flex-col gap-3 px-4 pt-3 pb-4 flex-1">
              <div className="min-w-0">
                <p className="text-base font-semibold truncate leading-tight">{picked.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{picked.artist}</p>
              </div>

              <div className="flex flex-col gap-1">
                <Slider value={[currentTime]} max={duration || 0} step={1} onValueChange={onSeek} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => changeVolume(volume - 10)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <Volume1 className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-[4px]">
                  {Array.from({ length: BAR_COUNT }, (_, i) => {
                    const threshold = ((i + 1) / BAR_COUNT) * 100;
                    const filled = volume >= threshold;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => changeVolume(Math.round(threshold))}
                        className="rounded-[1px] transition-all duration-100"
                        style={{
                          width: "3px",
                          height: "18px",
                          background: filled ? "rgb(59,130,246)" : "rgba(255,255,255,0.18)",
                        }}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => changeVolume(volume + 10)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-between mt-auto">
                <Button
                  type="button" size="icon" variant="ghost"
                  onClick={() => setRepeat((r) => r === "off" ? "one" : "off")}
                  className={repeat !== "off" ? "text-primary" : "text-muted-foreground"}
                >
                  {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                </Button>

                <Button
                  type="button" size="icon" variant="default"
                  onClick={(e) => onTogglePlay(e)}
                  className="h-11 w-11 rounded-full shadow-md"
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
                </Button>

                <Button
                  type="button" size="icon" variant="ghost"
                  onClick={playNext}
                  disabled={loadingNext || suggestions.length === 0}
                  className="text-muted-foreground"
                >
                  {loadingNext ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:block w-px bg-border flex-shrink-0" />

          <div className="flex flex-col flex-1 min-w-0 overflow-hidden md:border-t-0 border-t border-border">
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Up Next</p>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3">
              {loadingSuggestions && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 px-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading suggestions…
                </div>
              )}
              {!loadingSuggestions && suggestions.length === 0 && (
                <p className="text-xs text-muted-foreground py-6 px-2">No suggestions found.</p>
              )}
              {!loadingSuggestions && suggestions.map((song, i) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => void resolveAndPlay(song)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/40 transition-colors text-left group"
                >
                  <span className="text-xs text-muted-foreground w-4 text-center flex-shrink-0">{i + 1}</span>
                  <img src={song.imageUrl} alt={song.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0 bg-secondary/50" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate leading-tight">{song.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  <Play className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}