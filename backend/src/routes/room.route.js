import express from 'express';
import { createRoom, getRoomExpirationTime, getUserRooms, joinRoom } from '../controllers/room.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create',protectRoute, createRoom); 
router.post('/join',protectRoute, joinRoom);
router.get('/users',protectRoute, getUserRooms); 
// router.get('/:roomCode/expiry',protectRoute, getRoomExpirationTime); 
router.get('/:roomIdentifier/expiry',protectRoute, getRoomExpirationTime); 

export default router;
