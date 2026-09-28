// Load env here: ES imports are hoisted, so index.js's dotenv.config() runs
// after this module and FRONTEND_URL / SECRET would otherwise be undefined.
import "dotenv/config";
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import Room from "../models/room.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getRoomExpiry } from "./roomTtl.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
  },
  // Brief network drops (mobile, Wi-Fi switches, proxy hiccups) resume with
  // the same rooms and any missed events instead of starting from scratch.
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
  pingInterval: 20000,
  pingTimeout: 20000,
});

// A user can have several sockets (tabs, devices, reconnects), so track them
// all and address users through a per-user room.
const userSockets = new Map();
const activeCalls = {};

const userRoom = (userId) => `user:${userId}`;

export function getReceiverSocketId(userId) {
  return userSockets.has(String(userId)) ? userRoom(userId) : undefined;
}

const emitOnlineUsers = () => io.emit('ONLINE_USERS', [...userSockets.keys()]);

/* ------------------------------------------------------------------ */
/* Guests: anyone with a public room's link can chat without an        */
/* account. Their messages live only in memory and vanish when their   */
/* socket disconnects, unless they sign up and claim them.             */
/* ------------------------------------------------------------------ */

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
const GUEST_MESSAGE_MAX = 2000;
const GUEST_RATE = { count: 8, windowMs: 5000 };

// socket.id -> { guestId, username, key, roomId, expiresAt, claimToken, messages, sentAt }
const guestSessions = new Map();
// roomId -> Set<socket.id>
const roomGuests = new Map();

const sessionsInRoom = (roomId) =>
  [...(roomGuests.get(String(roomId)) ?? [])]
    .map((id) => guestSessions.get(id))
    .filter(Boolean);

export function getGuestMessages(roomId) {
  return sessionsInRoom(roomId).flatMap((s) => s.messages);
}

const emitRoomGuests = (roomId) => {
  io.to(String(roomId)).emit("room-guests", {
    roomId: String(roomId),
    guests: sessionsInRoom(roomId).map((s) => ({ id: s.guestId, username: s.username })),
  });
};

// Drops a guest session. Unsaved messages are removed for everyone unless
// they were just claimed into real messages.
function endGuestSession(socketId, { claimed = false } = {}) {
  const session = guestSessions.get(socketId);
  if (!session) return null;
  guestSessions.delete(socketId);
  roomGuests.get(session.roomId)?.delete(socketId);
  if (roomGuests.get(session.roomId)?.size === 0) roomGuests.delete(session.roomId);

  if (!claimed && session.messages.length) {
    io.to(session.roomId).emit("messages-removed", {
      roomId: session.roomId,
      ids: session.messages.map((m) => m._id),
    });
  }
  emitRoomGuests(session.roomId);
  return session;
}

// Kick every guest out of a room, e.g. when it's deleted or made private.
export function closeGuestsInRoom(roomId, reason) {
  sessionsInRoom(roomId).forEach((session) => {
    const socket = io.sockets.sockets.get(session.socketId);
    socket?.emit("guest:closed", { reason });
    endGuestSession(session.socketId);
    socket?.disconnect(true);
  });
}

// Called from signup: turn a guest's in-memory messages into real messages
// sent by the new account, and make them a member of the room.
export async function claimGuestSession(claimToken, user) {
  const session = [...guestSessions.values()].find((s) => s.claimToken === claimToken);
  if (!session) return null;

  const room = await Room.findById(session.roomId);
  if (!room || getRoomExpiry(room).getTime() <= Date.now()) {
    endGuestSession(session.socketId);
    return null;
  }

  if (!room.members.some((m) => m.toString() === user._id.toString())) {
    room.members.push(user._id);
    await room.save();
  }

  const expiresAt = getRoomExpiry(room);
  const saved = session.messages.length
    ? await Message.create(
        session.messages.map((m) => ({
          room: room._id,
          sender: user._id,
          text: m.text,
          createdAt: m.createdAt,
          expiresAt,
        }))
      )
    : [];

  const sysMsg = await Message.create({
    room: room._id,
    type: "system",
    text: `${user.name} saved their chat and joined`,
  });

  endGuestSession(session.socketId, { claimed: true });

  const sender = { _id: user._id, name: user.name, profilepic: user.profilepic };
  io.to(session.roomId).emit("messages-claimed", {
    roomId: session.roomId,
    ids: session.messages.map((m) => m._id),
    messages: saved.map((m) => ({ ...m.toObject(), sender })),
  });
  io.to(session.roomId).emit("message", sysMsg);

  const socket = io.sockets.sockets.get(session.socketId);
  socket?.emit("guest:claimed", { roomId: session.roomId });
  socket?.disconnect(true);

  return session.roomId;
}

