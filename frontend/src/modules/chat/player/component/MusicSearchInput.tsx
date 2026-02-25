"use client";

import { useEffect, useMemo, useState } from "react";
import { getSongsById, getSongsByQuery } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type SongImage = { url: string };

type SongResult = {
  id: string;
  name: string;
  image: SongImage[];
  artists?: { primary?: Array<{ name: string }> };
};

type SearchResponse = {
  success?: boolean;
  data?: {
    results?: SongResult[];
  };
};

type SongByIdResponse = {
  data?: Array<{
    id: string;
    name: string;
    image: SongImage[];
    artists?: { primary?: Array<{ name: string }> };
    downloadUrl?: Array<{ url: string }>;
  }>;
};

export type PickedSong = {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
  audioUrl: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onPicked: (song: PickedSong) => void;
};

function artistName(song: SongResult): string {
  return song.artists?.primary?.[0]?.name ?? "unknown";
}

function pickImage(song: SongResult): string {
  return song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url || "";
}

function pickAudioFromById(json: SongByIdResponse): string {
  const s = json.data?.[0];
  const urls = s?.downloadUrl ?? [];
  return urls[2]?.url || urls[1]?.url || urls[0]?.url || "";
}

export default function MusicSearchInput({ value, onChange, onPicked }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SongResult[]>([]);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

  const trimmed = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setPanelOpen(false);
      return;
    }

    setPanelOpen(true);

    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await getSongsByQuery(trimmed);
          const json = (await res.json()) as SearchResponse;
          setResults(json.data?.results ?? []);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 350);

    return () => window.clearTimeout(t);
  }, [trimmed]);

  const pickSong = async (song: SongResult) => {
    try {
      const res = await getSongsById(song.id);
      const json = (await res.json()) as SongByIdResponse;

      const audioUrl = pickAudioFromById(json);
      if (!audioUrl) return;

      onPicked({
        id: song.id,
        name: song.name,
        artist: artistName(song),
        imageUrl: pickImage(song) || "/favicon.ico",
        audioUrl,
      });

      setPanelOpen(false);
      setResults([]);
      onChange("");
    } catch {
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-start gap-2 w-full backdrop-blur-md  shadow-sm">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search songs by name or artist..."
          className="flex tracking-tight text-base border-none md:text-xs resize-none font-mono md:h-20 h-15 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] overflow-y-auto"
          autoComplete="on"
          inputMode="search"
        />
      </div>

      <div
        className={[
          "absolute left-0 right-0 bottom-full mb-2 overflow-hidden",
          "rounded-xl border border-border bg-background backdrop-blur-md shadow-lg",
          "transition-[max-height,opacity] duration-200",
          panelOpen ? "opacity-100 max-h-[255px]" : "opacity-0 max-h-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="p-2">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {!loading && trimmed && results.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No results found.</div>
          )}

          {!loading && results.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {results.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => void pickSong(song)}
                  className="w-full text-left flex items-center justify-between gap-2 border-b p-2 hover:bg-secondary/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={pickImage(song)}
                      alt={song.name}
                      className="h-9 w-9 rounded-md object-cover bg-secondary/50"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{song.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{artistName(song)}</p>
                    </div>
                  </div>

                  <Button type="button" size="icon" variant="outline" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void pickSong(song);
                  }}>
                    <Play className="h-4 w-4" />
                  </Button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}