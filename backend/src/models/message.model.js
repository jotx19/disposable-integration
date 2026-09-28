import mongoose from "mongoose";
import { getRoomExpiry } from "../lib/roomTtl.js";

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
      required: false,
    },
    type: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
    text: {
      type: String,
      required: function () {
        return this.type !== "system";
      },
    },
    image: {
      type: String,
      required: false,
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Messages expire together with their room.
messageSchema.pre("save", async function () {
  if (!this.expiresAt && this.room) {
    const room = await mongoose
      .model("Room")
      .findById(this.room)
      .select("expiresAt ttlHours createdAt");
    if (room) this.expiresAt = getRoomExpiry(room);
  }
});

messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 6 * 24 * 60 * 60 });

const Message = mongoose.model("Message", messageSchema);
export default Message;