async function authenticateGuest(socket, guest) {
  const username = String(guest.username ?? "").trim();
  const key = String(guest.key ?? "");
  if (!USERNAME_PATTERN.test(username)) throw new Error("invalid_username");
  if (!key) throw new Error("invalid_session");

  const room = await Room.findOne({ roomCode: String(guest.roomCode ?? "") });
  if (!room || !room.isPublic) throw new Error("room_unavailable");
  const expiresAt = getRoomExpiry(room);
  if (expiresAt.getTime() <= Date.now()) throw new Error("room_unavailable");

  const roomId = room._id.toString();
  const lower = username.toLowerCase();
  for (const s of sessionsInRoom(roomId)) {
    if (s.username.toLowerCase() !== lower) continue;
    // Same browser reconnecting before the old socket timed out: replace it.
    if (s.key === key) {
      io.sockets.sockets.get(s.socketId)?.disconnect(true);
      endGuestSession(s.socketId);
    } else {
      throw new Error("username_taken");
    }
  }
  // Keep guest names free of registered usernames so they can be claimed on signup.
  const taken = await User.exists({
    name: { $regex: `^${username.replace(/[.]/g, "\\.")}$`, $options: "i" },
  });
  if (taken) throw new Error("username_taken");

  socket.data.guest = {
    guestId: `guest_${randomUUID()}`,
    username,
    key,
    roomId,
    roomName: room.name,
    memberCount: room.members.length,
    expiresAt,
    claimToken: randomUUID(),
  };
}

async function handleGuestConnection(socket) {
  const g = socket.data.guest;
  const session = { ...g, socketId: socket.id, messages: [], sentAt: [] };
  guestSessions.set(socket.id, session);
  if (!roomGuests.has(g.roomId)) roomGuests.set(g.roomId, new Set());
  roomGuests.get(g.roomId).add(socket.id);
  socket.join(g.roomId);

  socket.on("guest:send", ({ text } = {}, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const s = guestSessions.get(socket.id);
    if (!s) return reply({ ok: false, error: "session_ended" });

    const body = String(text ?? "").trim();
    if (!body) return reply({ ok: false, error: "empty" });
    if (body.length > GUEST_MESSAGE_MAX) return reply({ ok: false, error: "too_long" });
    if (new Date(s.expiresAt).getTime() <= Date.now()) {
      return reply({ ok: false, error: "room_expired" });
    }

    const now = Date.now();
    s.sentAt = s.sentAt.filter((t) => now - t < GUEST_RATE.windowMs);
    if (s.sentAt.length >= GUEST_RATE.count) return reply({ ok: false, error: "rate_limited" });
    s.sentAt.push(now);

    const message = {
      _id: `g_${randomUUID()}`,
      room: s.roomId,
      type: "user",
      guest: true,
      text: body,
      sender: { _id: s.guestId, name: s.username },
      createdAt: new Date(now).toISOString(),
    };
    s.messages.push(message);
    io.to(s.roomId).emit("message", message);
    reply({ ok: true, message });
  });

  socket.on("disconnect", () => endGuestSession(socket.id));

  try {
    const saved = await Message.find({ room: g.roomId })
      .populate("sender", "name profilepic")
      .sort({ createdAt: 1 })
      .lean();
    const messages = [...saved, ...getGuestMessages(g.roomId)].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    socket.emit("guest:init", {
      room: {
        _id: g.roomId,
        name: g.roomName,
        memberCount: g.memberCount,
        expiresAt: g.expiresAt,
      },
      you: { id: g.guestId, username: g.username },
      claimToken: g.claimToken,
      messages,
    });
  } catch (error) {
    console.error("Error loading guest room:", error);
  }
  emitRoomGuests(g.roomId);
}

