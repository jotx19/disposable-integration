"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { X, Plus, Forward, Music2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import MusicSearchInput, {
  type PickedSong,
} from "@/modules/chat/player/component/MusicSearchInput";
import MiniPlayer from "@/modules/chat/player/component/MiniPlayer";

export default function ChatMessageInput() {
  const [text, setText] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [musicMode, setMusicMode] = useState<boolean>(false);
  const [musicQuery, setMusicQuery] = useState<string>("");
  const [picked, setPicked] = useState<PickedSong | null>(null);
  const [playerHidden, setPlayerHidden] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, selectedRoom } = useChatStore();

  useEffect(() => {
    const saved = localStorage.getItem("player-state");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { song: PickedSong; time: number };
      setPicked(parsed.song);
    } catch {}
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if (!text.trim() && !imagePreview) return;

    if (!selectedRoom?._id) {
      toast.error("Please select a room first");
      return;
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        roomId: selectedRoom._id,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="w-full border-t border-border p-3">
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
            onClose={() => {
              setPicked(null);
              localStorage.removeItem("player-state");
            }}
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
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                playerHidden ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      )}

      {imagePreview && (
        <div className="relative w-24 h-24 mb-3">
          <Image
            src={imagePreview}
            alt="Preview"
            fill
            className="object-cover rounded-lg border"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-2 w-full bg-none backdrop-blur-md border border-border rounded-xl px-3 py-1 shadow-sm">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-muted transition"
          title="Attach image"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={() => setMusicMode((v) => !v)}
          title="Music search"
          className={[
            "p-2 rounded-full transition flex items-center gap-2",
            musicMode
              ? "bg-[#421F05] text-[#F0B100] shadow-md"
              : "hover:bg-muted text-muted-foreground",
          ].join(" ")}
        >
          <Music2
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

        <div className="flex-1">
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
              value={text}
              placeholder="Sending message!"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex tracking-tight resize-none font-mono md:h-20 h-15 border-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] overflow-y-auto"
              rows={1}
            />
          )}
        </div>

        <Button
          onClick={() => void handleSendMessage()}
          className="rounded-full"
          size="icon"
          disabled={!text.trim() && !imagePreview}
          type="button"
        >
          <Forward className="h-5 w-5" />
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
