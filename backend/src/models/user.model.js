import mongoose from "mongoose";
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
        }
    },
    {timestamps: true}
);

const User = mongoose.model("User", userSchema);
export default User;