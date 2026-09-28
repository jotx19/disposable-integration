import mongoose from "mongoose";
import { ROOM_TTL_HOURS, DEFAULT_ROOM_TTL_HOURS } from "../lib/roomTtl.js";
const userSchema = new mongoose.Schema(
    {
        email:{
            type: String,
            required: true,
            unique: true
        },
        name:{
            type: String,
            required: true,
            unique: true
        },
        password:{
            type: String,
            required: function() { return !this.googleId; },
            minlength: 6
        },
        googleId: {
            type: String, 
            unique: true,
            sparse: true
          },
        profilepic:{
            type: String,
            default: "",
        },
        defaultRoomTtlHours:{
            type: Number,
            enum: ROOM_TTL_HOURS,
            default: DEFAULT_ROOM_TTL_HOURS,
        }
    },
    {timestamps: true}
);

const User = mongoose.model("User", userSchema);
export default User;