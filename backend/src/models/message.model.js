import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 6 * 24 * 60 * 60 });

const Message = mongoose.model("Message", messageSchema);
export default Message;