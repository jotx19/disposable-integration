import Message from '../models/message.model.js';
import Room from '../models/room.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId } from '../lib/socket.js';
import { io } from '../lib/socket.js';

export const sendMessage = async (req, res) => {
  try {
    const { roomId, text, image } = req.body;
    const user = req.user;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    let imageUrl = null;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'chat_app',
      });

      imageUrl = uploadResponse.secure_url;
    }

    const message = new Message({
      room: roomId,
      sender: user._id,
      text,
      image: imageUrl,
    });

    await message.save();
    io.to(roomId).emit('message', message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name email profilepic')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

export const deleteUserMessages = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'No messages specified for deletion' });
    }

    const result = await Message.deleteMany({
      _id: { $in: messageIds }, 
      sender: user._id,       
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No messages found to delete' });
    }

    res.status(200).json({
      message: 'Selected messages have been deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete messages' });
  }
};
