import mongoose from "mongoose";
import {
  ROOM_TTL_HOURS,
  DEFAULT_ROOM_TTL_HOURS,
  computeExpiry,
} from "../lib/roomTtl.js";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    inviteLink: {
      type: String,
      unique: true,
      sparse: true
    },
    roomCode: { type: String, unique: true, required: true },
    ttlHours: {
      type: Number,
      enum: ROOM_TTL_HOURS,
      default: DEFAULT_ROOM_TTL_HOURS,
    },
    expiresAt: { type: Date },
    // Public rooms let anyone with the link chat as an unsaved guest.
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

roomSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    this.expiresAt = computeExpiry(this.createdAt ?? Date.now(), this.ttlHours);
  }
  next();
});

// Per-room expiry, plus the original 6-day cap as a fallback for older rooms.
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 6 * 24 * 60 * 60 });

const Room = mongoose.model("Room", roomSchema);
export default Room;
