import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"
            , process.env.FRONTEND_URL || ""
        ],
    }
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

const userSocketMap = {};

io.on('connection', (socket) => {
    // console.log('a user connected', socket.id);

    const userId = socket.handshake.query.userId;
    if(userId) userSocketMap[userId] = socket.id;

    io.emit('ONLINE_USERS', Object.keys(userSocketMap));

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        // console.log(`User ${userId} joined room ${roomId}`);
      });
    
      socket.on('disconnect', () => {
        // console.log('User disconnected:', socket.id);
        delete userSocketMap[userId];
        io.emit('ONLINE_USERS', Object.keys(userSocketMap));
      });
      socket.on("play_song", ({ roomId, song }) => {
        socket.to(roomId).emit("room_play_song", { song });
      });
    
      socket.on("pause_song", ({ roomId, currentTime }) => {
        socket.to(roomId).emit("room_pause_song", { currentTime });
      });
    
      socket.on("seek_song", ({ roomId, currentTime }) => {
        socket.to(roomId).emit("room_seek_song", { currentTime });
      });
    
      socket.on("stop_song", ({ roomId }) => {
        socket.to(roomId).emit("room_stop_song");
      });
      
    });

export { io, app, server };