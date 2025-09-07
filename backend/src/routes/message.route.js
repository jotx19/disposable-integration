import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { deleteUserMessages, getRoomMessages, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.post('/:roomId/sendMessage', protectRoute, sendMessage);
router.get('/:roomId/messages', protectRoute, getRoomMessages); 
router.delete('/delete', protectRoute, deleteUserMessages);

export default router;