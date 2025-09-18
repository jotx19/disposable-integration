import Room from "../models/room.model.js";

const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let roomCode = "";
  for (let i = 0; i < 8; i++) {
    roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomCode;
};

export const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Room name is required" });

    let roomCode;
    let roomExists;

    do {
      roomCode = generateRoomCode();
      roomExists = await Room.findOne({ roomCode });
    } while (roomExists);

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) return res.status(500).json({ message: "FRONTEND_URL not set" });

    const inviteLink = `${frontendUrl}/join/${roomCode}`;

    const room = new Room({
      name,
      createdBy: req.user._id,
      members: [req.user._id],
      roomCode,
      inviteLink,
    });

    await room.save();

    res.status(200).json({
      message: "Room created successfully",
      roomCode: room.roomCode,
      roomId: room._id,
      inviteLink: room.inviteLink,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Unable to create room" });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;
    if (!roomCode) return res.status(400).json({ message: "Room code is required" });

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.members.includes(req.user._id)) return res.status(400).json({ message: "Already in room" });

    room.members.push(req.user._id);
    await room.save();

    res.status(200).json({ message: "Successfully joined the room", roomId: room._id });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ message: "Unable to join room" });
  }
};

export const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate("createdBy", "name email profilepic")
      .populate("members", "name email profilepic");

    if (!rooms.length) return res.status(404).json({ message: "No rooms found" });

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Unable to fetch rooms" });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { roomCode, userId } = req.body;
    if (!roomCode || !userId) return res.status(400).json({ message: "Room code and userId required" });

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.members.includes(userId)) return res.status(400).json({ message: "User not in room" });

    room.members = room.members.filter(member => member.toString() !== userId);
    await room.save();

    res.status(200).json({ message: "User removed from room", roomId: room._id });
  } catch (error) {
    console.error("Error removing user:", error);
    res.status(500).json({ message: "Unable to remove user" });
  }
};

export const getRoomExpirationTime = async (req, res) => {
  try {
    const { roomIdentifier } = req.params;
    const isRoomCode = typeof roomIdentifier === "string" && roomIdentifier.length < 24;
    const query = isRoomCode ? { roomCode: roomIdentifier } : { _id: roomIdentifier };

    const room = await Room.findOne(query);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const roomCreationTime = new Date(room.createdAt).getTime();
    const ttl = 6 * 24 * 60 * 60 * 1000;
    const expirationTime = roomCreationTime + ttl;
    const remainingTime = expirationTime - Date.now();

    if (remainingTime <= 0) return res.status(200).json({ message: "Room has expired" });

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    const timeLeft = `${hours}:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

    res.status(200).json({ message: "Time left until expiration", timeLeft });
  } catch (error) {
    console.error("Error calculating expiration:", error);
    res.status(500).json({ message: "Unable to calculate expiration time" });
  }
};
