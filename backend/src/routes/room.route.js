import express from 'express';
import { createRoom, deleteRoom, getPublicRoomInfo, getRoomExpirationTime, getUserRooms, joinRoom, leaveRoom, removeUser, updateRoomTtl, updateRoomVisibility } from '../controllers/room.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create',protectRoute, createRoom); 
router.post('/join',protectRoute, joinRoom);
router.get('/users',protectRoute, getUserRooms); 
// router.get('/:roomCode/expiry',protectRoute, getRoomExpirationTime); 
router.get('/:roomIdentifier/expiry',protectRoute, getRoomExpirationTime);
router.post("/removeUser", protectRoute, removeUser); 
router.delete("/:roomId", protectRoute, deleteRoom);
router.post("/:roomId/leave", protectRoute, leaveRoom);
router.patch("/:roomId/ttl", protectRoute, updateRoomTtl);
router.patch("/:roomId/visibility", protectRoute, updateRoomVisibility);
router.get("/public/:roomCode", getPublicRoomInfo);

export default router;
