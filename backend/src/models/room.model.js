import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 6 * 24 * 60 * 60 });

const Room = mongoose.model("Room", roomSchema);
export default Room;
