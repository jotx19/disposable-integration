import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL || ""
    ],
  },
});

const userSocketMap = {};
const activeCalls = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit('ONLINE_USERS', Object.keys(userSocketMap));

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
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

  socket.on('disconnect', () => {
    delete userSocketMap[userId];
    io.emit('ONLINE_USERS', Object.keys(userSocketMap));

    Object.keys(activeCalls).forEach((roomId) => {
      const call = activeCalls[roomId];
      if (call.participants.includes(userId)) {
        call.participants = call.participants.filter((id) => id !== userId);
        io.to(`call-${roomId}`).emit("participants-update", { participants: call.participants });
        if (call.participants.length === 0) {
          delete activeCalls[roomId];
          io.to(roomId).emit("call-inactive", { roomId });
        }
      }
    });
  });
});

export { io, app, server };