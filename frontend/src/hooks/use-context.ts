"use client";

import { createContext, useContext } from "react";

export type MusicContextValue = {
  music: string | null;
  setMusic: React.Dispatch<React.SetStateAction<string | null>>;
  current: string | null;
  setCurrent: React.Dispatch<React.SetStateAction<string | null>>;
  downloadProgress: number;
  setDownloadProgress: React.Dispatch<React.SetStateAction<number>>;
};

export type NextContextValue = MusicContextValue;

export const MusicContext = createContext<MusicContextValue | null>(null);
export const NextContext = createContext<NextContextValue | null>(null);

export const useMusicProvider = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusicProvider must be used within a MusicProvider");
  }
  return ctx;
};

export const useNextMusicProvider = () => {
  const ctx = useContext(NextContext);
  if (!ctx) {
    throw new Error("useNextMusicProvider must be used within a NextContext provider");
  }
  return ctx;
};