import mongoose from "mongoose";
import Room from "./room.model.js";
import User from "./user.model.js";

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 6 * 24 * 60 * 60 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