// Members authenticate with the same JWT the REST API uses; guests with a
// public room code and a unique username.
io.use(async (socket, next) => {
  const { token, guest } = socket.handshake.auth ?? {};

  if (guest && !token) {
    try {
      await authenticateGuest(socket, guest);
      return next();
    } catch (error) {
      return next(new Error(error.message || "room_unavailable"));
    }
  }

  if (!token) return next(new Error("unauthorized"));
  try {
    const { userId } = jwt.verify(token, process.env.SECRET);
    socket.data.userId = String(userId);
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on('connection', (socket) => {
  if (socket.data.guest) {
    void handleGuestConnection(socket);
    return;
  }

  const userId = socket.data.userId;

  socket.join(userRoom(userId));
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socket.id);
  emitOnlineUsers();

  socket.on('joinRoom', async (roomId) => {
    try {
      const isMember = await Room.exists({ _id: roomId, members: userId });
      if (!isMember) return;
      socket.join(String(roomId));
      socket.emit("room-guests", {
        roomId: String(roomId),
        guests: sessionsInRoom(roomId).map((s) => ({ id: s.guestId, username: s.username })),
      });
    } catch {
      // Invalid room id; ignore.
    }
  });

  socket.on('leaveRoom', (roomId) => {
    if (roomId) socket.leave(String(roomId));
  });

  socket.on("play_song", ({ roomId, song }) => socket.to(roomId).emit("room_play_song", { song }));
  socket.on("pause_song", ({ roomId, currentTime }) => socket.to(roomId).emit("room_pause_song", { currentTime }));
  socket.on("seek_song", ({ roomId, currentTime }) => socket.to(roomId).emit("room_seek_song", { currentTime }));
  socket.on("stop_song", ({ roomId }) => socket.to(roomId).emit("room_stop_song"));

  socket.on("get-active-call", ({ roomId }) => {
    const call = activeCalls[roomId];
    if (call?.isActive) {
      socket.emit("call-active", { hostId: call.hostId, roomId, maxParticipants: call.maxParticipants });
    }
  });

  socket.on("start-call", ({ roomId, maxParticipants = 5 }) => {
    if (activeCalls[roomId]?.isActive) {
      socket.emit("call-denied", { reason: "A call is already active in this room" });
      return;
    }
    activeCalls[roomId] = {
      hostId: userId,
      participants: [userId],
      maxParticipants,
      isActive: true,
    };
    socket.join(`call-${roomId}`);
    io.to(`call-${roomId}`).emit("call-started", { hostId: userId, maxParticipants });
    io.to(roomId).emit("call-active", { hostId: userId, roomId, maxParticipants });
  });

  socket.on("join-call", ({ roomId }) => {
    const call = activeCalls[roomId];
    if (!call || !call.isActive) {
      socket.emit("call-denied", { reason: "No active call" });
      return;
    }
    if (call.participants.length >= call.maxParticipants) {
      socket.emit("call-denied", { reason: "Call is full" });
      return;
    }
    call.participants.push(userId);
    socket.join(`call-${roomId}`);
    socket.emit("call-joined", { roomId });
    io.to(`call-${roomId}`).emit("participants-update", { participants: call.participants });
  });

  socket.on("leave-call", ({ roomId }) => {
    const call = activeCalls[roomId];
    if (!call) return;
    call.participants = call.participants.filter((id) => id !== userId);
    socket.leave(`call-${roomId}`);
    io.to(`call-${roomId}`).emit("participants-update", { participants: call.participants });
    if (call.participants.length === 0) {
      delete activeCalls[roomId];
      io.to(roomId).emit("call-inactive", { roomId });
    }
  });

  socket.on("end-call", ({ roomId }) => {
    const call = activeCalls[roomId];
    if (call?.hostId === userId) {
      io.to(`call-${roomId}`).emit("call-ended");
      delete activeCalls[roomId];
      io.to(roomId).emit("call-inactive", { roomId });
    }
  });

  socket.on("call-user", ({ roomId, targetUserId, offer }) => {
    const targetSocket = getReceiverSocketId(targetUserId);
    if (targetSocket) io.to(targetSocket).emit("incoming-call", { from: userId, offer, roomId });
  });

  socket.on("answer-call", ({ roomId, targetUserId, answer }) => {
    const targetSocket = getReceiverSocketId(targetUserId);
    if (targetSocket) io.to(targetSocket).emit("call-answered", { from: userId, answer, roomId });
  });

  socket.on("ice-candidate", ({ roomId, targetUserId, candidate }) => {
    const targetSocket = getReceiverSocketId(targetUserId);
    if (targetSocket) io.to(targetSocket).emit("ice-candidate", { from: userId, candidate, roomId });
  });

  // Leave any call this socket was part of while its rooms are still known.
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      if (!room.startsWith("call-")) return;
      const roomId = room.slice("call-".length);
      const call = activeCalls[roomId];
      if (!call) return;
      call.participants = call.participants.filter((id) => id !== userId);
      io.to(room).emit("participants-update", { participants: call.participants });
      if (call.participants.length === 0) {
        delete activeCalls[roomId];
        io.to(roomId).emit("call-inactive", { roomId });
      }
    });
  });

  socket.on('disconnect', () => {
    const sockets = userSockets.get(userId);
    sockets?.delete(socket.id);
    if (!sockets || sockets.size === 0) {
      userSockets.delete(userId);
      emitOnlineUsers();
    }
  });
});

export { io, app, server };