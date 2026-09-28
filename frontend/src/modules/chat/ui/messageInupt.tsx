"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, MusicNote01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import MusicSearchInput, {
  type PickedSong,
} from "@/modules/chat/player/component/MusicSearchInput";
import MiniPlayer from "@/modules/chat/player/component/MiniPlayer";

export default function ChatMessageInput() {
  const [text, setText] = useState<string>("");

  const [musicMode, setMusicMode] = useState<boolean>(false);
  const [musicQuery, setMusicQuery] = useState<string>("");
  const [picked, setPicked] = useState<PickedSong | null>(null);
  const [playerHidden, setPlayerHidden] = useState(false);

  const { sendMessage, selectedRoom } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the textarea with its content; CSS max-height caps it and it scrolls beyond that.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text, musicMode]);

  useEffect(() => {
    const saved = localStorage.getItem("player-state");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { song: PickedSong; time: number };
      setPicked(parsed.song);
    } catch {}
  }, []);

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    if (!selectedRoom?._id) {
      toast.error("Please select a room first");
      return;
    }

    try {
      await sendMessage({
        text: text.trim(),
        roomId: selectedRoom._id,
      });

      setText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (musicMode) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  if (!selectedRoom) {
    return (
      <div className="text-center text-sm text-muted-foreground p-3">
        Please select a room to start chatting
      </div>
    );
  }

  return (
    <div className="w-full px-3 pb-3 pt-2">
      {picked && (
        <div
          className={[
            "overflow-hidden transition-all duration-700 ease-in-out",
            playerHidden
              ? "max-h-0 opacity-0 -translate-y-2"
              : "max-h-[300px] opacity-100 translate-y-0",
          ].join(" ")}
        >
          <MiniPlayer
            picked={picked}
            onClose={() => setPicked(null)}
            onSongChange={(song) => setPicked(song)}
          />
        </div>
      )}
      {picked && (
        <div className="absolute left-1/2 -top-3 -translate-x-1/2 z-10">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-full shadow-md"
            onClick={() => setPlayerHidden((v) => !v)}
            title={playerHidden ? "Show player" : "Hide player"}
          >
            <HugeiconsIcon icon={ArrowDown01Icon}
              className={`h-4 w-4 transition-transform ${
                playerHidden ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2 w-full min-w-0 bg-background/60 dark:bg-background/60 backdrop-blur-xl border border-border rounded-2xl px-3 py-1 shadow-lg">
        <button
          type="button"
          onClick={() => setMusicMode((v) => !v)}
          title="Music search"
          className={[
            "shrink-0 self-start mt-1 p-2 rounded-full transition flex items-center gap-2",
            musicMode
              ? "bg-[#421F05] text-[#F0B100] shadow-md"
              : "hover:bg-muted text-muted-foreground",
          ].join(" ")}
        >
          <HugeiconsIcon icon={MusicNote01Icon}
            className={[
              "h-5 w-5 transition",
              musicMode ? "text-[#F0B100]" : "text-muted-foreground",
            ].join(" ")}
          />

          {musicMode && (
            <span className="hidden md:inline text-sm font-medium select-none">
              Music
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {musicMode ? (
            <MusicSearchInput
              value={musicQuery}
              onChange={setMusicQuery}
              onClose={() => {
                setMusicMode(false);
                setMusicQuery("");
              }}
              onPicked={(song) => {
                setPicked(song);
                setMusicMode(false);
                setMusicQuery("");

                localStorage.setItem(
                  "player-state",
                  JSON.stringify({
                    song,
                    time: 0,
                  })
                );
              }}
            />
          ) : (
            <Textarea
              ref={textareaRef}
              value={text}
              placeholder="Sending message!"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex min-w-0 wrap-anywhere tracking-tight resize-none font-mono border-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-10 md:min-h-20 max-h-[40vh] overflow-x-hidden overflow-y-auto"
              rows={1}
            />
          )}
        </div>

        <Button
          onClick={() => void handleSendMessage()}
          className="shrink-0 rounded-full mb-1"
          size="icon"
          disabled={!text.trim()}
          type="button"
        >
          <HugeiconsIcon icon={SentIcon} className="h-5 w-5" />
        </Button>
      </div>

      <div className="hidden md:block justify-start px-3 mt-1">
        <p className="text-xs">
          Press{" "}
          <Badge className="font-mono" variant="secondary">
            Enter
          </Badge>{" "}
          to send ·{" "}
          <Badge className="font-mono" variant="secondary">
            Shift
          </Badge>{" "}
          +{" "}
          <Badge className="font-mono" variant="secondary">
            Enter
          </Badge>{" "}
          for newline
        </p>
      </div>
    </div>
  );
}