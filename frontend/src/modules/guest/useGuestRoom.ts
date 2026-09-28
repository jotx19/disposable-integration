"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "@/lib/axios";
import type { Message, RoomGuest } from "@/store/useChatStore";

export interface GuestRoomInfo {
  _id: string;
  name: string;
  memberCount: number;
  expiresAt: string;
}

export type GuestStatus = "idle" | "connecting" | "connected" | "reconnecting" | "closed";

// Errors the server returns from the guest handshake / session.
export type GuestError =
  | "username_taken"
  | "invalid_username"
  | "room_unavailable"
  | "room_private"
  | "room_deleted"
  | "connection_failed";

const FATAL_HANDSHAKE_ERRORS = ["username_taken", "invalid_username", "room_unavailable", "invalid_session"];

// One random key per tab and room. It lets the server replace this tab's old
// session when we reconnect before it noticed the drop, without letting
// another browser take over the same username.
function getGuestKey(roomCode: string) {
  const storageKey = `guest-key:${roomCode}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(storageKey, key);
    return key;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const byTime = (a: Message, b: Message) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

export function useGuestRoom(roomCode: string) {
  const [status, setStatus] = useState<GuestStatus>("idle");
  const [error, setError] = useState<GuestError | null>(null);
  const [room, setRoom] = useState<GuestRoomInfo | null>(null);
  const [you, setYou] = useState<RoomGuest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [guests, setGuests] = useState<RoomGuest[]>([]);
  // Set when a dropped connection wiped messages this guest had sent.
  const [lostMessages, setLostMessages] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const claimTokenRef = useRef<string | null>(null);
  const youRef = useRef<RoomGuest | null>(null);
  const hadConnectedRef = useRef(false);
  // While saving the chat the server closes our socket on purpose.
  const claimingRef = useRef(false);
  // Messages this guest sent in the current connection; lost if it drops.
  const sentCountRef = useRef(0);

  const join = useCallback(
    (username: string) => {
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      hadConnectedRef.current = false;
      setError(null);
      setStatus("connecting");

      const socket = io(BASE_URL, {
        auth: { guest: { roomCode, username, key: getGuestKey(roomCode) } },
        transports: ["websocket", "polling"],
        tryAllTransports: true,
        reconnectionDelayMax: 5000,
        forceNew: true,
      });
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
        if (FATAL_HANDSHAKE_ERRORS.includes(err.message)) {
          socket.disconnect();
          const code = (err.message === "invalid_session" ? "connection_failed" : err.message) as GuestError;
          setError(code);
          // Before the first successful join, go back to the form; afterwards the room is gone.
          setStatus(hadConnectedRef.current ? "closed" : "idle");
        } else if (!hadConnectedRef.current) {
          setError("connection_failed");
        }
      });

      socket.on("guest:init", (data: {
        room: GuestRoomInfo;
        you: RoomGuest;
        claimToken: string;
        messages: Message[];
      }) => {
        // Reconnected: the server dropped whatever we'd sent before.
        if (sentCountRef.current > 0) setLostMessages(true);
        sentCountRef.current = 0;
        setMessages([...data.messages].sort(byTime));
        hadConnectedRef.current = true;
        claimTokenRef.current = data.claimToken;
        youRef.current = data.you;
        setRoom(data.room);
        setYou(data.you);
        setError(null);
        setStatus("connected");
        try {
          sessionStorage.setItem(`guest-name:${roomCode}`, data.you.username);
        } catch {}
      });

      socket.on("disconnect", (reason) => {
        if (claimingRef.current || reason === "io client disconnect") return;
        if (reason === "io server disconnect") {
          setStatus("closed");
          return;
        }
        setStatus("reconnecting");
      });

      socket.on("message", (message: Message) => {
        setMessages((prev) =>
          prev.some((m) => m._id === message._id) ? prev : [...prev, message].sort(byTime)
        );
      });

      socket.on("messages-removed", ({ ids }: { ids: string[] }) => {
        setMessages((prev) => prev.filter((m) => !ids.includes(m._id)));
      });

      socket.on("messages-claimed", ({ ids, messages: saved }: { ids: string[]; messages: Message[] }) => {
        setMessages((prev) => [...prev.filter((m) => !ids.includes(m._id)), ...saved].sort(byTime));
      });

      socket.on("room-guests", ({ guests: list }: { guests: RoomGuest[] }) => setGuests(list));

      socket.on("guest:closed", ({ reason }: { reason: GuestError }) => {
        setError(reason);
        setStatus("closed");
      });
    },
    [roomCode]
  );

  const send = useCallback(
    (text: string) =>
      new Promise<{ ok: boolean; error?: string }>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) return resolve({ ok: false, error: "offline" });
        socket.timeout(8000).emit("guest:send", { text }, (err: unknown, res: { ok: boolean; error?: string }) => {
          if (!err && res.ok) sentCountRef.current += 1;
          resolve(err ? { ok: false, error: "timeout" } : res);
        });
      }),
    []
  );

  const leave = useCallback(() => {
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    youRef.current = null;
    setStatus("idle");
    setMessages([]);
    setRoom(null);
    setYou(null);
  }, []);

  // Call right before signing up with the claim token.
  const beginClaim = useCallback(() => {
    claimingRef.current = true;
    return claimTokenRef.current;
  }, []);

  const cancelClaim = useCallback(() => {
    claimingRef.current = false;
  }, []);

  useEffect(
    () => () => {
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
    },
    []
  );

  return {
    status,
    error,
    room,
    you,
    messages,
    guests,
    lostMessages,
    dismissLostMessages: () => setLostMessages(false),
    join,
    send,
    leave,
    beginClaim,
    cancelClaim,
  };
}
